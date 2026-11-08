# Lokale Vorschau: liefert /seite aus seite.html aus (wie GitHub Pages). Port über PORT (Standard 8000).
import os
from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer

class Handler(SimpleHTTPRequestHandler):
    def translate_path(self, path):
        p = super().translate_path(path)
        return p + ".html" if not os.path.exists(p) and os.path.isfile(p + ".html") else p

ThreadingHTTPServer(("localhost", int(os.environ.get("PORT", 8000))), Handler).serve_forever()
