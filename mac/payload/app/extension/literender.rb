# LiteRender - lightweight real-time viewer for SketchUp
# Loader file: SketchUp only evaluates files in the Plugins root, so this file
# registers the extension and points at the real code in ./literender/.
require 'sketchup.rb'
require 'extensions.rb'

module GANK
  module LiteRender
    PLUGIN_ID   = 'literender'.freeze
    PLUGIN_NAME = 'LiteRender'.freeze
    VERSION     = '0.38.0'.freeze

    FILE_DIR = File.join(File.dirname(__FILE__), PLUGIN_ID)

    unless file_loaded?(__FILE__)
      ext = SketchupExtension.new(PLUGIN_NAME, File.join(FILE_DIR, 'main'))
      ext.description = 'Real-time lit viewer for SketchUp models: browser app with live link, plus an in-SketchUp window.'
      ext.version     = VERSION
      ext.creator     = 'GANK'
      Sketchup.register_extension(ext, true)
      file_loaded(__FILE__)
    end
  end
end
