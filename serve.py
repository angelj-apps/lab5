"""Local dev server with no-cache headers for JS/HTML."""
from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer
import sys

PORT = int(sys.argv[1]) if len(sys.argv) > 1 else 8765


class Handler(SimpleHTTPRequestHandler):
    def end_headers(self):
        if self.path.endswith(('.js', '.html', '.mjs')):
            self.send_header('Cache-Control', 'no-store, must-revalidate')
        super().end_headers()

    def log_message(self, format, *args):
        if args and '200' in str(args[1]):
            return
        super().log_message(format, *args)


if __name__ == '__main__':
    host = '127.0.0.1'
    server = ThreadingHTTPServer((host, PORT), Handler)
    print(f'Serving Lab5 at http://{host}:{PORT} (no-cache enabled)')
    print('Press Ctrl+C to stop.')
    server.serve_forever()
