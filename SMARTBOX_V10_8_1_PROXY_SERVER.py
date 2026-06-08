# -*- coding: utf-8 -*-
"""
SMARTBOX_V10_8_1_PROXY_SERVER.py

Proxy phụ cho SmartBox V10.8.1 Diagnostic Admin.
Dùng khi HTML phát thẳng báo nghi CORS/MIME.

Chạy:
  cd /d "D:\DAUTU\GET_link_tiktok\Tool_tim_vang\kenh_radio"
  python SMARTBOX_V10_8_1_PROXY_SERVER.py

Sau đó trong HTML chọn:
  Chế độ phát / kiểm = Qua proxy localhost
  Proxy base = http://localhost:8899/proxy?url=
"""

from __future__ import annotations
import re
import urllib.parse
import urllib.request
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer

PORT = 8899
USER_AGENT = "Mozilla/5.0 SmartBoxV10.8.1Proxy/10.8.1"

def proxy_url(u: str) -> str:
    return "/proxy?url=" + urllib.parse.quote(str(u or ""), safe="")

def guess_type(url: str, upstream: str = "") -> str:
    path = urllib.parse.urlparse(url).path.lower()
    if path.endswith((".m3u8", ".m3u")): return "application/vnd.apple.mpegurl; charset=utf-8"
    if path.endswith(".ts"): return "video/mp2t"
    if path.endswith((".m4s", ".mp4")): return "video/mp4"
    if path.endswith(".mp3"): return "audio/mpeg"
    if path.endswith(".aac"): return "audio/aac"
    if path.endswith(".m4a"): return "audio/mp4"
    if path.endswith((".ogg", ".opus")): return "audio/ogg"
    return upstream or "application/octet-stream"

def rewrite_m3u8(text: str, base_url: str) -> str:
    out = []
    for line in text.splitlines():
        s = line.strip()
        if line.startswith("#EXT-X-KEY") and "URI=" in line:
            line = re.sub(r'URI="([^"]+)"', lambda m: 'URI="' + proxy_url(urllib.parse.urljoin(base_url, m.group(1))) + '"', line)
        elif s and not s.startswith("#"):
            line = proxy_url(urllib.parse.urljoin(base_url, s))
        out.append(line)
    return "\n".join(out) + "\n"

class Handler(BaseHTTPRequestHandler):
    def send_bytes(self, data: bytes, content_type: str, code: int = 200):
        self.send_response(code)
        self.send_header("Content-Type", content_type)
        self.send_header("Access-Control-Allow-Origin", "*")
        self.send_header("Access-Control-Allow-Headers", "Range, Origin, Accept, Content-Type")
        self.send_header("Access-Control-Allow-Methods", "GET, OPTIONS")
        self.send_header("Cache-Control", "no-cache")
        self.send_header("Content-Length", str(len(data)))
        self.end_headers()
        self.wfile.write(data)

    def do_OPTIONS(self):
        self.send_bytes(b"", "text/plain")

    def do_GET(self):
        parsed = urllib.parse.urlparse(self.path)
        if parsed.path in ("/", "/health"):
            self.send_bytes(b"SMARTBOX V10.8.1 PROXY OK", "text/plain; charset=utf-8")
            return
        if parsed.path != "/proxy":
            self.send_bytes(b"not found", "text/plain", 404)
            return
        url = urllib.parse.parse_qs(parsed.query).get("url", [""])[0]
        if not url.startswith(("http://", "https://")):
            self.send_bytes(b"bad url", "text/plain", 400)
            return
        try:
            req = urllib.request.Request(url, headers={"User-Agent": USER_AGENT, "Accept": "*/*"})
            rng = self.headers.get("Range")
            if rng:
                req.add_header("Range", rng)
            with urllib.request.urlopen(req, timeout=20) as r:
                data = r.read()
                ct = r.headers.get("content-type", "")
                final = r.geturl()
            if urllib.parse.urlparse(final).path.lower().endswith((".m3u8", ".m3u")) or b"#EXTM3U" in data[:5000]:
                data = rewrite_m3u8(data.decode("utf-8", errors="replace"), final).encode("utf-8")
                ct = "application/vnd.apple.mpegurl; charset=utf-8"
            else:
                ct = guess_type(final, ct)
            self.send_bytes(data, ct)
        except Exception as e:
            self.send_bytes(("proxy error: " + str(e)).encode("utf-8"), "text/plain; charset=utf-8", 502)

    def log_message(self, fmt, *args):
        print("[HTTP]", fmt % args)

def main():
    print("=" * 90)
    print("SMARTBOX V10.8.1 PROXY SERVER")
    print("URL: http://localhost:8899/health")
    print("Proxy base: http://localhost:8899/proxy?url=")
    print("=" * 90)
    ThreadingHTTPServer(("127.0.0.1", PORT), Handler).serve_forever()

if __name__ == "__main__":
    main()
