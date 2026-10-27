# Scene pack (.lrscene): one file holding the scene JSON and every binary
# buffer (positions, indices, UVs, instance matrices, textures) as raw bytes.
#
# Layout (little-endian):
#   0  "LRS1"          magic
#   4  u8  flags       bit 0 = payload is zlib-deflated
#   5  3 bytes         reserved (0)
#   8  payload:        u32 jsonLength | JSON (UTF-8) | pad to 4 | blob
#
# In the JSON a buffer is a reference { "b": offset, "n": bytes, "t": type }
# into the blob (type: f32 | u16 | u32 | img). Offsets are 4-byte aligned so
# the viewer can view typed arrays straight onto the decoded bytes.
#
# The same bytes travel three ways:
#   * a .lrscene file on disk (deflated)          -> opened in the browser app
#   * link/scene.js for the live browser view     -> LR.receivePack("<base64>")
#   * cache/scene.js for the SketchUp dialog      -> LR.receivePack("<base64>")
# The two .js forms are uncompressed: they are local files, so deflate would
# only cost time.
require 'json'
require 'zlib'
require 'base64'

module GANK
  module LiteRender
    # Raw binary buffer produced by the exporter, resolved when packed.
    Bin = Struct.new(:data, :type)

    module Pack
      MAGIC = 'LRS1'.b.freeze
      FLAG_DEFLATE = 1

      # Writes header + payload to `io`. mode: :deflate | :raw | :jsonp (base64
      # inside a LR.receivePack("...") call). Returns payload byte size.
      def self.write_to_sink(scene, sink, mode) write(scene, sink, mode) end

      def self.write(scene, io, mode = :deflate, jsonp_fn = 'LR.receivePack')
        blob = []
        offset = [0]
        seen = {}
        json_obj = resolve(scene, blob, offset, seen)
        json = JSON.generate(json_obj).b
        head_len = 4 + json.bytesize
        pad = (4 - head_len % 4) % 4

        flags = mode == :deflate ? FLAG_DEFLATE : 0
        header = MAGIC + [flags, 0, 0, 0].pack('C4')

        sink = if io.respond_to?(:part_sink?) then io.start(header)
               else
                 case mode
                 when :deflate then DeflateSink.new(io, header)
                 when :jsonp then B64Sink.new(io, jsonp_fn, header)
                 else RawSink.new(io, header)
                 end
               end
        sink.write([json.bytesize].pack('V'))
        sink.write(json)
        sink.write("\0" * pad) if pad > 0
        blob.each { |s| sink.write(s) }
        sink.finish
        head_len + pad + offset[0]
      end

      # JSONP in parts: V8 caps a string (and a script's source) at ~512 MB,
      # so big scenes are split into several scripts of <= PART_BYTES each:
      #   <dir>/<name>_<i>.js : LR.receivePackPart("<token>", i, n, "<base64>");
      # Returns the number of parts.
      PART_BYTES = 48 * 1024 * 1024

      def self.write_parts(scene, dir, name, token)
        sink = PartSink.new(dir, name, token)
        write_to_sink(scene, sink, :raw)
        sink.count
      end

      # Writes <dir>/<prefix>_<seq>_<i>.js and removes parts older than the
      # previous export (a reader may still be on that one). -> [name, count]
      def self.write_parts_rotating(scene, dir, prefix, seq)
        name = "#{prefix}_#{seq}"
        n = write_parts(scene, dir, name, name)
        Dir.glob(File.join(dir, "#{prefix}_*_*.js")).each do |f|
          s = File.basename(f)[/\A#{Regexp.escape(prefix)}_(\d+)_\d+\.js\z/, 1]
          next unless s
          begin
            File.delete(f) if s.to_i < seq - 1
          rescue StandardError
            nil # locked by the browser (Windows); cleaned up next time
          end
        end
        [name, n]
      end

      def self.write_file(scene, path, mode = :deflate)
        tmp = path + '.part'
        File.open(tmp, 'wb') { |f| write(scene, f, mode) }
        File.delete(path) if File.exist?(path)
        File.rename(tmp, path)
      end

      # Bin -> { b, n, t } (deduplicated: shared instance buffers go in once)
      def self.resolve(obj, blob, offset, seen)
        case obj
        when Hash
          h = {}
          obj.each { |k, v| h[k] = resolve(v, blob, offset, seen) }
          h
        when Array
          obj.map { |v| resolve(v, blob, offset, seen) }
        when Bin
          ref = seen[obj.object_id]
          return ref if ref
          data = obj.data
          n = data.bytesize
          ref = { 'b' => offset[0], 'n' => n, 't' => obj.type }
          blob << data
          pad = (4 - n % 4) % 4
          blob << ("\0" * pad) if pad > 0
          offset[0] += n + pad
          seen[obj.object_id] = ref
          ref
        else
          obj
        end
      end

      class RawSink
        def initialize(io, header)
          @io = io
          @io.write(header)
        end

        def write(s) @io.write(s) end
        def finish; end
      end

      class DeflateSink
        def initialize(io, header)
          @io = io
          @io.write(header)
          @z = Zlib::Deflate.new(Zlib::BEST_SPEED)
        end

        def write(s)
          # feed in slices so a 200 MB blob never doubles in memory at once
          i = 0
          step = 4 * 1024 * 1024
          while i < s.bytesize
            @io.write(@z.deflate(s.byteslice(i, step)))
            i += step
          end
        end

        def finish
          @io.write(@z.finish)
          @z.close
        end
      end

      # Raw bytes -> numbered JSONP part files (uncompressed pack).
      class PartSink
        attr_reader :count

        def initialize(dir, name, token)
          @dir, @name, @token = dir, name, token
          @parts = []
          @buf = ''.b
          @count = 0
        end

        def part_sink?; true; end

        def start(header)
          write(header)
          self
        end

        def write(s)
          i = 0
          while i < s.bytesize
            room = PART_BYTES - @buf.bytesize
            piece = s.byteslice(i, room)
            @buf << piece
            i += piece.bytesize
            flush_part if @buf.bytesize >= PART_BYTES
          end
        end

        def flush_part
          @parts << @buf
          @buf = ''.b
          # parts are written in finish, once the total count is known
          spill if @parts.size > 1
        end

        # Keep at most one part in memory: write earlier parts with a
        # placeholder count, then patch the count into each file at the end.
        def spill
          data = @parts.shift
          write_part(@count, data)
          @count += 1
        end

        COUNT_PAD = 6 # digits reserved for the part count

        def write_part(i, data)
          File.open(File.join(@dir, "#{@name}_#{i}.js"), 'wb') do |f|
            f.write("LR.receivePackPart(#{@token.to_json}, #{i}, #{format("%#{COUNT_PAD}d", 0)}, \"")
            f.write(Base64.strict_encode64(data))
            f.write("\");\n")
          end
        end

        def finish
          @parts << @buf unless @buf.empty? && !@parts.empty?
          @parts.each { |d| write_part(@count, d); @count += 1 }
          @parts.clear
          @buf = ''.b
          # patch the padded part count in place (same length, no rewrite)
          head = "LR.receivePackPart(#{@token.to_json}, "
          @count.times do |i|
            File.open(File.join(@dir, "#{@name}_#{i}.js"), 'r+b') do |f|
              f.seek(head.bytesize + i.to_s.size + 2)
              f.write(format("%#{COUNT_PAD}d", @count)) # space-padded: '0'-padded would be octal in JS
            end
          end
        end
      end

      # Base64 in 3-byte-aligned chunks so the encoding is continuous.
      class B64Sink
        CHUNK = 3 * 1024 * 1024

        def initialize(io, fn, header)
          @io = io
          @buf = ''.b
          @io.write(fn + '("')
          write(header)
        end

        def write(s)
          @buf << s
          return if @buf.bytesize < CHUNK
          n = @buf.bytesize - (@buf.bytesize % 3)
          @io.write(Base64.strict_encode64(@buf.byteslice(0, n)))
          @buf = @buf.byteslice(n, @buf.bytesize - n) || ''.b
        end

        def finish
          @io.write(Base64.strict_encode64(@buf)) unless @buf.empty?
          @io.write("\");\n")
        end
      end
    end
  end
end
