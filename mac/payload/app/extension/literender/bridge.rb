# Dialog bridge: owns the UI::HtmlDialog and moves data between Ruby and JS.
#
# Transport: the scene pack (pack.rb) is written to cache/scene_<n>_<i>.js
# as JSONP part scripts (LR.receivePackPart(...)) and the dialog is told to load it with a <script>
# tag. This avoids pushing multi-MB strings through execute_script (slow, and
# fragile on older CEF), and classic <script src> is allowed under file://,
# whereas fetch()/XHR of local files is blocked.
require 'json'
require 'fileutils'
require 'base64'

module GANK
  module LiteRender
    # Pushes the SketchUp camera to the viewer while "Follow SketchUp view" is
    # on. onViewChanged fires on every orbit frame, so it is throttled with a
    # one-shot timer: at most ~8 small messages per second.
    class ViewFollower < Sketchup::ViewObserver
      def onViewChanged(_view)
        return if @pending
        @pending = true
        UI.start_timer(0.12, false) do
          @pending = false
          Bridge.push_camera
        end
      end
    end

    module Bridge
      HTML_FILE = File.join(FILE_DIR, 'html', 'viewer.html')

      def self.cache_dir
        @cache_dir ||= begin
          dir = File.join(FILE_DIR, 'cache') # stays inside the user Plugins folder
          begin
            FileUtils.mkdir_p(File.join(dir, 'tex'))
            test = File.join(dir, '.write_test')
            File.open(test, 'w') { |f| f.write('ok') }
            File.delete(test)
          rescue StandardError
            require 'tmpdir'
            dir = File.join(Dir.tmpdir, 'literender_cache')
            FileUtils.mkdir_p(File.join(dir, 'tex'))
          end
          dir
        end
      end

      def self.show
        if @dialog && @dialog.visible?
          @dialog.bring_to_front
          push_scene
          return
        end
        @dialog = UI::HtmlDialog.new(
          dialog_title: "#{PLUGIN_NAME} #{VERSION}",
          preferences_key: 'GANK_LiteRender',
          scrollable: false, resizable: true,
          width: 1280, height: 800, left: 100, top: 100,
          style: UI::HtmlDialog::STYLE_DIALOG
        )
        @dialog.set_file(HTML_FILE)
        register_callbacks(@dialog)
        @dialog.set_on_closed do
          follow(false)
          drop_tracker # release observers and cached geometry
        end
        @dialog.show
      end

      # Callback args: first param is the action context (SU2017+ signature).
      def self.register_callbacks(dlg)
        dlg.add_action_callback('ready') do |_ctx|
          push_scene
          Library.send_catalog(@dialog) if Library.dir
        end
        dlg.add_action_callback('refresh') { |_ctx, full| push_scene(full ? true : false) }
        dlg.add_action_callback('saveData') do |_ctx, key, json|
          ok = Exporter.save_data(Sketchup.active_model, key.to_s, json.to_s)
          @dialog.execute_script("LR.dataSaved(#{key.to_s.to_json}, #{ok ? 'true' : 'false'})") if @dialog
        end
        dlg.add_action_callback('saveAll') do |_ctx, json|
          ok = Exporter.save_all(Sketchup.active_model, json.to_s)
          @dialog.execute_script("LR.allSaved(#{ok ? 'true' : 'false'})") if @dialog
        end
        dlg.add_action_callback('pickHdri') { |_ctx| pick_hdri }
        dlg.add_action_callback('libPick')    { |_ctx| Library.pick_folder(@dialog) }
        dlg.add_action_callback('libCatalog') { |_ctx| Library.send_catalog(@dialog) }
        dlg.add_action_callback('libLoad')    { |_ctx, id| Library.send_maps(@dialog, id.to_s, cache_dir) }
        dlg.add_action_callback('loadHdri') { |_ctx, path| send_hdri(path.to_s) }
        dlg.add_action_callback('saveMaterials') do |_ctx, json|
          ok = Exporter.save_overrides(Sketchup.active_model, json.to_s)
          @dialog.execute_script("LR.materialsSaved(#{ok ? 'true' : 'false'})") if @dialog
        end
        dlg.add_action_callback('camera')  { |_ctx| push_camera }
        dlg.add_action_callback('follow')  { |_ctx, on| follow(on ? true : false) }
        # --- saving renders: the viewer asks for a location once, then streams
        # each PNG as base64 chunks (1 MB each, acked one by one, so large
        # images never go through a single huge callback string).
        dlg.add_action_callback('saveBegin') { |_ctx, name| save_begin(name.to_s) }
        dlg.add_action_callback('saveChunk') do |_ctx, suffix, index, data|
          save_chunk(suffix.to_s, index.to_i, data.to_s)
        end
        dlg.add_action_callback('log') do |_ctx, level, msg|
          puts "[LiteRender JS #{level}] #{msg}"
        end
      end

      # Attach/detach the view observer. Detached on dialog close so nothing
      # keeps running in SketchUp once the viewer is gone.
      def self.follow(on)
        view = Sketchup.active_model.active_view
        if on
          return if @follower
          @follower = ViewFollower.new
          @follow_view = view
          view.add_observer(@follower)
          push_camera
        elsif @follower
          begin
            @follow_view.remove_observer(@follower)
          rescue StandardError
            nil
          end
          @follower = nil
          @follow_view = nil
        end
      end

      MAX_HDRI_BYTES = 80 * 1024 * 1024

      def self.pick_hdri
        path = UI.openpanel('Choose an HDRI environment', nil, 'HDR images|*.hdr;*.exr||')
        if path
          send_hdri(path)
        else
          @dialog.execute_script('LR.hdriFailed(null)')
        end
      end

      # The HDRI travels like the scene: written into a JSONP script that the
      # dialog loads with <script src> (fetch of local files is blocked).
      def self.send_hdri(path)
        unless File.file?(path)
          @dialog.execute_script("LR.hdriFailed(#{('HDRI not found: ' + path).to_json})")
          return
        end
        if File.size(path) > MAX_HDRI_BYTES
          @dialog.execute_script("LR.hdriFailed(#{'HDRI is larger than 80 MB — use a 2K/4K version'.to_json})")
          return
        end
        data = File.open(path, 'rb') { |f| f.read }
        js = File.join(cache_dir, 'hdri.js')
        File.open(js, 'wb') do |f|
          f.write('LR.receiveHdri(')
          f.write(JSON.generate('path' => path, 'name' => File.basename(path),
                                'ext' => File.extname(path).downcase.delete('.'),
                                'data' => Base64.strict_encode64(data)))
          f.write(");\n")
        end
        @dialog.execute_script("LR.loadScript(#{file_url(js).to_json})")
      rescue StandardError => err
        @dialog.execute_script("LR.hdriFailed(#{err.message.to_json})")
      end

      def self.save_begin(name)
        model = Sketchup.active_model
        dir = Sketchup.read_default('GANK_LiteRender', 'lastDir', nil)
        dir = File.dirname(model.path) if (dir.nil? || !File.directory?(dir)) && !model.path.to_s.empty?
        dir = File.expand_path('~') if dir.nil? || !File.directory?(dir)
        safe = name.gsub(/[^\w\-. ]+/, '_')
        safe = 'render' if safe.strip.empty?
        path = UI.savepanel('Save render (passes are saved next to it)', dir, safe + '.png')
        if path
          path += '.png' unless path.downcase.end_with?('.png')
          Sketchup.write_default('GANK_LiteRender', 'lastDir', File.dirname(path))
          @save_base = path.sub(/\.png\z/i, '')
        else
          @save_base = nil
        end
        @dialog.execute_script("LR.saveReady(#{path ? path.to_json : 'null'})")
      end

      def self.save_chunk(suffix, index, data)
        return unless @save_base
        sfx = suffix.gsub(/[^\w\-. ]+/, '_')
        file = @save_base + sfx + '.png'
        File.open(file, index == 0 ? 'wb' : 'ab') { |f| f.write(Base64.decode64(data)) }
        @dialog.execute_script('LR.saveAck(true)')
      rescue StandardError => err
        puts "[LiteRender] saving #{file} failed: #{err.message}"
        @dialog.execute_script("LR.saveAck(false, #{err.message.to_json})")
      end

      # One tracker per model; replaced if the user switches documents (Mac).
      def self.tracker_for(model)
        if @tracker && @tracker.model != model
          drop_tracker
        end
        unless @tracker
          @tracker = Tracker.new(model)
          @tracker.attach
        end
        @tracker
      end

      def self.drop_tracker
        @tracker.detach if @tracker
        @tracker = nil
      end

      def self.push_scene(full = false)
        return unless @dialog
        model = Sketchup.active_model
        Sketchup.status_text = 'LiteRender: exporting...'
        tracker = tracker_for(model)
        tracker.clear_all if full
        exp = Exporter.new(model, File.join(cache_dir, 'tex'), tracker)
        scene = exp.export
        t0 = Time.now
        @seq = (@seq || 0) + 1
        name, parts = Pack.write_parts_rotating(scene, cache_dir, 'scene', @seq)
        paths = (0...parts).map { |i| File.join(cache_dir, "#{name}_#{i}.js") }
        st = scene['stats']
        st[:writeMs] = ((Time.now - t0) * 1000).round
        mb = (paths.inject(0) { |a, p| a + File.size(p) } / 1024.0 / 1024.0).round(1)
        puts "[LiteRender] meshed #{st[:meshedDefs]} defs / reused #{st[:cachedDefs]} | " \
             "#{st[:faces]} faces meshed, #{st[:triangles]} tris, #{st[:meshes]} meshes, " \
             "#{st[:instances]} instances | export #{st[:exportMs]} ms (walk #{st[:walkMs]}, " \
             "textures #{st[:texMs]}, pack #{st[:packMs]}) + write #{st[:writeMs]} ms, #{mb} MB"
        Sketchup.status_text = ''
        urls = paths.map { |p| file_url(p).sub(/\?t=\d+\z/, '') }
        @dialog.execute_script("LR.loadPackParts(#{JSON.generate(urls)}, #{JSON.generate(writeMs: st[:writeMs])})")
      rescue StandardError => err
        puts "[LiteRender] export failed: #{err.class}: #{err.message}"
        puts err.backtrace.first(8).join("\n")
        if @dialog
          @dialog.execute_script("LR.showError(#{('Export failed: ' + err.message).to_json})")
        end
      end

      def self.push_camera
        return unless @dialog && @dialog.visible?
        view = Sketchup.active_model.active_view
        cam = Exporter.camera_hash(view.camera, view)
        @dialog.execute_script("LR.setCamera(#{JSON.generate(cam)})")
      end

      # Windows paths -> file:///C:/... ; cache-busted so the script reloads.
      def self.file_url(path)
        p = path.tr('\\', '/')
        p = '/' + p unless p.start_with?('/')
        # Percent-encode anything unsafe (spaces, non-ASCII user names, etc.)
        enc = p.split('/', -1).map do |seg|
          seg.gsub(/[^A-Za-z0-9\-._~:]/) { |c| c.bytes.map { |byte| format('%%%02X', byte) }.join }
        end.join('/')
        'file://' + enc + "?t=#{(Time.now.to_f * 1000).to_i}"
      end
    end
  end
end
