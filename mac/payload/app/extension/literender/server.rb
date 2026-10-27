# App connection: lets the LiteRender browser app find this SketchUp and load
# the model by itself (Live detect), without SketchUp opening the page.
#
# A browser page can't see running programs, so instead SketchUp answers on a
# fixed local port and the app looks there every few seconds. Transport is
# plain HTTP serving small JavaScript files - the same stamp / scene / camera
# scripts the file-based live link writes - loaded with <script src>, which a
# page opened from disk may do without any CORS setup.
#
# Safety / footprint:
#  * bound to 127.0.0.1 only: unreachable from other machines (and loopback-only
#    sockets don't trigger the Windows firewall prompt)
#  * runs inside SketchUp on a UI timer (no threads, no service, nothing
#    installed); closes when SketchUp quits
#  * read-only: it only serves the export; nothing sent to it changes the model
#  * off switch: Extensions > LiteRender > Allow App to Connect
require 'socket'
require 'json'

module GANK
  module LiteRender
    module Server
      PORTS = (47210..47213).freeze   # first free one; a second SketchUp takes the next
      IDLE_STOP = 30                  # s without app requests -> stop a link the app started
      MAX_REQ = 8192

      @server = nil
      @clients = []
      @last_req = nil

      def self.enabled?; Sketchup.read_default('GANK_LiteRender', 'appConnect', true) != false; end
      def self.running?; !@server.nil?; end
      def self.port; @port; end

      def self.toggle
        on = !enabled?
        Sketchup.write_default('GANK_LiteRender', 'appConnect', on)
        on ? start : stop
      end

      def self.start
        return if @server
        PORTS.each do |p|
          begin
            @server = TCPServer.new('127.0.0.1', p)
            @port = p
            break
          rescue SystemCallError
            next
          end
        end
        unless @server
          puts '[LiteRender] app connection: no free local port (47210-47213), Live detect unavailable'
          return
        end
        @timer = UI.start_timer(0.1, true) { tick }
        puts "[LiteRender] app connection ready on 127.0.0.1:#{@port}"
      rescue StandardError => e
        puts "[LiteRender] app connection could not start: #{e.message}"
        @server = nil
      end

      def self.stop
        UI.stop_timer(@timer) if @timer && defined?(UI.stop_timer)
        @timer = nil
        @clients.each { |c| c[:s].close rescue nil }
        @clients = []
        @server.close if @server
        @server = nil
        Link.stop if Link.by_app?
      rescue StandardError
        @server = nil
      end

      # ---------------------------------------------------------- polling
      def self.tick
        return unless @server
        loop do
          c = @server.accept_nonblock(exception: false)
          break if c == :wait_readable || c.nil?
          @clients << { s: c, buf: +'', t: Time.now }
        end
        @clients.reject! { |cl| step(cl) }
        if Link.by_app? && @last_req && Time.now - @last_req > IDLE_STOP
          Link.stop
          puts '[LiteRender] app went away - live link stopped'
        end
      rescue StandardError => e
        puts "[LiteRender] app connection: #{e.class}: #{e.message}"
      end

      # true = finished with this client
      def self.step(cl)
        d = cl[:s].read_nonblock(4096, exception: false)
        if d.nil?
          cl[:s].close rescue nil
          return true
        elsif d == :wait_readable
          if Time.now - cl[:t] > 5
            cl[:s].close rescue nil
            return true
          end
          return false
        end
        cl[:buf] << d
        return false unless cl[:buf].include?("\r\n\r\n") || cl[:buf].bytesize > MAX_REQ
        line = cl[:buf].lines.first.to_s
        _verb, target, = line.split(' ')
        status, body = route(target.to_s.split('?').first.to_s)
        reply(cl[:s], status, body)
        true
      rescue StandardError => e
        puts "[LiteRender] app connection request failed: #{e.message}"
        cl[:s].close rescue nil
        true
      end

      def self.reply(sock, status, body)
        body = body.to_s.b
        head = "HTTP/1.1 #{status == 200 ? '200 OK' : '404 Not Found'}\r\n" \
               "Content-Type: application/javascript; charset=utf-8\r\n" \
               "Content-Length: #{body.bytesize}\r\n" \
               "Cache-Control: no-store\r\n" \
               "Access-Control-Allow-Origin: *\r\n" \
               "Connection: close\r\n\r\n"
        sock.write(head)
        sock.write(body)
        sock.close
      end

      # ---------------------------------------------------------- routes
      def self.route(path)
        case path
        when '/lr/hello.js'
          [200, "LR_hostHello(#{JSON.generate(hello)});\n"]
        when '/lr/stamp.js'
          @last_req = Time.now
          ensure_link
          f = File.join(Link.link_dir, 'stamp.js')
          [200, Link.active? && File.exist?(f) && !@exporting ? File.binread(f) : "LR_linkStamp(null);\n"]
        when %r{\A/lr/link/([\w\-]+\.js)\z}
          @last_req = Time.now
          f = File.join(Link.link_dir, Regexp.last_match(1))
          File.exist?(f) ? [200, File.binread(f)] : [404, '']
        else
          [404, '']
        end
      end

      def self.hello
        m = Sketchup.active_model
        title = m ? m.title.to_s : ''
        { 'app' => 'LiteRender', 'version' => VERSION, 'host' => 'SketchUp',
          'hostVersion' => Sketchup.version.to_s.split('.').first,
          'model' => title.empty? ? 'Untitled' : title, 'port' => @port, 'linked' => Link.active? }
      end

      # Start (or move) the live link to the model that's open now. The export
      # runs on a timer after this reply, so the app hears back straight away
      # and polls again; until then it gets LR_linkStamp(null) = "exporting".
      def self.ensure_link
        model = Sketchup.active_model
        return unless model
        return if Link.active? && Link.model == model
        return if @exporting
        @exporting = true
        UI.start_timer(0.01, false) do
          begin
            Link.start(open: false, by_app: true)
          ensure
            @exporting = false
          end
        end
      end
    end
  end
end
