# PBR texture library: a folder of the user's own texture sets (Poly Haven,
# ambientCG, Quixel exports, studio libraries...). Nothing is bundled or
# downloaded; the folder path is remembered in SketchUp's own preferences.
#
# Recognised map names (case-insensitive, any separator):
#   albedo  : diff, diffuse, albedo, basecolor, base color, color, col
#   normal  : nor_gl / normalgl (OpenGL), nor_dx / normaldx (DirectX), normal, nrm, nor
#   rough   : rough, roughness        metal: metal, metallic, metalness
#   ao      : ao, ambientocclusion, occlusion     disp: disp, displacement, height (parallax depth)
# Maps sharing a prefix in the same folder form one material.
require 'json'
require 'base64'
require 'digest'

module GANK
  module LiteRender
    module Library
      EXTS = %w[.jpg .jpeg .png].freeze
      MAX_MAP_BYTES = 24 * 1024 * 1024
      SLOTS = [
        [:normal_dx, /(?:^|[^a-z])(nor(?:mal)?[ _-]?dx)(?:[^a-z]|$)/],
        [:normal,    /(?:^|[^a-z])(nor(?:mal)?[ _-]?gl|normal|nrm|nor)(?:[^a-z]|$)/],
        [:albedo,    /(?:^|[^a-z])(diff(?:use)?|albedo|base[ _-]?colou?r|colou?r|col)(?:[^a-z]|$)/],
        [:rough,     /(?:^|[^a-z])(rough(?:ness)?)(?:[^a-z]|$)/],
        [:metal,     /(?:^|[^a-z])(metal(?:lic|ness)?)(?:[^a-z]|$)/],
        [:ao,        /(?:^|[^a-z])(ao|ambient[ _-]?occlusion|occlusion)(?:[^a-z]|$)/],
        [:disp,      /(?:^|[^a-z])(disp(?:lacement)?|height)(?:[^a-z]|$)/]
      ].freeze

      def self.dir
        d = Sketchup.read_default('GANK_LiteRender', 'libDir', nil)
        d = d.tr('\\', '/') if d
        d && File.directory?(d) ? d : nil
      end

      # scans are cached per folder; re-scanned when the folder is (re)picked
      def self.items(root)
        @items = nil if @items_root != root
        @items_root = root
        @items ||= scan(root)
      end

      def self.pick_folder(dialog)
        d = UI.select_directory(title: 'Choose your PBR texture library folder', directory: dir)
        return unless d
        Sketchup.write_default('GANK_LiteRender', 'libDir', d)
        send_catalog(dialog)
      end

      def self.send_catalog(dialog)
        d = dir
        @items = nil
        cat = d ? items(d) : []
        dialog.execute_script("LR.receiveLibrary(#{JSON.generate('dir' => d, 'items' => cat)})")
      rescue StandardError => err
        puts "[LiteRender] library scan failed: #{err.message}"
        dialog.execute_script("LR.receiveLibrary(#{JSON.generate('dir' => d, 'items' => [], 'error' => err.message)})")
      end

      # -> [{ id, name, group, maps: { albedo: rel, normal: rel, rough:, metal:, ao: }, dx: bool }]
      def self.scan(root)
        sets = {}
        files = Dir.glob(File.join(root, '**', '*')).select do |f|
          EXTS.include?(File.extname(f).downcase) && f.count('/') - root.count('/') <= 4
        end
        files.sort.each do |f|
          base = File.basename(f, '.*').downcase
          next if base =~ /preview|thumb|sphere|cube|bump|opacity|mask|spec/
          slot, prefix = classify(base)
          next unless slot
          rel = f.sub(root, '').sub(%r{\A[/\\]}, '')
          key = File.dirname(rel) + '|' + prefix
          s = (sets[key] ||= { 'id' => key, 'name' => nice_name(prefix, rel), 'group' => File.dirname(rel).split(%r{[/\\]}).first.to_s,
                               'maps' => {}, 'dx' => false })
          name = slot == :normal_dx ? 'normal' : slot.to_s
          cur = s['maps'][name]
          if slot == :normal_dx
            # DirectX normals only when no OpenGL one exists (flip G in the viewer)
            next if cur && !s['dx']
            s['dx'] = true
          elsif slot == :normal && s['dx']
            s['dx'] = false # an OpenGL normal map wins over a DirectX one
            cur = nil
          end
          # prefer ~2K files when several resolutions exist
          s['maps'][name] = rel if cur.nil? || (rel =~ /2k/i && cur !~ /2k/i)
        end
        sets.values.select { |s| s['maps']['albedo'] }.sort_by { |s| s['name'].downcase }
      end

      def self.classify(base)
        SLOTS.each do |slot, re|
          m = base.match(re)
          next unless m
          prefix = base[0...m.begin(1)].sub(/[ _-]+\z/, '')
          prefix = prefix.sub(/[ _-]?\d+k(?:[ _-]?(?:jpe?g|png))?\z/, '') # drop resolution tags
          return [slot, prefix]
        end
        nil
      end

      def self.nice_name(prefix, rel)
        n = prefix.to_s.empty? ? File.basename(File.dirname(rel)) : prefix
        n.tr('_-', '  ').squeeze(' ').strip.split(' ').map(&:capitalize).join(' ')
      end

      # Ship one material's maps to the viewer as a JSONP script (data URIs).
      def self.send_maps(dialog, id, cache_dir)
        root = dir
        item = root ? items(root).find { |s| s['id'] == id } : nil
        unless item
          dialog.execute_script("LR.libMapsFailed(#{id.to_json}, 'not found in library')")
          return
        end
        maps = {}
        item['maps'].each do |slot, rel|
          path = File.join(root, rel)
          next unless File.file?(path)
          next if File.size(path) > MAX_MAP_BYTES
          mime = File.extname(path).downcase == '.png' ? 'image/png' : 'image/jpeg'
          maps[slot] = "data:#{mime};base64," + Base64.strict_encode64(File.open(path, 'rb') { |f| f.read })
        end
        js = File.join(cache_dir, "lib_#{Digest::MD5.hexdigest(id)[0, 12]}.js")
        File.open(js, 'wb') do |f|
          f.write('LR.receiveLibMaps(')
          f.write(JSON.generate('id' => id, 'name' => item['name'], 'dx' => item['dx'], 'maps' => maps))
          f.write(");\n")
        end
        dialog.execute_script("LR.loadScript(#{Bridge.file_url(js).to_json})")
      rescue StandardError => err
        dialog.execute_script("LR.libMapsFailed(#{id.to_json}, #{err.message.to_json})")
      end
    end
  end
end
