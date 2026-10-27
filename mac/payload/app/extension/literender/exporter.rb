# Exporter: walks the model and produces a compact scene hash.
#
# Strategy (performance-safe for big component-heavy models):
#  * Geometry is meshed ONCE per (definition, inherited material) pair, in the
#    definition's own coordinate space, bucketed by material, and packed
#    to raw little-endian buffers (Bin, see pack.rb). With a Tracker, packed buckets are cached across
#    refreshes and only dirty definitions are re-meshed.
#  * Every occurrence of a pair (nested paths included) is recorded as a world
#    transform; the viewer draws pairs with >1 placement as InstancedMesh.
#  * Data stays in SketchUp inches / Z-up; the viewer applies one root
#    transform (scale 0.0254, Z-up -> Y-up).
#  * Normals are not exported: face.mesh only has flat per-face normals and
#    the viewer rebuilds them from triangle winding.
#
# Ruby compatibility: Ruby 2.2+ (SketchUp 2017+): no safe navigation, no
# squiggly heredocs.
require 'json'
require 'base64'

module GANK
  module LiteRender
    class Exporter
      DEFAULT_MAT_ID = '__default'.freeze
      FLAGS_PLAIN    = 0 # points only
      FLAGS_UV       = 1 # + front UVQ
      FLAGS_UV_BACK  = 2 # + back UVQ
      MAX_TEX_BYTES  = 16 * 1024 * 1024 # skip absurd textures; viewer downsizes the rest
      ATTR_DICT      = 'GANK_LiteRender'.freeze

      # Point3d#to_a returns Floats on every SketchUp version we know of, but
      # check once rather than trust it (Length objects would break pack).
      FAST_TO_A = begin
        Geom::Point3d.new(1, 2, 3).to_a[0].is_a?(Float)
      rescue StandardError
        false
      end

      attr_reader :stats

      def initialize(model, tex_dir, tracker = nil)
        @model     = model
        @tex_dir   = tex_dir
        @cache     = tracker ? tracker.geo_cache : {}
        @tex_cache = tracker ? tracker.tex_cache : {}
        @tracker   = tracker
        @geom      = {}  # key -> { mat_id => packed bucket }
        @places    = {}  # key -> [ [16 floats], ... ]
        @names     = {}  # key -> definition name
        @mats      = {}  # mat_id -> material hash
        @tex_ms    = 0.0
        @stats     = { faces: 0, triangles: 0, instances: 0, definitions: 0,
                       meshedDefs: 0, cachedDefs: 0, skipped_textures: 0 }
      end

      def export
        t0 = Time.now
        @tracker.prepare if @tracker
        walk(@model.entities, [:root, nil], 'root', Geom::Transformation.new, nil)
        add_material(nil) # default always present
        @tracker.prune(@geom) if @tracker
        t_walk = Time.now

        meshes = []
        @geom.each do |key, buckets|
          places = @places[key]
          next if places.nil? || places.empty?
          inst = binf(places.flatten)
          buckets.each do |_bkey, b|
            next if b[:tris] == 0
            mat_id = b[:mat_id]
            @stats[:triangles] += b[:tris] * places.length
            h = { 'material' => mat_id, 'name' => @names[key], 'pos' => b[:pos],
                  'idx' => b[:idx], 'instances' => inst }
            h['idx16'] = true if b[:idx16]
            h['single'] = true if b[:single]
            h['uv'] = b[:uv] if b[:uv]
            meshes << h
          end
        end
        t_pack = Time.now

        view = @model.active_view
        {
          'version'   => 4,
          'units'     => 'inch',
          'up'        => 'z',
          'modelName' => (@model.title.to_s.empty? ? 'Untitled' : @model.title),
          'materials' => @mats.values,
          'overrides' => Exporter.load_overrides(@model),
          'entourage' => Exporter.load_data(@model, 'entourage', []),
          'env'       => Exporter.load_data(@model, 'env', {}),
          'meshes'    => meshes,
          'camera'    => Exporter.camera_hash(view.camera, view),
          'sun'       => Exporter.sun_hash(@model.shadow_info),
          'scenes'    => scenes_list(view),
          'stats'     => @stats.merge(
            exportMs: ms(t0, Time.now),
            walkMs:   ms(t0, t_walk) - @tex_ms.round,
            texMs:    @tex_ms.round,
            packMs:   ms(t_walk, t_pack),
            meshes:   meshes.size,
            suVersion: Sketchup.version,
            platform: (RUBY_PLATFORM =~ /darwin/ ? 'mac' : 'win')
          )
        }
      end

      # ---------------------------------------------------- material overrides
      # Stored in the .skp itself (attribute dictionary on the model), so they
      # travel with the file and nothing is written elsewhere on the machine.
      def self.load_overrides(model)
        json = model.get_attribute(ATTR_DICT, 'materials', nil)
        return {} if json.nil? || json.to_s.empty?
        JSON.parse(json)
      rescue StandardError => err
        puts "[LiteRender] could not read saved materials: #{err.message}"
        {}
      end

      def self.load_data(model, key, default)
        json = model.get_attribute(ATTR_DICT, key, nil)
        return default if json.nil? || json.to_s.empty?
        JSON.parse(json)
      rescue StandardError
        default
      end

      SAVE_KEYS = %w[materials entourage env].freeze

      # Generic save for viewer state stored in the .skp (one undo step).
      def self.save_data(model, key, json)
        return false unless SAVE_KEYS.include?(key)
        JSON.parse(json) # validate before touching the model
        model.start_operation("LiteRender #{key}", true)
        model.set_attribute(ATTR_DICT, key, json)
        model.commit_operation
        true
      rescue StandardError => err
        model.abort_operation rescue nil
        puts "[LiteRender] could not save #{key}: #{err.message}"
        false
      end

      # Everything the viewer keeps in the .skp, in a single undo step.
      # payload: { "materials" => {...}, "entourage" => {...}, "env" => {...} }
      def self.save_all(model, json)
        data = JSON.parse(json)
        model.start_operation('LiteRender settings', true)
        SAVE_KEYS.each do |k|
          model.set_attribute(ATTR_DICT, k, JSON.generate(data[k])) if data.key?(k)
        end
        model.commit_operation
        true
      rescue StandardError => err
        model.abort_operation rescue nil
        puts "[LiteRender] could not save settings: #{err.message}"
        false
      end

      def self.save_overrides(model, json)
        JSON.parse(json) # validate before touching the model
        model.start_operation('LiteRender materials', true)
        model.set_attribute(ATTR_DICT, 'materials', json)
        model.commit_operation
        true
      rescue StandardError => err
        model.abort_operation rescue nil
        puts "[LiteRender] could not save materials: #{err.message}"
        false
      end

      # ---------------------------------------------------------- camera/sun
      def self.camera_hash(cam, view)
        persp = cam.perspective?
        {
          'eye'         => cam.eye.to_a,
          'target'      => cam.target.to_a,
          'up'          => cam.up.to_a,
          'perspective' => persp,
          'fov'         => (persp ? cam.fov : 35.0),
          'fovIsHeight' => (cam.respond_to?(:fov_is_height?) ? cam.fov_is_height? : true),
          'vpAspect'    => (view.vpheight > 0 ? view.vpwidth.to_f / view.vpheight : 1.5)
        }
      end

      # QUIRK: ShadowTime is a Time object whose clock fields are the model's
      # LOCAL time even though Ruby labels it UTC. True UTC = local - TZOffset.
      def self.sun_hash(si)
        dir = si['SunDirection'] # unit vector from the model TOWARDS the sun, model axes
        t = si['ShadowTime']
        local = t ? t.utc : nil
        {
          'direction'      => dir ? dir.to_a : [0.3, -0.5, 0.8],
          'displayShadows' => si['DisplayShadows'] ? true : false,
          'light'          => (si['Light'] || 80).to_i,
          'dark'           => (si['Dark'] || 45).to_i,
          'city'           => si['City'].to_s,
          'country'        => si['Country'].to_s,
          'latitude'       => si['Latitude'].to_f,
          'longitude'      => si['Longitude'].to_f,
          'tzOffset'       => si['TZOffset'].to_f,
          'northAngle'     => si['NorthAngle'].to_f,
          'local'          => (local ? [local.year, local.month, local.day, local.hour, local.min] : nil)
        }
      end

      private

      def ms(a, b)
        ((b - a) * 1000).round
      end

      def scenes_list(view)
        pages = @model.pages
        return [] if pages.nil?
        list = []
        pages.each do |pg|
          begin
            h = { 'name' => pg.name.to_s, 'camera' => Exporter.camera_hash(pg.camera, view) }
            if pg.respond_to?(:use_shadow_info?) && pg.use_shadow_info? && pg.shadow_info
              h['sun'] = Exporter.sun_hash(pg.shadow_info)
            end
            list << h
          rescue StandardError => err
            puts "[LiteRender] scene '#{pg.name}' skipped: #{err.message}"
          end
        end
        list
      end

      # ---------------------------------------------------------------- walk
      # key = [definition entityID | :root, inherited material entityID | nil]
      def walk(entities, key, name, tr, inherited)
        (@places[key] ||= []) << tr.to_a
        @stats[:instances] += 1 unless key[0] == :root

        unless @geom.key?(key)
          @names[key] = name
          @stats[:definitions] += 1 unless key[0] == :root
          cached = @cache[key]
          if cached && cache_valid?(cached)
            @geom[key] = cached
            @stats[:cachedDefs] += 1
            @stats[:faces] += cached.each_value.inject(0) { |a, b| a + (b[:faces] || 0) }
          else
            @geom[key] = @cache[key] = build_geometry(entities, inherited)
            @stats[:meshedDefs] += 1
          end
        end

        entities.each do |e|
          next unless e.is_a?(Sketchup::ComponentInstance) || e.is_a?(Sketchup::Group)
          next unless visible?(e)
          defn = e.respond_to?(:definition) ? e.definition : nil # Group#definition: SU2015+
          next if defn.nil?
          mat = e.material || inherited
          walk(defn.entities, [defn.entityID, mat ? mat.entityID : nil], defn.name,
               tr * e.transformation, mat)
        end
      end

      # A cached bucket is reusable if its materials still exist and still
      # agree on whether they're textured (that decides whether UVs exist).
      def cache_valid?(buckets)
        buckets.each_value do |b|
          m = b[:mat]
          return false if m && !m.valid?
          mat_id = add_material(m)
          return false if b[:textured] != !@mats[mat_id]['texture'].nil?
        end
        true
      end

      def visible?(e)
        return false if e.hidden?
        layer_visible?(e.layer)
      end

      # SU2021+ tags can live in folders; a hidden folder hides its tags but
      # Layer#visible? does not reflect that, so walk up the folder chain.
      def layer_visible?(layer)
        return true if layer.nil?
        return false unless layer.visible?
        if layer.respond_to?(:folder)
          f = layer.folder
          while f
            return false unless f.visible?
            f = f.respond_to?(:folder) ? f.folder : nil
          end
        end
        true
      end

      # ------------------------------------------------------------ geometry
      def build_geometry(entities, inherited)
        raw = {}
        entities.each do |e|
          next unless e.is_a?(Sketchup::Face)
          next unless visible?(e)
          # SketchUp shows a face's FRONT material on the front and its BACK
          # material on the back. The viewer draws faces double-sided with the
          # front material, which is friendlier for models with reversed faces,
          # except where SketchUp would show something different:
          #  * only the back is painted (reversed faces painted from outside)
          #    -> draw the back material on both sides
          #  * front and back explicitly differ (TV screens, cabinet doors...)
          #    -> two one-sided copies, one per material
          fm = e.material || inherited
          bm = e.back_material
          if bm.nil? || bm == fm
            add_to(raw, fm, :double, e)
          elsif fm.nil?
            add_to(raw, bm, :double_back, e)
          else
            add_to(raw, fm, :front, e)
            add_to(raw, bm, :back, e)
          end
        end
        packed = {}
        raw.each do |bkey, b|
          faces = b[:faces] || 0
          mat_id = b[:mat_id]
          nverts = b[:pos].length / 3
          idx16 = nverts < 65_536
          packed[bkey] = {
            mat: b[:mat], mat_id: mat_id, single: b[:single], textured: b[:textured], tris: b[:idx].length / 3,
            pos: binf(b[:pos]),
            idx: Bin.new(b[:idx].pack(idx16 ? 'v*' : 'V*'), idx16 ? 'u16' : 'u32'),
            idx16: idx16, faces: faces,
            uv: (b[:textured] && !b[:uv].empty? ? binf(b[:uv]) : nil)
          }
        end
        packed
      end

      # Buckets are keyed by material + sidedness ('m12', 'm12|1' one-sided).
      # :double_back uses the back UVs; :back additionally reverses winding.
      def add_to(raw, mat, mode, face)
        mat_id = add_material(mat)
        single = (mode == :front || mode == :back)
        key = single ? mat_id + '|1' : mat_id
        b = (raw[key] ||= { mat: mat, mat_id: mat_id, single: single, pos: [], uv: [], idx: [],
                            textured: !@mats[mat_id]['texture'].nil? })
        add_face(face, b, mode == :back || mode == :double_back, mode == :back)
      end

      def add_face(face, b, back_side = false, reverse = false)
        textured = b[:textured]
        mesh = face.mesh(textured ? (back_side ? FLAGS_UV_BACK : FLAGS_UV) : FLAGS_PLAIN)
        pos = b[:pos]
        base = pos.length / 3
        if FAST_TO_A
          mesh.points.each { |p| pos.concat(p.to_a) }
        else
          mesh.points.each { |p| pos.push(p.x.to_f, p.y.to_f, p.z.to_f) }
        end
        if textured
          uv = b[:uv]
          mesh.uvs(!back_side).each do |q|
            a = q.to_a
            w = a[2].to_f
            w = 1.0 if w.abs < 1e-12
            uv.push(a[0].to_f / w, a[1].to_f / w)
          end
        end
        b[:faces] = (b[:faces] || 0) + 1
        idx = b[:idx]
        mesh.polygons.each do |poly|
          # Negative indices only flag hidden edges; take abs. 1-based.
          n = poly.length
          next if n < 3
          a = base + poly[0].abs - 1
          k = 1
          while k < n - 1
            if reverse
              idx.push(a, base + poly[k + 1].abs - 1, base + poly[k].abs - 1)
            else
              idx.push(a, base + poly[k].abs - 1, base + poly[k + 1].abs - 1)
            end
            k += 1
          end
        end
        @stats[:faces] += 1
      end

      def binf(arr)
        Bin.new(arr.pack('e*'), 'f32') # little-endian float32
      end

      # ------------------------------------------------------------ materials
      def add_material(mat)
        if mat.nil?
          unless @mats.key?(DEFAULT_MAT_ID)
            @mats[DEFAULT_MAT_ID] = { 'id' => DEFAULT_MAT_ID, 'key' => '', 'name' => 'Default',
                                      'color' => [224, 224, 224], 'alpha' => 1.0, 'texture' => nil }
          end
          return DEFAULT_MAT_ID
        end
        id = 'm' + mat.entityID.to_s
        return id if @mats.key?(id)
        c = mat.color
        h = { 'id' => id, 'key' => mat.name.to_s, 'name' => mat.display_name.to_s,
              'color' => [c.red, c.green, c.blue], 'alpha' => mat.alpha.to_f, 'texture' => nil }
        if mat.texture
          t0 = Time.now
          tex = texture_uri(mat, id)
          @tex_ms += (Time.now - t0) * 1000
          if tex
            h['texture'] = tex
            h['color'] = [255, 255, 255] # texture is written colorized
            begin
              h['texSize'] = [mat.texture.width.to_f, mat.texture.height.to_f] # inches per tile
            rescue StandardError
              nil
            end
          end
        end
        @mats[id] = h
        id
      end

      # Re-written only when the texture or (for colourised textures) the colour changed.
      def texture_uri(mat, id)
        tex = mat.texture
        sig = [tex.filename.to_s, tex.image_width, tex.image_height, mat.color.to_a, mat.colorize_type].join('|')
        hit = @tex_cache[mat.entityID]
        return hit[1] if hit && hit[0] == sig
        uri = write_texture(mat, id)
        @tex_cache[mat.entityID] = [sig, uri]
        uri
      rescue StandardError
        write_texture(mat, id)
      end

      # Texture bytes travel inside the pack; the viewer turns them into blob:
      # URLs (same-origin, so WebGL isn't tainted the way a file:// <img> is).
      def write_texture(mat, id)
        return nil if @tex_dir.nil?
        tex = mat.texture
        ext = File.extname(tex.filename.to_s).downcase
        ext = '.png' unless ['.jpg', '.jpeg', '.png'].include?(ext)
        path = File.join(@tex_dir, id + ext)
        ok = begin
          tex.write(path, true) # SU2016+; true = write with colorization applied
        rescue ArgumentError
          tex.write(path)
        end
        return nil unless ok && File.exist?(path)
        if File.size(path) > MAX_TEX_BYTES
          @stats[:skipped_textures] += 1
          return nil
        end
        data = File.open(path, 'rb') { |f| f.read }
        Bin.new(data, ext == '.png' ? 'png' : 'jpg')
      rescue StandardError => err
        puts "[LiteRender] texture '#{mat.display_name}' failed: #{err.message}"
        @stats[:skipped_textures] += 1
        nil
      end
    end
  end
end
