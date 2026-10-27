/* LiteRender engine: renders a LiteRender Photo job with Cycles.
 *
 *   lr_engine <job folder> [--device auto|cpu]
 *
 * The job folder holds what LiteRender exports (see LiteRender src/photo.js):
 *   job.json   materials, meshes (buffer refs), instances, sun, sky, camera, output
 *   scene.bin  the binary buffers referenced as [byteOffset, count]
 *   tex_*.png  textures
 * Output: render.exr (linear, half float). Progress lines on stdout start with "[LR]".
 *
 * Coordinates arrive in Blender's frame (Z up, metres), so this mirrors
 * LiteRender's Blender script (desktop/cycles/lr_cycles.py) node for node.
 *
 * SPDX-License-Identifier: Apache-2.0 (like Cycles, which this links) */

#include <algorithm>
#include <chrono>
#include <cmath>
#include <cstdio>
#include <fstream>
#include <map>
#include <string>
#include <vector>

#include "device/device.h"
#include "scene/background.h"
#include "scene/camera.h"
#include "scene/film.h"
#include "scene/integrator.h"
#include "scene/light.h"
#include "scene/mesh.h"
#include "scene/object.h"
#include "scene/pass.h"
#include "scene/scene.h"
#include "scene/shader.h"
#include "scene/shader_graph.h"
#include "scene/shader_nodes.h"
#include "session/buffers.h"
#include "session/output_driver.h"
#include "session/session.h"
#include "util/colorspace.h"
#include "util/image.h"
#include "util/path.h"
#include "util/transform.h"
#include "util/unique_ptr.h"

#include <OpenImageIO/imagebuf.h>

#include "nlohmann/json.hpp"

using json = nlohmann::json;

CCL_NAMESPACE_BEGIN

static auto T0 = std::chrono::steady_clock::now();
static double elapsed()
{
  return std::chrono::duration<double>(std::chrono::steady_clock::now() - T0).count();
}
#define LOG(...) \
  do { \
    printf("[LR] " __VA_ARGS__); \
    printf("\n"); \
    fflush(stdout); \
  } while (0)

/* ------------------------------------------------------------------ job data */

struct Job {
  json J;
  std::vector<uint8_t> bin;
  string dir;

  template<typename T> const T *ptr(const json &ref, size_t *count) const
  {
    const size_t off = ref[0].get<size_t>(), n = ref[1].get<size_t>();
    if (off + n * sizeof(T) > bin.size()) {
      throw std::runtime_error("buffer reference out of range");
    }
    *count = n;
    return reinterpret_cast<const T *>(bin.data() + off);
  }
};

static std::vector<uint8_t> read_file(const string &path)
{
  std::ifstream f(path, std::ios::binary);
  if (!f) {
    throw std::runtime_error("cannot open " + path);
  }
  return std::vector<uint8_t>((std::istreambuf_iterator<char>(f)), std::istreambuf_iterator<char>());
}

static float3 f3(const json &a)
{
  return make_float3(a[0].get<float>(), a[1].get<float>(), a[2].get<float>());
}

/* column-major 4x4 (as LiteRender sends) -> Cycles 3x4 transform */
static Transform tfm_from(const float *m)
{
  Transform t;
  t.x = make_float4(m[0], m[4], m[8], m[12]);
  t.y = make_float4(m[1], m[5], m[9], m[13]);
  t.z = make_float4(m[2], m[6], m[10], m[14]);
  return t;
}

/* raw float RGBA rows (bottom row first) -> EXR next to the job, for an image node */
static string write_raw_image(const Job &job, const json &ref, const string &name)
{
  size_t n;
  const float *px = job.ptr<float>(ref["raw"], &n);
  const int w = ref["w"].get<int>(), h = ref["h"].get<int>();
  if (n < size_t(w) * h * 4) {
    throw std::runtime_error("raw image too small");
  }
  const string path = path_join(job.dir, name);
  const OIIO::ImageSpec spec(w, h, 4, OIIO::TypeDesc::FLOAT);
  /* top row first in the file: start at the last row, step backwards */
  OIIO::ImageBuf buf(spec, (void *)(px + size_t(h - 1) * w * 4), OIIO::AutoStride, -ptrdiff_t(w) * 4 * sizeof(float), OIIO::AutoStride);
  buf.set_write_format(OIIO::TypeDesc::HALF);
  if (!buf.write(path)) {
    throw std::runtime_error("cannot write " + path);
  }
  return path;
}

/* ------------------------------------------------------------------ materials */

struct GraphBuilder {
  ShaderGraph *g;
  explicit GraphBuilder(ShaderGraph *graph) : g(graph) {}
  void link(ShaderNode *from, const char *out, ShaderNode *to, const char *in)
  {
    ShaderOutput *o = from->output(ustring(out));
    ShaderInput *i = to->input(ustring(in));
    if (!o || !i) {
      throw std::runtime_error(string("no socket ") + out + " -> " + in);
    }
    g->connect(o, i);
  }
};

static ShaderNode *uv_vector(GraphBuilder &b, const json &tex)
{
  UVMapNode *uv = b.g->create_node<UVMapNode>();
  uv->set_attribute(ustring(tex.value("uv", "UVMap")));
  if (!tex.contains("repeat") && !tex.contains("offset") && !tex.contains("rotation")) {
    return uv;
  }
  MappingNode *mp = b.g->create_node<MappingNode>();
  mp->set_mapping_type(NODE_MAPPING_TYPE_POINT);
  if (tex.contains("repeat")) {
    mp->set_scale(make_float3(tex["repeat"][0].get<float>(), tex["repeat"][1].get<float>(), 1.0f));
  }
  if (tex.contains("offset")) {
    mp->set_location(make_float3(tex["offset"][0].get<float>(), tex["offset"][1].get<float>(), 0.0f));
  }
  mp->set_rotation(make_float3(0.0f, 0.0f, tex.value("rotation", 0.0f)));
  b.link(uv, "UV", mp, "Vector");
  return mp;
}

static ImageTextureNode *tex_node(GraphBuilder &b, const Job &job, const json &tex, bool colour)
{
  ImageTextureNode *t = b.g->create_node<ImageTextureNode>();
  t->set_filename(ustring(path_join(job.dir, tex["img"]["file"].get<string>())));
  t->set_colorspace(colour ? u_colorspace_scene_linear_srgb : u_colorspace_data); /* sRGB decoded in the kernel; needs no OCIO config */
  t->set_interpolation(colour ? INTERPOLATION_SMART : INTERPOLATION_LINEAR);
  t->set_alpha_type(IMAGE_ALPHA_CHANNEL_PACKED);
  ShaderNode *v = uv_vector(b, tex);
  b.link(v, v->output(ustring("Vector")) ? "Vector" : "UV", t, "Vector");
  return t;
}

static Shader *build_material(Scene *scene, const Job &job, const json &m)
{
  Shader *shader = scene->create_node<Shader>();
  shader->name = ustring(m.value("name", "material"));
  unique_ptr<ShaderGraph> graph = make_unique<ShaderGraph>();
  GraphBuilder b(graph.get());

  PrincipledBsdfNode *bsdf = graph->create_node<PrincipledBsdfNode>();
  const float3 col = f3(m["color"]);
  const float rough = m.value("roughness", 0.5f);
  bsdf->set_base_color(col);
  bsdf->set_roughness(rough);
  bsdf->set_metallic(m.value("metalness", 0.0f));
  bsdf->set_specular_ior_level(0.5f * m.value("spec", 1.0f));

  ShaderNode *base = nullptr;
  const char *base_out = nullptr;
  if (m.contains("map") && !m["map"].is_null()) {
    ImageTextureNode *t = tex_node(b, job, m["map"], true);
    MixColorNode *mul = graph->create_node<MixColorNode>();
    mul->set_blend_type(NODE_MIX_MUL);
    mul->set_fac(1.0f);
    mul->set_a(col);
    b.link(t, "Color", mul, "B");
    base = mul;
    base_out = "Result";
    if (m.value("cutout", false)) {
      b.link(t, "Alpha", bsdf, "Alpha");
    }
  }
  if (m.value("grass", false)) {
    /* per-clump colour (object colour) x darker roots (gH: 0 root .. 1 tip) */
    ObjectInfoNode *info = graph->create_node<ObjectInfoNode>();
    AttributeNode *h = graph->create_node<AttributeNode>();
    h->set_attribute(ustring("gH"));
    MapRangeNode *ramp = graph->create_node<MapRangeNode>();
    ramp->set_from_min(0.0f);
    ramp->set_from_max(0.6f);
    ramp->set_to_min(0.35f);
    ramp->set_to_max(1.0f);
    b.link(h, "Fac", ramp, "Value");
    VectorMathNode *mul = graph->create_node<VectorMathNode>();
    mul->set_math_type(NODE_VECTOR_MATH_SCALE);
    b.link(info, "Color", mul, "Vector1");
    b.link(ramp, "Result", mul, "Scale");
    base = mul;
    base_out = "Vector";
  }
  if (base) {
    b.link(base, base_out, bsdf, "Base Color");
  }

  if (m.contains("roughMap") && !m["roughMap"].is_null()) {
    ImageTextureNode *t = tex_node(b, job, m["roughMap"], false);
    MathNode *mul = graph->create_node<MathNode>();
    mul->set_math_type(NODE_MATH_MULTIPLY);
    mul->set_value2(rough);
    b.link(t, "Color", mul, "Value1");
    b.link(mul, "Value", bsdf, "Roughness");
  }
  if (m.contains("metalMap") && !m["metalMap"].is_null()) {
    ImageTextureNode *t = tex_node(b, job, m["metalMap"], false);
    SeparateColorNode *sep = graph->create_node<SeparateColorNode>();
    MathNode *mul = graph->create_node<MathNode>();
    mul->set_math_type(NODE_MATH_MULTIPLY);
    const float metal = m.value("metalness", 0.0f);
    mul->set_value2(metal > 0.0f ? metal : 1.0f);
    b.link(t, "Color", sep, "Color");
    b.link(sep, "Blue", mul, "Value1");
    b.link(mul, "Value", bsdf, "Metallic");
  }
  if (m.contains("normalMap") && !m["normalMap"].is_null()) {
    const json &nmj = m["normalMap"];
    ImageTextureNode *t = tex_node(b, job, nmj, false);
    NormalMapNode *nm = graph->create_node<NormalMapNode>();
    nm->set_space(NODE_NORMAL_MAP_TANGENT);
    nm->set_attribute(ustring(nmj.value("uv", "UVMap")));
    nm->set_strength(nmj.value("strength", 1.0f));
    if (nmj.value("flipY", false)) {
      SeparateColorNode *sep = graph->create_node<SeparateColorNode>();
      MathNode *inv = graph->create_node<MathNode>();
      inv->set_math_type(NODE_MATH_SUBTRACT);
      inv->set_value1(1.0f);
      CombineColorNode *comb = graph->create_node<CombineColorNode>();
      b.link(t, "Color", sep, "Color");
      b.link(sep, "Green", inv, "Value2");
      b.link(sep, "Red", comb, "Red");
      b.link(inv, "Value", comb, "Green");
      b.link(sep, "Blue", comb, "Blue");
      b.link(comb, "Color", nm, "Color");
    }
    else {
      b.link(t, "Color", nm, "Color");
    }
    b.link(nm, "Normal", bsdf, "Normal");
  }
  if (m.value("clearcoat", 0.0f) > 0.0f) {
    bsdf->set_coat_weight(m["clearcoat"].get<float>());
    bsdf->set_coat_roughness(m.value("clearcoatRoughness", 0.05f));
  }
  if (m.value("sheen", 0.0f) > 0.0f) {
    bsdf->set_sheen_weight(m["sheen"].get<float>());
    bsdf->set_sheen_roughness(m.value("sheenRoughness", 0.5f));
    if (m.contains("sheenColor")) {
      bsdf->set_sheen_tint(f3(m["sheenColor"]));
    }
  }
  if (m.contains("emission")) {
    bsdf->set_emission_color(f3(m["emission"]));
    bsdf->set_emission_strength(1.0f);
    if (base && m.value("emissionFromMap", false)) {
      b.link(base, base_out, bsdf, "Emission Color");
      bsdf->set_emission_strength(m.value("emissionStrength", 1.0f));
    }
  }
  if (m.value("opacity", 1.0f) < 1.0f && !m.contains("glass")) {
    bsdf->set_alpha(m["opacity"].get<float>());
  }

  ShaderNode *surf = bsdf;
  const char *surf_out = "BSDF";
  if (m.contains("glass")) {
    const json &gl = m["glass"];
    const float3 tint = gl.contains("tint") ? f3(gl["tint"]) : one_float3();
    const float grough = gl.value("rough", 0.0f);
    if (grough > 0.15f) {
      /* frosted: real refraction, rough transmission */
      bsdf->set_transmission_weight(1.0f);
      bsdf->set_base_color(tint);
      bsdf->set_roughness(grough);
      bsdf->set_ior(1.5f);
    }
    else {
      /* architectural glass: a thin pane - light and sun pass straight through, plus Fresnel reflection */
      TransparentBsdfNode *tr = graph->create_node<TransparentBsdfNode>();
      tr->set_color(tint);
      GlossyBsdfNode *gls = graph->create_node<GlossyBsdfNode>();
      gls->set_roughness(grough);
      FresnelNode *fr = graph->create_node<FresnelNode>();
      fr->set_IOR(1.52f);
      MixClosureNode *mix = graph->create_node<MixClosureNode>();
      b.link(fr, "Fac", mix, "Fac");
      b.link(tr, "BSDF", mix, "Closure1");
      b.link(gls, "BSDF", mix, "Closure2");
      surf = mix;
      surf_out = "Closure";
    }
  }
  if (m.value("grass", false)) {
    /* thin blades let light through: back-lit grass glows */
    TranslucentBsdfNode *tl = graph->create_node<TranslucentBsdfNode>();
    if (base) {
      b.link(base, base_out, tl, "Color");
    }
    MixClosureNode *mix = graph->create_node<MixClosureNode>();
    mix->set_fac(0.3f);
    b.link(surf, surf_out, mix, "Closure1");
    b.link(tl, "BSDF", mix, "Closure2");
    surf = mix;
    surf_out = "Closure";
  }
  if (m.value("oneSided", false)) {
    /* back of a one-sided surface: invisible (the other side's copy shows there) */
    GeometryNode *geo = graph->create_node<GeometryNode>();
    TransparentBsdfNode *tr = graph->create_node<TransparentBsdfNode>();
    tr->set_color(one_float3());
    MixClosureNode *mix = graph->create_node<MixClosureNode>();
    b.link(geo, "Backfacing", mix, "Fac");
    b.link(surf, surf_out, mix, "Closure1");
    b.link(tr, "BSDF", mix, "Closure2");
    surf = mix;
    surf_out = "Closure";
  }
  b.link(surf, surf_out, graph->output(), "Surface");
  shader->set_graph(std::move(graph));
  shader->tag_update(scene);
  return shader;
}

/* ------------------------------------------------------------------ meshes */

static void add_corner_uv(Mesh *mesh, const string &name, const float *uv, const int *tri, size_t nt, bool tangents, const float3 *pos, const float3 *nrm, size_t nv)
{
  Attribute *a = mesh->attributes.add(ATTR_STD_UV, ustring(name));
  float2 *d = a->data_for_write<float2>();
  for (size_t i = 0; i < nt * 3; i++) {
    d[i] = make_float2(uv[tri[i] * 2], uv[tri[i] * 2 + 1]);
  }
  if (!tangents) {
    return;
  }
  /* UV tangents for normal maps: per-face, accumulated per vertex, Gram-Schmidt against the normal */
  std::vector<float3> T(nv, zero_float3()), B(nv, zero_float3());
  for (size_t t = 0; t < nt; t++) {
    const int i0 = tri[t * 3], i1 = tri[t * 3 + 1], i2 = tri[t * 3 + 2];
    const float3 e1 = pos[i1] - pos[i0], e2 = pos[i2] - pos[i0];
    const float du1 = uv[i1 * 2] - uv[i0 * 2], dv1 = uv[i1 * 2 + 1] - uv[i0 * 2 + 1];
    const float du2 = uv[i2 * 2] - uv[i0 * 2], dv2 = uv[i2 * 2 + 1] - uv[i0 * 2 + 1];
    const float det = du1 * dv2 - du2 * dv1;
    if (fabsf(det) < 1e-12f) {
      continue;
    }
    const float r = 1.0f / det;
    const float3 tt = (e1 * dv2 - e2 * dv1) * r, bb = (e2 * du1 - e1 * du2) * r;
    for (const int i : {i0, i1, i2}) {
      T[i] += tt;
      B[i] += bb;
    }
  }
  Attribute *at = mesh->attributes.add(ATTR_STD_UV_TANGENT, ustring(name + ".tangent"));
  Attribute *as = mesh->attributes.add(ATTR_STD_UV_TANGENT_SIGN, ustring(name + ".tangent_sign"));
  packed_float3 *td = at->data_for_write<packed_float3>();
  float *sd = as->data_for_write<float>();
  for (size_t i = 0; i < nt * 3; i++) {
    const int v = tri[i];
    const float3 n = nrm ? nrm[v] : make_float3(0, 0, 1);
    float3 t = T[v] - n * dot(n, T[v]);
    const float l = len(t);
    t = l > 1e-12f ? t / l : make_float3(1, 0, 0);
    td[i] = t;
    sd[i] = dot(cross(n, t), B[v]) < 0.0f ? -1.0f : 1.0f;
  }
}

static Mesh *build_mesh(Scene *scene, const Job &job, const json &g, Shader *shader)
{
  size_t np, ni;
  const float *pos = job.ptr<float>(g["pos"], &np);
  const uint32_t *idx = job.ptr<uint32_t>(g["idx"], &ni);
  const size_t nv = np / 3, nt = ni / 3;

  Mesh *mesh = scene->create_node<Mesh>();
  mesh->name = ustring(g.value("name", "mesh"));
  array<Node *> used;
  used.push_back_slow(shader);
  mesh->set_used_shaders(used);
  mesh->resize_mesh(nv, nt);
  std::vector<float3> P(nv);
  for (size_t i = 0; i < nv; i++) {
    P[i] = make_float3(pos[i * 3], pos[i * 3 + 1], pos[i * 3 + 2]);
  }
  std::copy_n(P.data(), nv, mesh->get_position_for_write());
  int *tri = mesh->get_triangles().data();
  for (size_t i = 0; i < ni; i++) {
    if (idx[i] >= nv) {
      throw std::runtime_error("triangle index out of range");
    }
    tri[i] = int(idx[i]);
  }
  std::ranges::fill(mesh->get_smooth(), true);
  std::ranges::fill(mesh->get_shader(), 0);
  mesh->tag_triangles_modified();
  mesh->tag_shader_modified();
  mesh->tag_smooth_modified();

  std::vector<float3> N;
  if (g.contains("nrm")) {
    size_t nn;
    const float *n = job.ptr<float>(g["nrm"], &nn);
    N.resize(nv);
    Attribute *a = mesh->attributes.add(ATTR_STD_VERTEX_NORMAL);
    packed_normal *d = a->data_for_write<packed_normal>();
    for (size_t i = 0; i < nv; i++) {
      float3 v = make_float3(n[i * 3], n[i * 3 + 1], n[i * 3 + 2]);
      const float l = len(v);
      v = l > 0.0f ? v / l : make_float3(0, 0, 1);
      N[i] = v;
      d[i] = packed_normal(v);
    }
  }
  const bool normal_mapped = g.value("normalMapped", false);
  const string nm_uv = g.value("normalMapUV", "UVMap");
  for (const char *k : {"uv", "box"}) {
    if (g.contains(k)) {
      size_t nu;
      const float *uv = job.ptr<float>(g[k], &nu);
      const string name = string(k) == "uv" ? "UVMap" : "LRBox";
      add_corner_uv(mesh, name, uv, tri, nt, normal_mapped && name == nm_uv, P.data(), N.empty() ? nullptr : N.data(), nv);
    }
  }
  if (g.contains("attrs")) {
    for (const json &a : g["attrs"]) {
      size_t na;
      const float *v = job.ptr<float>(a["data"], &na);
      Attribute *at = mesh->attributes.add(ustring(a["name"].get<string>()), TypeFloat, ATTR_ELEMENT_VERTEX);
      float *d = at->data_for_write<float>();
      std::copy_n(v, std::min(na, nv), d);
    }
  }
  return mesh;
}

/* ------------------------------------------------------------------ output */

class ExrOutput : public OutputDriver {
 public:
  explicit ExrOutput(string path) : path_(std::move(path)) {}
  void write_render_tile(const Tile &tile) override
  {
    if (!(tile.size == tile.full_size)) {
      return; /* only the full frame */
    }
    const int w = tile.size.x, h = tile.size.y;
    vector<float> px(size_t(w) * h * 4);
    if (!tile.get_pass_pixels("combined", 4, px.data())) {
      LOG("error: could not read the render");
      return;
    }
    const OIIO::ImageSpec spec(w, h, 4, OIIO::TypeDesc::FLOAT);
    OIIO::ImageBuf buf(spec, px.data() + size_t(h - 1) * w * 4, OIIO::AutoStride, -ptrdiff_t(w) * 4 * sizeof(float), OIIO::AutoStride);
    buf.specmod().attribute("compression", "zip");
    buf.set_write_format(OIIO::TypeDesc::HALF);
    if (!buf.write(path_)) {
      LOG("error: could not write %s", path_.c_str());
      return;
    }
    written = true;
  }
  bool written = false;

 private:
  string path_;
};

/* ------------------------------------------------------------------ main */

static DeviceInfo pick_device(const string &want, string *desc)
{
  if (want != "cpu") {
    const DeviceType order[] = {DEVICE_OPTIX, DEVICE_CUDA, DEVICE_HIP, DEVICE_METAL, DEVICE_ONEAPI};
    for (const DeviceType t : order) {
      const vector<DeviceInfo> devs = Device::available_devices(DEVICE_MASK(t));
      if (!devs.empty()) {
        *desc = Device::string_from_type(t) + ": " + devs[0].description;
        return devs[0];
      }
    }
  }
  const vector<DeviceInfo> cpus = Device::available_devices(DEVICE_MASK_CPU);
  *desc = "CPU (" + std::to_string(std::max(1u, std::thread::hardware_concurrency())) + " threads)";
  return cpus.empty() ? DeviceInfo() : cpus[0];
}

static int run(int argc, const char **argv)
{
  if (argc < 2) {
    fprintf(stderr, "usage: lr_engine <job folder> [--device auto|cpu]\n");
    return 2;
  }
  Job job;
  job.dir = argv[1];
  string want = "auto";
  for (int i = 2; i + 1 < argc; i++) {
    if (string(argv[i]) == "--device") {
      want = argv[i + 1];
    }
  }
  path_init(path_dirname(argv[0]), "");
  {
    const std::vector<uint8_t> js = read_file(path_join(job.dir, "job.json"));
    job.J = json::parse(js.begin(), js.end());
  }
  job.bin = read_file(path_join(job.dir, "scene.bin"));
  const json &J = job.J;
  if (J.contains("device")) {
    want = J["device"].get<string>() == "cpu" ? "cpu" : want;
  }
  const json &o = J["output"];
  const int W = o["width"].get<int>(), H = o["height"].get<int>();
  const int samples = o.value("samples", 512);

  string dev_desc;
  SessionParams sp;
  sp.device = pick_device(want, &dev_desc);
  sp.background = true;
  sp.samples = samples;
  sp.threads = 0;
  sp.use_auto_tile = false;
  sp.tile_size = 0;
  if (o.value("timeLimit", 0.0) > 0.0) {
    sp.time_limit = o["timeLimit"].get<double>();
  }
  LOG("device %s", dev_desc.c_str());

  SceneParams scp;
  scp.shadingsystem = SHADINGSYSTEM_SVM;
  scp.bvh_type = BVH_TYPE_STATIC;

  auto session = make_unique<Session>(sp, scp);
  Scene *scene = session->scene.get();
  auto out = make_unique<ExrOutput>(path_join(job.dir, "render.exr"));
  ExrOutput *outp = out.get();
  session->set_output_driver(std::move(out));

  {
    thread_scoped_lock lock(scene->mutex);

    /* integrator: interior-friendly light paths, adaptive sampling, OIDN */
    Integrator *in = scene->integrator;
    in->set_max_bounce(12);
    in->set_max_diffuse_bounce(6);
    in->set_max_glossy_bounce(6);
    in->set_max_transmission_bounce(12);
    in->set_transparent_max_bounce(32);
    in->set_caustics_reflective(false);
    in->set_caustics_refractive(false);
    in->set_filter_glossy(1.0f);
    in->set_sample_clamp_indirect(o.value("clampIndirect", 10.0f));
    in->set_use_light_tree(true);
    in->set_use_adaptive_sampling(true);
    in->set_adaptive_threshold(o.value("noise", 0.01f));
    in->set_aa_samples(samples);
    const bool denoise = o.value("denoise", true);
    in->set_use_denoise(denoise);
    in->set_denoiser_type(DENOISER_OPENIMAGEDENOISE);
    in->set_denoiser_prefilter(DENOISER_PREFILTER_ACCURATE);
    in->set_denoise_start_sample(0);

    scene->film->set_exposure(1.0f);
    Pass *pass = scene->create_node<Pass>();
    pass->set_name(ustring("combined"));
    pass->set_type(PASS_COMBINED);
    pass->set_mode(denoise ? PassMode::DENOISED : PassMode::NOISY);

    /* materials */
    std::map<string, Shader *> mats;
    for (const json &m : J["materials"]) {
      mats[m["id"].get<string>()] = build_material(scene, job, m);
    }
    LOG("materials %zu %.1fs", mats.size(), elapsed());

    /* geometry: one Mesh per LiteRender mesh, one Object per placed copy (instanced) */
    size_t nobj = 0;
    for (const json &g : J["meshes"]) {
      Shader *sh = mats.at(g["material"].get<string>());
      Mesh *mesh = build_mesh(scene, job, g, sh);
      size_t nm;
      const float *mt = job.ptr<float>(g["instances"], &nm);
      const float *cols = nullptr;
      size_t nc = 0;
      if (g.contains("colors")) {
        cols = job.ptr<float>(g["colors"], &nc);
      }
      for (size_t i = 0; i < nm / 16; i++) {
        Object *ob = scene->create_node<Object>();
        ob->set_geometry(mesh);
        ob->set_tfm(tfm_from(mt + i * 16));
        if (cols && (i + 1) * 3 <= nc) {
          ob->set_color(make_float3(cols[i * 3], cols[i * 3 + 1], cols[i * 3 + 2]));
        }
        nobj++;
      }
    }
    LOG("geometry %zu meshes, %zu objects %.1fs", J["meshes"].size(), nobj, elapsed());

    /* sun */
    if (J.contains("sun") && J["sun"].value("strength", 0.0f) > 0.0f) {
      const json &s = J["sun"];
      SunLight *sun = scene->create_node<SunLight>();
      sun->set_strength(f3(s["color"]) * s["strength"].get<float>());
      sun->set_angle(s.value("angle", 0.0093f));
      /* Cycles' default light shader emits nothing (strength 0): give the sun a
       * plain white emission, scaled by the light's strength */
      Shader *ls = scene->create_node<Shader>();
      ls->name = ustring("lr_sun");
      {
        unique_ptr<ShaderGraph> lg = make_unique<ShaderGraph>();
        EmissionNode *em = lg->create_node<EmissionNode>();
        em->set_color(one_float3());
        em->set_strength(1.0f);
        lg->connect(em->output("Emission"), lg->output()->input("Surface"));
        ls->set_graph(std::move(lg));
        ls->tag_update(scene);
      }
      array<Node *> used;
      used.push_back_slow(ls);
      sun->set_used_shaders(used);
      /* the light shines along its object's -Z: make +Z point at the sun */
      const float3 z = normalize(f3(s["dir"]));
      const float3 up = fabsf(z.z) > 0.99f ? make_float3(0, 1, 0) : make_float3(0, 0, 1);
      const float3 x = normalize(cross(up, z)), y = cross(z, x);
      Transform t;
      t.x = make_float4(x.x, y.x, z.x, 0);
      t.y = make_float4(x.y, y.y, z.y, 0);
      t.z = make_float4(x.z, y.z, z.z, 0);
      Object *ob = scene->create_node<Object>();
      ob->set_geometry(sun);
      ob->set_tfm(t);
      ob->set_visibility(PATH_RAY_VISIBILITY_ALL & ~PATH_RAY_VISIBILITY_CAMERA);
    }

    /* world: the camera sees the sky, everything else is lit by LiteRender's sky light */
    {
      const json &w = J["world"];
      Shader *bg = scene->default_background;
      unique_ptr<ShaderGraph> graph = make_unique<ShaderGraph>();
      GraphBuilder b(graph.get());
      auto env = [&](const json &ref, const char *name) {
        EnvironmentTextureNode *t = graph->create_node<EnvironmentTextureNode>();
        t->set_filename(ustring(write_raw_image(job, ref, name)));
        t->set_colorspace(u_colorspace_scene_linear);
        t->set_interpolation(INTERPOLATION_LINEAR);
        TextureCoordinateNode *tc = graph->create_node<TextureCoordinateNode>();
        MappingNode *mp = graph->create_node<MappingNode>();
        mp->set_mapping_type(NODE_MAPPING_TYPE_POINT);
        mp->set_rotation(make_float3(0, 0, w.value("rotation", 0.0f)));
        b.link(tc, "Generated", mp, "Vector");
        b.link(mp, "Vector", t, "Vector");
        return t;
      };
      EnvironmentTextureNode *bgt = env(w["background"], "sky_background.exr");
      EnvironmentTextureNode *lt = w.contains("light") ? env(w["light"], "sky_light.exr") : bgt;
      BackgroundNode *bgc = graph->create_node<BackgroundNode>();
      bgc->set_strength(w.value("backgroundStrength", 1.0f));
      BackgroundNode *bgl = graph->create_node<BackgroundNode>();
      bgl->set_strength(w.value("lightStrength", 1.0f));
      b.link(bgt, "Color", bgc, "Color");
      b.link(lt, "Color", bgl, "Color");
      LightPathNode *lp = graph->create_node<LightPathNode>();
      MixClosureNode *mix = graph->create_node<MixClosureNode>();
      b.link(lp, "Is Camera Ray", mix, "Fac");
      b.link(bgl, "Background", mix, "Closure1");
      b.link(bgc, "Background", mix, "Closure2");
      b.link(mix, "Closure", graph->output(), "Surface");
      bg->set_graph(std::move(graph));
      bg->tag_update(scene);
      /* importance-sample the sky (Blender adds this "world MIS" light itself) */
      BackgroundLight *bl = scene->create_node<BackgroundLight>();
      bl->set_map_resolution(1024);
      array<Node *> used;
      used.push_back_slow(bg);
      bl->set_used_shaders(used);
      Object *ob = scene->create_node<Object>();
      ob->set_geometry(bl);
      ob->set_tfm(transform_identity());
    }

    /* camera: Blender convention in, Cycles camera looks down +Z */
    {
      const json &c = J["camera"];
      Camera *cam = scene->camera;
      std::vector<float> m = c["matrix"].get<std::vector<float>>();
      cam->set_matrix(tfm_from(m.data()) * transform_scale(1.0f, 1.0f, -1.0f));
      cam->set_camera_type(CAMERA_PERSPECTIVE);
      cam->set_full_width(W);
      cam->set_full_height(H);
      const float fov_v = 2.0f * atanf(c["sensorHeight"].get<float>() * 0.5f / c["lens"].get<float>());
      const float aspect = float(W) / float(H);
      /* Cycles' fov applies to the shorter side */
      cam->set_fov(aspect >= 1.0f ? fov_v : 2.0f * atanf(tanf(fov_v * 0.5f) * aspect));
      cam->set_nearclip(c.value("near", 0.05f));
      cam->set_farclip(c.value("far", 10000.0f));
      if (c.contains("dof")) {
        const float lens_m = c["lens"].get<float>() * 1e-3f;
        cam->set_aperturesize(lens_m / (2.0f * c["dof"]["fstop"].get<float>()));
        cam->set_focaldistance(c["dof"]["focus"].get<float>());
      }
      cam->compute_auto_viewplane();
      /* two-point shift: shiftY is a fraction of the longer side (Blender's unit) */
      const float sy = c.value("shiftY", 0.0f) * 2.0f * std::max(aspect, 1.0f / aspect);
      cam->set_viewplane_bottom(cam->get_viewplane_bottom() + sy);
      cam->set_viewplane_top(cam->get_viewplane_top() + sy);
      cam->need_flags_update = true;
      cam->update(scene);
    }
  }

  /* progress */
  double last = 0;
  session->progress.set_update_callback([&] {
    const double t = elapsed();
    if (t - last < 0.5) {
      return;
    }
    last = t;
    const double p = session->progress.get_progress();
    LOG("stats Sample %d/%d", int(p * samples + 0.5), samples);
  });

  BufferParams bp;
  bp.width = bp.full_width = W;
  bp.height = bp.full_height = H;
  LOG("render start %d x %d samples %d %.1fs", W, H, samples, elapsed());
  session->reset(sp, bp);
  session->start();
  session->wait();
  if (!session->progress.get_error_message().empty()) {
    LOG("error: %s", session->progress.get_error_message().c_str());
    return 1;
  }
  session.reset(); /* flushes the output driver */
  if (!outp->written) {
    LOG("error: no image written");
    return 1;
  }
  LOG("render done %.1fs", elapsed());
  LOG("wrote %s", path_join(job.dir, "render.exr").c_str());
  return 0;
}

CCL_NAMESPACE_END

int main(int argc, const char **argv)
{
  try {
    return ccl::run(argc, argv);
  }
  catch (const std::exception &e) {
    printf("[LR] error: %s\n", e.what());
    fflush(stdout);
    return 1;
  }
}
