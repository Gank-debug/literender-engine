# Change tracking for incremental refresh.
#
# The expensive part of an export is meshing faces (face.mesh), so meshed
# geometry is cached per (definition, inherited material). Observers mark a
# definition dirty when something inside it changes; the next Refresh only
# re-meshes dirty definitions. Instance placements are always re-walked
# (cheap), so moving/copying components never needs a re-mesh.
#
# Lifecycle: created when the viewer first exports, detached (and the cache
# dropped) when the dialog closes, so nothing lingers in SketchUp.
module GANK
  module LiteRender
    class EntsObserver < Sketchup::EntitiesObserver
      def initialize(tracker) @tracker = tracker end

      def onElementAdded(entities, _e)    @tracker.mark(entities) end
      def onElementRemoved(entities, _id) @tracker.mark(entities) end
      def onEraseEntities(entities)       @tracker.mark(entities) end

      def onElementModified(entities, e)
        # Moving/painting an *instance* doesn't change this collection's own
        # faces (placements and instance materials are re-read every export).
        return if e.is_a?(Sketchup::ComponentInstance) || e.is_a?(Sketchup::Group)
        @tracker.mark(entities)
      end
    end

    class DefsObserver < Sketchup::DefinitionsObserver
      def initialize(tracker) @tracker = tracker end
      def onComponentAdded(_defs, d) @tracker.watch_definition(d) end
    end

    class Tracker
      attr_reader :model, :geo_cache, :tex_cache

      def initialize(model)
        @model = model
        @geo_cache = {}   # [defn_id|:root, mat_id|nil] -> cached buckets
        @tex_cache = {}   # material entityID -> [signature, data_uri]
        @dirty = {}       # defn entityID|:root -> true
        @watched = {}     # defn entityID|:root -> Entities
        @ents_obs = EntsObserver.new(self)
        @defs_obs = DefsObserver.new(self)
        @tag_sig = nil
        @attached = false
      end

      def attach
        return if @attached
        @attached = true
        watch(:root, @model.entities)
        @model.definitions.each { |d| watch_definition(d) }
        @model.definitions.add_observer(@defs_obs)
      end

      def detach
        return unless @attached
        @watched.each_value do |ents|
          begin
            ents.remove_observer(@ents_obs)
          rescue StandardError
            nil
          end
        end
        begin
          @model.definitions.remove_observer(@defs_obs)
        rescue StandardError
          nil
        end
        @watched.clear
        @geo_cache.clear
        @tex_cache.clear
        @attached = false
      end

      def watch_definition(d)
        return if d.image?
        watch(d.entityID, d.entities)
      end

      def watch(key, ents)
        return if @watched.key?(key)
        ents.add_observer(@ents_obs)
        @watched[key] = ents
      end

      def mark(entities)
        parent = entities.parent
        key = parent.is_a?(Sketchup::Model) ? :root : parent.entityID
        @dirty[key] = true
      end

      def clear_all
        @geo_cache.clear
        @tex_cache.clear
        @dirty.clear
      end

      # Called before each export: drop cache entries for dirty definitions,
      # and everything if tag/folder visibility changed (faces on hidden tags
      # inside definitions are skipped at mesh time, so visibility is baked in).
      def prepare
        sig = tag_signature
        if sig != @tag_sig
          @geo_cache.clear
          @tag_sig = sig
        end
        unless @dirty.empty?
          @geo_cache.delete_if { |k, _| @dirty.key?(k[0]) }
          @dirty.clear
        end
      end

      def tag_signature
        parts = []
        @model.layers.each { |l| parts << (l.visible? ? '1' : '0') }
        if @model.layers.respond_to?(:each_folder)
          walk = lambda do |f|
            parts << (f.visible? ? 'F1' : 'F0')
            f.each_folder { |c| walk.call(c) } if f.respond_to?(:each_folder)
          end
          @model.layers.each_folder { |f| walk.call(f) }
        end
        parts.join
      end

      # Keep only entries used by the latest export (prunes deleted defs).
      def prune(used_keys)
        @geo_cache.keep_if { |k, _| used_keys.key?(k) }
      end
    end
  end
end
