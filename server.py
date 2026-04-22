#!/usr/bin/env python3
"""Zero-dependency local dev server for HAND.TRACE.SYS.
Serves the current directory with correct MIME types for ES modules.

Usage:
  python3 server.py          # port 8080
  python3 server.py 3000     # custom port
"""

import http.server
import socketserver
import sys

PORT = int(sys.argv[1]) if len(sys.argv) > 1 else 8080


class Handler(http.server.SimpleHTTPRequestHandler):
    def end_headers(self):
        # Required for SharedArrayBuffer (MediaPipe WASM) and ES modules
        self.send_header('Cross-Origin-Opener-Policy',   'same-origin')
        self.send_header('Cross-Origin-Embedder-Policy', 'require-corp')
        # General hardening
        self.send_header('X-Content-Type-Options', 'nosniff')
        self.send_header('X-Frame-Options',        'DENY')
        self.send_header('Permissions-Policy',     'camera=self, microphone=self')
        self.send_header(
            'Content-Security-Policy',
            "default-src 'self'; "
            "script-src 'self' https://cdn.jsdelivr.net 'unsafe-inline'; "
            "style-src  'self' https://fonts.googleapis.com 'unsafe-inline'; "
            "font-src   'self' https://fonts.gstatic.com; "
            "connect-src 'self' https://cdn.jsdelivr.net; "
            "worker-src blob:; "
            "img-src 'self' blob: data:;"
        )
        super().end_headers()

    def log_message(self, fmt, *args):
        print(f"  {self.address_string():>15}  {fmt % args}")


print(f"""
  ╔══════════════════════════════════════╗
  ║   手追跡 // HAND.TRACE.SYS           ║
  ║   Local server ready                 ║
  ╚══════════════════════════════════════╝

  → http://localhost:{PORT}

  Open the URL in Chrome (camera permission required).
  Press Ctrl+C to stop.
""")

with socketserver.TCPServer(('127.0.0.1', PORT), Handler) as httpd:
    httpd.serve_forever()
