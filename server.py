
from http.server import SimpleHTTPRequestHandler, HTTPServer
from pathlib import Path

class Handler(SimpleHTTPRequestHandler):
    def do_GET(self):
        path = self.translate_path(self.path)

        if not Path(path).exists():
            html_path = Path(path + ".html")
            if html_path.is_file():
                self.path = self.path.rstrip("/") + ".html"

        super().do_GET()

HTTPServer(("localhost", 8000), Handler).serve_forever()