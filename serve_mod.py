"""Server chơi bản nâng cấp: phục vụ site-mod/ và trả lời /api/version.

Mặc định chỉ máy này vào được. Thêm --lan để điện thoại cùng Wi-Fi vào được.
"""
import http.server
import json
import os
import pathlib
import socket
import socketserver
import sys

ROOT = pathlib.Path(__file__).parent / "site-mod"
PORT = int(os.environ.get("PORT", "8766"))
BASE = os.environ.get("BASE", "")  # Giả lập thư mục con như GitHub Pages: BASE=/bok, chỉ phục vụ dưới tiền tố đó
VERSION = {"v": "34be145195c489cf3c9c6209841f479843348b00", "now": 1794158440285}  # Cùng giá trị với serve.py


class Handler(http.server.SimpleHTTPRequestHandler):
    def __init__(self, *args, **kwargs):
        super().__init__(*args, directory=str(ROOT), **kwargs)

    def end_headers(self):
        self.send_header("Cache-Control", "no-store")
        super().end_headers()

    def do_GET(self):
        path = self.path.split("?", 1)[0]
        if BASE:
            if not (path == BASE or path.startswith(BASE + "/")):
                self.send_error(404)
                return
            path = path[len(BASE):] or "/"
            self.path = path
        if path == "/api/version" and not BASE:  # Trang tĩnh không có API, guard.js tự trả lời
            body = json.dumps(VERSION).encode()
            self.send_response(200)
            self.send_header("Content-Type", "application/json")
            self.send_header("Content-Length", str(len(body)))
            self.end_headers()
            self.wfile.write(body)
            return
        if path.startswith("/api/"):
            self.send_error(404)
            return
        target = ROOT / path.lstrip("/")
        if not path.endswith("/") and target.is_dir():
            self.send_response(301)
            self.send_header("Location", BASE + path + "/")
            self.end_headers()
            return
        return super().do_GET()

    def log_message(self, fmt, *args):
        pass


class Server(socketserver.ThreadingMixIn, socketserver.TCPServer):
    allow_reuse_address = True
    daemon_threads = True


def lan_ips():
    """Mọi IPv4 của máy này, trừ loopback và địa chỉ tự cấp. Máy có nhiều card mạng nên in hết để chọn."""
    ips = socket.gethostbyname_ex(socket.gethostname())[2]
    return [ip for ip in ips if not ip.startswith(("127.", "169.254."))]


if __name__ == "__main__":
    lan = "--lan" in sys.argv
    with Server(("0.0.0.0" if lan else "127.0.0.1", PORT), Handler) as httpd:
        print(f"May tinh: http://127.0.0.1:{PORT}/choi/", flush=True)
        if lan:
            print("Dien thoai cung Wi-Fi, thu cac dia chi sau:", flush=True)
            for ip in lan_ips():
                print(f"  http://{ip}:{PORT}/choi/", flush=True)
        httpd.serve_forever()
