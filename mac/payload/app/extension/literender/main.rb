# Entry point loaded by SketchupExtension when the extension is enabled.
require 'sketchup.rb'

module GANK
  module LiteRender
    require File.join(FILE_DIR, 'pack')
    require File.join(FILE_DIR, 'exporter')
    require File.join(FILE_DIR, 'tracker')
    require File.join(FILE_DIR, 'bridge')
    require File.join(FILE_DIR, 'library')
    require File.join(FILE_DIR, 'link')
    require File.join(FILE_DIR, 'server')

    def self.open_viewer
      Bridge.show
    end

    unless file_loaded?(__FILE__)
      menu = UI.menu('Extensions').add_submenu(PLUGIN_NAME)
      # Browser app (primary)
      menu.add_item('View in Browser (Live Link)') { Link.start }
      menu.add_item('Update Browser View')         { Link.update(true) }
      auto = menu.add_item('Live Link: Auto-update') { Link.toggle_auto }
      menu.set_validation_proc(auto) do
        if !Link.active? then MF_GRAYED
        elsif Link.auto? then MF_CHECKED
        else MF_UNCHECKED
        end
      end
      stop = menu.add_item('Stop Live Link') { Link.stop }
      menu.set_validation_proc(stop) { Link.active? ? MF_ENABLED : MF_GRAYED }
      menu.add_separator
      menu.add_item('Export .lrscene File...')  { Link.export_file(true) }
      menu.add_item('Re-export .lrscene File')  { Link.export_file(false) }
      menu.add_item('Open LiteRender App')      { Link.open_app }
      menu.add_item('Set LiteRender App Location...') { Link.set_desktop_path }
      conn = menu.add_item('Allow App to Connect (Live detect)') { Server.toggle }
      menu.set_validation_proc(conn) { Server.enabled? ? MF_CHECKED : MF_UNCHECKED }
      menu.add_item('Import Viewer Settings...') { Link.import_settings }
      menu.add_separator
      # In-SketchUp viewer (HtmlDialog) — kept as a fallback
      sub = menu.add_submenu('SketchUp Window Viewer')
      sub.add_item('Open Viewer')           { open_viewer }
      sub.add_item('Refresh Scene')         { Bridge.push_scene }
      sub.add_item('Full Re-export')        { Bridge.push_scene(true) }
      sub.add_item('Sync Camera to Viewer') { Bridge.push_camera }
      Server.start if Server.enabled?
      file_loaded(__FILE__)
    end
  end
end
