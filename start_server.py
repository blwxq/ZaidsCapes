"""
Simple HTTP Server for Website
Starts a server that makes the website accessible to anyone on your network
"""
import http.server
import socketserver
import os
import socket

# Change directory to website folder
os.chdir(os.path.dirname(os.path.abspath(__file__)))

PORT = 8000

# Get local IP address
def get_local_ip():
    """Get the local IP address"""
    try:
        # Connect to a remote address to get local IP
        s = socket.socket(socket.AF_INET, socket.SOCK_DGRAM)
        s.connect(("8.8.8.8", 80))
        ip = s.getsockname()[0]
        s.close()
        return ip
    except Exception:
        return "localhost"

# Allow all hosts
class MyHTTPRequestHandler(http.server.SimpleHTTPRequestHandler):
    def end_headers(self):
        # Add CORS headers
        self.send_header('Access-Control-Allow-Origin', '*')
        self.send_header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS')
        self.send_header('Access-Control-Allow-Headers', 'Content-Type')
        super().end_headers()
    
    def log_message(self, format, *args):
        # Custom logging
        print(f"[{self.address_string()}] {args[0]}")

if __name__ == "__main__":
    local_ip = get_local_ip()
    
    with socketserver.TCPServer(("0.0.0.0", PORT), MyHTTPRequestHandler) as httpd:
        print("=" * 60)
        print("🌐 Website Server Started!")
        print("=" * 60)
        print(f"📱 Local access:     http://localhost:{PORT}")
        print(f"🌍 Network access:   http://{local_ip}:{PORT}")
        print("=" * 60)
        print("\n💡 To access from other devices:")
        print(f"   • Make sure they're on the same network")
        print(f"   • Use: http://{local_ip}:{PORT}")
        print("\n⏹️  Press Ctrl+C to stop the server")
        print("=" * 60)
        
        try:
            httpd.serve_forever()
        except KeyboardInterrupt:
            print("\n\n🛑 Server stopped")

