# Browser app support: .lrscene file export, the live link to a browser
# window, and importing settings saved in the browser back into the .skp.
#
# Live link transport: a page opened from disk (file://) may not fetch() or
# XHR local files, but it may load <script src> from next to itself. So
# SketchUp writes three small scripts into html/link/ and the page polls them:
#   stamp.js   LR_linkStamp({id})          changes on every export (~0.1 KB)
#   scene_<seq>_<i>.js  LR.receivePackPart(...)  the scene pack in parts (pack.rb)
#   camera.js  LR_linkCamera({seq, camera}) current SketchUp view
# This needs no server or ports. (server.rb adds an optional local port so
# the app can find SketchUp by itself; it serves these same files.) The
# observers are removed again by Stop Live Link (or when SketchUp quits).
require 'json'
require 'fileutils'

module GANK
  module LiteRender
    class LinkModelObserver < Sketchup::ModelObserver
      def onTransactionCommit(_m) Link.schedule end
      def onTransactionUndo(_m)   Link.schedule end
      def onTransactionRedo(_m)   Link.schedule end
    end

    class LinkViewObserver < Sketchup::ViewObserver
      def onViewChanged(_view)
        return if @pending
        @pending = true
        UI.start_timer(0.15, false) do
          @pending = false
          Link.write_camera
        end
      end
    end

    module Link
      DEBOUNCE   = 1.5 # s of quiet after an edit before re-exporting
      HEAVY_SECS = 4.0 # an auto update slower than this pauses auto-update

      @auto = true
      @seq = 0
      @gen = 0
      @last_paths = {}

      def self.active?; !@model.nil?; end
      def self.model; @model; end
      # started by the browser app finding SketchUp (server.rb), not from the menu
      def self.by_app?; !@model.nil? && @by_app; end
      def self.auto?; @auto; end

      # ---------------------------------------------------------- app folder
      # The browser app is the html/ folder of this extension. If that isn't
      # writable, a copy goes to the temp folder so link/ can sit beside it.
      def self.app_dir
        @app_dir ||= begin
          dir = File.join(FILE_DIR, 'html')
          if writable?(File.join(dir, 'link'))
            dir
          else
            require 'tmpdir'
            tmp = File.join(Dir.tmpdir, 'literender_app')
            FileUtils.mkdir_p(File.join(tmp, 'link'))
            %w[viewer.html live.html viewer.bundle.js builtin_tex.js fonts.css].each do |f|
              FileUtils.cp(File.join(dir, f), File.join(tmp, f))
            end
            src_tex = File.join(dir, 'tex')
            FileUtils.cp_r(src_tex, tmp) if File.directory?(src_tex) && !File.directory?(File.join(tmp, 'tex'))
            tmp
          end
        end
      end

      def self.writable?(dir)
        FileUtils.mkdir_p(dir)
        t = File.join(dir, '.write_test')
        File.open(t, 'w') { |f| f.write('ok') }
        File.delete(t)
        true
      rescue StandardError
        false
      end

      def self.link_dir; File.join(app_dir, 'link'); end

      # file:///... without a query string (UI.openURL drops queries on some systems)
      def self.page_url(path)
        Bridge.file_url(path).sub(/\?t=\d+\z/, '')
      end

      # The viewer is built and tested against Chromium (Chrome / Edge). Safari's
      # WebGL behaves differently and can refuse a WebGL context outright, so
      # open the page in Chrome or Edge when one is installed, else the default
      # browser. Override: Sketchup.write_default('GANK_LiteRender', 'browser', 'default')
      def self.chromium_browser
        return nil if Sketchup.read_default('GANK_LiteRender', 'browser', '') == 'default'
        if RUBY_PLATFORM =~ /darwin/
          ['Google Chrome', 'Microsoft Edge', 'Chromium', 'Brave Browser'].each do |app|
            ['/Applications', File.join(Dir.home, 'Applications')].each do |dir|
              return [:mac, app] if File.directory?(File.join(dir, app + '.app'))
            end
          end
        else
          roots = [ENV['ProgramFiles'], ENV['ProgramFiles(x86)'], ENV['LOCALAPPDATA']].compact
          [['Google', 'Chrome', 'chrome.exe'], ['Microsoft', 'Edge', 'msedge.exe']].each do |vendor, prod, exe|
            roots.each do |r|
              f = File.join(r, vendor, prod, 'Application', exe)
              return [:win, f] if File.exist?(f)
            end
          end
        end
        nil
      rescue StandardError
        nil
      end

      def self.open_page(path)
        b = chromium_browser
        if b
          begin
            pid = b[0] == :mac ? Process.spawn('open', '-a', b[1], path) : Process.spawn(b[1], page_url(path))
            Process.detach(pid)
            return true
          rescue StandardError => e
            puts "[LiteRender] could not start #{b[1]}: #{e.message}; using the default browser"
          end
        end
        UI.openURL(page_url(path))
      end

      # ---------------------------------------------------------- live link
      def self.start(open: true, by_app: false)
        model = Sketchup.active_model
        @by_app = by_app
        stop if @model && @model != model
        unless @model
          @model = model
          @tracker = Tracker.new(model)
          @tracker.attach
          @model_obs = LinkModelObserver.new
          model.add_observer(@model_obs)
          @view = model.active_view
          @view_obs = LinkViewObserver.new
          @view.add_observer(@view_obs)
        end
        @auto = true
        update(true)
        write_camera
        open_page(File.join(app_dir, 'live.html')) if open
      end

      def self.stop
        return unless @model
        begin
          @model.remove_observer(@model_obs)
          @view.remove_observer(@view_obs)
        rescue StandardError
          nil
        end
        @tracker.detach if @tracker
        @model = @tracker = @model_obs = @view = @view_obs = nil
        @by_app = false
        Sketchup.status_text = 'LiteRender: live link stopped'
      end

      def self.toggle_auto
        @auto = !@auto
        schedule if @auto
      end

      # Debounced: every edit restarts the countdown, so a burst of edits
      # (or a long move) produces one export once things settle.
      def self.schedule
        return unless @model && @auto
        @gen += 1
        my = @gen
        UI.start_timer(DEBOUNCE, false) do
          update(false) if my == @gen && @model
        end
      end

      def self.update(manual)
        return start unless @model
        if Sketchup.active_model != @model
          Sketchup.status_text = 'LiteRender: live link is attached to another model window'
          return
        end
        t0 = Time.now
        Sketchup.status_text = 'LiteRender: updating browser view...'
        scene = Exporter.new(@model, File.join(Bridge.cache_dir, 'tex'), @tracker).export
        dir = link_dir
        FileUtils.mkdir_p(dir)
        @scene_seq = (@scene_seq || 0) + 1
        name, parts = Pack.write_parts_rotating(scene, dir, 'scene', @scene_seq)
        stamp = { 'id' => "#{Time.now.to_i}-#{@scene_seq}", 'model' => scene['modelName'], 'name' => name, 'parts' => parts }
        replace_file(File.join(dir, 'stamp.js')) { |f| f.write("LR_linkStamp(#{JSON.generate(stamp)});\n") }
        secs = Time.now - t0
        st = scene['stats']
        puts "[LiteRender] live link: meshed #{st[:meshedDefs]} / reused #{st[:cachedDefs]} defs, " \
             "#{st[:triangles]} tris, #{(secs * 1000).round} ms"
        if !manual && secs > HEAVY_SECS
          @auto = false
          Sketchup.status_text = "LiteRender: heavy model (#{secs.round(1)} s per update) - auto-update paused. " \
                                 'Use Extensions > LiteRender > Update Browser View.'
        else
          Sketchup.status_text = ''
        end
      rescue StandardError => err
        puts "[LiteRender] live link export failed: #{err.class}: #{err.message}"
        puts err.backtrace.first(6).join("\n")
        Sketchup.status_text = 'LiteRender: export failed - see Ruby Console'
      end

      def self.write_camera
        return unless @model
        view = @model.active_view
        @seq += 1
        cam = { 'seq' => @seq, 'camera' => Exporter.camera_hash(view.camera, view) }
        replace_file(File.join(link_dir, 'camera.js')) { |f| f.write("LR_linkCamera(#{JSON.generate(cam)});\n") }
      rescue StandardError => err
        puts "[LiteRender] camera write failed: #{err.message}"
      end

      # Write to a temp name then swap, so the browser never reads half a file.
      def self.replace_file(path)
        tmp = path + '.part'
        File.open(tmp, 'wb') { |f| yield f }
        begin
          File.delete(path) if File.exist?(path)
          File.rename(tmp, path)
        rescue StandardError
          # Windows: target briefly locked by the browser -> write in place
          File.open(path, 'wb') { |f| f.write(File.binread(tmp)) }
          File.delete(tmp) rescue nil
        end
      end

      # ---------------------------------------------------------- .lrscene file
      def self.export_file(ask = true)
        model = Sketchup.active_model
        key = model.path.to_s.empty? ? model.object_id.to_s : model.path
        path = ask ? nil : @last_paths[key]
        unless path
          dir = Sketchup.read_default('GANK_LiteRender', 'exportDir', nil)
          dir = File.dirname(model.path) if (dir.nil? || !File.directory?(dir)) && !model.path.to_s.empty?
          dir = File.expand_path('~') if dir.nil? || !File.directory?(dir)
          base = model.title.to_s.empty? ? 'scene' : model.title.to_s
          path = UI.savepanel('Export LiteRender scene', dir, base.gsub(/[^\w\-. ]+/, '_') + '.lrscene')
          return unless path
          path += '.lrscene' unless path.downcase.end_with?('.lrscene')
          Sketchup.write_default('GANK_LiteRender', 'exportDir', File.dirname(path))
        end
        t0 = Time.now
        Sketchup.status_text = 'LiteRender: exporting scene...'
        scene = Exporter.new(model, File.join(Bridge.cache_dir, 'tex'), nil).export
        Pack.write_file(scene, path, :deflate)
        @last_paths[key] = path
        mb = (File.size(path) / 1048576.0).round(1)
        secs = (Time.now - t0).round(1)
        Sketchup.status_text = "LiteRender: exported #{File.basename(path)} (#{mb} MB, #{secs} s)"
        puts "[LiteRender] exported #{path} - #{mb} MB, #{scene['stats'][:triangles]} tris, #{secs} s"
      rescue StandardError => err
        puts "[LiteRender] export failed: #{err.class}: #{err.message}"
        puts err.backtrace.first(6).join("\n")
        UI.messagebox("LiteRender export failed:\n#{err.message}")
      end

      # The desktop app (LiteRender.exe / LiteRender.app) if its location is set,
      # else the browser app. The desktop app finds SketchUp by itself (server.rb).
      def self.desktop_path
        p = Sketchup.read_default('GANK_LiteRender', 'desktopApp', '').to_s
        return p if !p.empty? && File.exist?(p)
        # written by the desktop app when it installs / updates this extension
        f = File.join(FILE_DIR, 'desktop_app.txt')
        p = File.exist?(f) ? File.read(f).strip : ''
        p.empty? || !File.exist?(p) ? nil : p
      end

      def self.open_app
        exe = desktop_path
        if exe
          begin
            pid = RUBY_PLATFORM =~ /darwin/ ? Process.spawn('open', exe) : Process.spawn(exe)
            Process.detach(pid)
            Sketchup.status_text = 'LiteRender: starting the app - it connects to this model by itself'
            return
          rescue StandardError => e
            puts "[LiteRender] could not start #{exe}: #{e.message}; opening the browser app"
          end
        end
        open_page(File.join(app_dir, 'viewer.html'))
      end

      def self.set_desktop_path
        mac = RUBY_PLATFORM =~ /darwin/
        if mac
          # an .app is a folder: pick any file inside it, or the app via its Contents
          f = UI.openpanel('Locate LiteRender.app (choose any file inside it, e.g. Contents/Info.plist)', '/Applications', '*.*')
          f = f && f[%r{\A(.*?\.app)(/|\z)}, 1]
        else
          f = UI.openpanel('Locate LiteRender.exe', Dir.home, 'LiteRender|LiteRender.exe||')
        end
        return unless f
        if !mac && File.basename(f).downcase != 'literender.exe'
          UI.messagebox('Please choose LiteRender.exe (from the LiteRender desktop app folder).')
          return
        end
        Sketchup.write_default('GANK_LiteRender', 'desktopApp', f)
        UI.messagebox("LiteRender app set:\n#{f}\n\nExtensions > LiteRender > Open LiteRender App now starts it.")
      end

      # ---------------------------------------------------------- settings
      def self.import_settings
        path = UI.openpanel('Import LiteRender settings', nil, 'LiteRender settings|*.json||')
        return unless path
        json = File.open(path, 'rb') { |f| f.read }.force_encoding('UTF-8')
        data = JSON.parse(json)
        unless data.is_a?(Hash) && (data['materials'] || data['env'])
          UI.messagebox('That file does not contain LiteRender settings.')
          return
        end
        if Exporter.save_all(Sketchup.active_model, JSON.generate('materials' => data['materials'] || {}, 'env' => data['env'] || {}))
          n = (data['materials'] || {}).size
          UI.messagebox("Imported #{n} material setting#{n == 1 ? '' : 's'} and the environment into this model.\nSave the .skp to keep them.")
        else
          UI.messagebox('Import failed - see Ruby Console.')
        end
      rescue StandardError => err
        UI.messagebox("Import failed:\n#{err.message}")
      end
    end
  end
end
