# LiteRender -> Blender Cycles: rebuilds the scene LiteRender exported (job.json
# + binary buffers + textures) and renders it with Cycles to a linear EXR.
# LiteRender then applies its own exposure, bloom, colour grade and tone
# mapping, so a Photo render has the same look as the viewer.
#
#   blender -b --factory-startup --python lr_cycles.py -- <job folder>
#   python  lr_cycles.py <job folder>        (Blender as a Python module: tests)
#
# Coordinates arrive in Blender's frame (Z up, metres), already converted.
import sys, os, json, math, time
import bpy
import numpy as np
import mathutils
if bpy.app.version < (4, 2, 0):
    print('[LR] error: Blender %s is too old for LiteRender Photo renders - use Blender 4.2 or newer' % bpy.app.version_string, flush=True)
    sys.exit(3)

T0 = time.time()
def log(*a):
    print('[LR]', *a, flush=True)

argv = sys.argv
job_dir = argv[argv.index('--') + 1] if '--' in argv else argv[-1]
J = json.load(open(os.path.join(job_dir, 'job.json'), encoding='utf-8'))
BIN = np.fromfile(os.path.join(job_dir, 'scene.bin'), dtype=np.uint8)

def arr(ref, dtype):
    """ref = [byteOffset, count] into scene.bin"""
    off, n = ref
    return np.frombuffer(BIN, dtype=dtype, count=n, offset=off)

# ------------------------------------------------------------------ scene
bpy.ops.wm.read_factory_settings(use_empty=True)
scene = bpy.context.scene
scene.render.engine = 'CYCLES'
cy = scene.cycles

# ------------------------------------------------------------------ device
def pick_device():
    want = J.get('device', 'auto')
    try:
        prefs = bpy.context.preferences.addons['cycles'].preferences
    except Exception:
        return 'CPU', 'CPU'
    if want != 'cpu':
        for kind in ('OPTIX', 'CUDA', 'HIP', 'METAL', 'ONEAPI'):
            try:
                prefs.compute_device_type = kind
                prefs.refresh_devices()
                gpus = [d for d in prefs.devices if d.type == kind]
            except Exception:
                continue
            if gpus:
                for d in prefs.devices:
                    d.use = d.type == kind
                return 'GPU', '%s: %s' % (kind, ', '.join(d.name for d in gpus))
    try:
        prefs.compute_device_type = 'NONE'
    except Exception:
        pass
    return 'CPU', 'CPU (%d threads)' % os.cpu_count()

dev, dev_name = pick_device()
cy.device = dev
log('device', dev_name)

# ------------------------------------------------------------------ render settings
o = J['output']
r = scene.render
r.resolution_x, r.resolution_y, r.resolution_percentage = o['width'], o['height'], 100
r.film_transparent = False
cy.samples = o.get('samples', 512)
cy.use_adaptive_sampling = True
cy.adaptive_threshold = o.get('noise', 0.01)
if o.get('timeLimit'):
    cy.time_limit = o['timeLimit']
cy.use_denoising = True
try:
    cy.denoiser = 'OPENIMAGEDENOISE'
    cy.denoising_input_passes = 'RGB_ALBEDO_NORMAL'
    cy.denoising_prefilter = 'ACCURATE'
    cy.denoising_use_gpu = dev == 'GPU'
except Exception:
    pass
cy.max_bounces = 12
cy.diffuse_bounces = 6
cy.glossy_bounces = 6
cy.transmission_bounces = 12
cy.transparent_max_bounces = 32
cy.caustics_reflective = False
cy.caustics_refractive = False
cy.blur_glossy = 1.0
cy.sample_clamp_indirect = o.get('clampIndirect', 10.0)
try:
    cy.use_light_tree = True
except Exception:
    pass
scene.view_settings.view_transform = 'Standard'   # linear out: LiteRender tone maps
scene.view_settings.look = 'None'
scene.view_settings.exposure = 0
scene.view_settings.gamma = 1
im = r.image_settings
im.file_format = 'OPEN_EXR'
im.color_depth = '16'
im.exr_codec = 'ZIP'
im.color_mode = 'RGBA'
r.filepath = os.path.join(job_dir, 'render')
r.use_file_extension = True

# ------------------------------------------------------------------ images
_images = {}
def image(ref, colour):
    """ref: {file, w, h} (PNG/JPEG next to job.json) or {raw: [off, n], w, h} float RGBA"""
    key = (json.dumps(ref, sort_keys=True), colour)
    if key in _images:
        return _images[key]
    if 'raw' in ref:
        img = bpy.data.images.new('lr_raw', ref['w'], ref['h'], alpha=True, float_buffer=True)
        # colour space first: changing it afterwards regenerates (blanks) the buffer
        img.colorspace_settings.name = 'Linear Rec.709' if colour else 'Non-Color'
        img.pixels.foreach_set(arr(ref['raw'], np.float32))
        img.update()
    else:
        img = bpy.data.images.load(os.path.join(job_dir, ref['file']), check_existing=True)
        img.colorspace_settings.name = 'sRGB' if colour else 'Non-Color'
        img.alpha_mode = 'CHANNEL_PACKED'
    _images[key] = img
    return img

# ------------------------------------------------------------------ materials
def build_material(m):
    mat = bpy.data.materials.new(m['name'][:60])
    mat.use_nodes = True
    nt = mat.node_tree
    N, L = nt.nodes, nt.links
    N.clear()
    out = N.new('ShaderNodeOutputMaterial')
    bsdf = N.new('ShaderNodeBsdfPrincipled')
    inp = bsdf.inputs
    col = m['color']

    # texture coordinates: SketchUp UVs, or LiteRender's box projection (metres) for library sets
    def uv_vector(name, tex):
        uvn = N.new('ShaderNodeUVMap'); uvn.uv_map = name
        if tex.get('repeat') or tex.get('offset') or tex.get('rotation'):
            mp = N.new('ShaderNodeMapping')
            rep = tex.get('repeat') or [1, 1]
            off = tex.get('offset') or [0, 0]
            mp.inputs['Scale'].default_value = (rep[0], rep[1], 1)
            mp.inputs['Location'].default_value = (off[0], off[1], 0)
            mp.inputs['Rotation'].default_value = (0, 0, tex.get('rotation') or 0)
            L.new(uvn.outputs['UV'], mp.inputs['Vector'])
            return mp.outputs['Vector']
        return uvn.outputs['UV']

    def tex_node(tex, colour):
        t = N.new('ShaderNodeTexImage')
        t.image = image(tex['img'], colour)
        t.interpolation = 'Smart' if colour else 'Linear'
        L.new(uv_vector(tex.get('uv', 'UVMap'), tex), t.inputs['Vector'])
        return t

    base_out = None
    if m.get('map'):
        t = tex_node(m['map'], True)
        mul = N.new('ShaderNodeMix'); mul.data_type = 'RGBA'; mul.blend_type = 'MULTIPLY'
        mul.inputs['Factor'].default_value = 1.0
        mul.inputs[6].default_value = (col[0], col[1], col[2], 1)
        L.new(t.outputs['Color'], mul.inputs[7])
        base_out = mul.outputs[2]
        if m.get('cutout'):
            L.new(t.outputs['Alpha'], inp['Alpha'])
    else:
        inp['Base Color'].default_value = (col[0], col[1], col[2], 1)

    # grass blades: darker at the roots (gH = 0 at the root, 1 at the tip), colour per clump
    if m.get('grass'):
        attr = N.new('ShaderNodeAttribute'); attr.attribute_type = 'INSTANCER'; attr.attribute_name = 'col'
        h = N.new('ShaderNodeAttribute'); h.attribute_type = 'GEOMETRY'; h.attribute_name = 'gH'
        ramp = N.new('ShaderNodeMapRange'); ramp.inputs['From Max'].default_value = 0.6
        ramp.inputs['To Min'].default_value = 0.35; ramp.inputs['To Max'].default_value = 1.0
        L.new(h.outputs['Fac'], ramp.inputs['Value'])
        mul = N.new('ShaderNodeVectorMath'); mul.operation = 'SCALE'
        L.new(attr.outputs['Color'], mul.inputs[0]); L.new(ramp.outputs['Result'], mul.inputs['Scale'])
        base_out = mul.outputs['Vector']

    if base_out is not None:
        L.new(base_out, inp['Base Color'])

    inp['Roughness'].default_value = m.get('roughness', 0.5)
    if m.get('roughMap'):
        t = tex_node(m['roughMap'], False)
        mul = N.new('ShaderNodeMath'); mul.operation = 'MULTIPLY'
        mul.inputs[1].default_value = m.get('roughness', 0.5)
        L.new(t.outputs['Color'], mul.inputs[0])
        L.new(mul.outputs[0], inp['Roughness'])
    inp['Metallic'].default_value = m.get('metalness', 0)
    if m.get('metalMap'):
        t = tex_node(m['metalMap'], False)
        sep = N.new('ShaderNodeSeparateColor')
        L.new(t.outputs['Color'], sep.inputs[0])
        mul = N.new('ShaderNodeMath'); mul.operation = 'MULTIPLY'
        mul.inputs[1].default_value = max(m.get('metalness', 0), 0) or 1
        L.new(sep.outputs['Blue'], mul.inputs[0])
        L.new(mul.outputs[0], inp['Metallic'])
    if m.get('normalMap'):
        t = tex_node(m['normalMap'], False)
        nm = N.new('ShaderNodeNormalMap'); nm.uv_map = m['normalMap'].get('uv', 'UVMap')
        nm.inputs['Strength'].default_value = m['normalMap'].get('strength', 1)
        src = t.outputs['Color']
        if m['normalMap'].get('flipY'):
            sep = N.new('ShaderNodeSeparateColor'); comb = N.new('ShaderNodeCombineColor'); inv = N.new('ShaderNodeMath')
            inv.operation = 'SUBTRACT'; inv.inputs[0].default_value = 1
            L.new(src, sep.inputs[0]); L.new(sep.outputs['Green'], inv.inputs[1])
            L.new(sep.outputs['Red'], comb.inputs['Red']); L.new(inv.outputs[0], comb.inputs['Green']); L.new(sep.outputs['Blue'], comb.inputs['Blue'])
            src = comb.outputs['Color']
        L.new(src, nm.inputs['Color'])
        L.new(nm.outputs['Normal'], inp['Normal'])
    inp['Specular IOR Level'].default_value = 0.5 * m.get('spec', 1)
    if m.get('clearcoat'):
        inp['Coat Weight'].default_value = m['clearcoat']
        inp['Coat Roughness'].default_value = m.get('clearcoatRoughness', 0.05)
    if m.get('sheen'):
        inp['Sheen Weight'].default_value = m['sheen']
        inp['Sheen Roughness'].default_value = m.get('sheenRoughness', 0.5)
        sc = m.get('sheenColor') or [1, 1, 1]
        inp['Sheen Tint'].default_value = (sc[0], sc[1], sc[2], 1)
    if m.get('emission'):
        e = m['emission']
        inp['Emission Color'].default_value = (e[0], e[1], e[2], 1)
        inp['Emission Strength'].default_value = 1.0
        if base_out is not None and m.get('emissionFromMap'):
            L.new(base_out, inp['Emission Color'])
            inp['Emission Strength'].default_value = m.get('emissionStrength', 1.0)
    if m.get('opacity', 1) < 1 and not m.get('glass'):
        inp['Alpha'].default_value = m['opacity']

    shader = bsdf.outputs['BSDF']
    if m.get('glass'):
        g = m['glass']
        tint = g.get('tint', [1, 1, 1])
        if g.get('rough', 0) > 0.15:
            # frosted: real refraction with rough transmission
            inp['Transmission Weight'].default_value = 1.0
            inp['Base Color'].default_value = (tint[0], tint[1], tint[2], 1)
            inp['Roughness'].default_value = g['rough']
            inp['IOR'].default_value = 1.5
        else:
            # architectural glass: thin pane, so light (and the sun) passes straight
            # through - no refraction offset, no caustic-blocked sunlight - plus Fresnel reflection
            tr = N.new('ShaderNodeBsdfTransparent'); tr.inputs['Color'].default_value = (tint[0], tint[1], tint[2], 1)
            gl = N.new('ShaderNodeBsdfGlossy'); gl.inputs['Roughness'].default_value = g.get('rough', 0)
            fr = N.new('ShaderNodeFresnel'); fr.inputs['IOR'].default_value = 1.52
            mix = N.new('ShaderNodeMixShader')
            L.new(fr.outputs['Fac'], mix.inputs['Fac'])
            L.new(tr.outputs['BSDF'], mix.inputs[1]); L.new(gl.outputs['BSDF'], mix.inputs[2])
            shader = mix.outputs['Shader']
    if m.get('grass'):
        # thin blades let light through: back-lit grass glows
        tl = N.new('ShaderNodeBsdfTranslucent')
        if base_out is not None:
            L.new(base_out, tl.inputs['Color'])
        mix = N.new('ShaderNodeMixShader'); mix.inputs['Fac'].default_value = 0.3
        L.new(shader, mix.inputs[1]); L.new(tl.outputs['BSDF'], mix.inputs[2])
        shader = mix.outputs['Shader']
    if m.get('oneSided'):
        # back of a one-sided surface: invisible (the other side's copy shows there)
        geo = N.new('ShaderNodeNewGeometry')
        tr = N.new('ShaderNodeBsdfTransparent')
        mix = N.new('ShaderNodeMixShader')
        L.new(geo.outputs['Backfacing'], mix.inputs['Fac'])
        L.new(shader, mix.inputs[1]); L.new(tr.outputs['BSDF'], mix.inputs[2])
        shader = mix.outputs['Shader']
    L.new(shader, out.inputs['Surface'])
    if m.get('opacity', 1) < 1 or m.get('cutout'):
        try:
            mat.surface_render_method = 'BLENDED'
        except Exception:
            pass
    return mat

MATS = {m['id']: build_material(m) for m in J['materials']}
log('materials', len(MATS), '%.1fs' % (time.time() - T0))

# ------------------------------------------------------------------ meshes
coll = bpy.data.collections.new('LiteRender')
scene.collection.children.link(coll)
src_coll = bpy.data.collections.new('LR sources')   # instance sources, not rendered themselves
scene.collection.children.link(src_coll)
bpy.context.view_layer.layer_collection.children['LR sources'].exclude = False
src_coll.hide_render = True

def build_mesh(g):
    pos = arr(g['pos'], np.float32)
    idx = arr(g['idx'], np.uint32)
    nv, nt = len(pos) // 3, len(idx) // 3
    me = bpy.data.meshes.new(g['name'][:60])
    me.vertices.add(nv)
    me.vertices.foreach_set('co', pos)
    me.loops.add(len(idx))
    me.loops.foreach_set('vertex_index', idx)
    me.polygons.add(nt)
    me.polygons.foreach_set('loop_start', np.arange(0, len(idx), 3, dtype=np.int32))
    me.polygons.foreach_set('material_index', np.zeros(nt, dtype=np.int32))
    me.update(calc_edges=False)
    for name in ('uv', 'box'):
        if g.get(name):
            uv = arr(g[name], np.float32).reshape(-1, 2)
            layer = me.uv_layers.new(name='UVMap' if name == 'uv' else 'LRBox')
            layer.data.foreach_set('uv', uv[idx].ravel())
    for a in g.get('attrs', []):
        at = me.attributes.new(a['name'], 'FLOAT', 'POINT')
        at.data.foreach_set('value', arr(a['data'], np.float32))
    me.polygons.foreach_set('use_smooth', np.ones(nt, dtype=bool))
    if g.get('nrm'):
        n = arr(g['nrm'], np.float32).reshape(-1, 3)
        me.normals_split_custom_set_from_vertices(n)
    me.materials.append(MATS[g['material']])
    return me

def gn_instancer(name, src_obj, pts_matrices, colors=None):
    """Points object whose geometry nodes put a copy of src_obj at every matrix (handles mirroring)."""
    n = len(pts_matrices) // 16
    M = pts_matrices.reshape(n, 4, 4).transpose(0, 2, 1)          # column-major -> row-major
    me = bpy.data.meshes.new(name + ' points')
    me.vertices.add(n)
    me.vertices.foreach_set('co', M[:, :3, 3].astype(np.float32).ravel())
    xf = me.attributes.new('xf', 'FLOAT4X4', 'POINT')
    xf.data.foreach_set('value', M.transpose(0, 2, 1).astype(np.float32).ravel())  # Blender stores column-major
    if colors is not None:
        c = me.attributes.new('col', 'FLOAT_COLOR', 'POINT')
        rgba = np.ones((n, 4), np.float32); rgba[:, :3] = colors.reshape(n, 3)
        c.data.foreach_set('color', rgba.ravel())
    ob = bpy.data.objects.new(name, me)
    coll.objects.link(ob)
    ng = bpy.data.node_groups.new(name + ' instances', 'GeometryNodeTree')
    ng.interface.new_socket('Geometry', in_out='INPUT', socket_type='NodeSocketGeometry')
    ng.interface.new_socket('Geometry', in_out='OUTPUT', socket_type='NodeSocketGeometry')
    gi, go = ng.nodes.new('NodeGroupInput'), ng.nodes.new('NodeGroupOutput')
    info = ng.nodes.new('GeometryNodeObjectInfo'); info.inputs['Object'].default_value = src_obj
    info.transform_space = 'ORIGINAL'
    iop = ng.nodes.new('GeometryNodeInstanceOnPoints')
    na = ng.nodes.new('GeometryNodeInputNamedAttribute'); na.data_type = 'FLOAT4X4'; na.inputs['Name'].default_value = 'xf'
    sit = ng.nodes.new('GeometryNodeSetInstanceTransform')
    ng.links.new(gi.outputs[0], iop.inputs['Points'])
    ng.links.new(info.outputs['Geometry'], iop.inputs['Instance'])
    ng.links.new(iop.outputs['Instances'], sit.inputs['Instances'])
    ng.links.new(na.outputs['Attribute'], sit.inputs['Transform'])
    ng.links.new(sit.outputs['Instances'], go.inputs[0])
    mod = ob.modifiers.new('LiteRender instances', 'NODES')
    mod.node_group = ng
    return ob

nobj = ninst = 0
for g in J['meshes']:
    me = build_mesh(g)
    mats = arr(g['instances'], np.float32)
    count = len(mats) // 16
    if count <= 64:
        for i in range(count):
            ob = bpy.data.objects.new(g['name'][:60], me)
            # LiteRender sends column-major matrices: read as rows, then transpose.
            # (matrix_world returns a copy - transposing it in place changes nothing)
            ob.matrix_world = mathutils.Matrix([list(map(float, mats[i * 16 + c * 4: i * 16 + c * 4 + 4])) for c in range(4)]).transposed()
            coll.objects.link(ob)
            nobj += 1
    else:
        src = bpy.data.objects.new(g['name'][:60] + ' (source)', me)
        src_coll.objects.link(src)
        gn_instancer(g['name'][:60], src, mats, arr(g['colors'], np.float32) if g.get('colors') else None)
        ninst += count
log('geometry', len(J['meshes']), 'meshes,', nobj, 'objects,', ninst, 'instances', '%.1fs' % (time.time() - T0))

# ------------------------------------------------------------------ sun
s = J.get('sun')
if s and s.get('strength', 0) > 0:
    ld = bpy.data.lights.new('Sun', 'SUN')
    ld.energy = s['strength']
    ld.color = s['color']
    ld.angle = s.get('angle', math.radians(0.53))
    sun = bpy.data.objects.new('Sun', ld)
    coll.objects.link(sun)
    d = np.array(s['dir'], float); d /= np.linalg.norm(d)
    # a Blender sun shines along its local -Z: point local +Z at the sun
    import mathutils
    sun.rotation_mode = 'QUATERNION'
    sun.rotation_quaternion = mathutils.Vector(d).to_track_quat('Z', 'Y')

# ------------------------------------------------------------------ world: camera sees the sky, lighting uses LiteRender's sky light
w = J['world']
world = bpy.data.worlds.new('LiteRender sky')
scene.world = world
world.use_nodes = True
nt = world.node_tree; N, L = nt.nodes, nt.links
N.clear()
wout = N.new('ShaderNodeOutputWorld')
def env_node(ref):
    t = N.new('ShaderNodeTexEnvironment')
    t.image = image(ref, True)
    t.interpolation = 'Linear'
    tc = N.new('ShaderNodeTexCoord'); mp = N.new('ShaderNodeMapping')
    mp.inputs['Rotation'].default_value = (0, 0, w.get('rotation', 0))
    L.new(tc.outputs['Generated'], mp.inputs['Vector'])
    L.new(mp.outputs['Vector'], t.inputs['Vector'])
    return t
bg_tex = env_node(w['background'])
light_tex = env_node(w['light']) if w.get('light') else bg_tex
bgc = N.new('ShaderNodeBackground'); bgc.inputs['Strength'].default_value = w.get('backgroundStrength', 1)
bgl = N.new('ShaderNodeBackground'); bgl.inputs['Strength'].default_value = w.get('lightStrength', 1)
L.new(bg_tex.outputs['Color'], bgc.inputs['Color']); L.new(light_tex.outputs['Color'], bgl.inputs['Color'])
lp = N.new('ShaderNodeLightPath'); mix = N.new('ShaderNodeMixShader')
L.new(lp.outputs['Is Camera Ray'], mix.inputs['Fac'])
L.new(bgl.outputs['Background'], mix.inputs[1]); L.new(bgc.outputs['Background'], mix.inputs[2])
L.new(mix.outputs['Shader'], wout.inputs['Surface'])

# ------------------------------------------------------------------ camera
c = J['camera']
cd = bpy.data.cameras.new('Camera')
cd.sensor_fit = 'VERTICAL'
cd.sensor_height = c['sensorHeight']
cd.lens = c['lens']
cd.shift_x = c.get('shiftX', 0)
cd.shift_y = c.get('shiftY', 0)
cd.clip_start = c.get('near', 0.05)
cd.clip_end = c.get('far', 10000)
if c.get('dof'):
    cd.dof.use_dof = True
    cd.dof.focus_distance = c['dof']['focus']
    cd.dof.aperture_fstop = c['dof']['fstop']
cam = bpy.data.objects.new('Camera', cd)
coll.objects.link(cam)
import mathutils
cam.matrix_world = mathutils.Matrix([c['matrix'][i * 4:(i + 1) * 4] for i in range(4)]).transposed()
scene.camera = cam

# ------------------------------------------------------------------ render
total = cy.samples
log('render start', o['width'], 'x', o['height'], 'samples', total, '%.1fs' % (time.time() - T0))
def on_post(scene_, *_a):
    log('render done %.1fs' % (time.time() - T0))
bpy.app.handlers.render_post.append(on_post)
# progress: Blender run as a Python module doesn't print its status line, so
# relay render statistics ("... | Sample 12/512") to LiteRender
_last = [0.0]
def on_stats(*a):
    t = time.time()
    if t - _last[0] < 0.5:
        return
    _last[0] = t
    txt = ' '.join(str(x) for x in a if isinstance(x, str))
    if 'Sample' in txt:
        log('stats', txt)
try:
    bpy.app.handlers.render_stats.append(on_stats)
except Exception:
    pass
bpy.ops.render.render(write_still=True)
log('wrote', r.filepath + '.exr')
