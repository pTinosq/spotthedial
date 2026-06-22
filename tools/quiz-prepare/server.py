#!/usr/bin/env python3
"""Local-only tool for masking watch faces for the quiz.

Scans `public/watches/<brand>/<model>/thumbnail.webp` for any without a
`thumbnail-quiz.webp` sibling, then serves a small web UI where you drag
rectangles over the logos/text and save. Saving Gaussian-blurs those regions
and writes `thumbnail-quiz.webp` next to the source — which the site then picks
up automatically (see `quizSrc` in lib/data.ts).

Run via `just quiz-prepare`. Binds to localhost only; not part of the deployed
site. Requires Pillow (`pip3 install pillow`).
"""

from __future__ import annotations

import json
import os
import threading
import webbrowser
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path
from urllib.parse import parse_qs, urlparse

from PIL import Image, ImageFilter

ROOT = Path(__file__).resolve().parents[2]
PUBLIC = ROOT / "public"
WATCHES = PUBLIC / "watches"
HERE = Path(__file__).resolve().parent
PORT = int(os.environ.get("QUIZ_PREPARE_PORT", "4321"))
QUIZ_NAME = "thumbnail-quiz.webp"


def scan(include_done: bool) -> list[dict]:
    items = []
    for thumb in sorted(WATCHES.glob("*/*/thumbnail.webp")):
        quiz = thumb.with_name(QUIZ_NAME)
        done = quiz.exists()
        if done and not include_done:
            continue
        items.append(
            {
                "brand": thumb.parts[-3],
                "model": thumb.parts[-2],
                "thumb": thumb.relative_to(PUBLIC).as_posix(),
                "done": done,
            }
        )
    return items


def safe_public_path(rel: str) -> Path:
    """Resolve `rel` under PUBLIC, rejecting traversal outside it."""
    p = (PUBLIC / rel).resolve()
    if not str(p).startswith(str(PUBLIC.resolve()) + os.sep):
        raise ValueError("path escapes public/")
    return p


def blur_and_save(thumb_rel: str, rects: list[dict], radius_frac: float) -> str:
    src = safe_public_path(thumb_rel)
    img = Image.open(src).convert("RGBA")
    w, h = img.size
    radius = max(1.0, radius_frac * w)
    pad = int(radius * 2)
    for r in rects:
        x0 = max(0, int(r["x"] * w))
        y0 = max(0, int(r["y"] * h))
        x1 = min(w, int((r["x"] + r["w"]) * w))
        y1 = min(h, int((r["y"] + r["h"]) * h))
        if x1 <= x0 or y1 <= y0:
            continue
        # Blur a padded crop so the masked region's edges don't stay sharp,
        # then paste back only the selected rectangle.
        ex0, ey0 = max(0, x0 - pad), max(0, y0 - pad)
        ex1, ey1 = min(w, x1 + pad), min(h, y1 + pad)
        region = img.crop((ex0, ey0, ex1, ey1)).filter(ImageFilter.GaussianBlur(radius))
        inner = region.crop((x0 - ex0, y0 - ey0, x0 - ex0 + (x1 - x0), y0 - ey0 + (y1 - y0)))
        img.paste(inner, (x0, y0))
    dst = src.with_name(QUIZ_NAME)
    img.save(dst, "WEBP", quality=82, method=6)
    return dst.relative_to(PUBLIC).as_posix()


CONTENT_TYPES = {".webp": "image/webp", ".png": "image/png", ".html": "text/html; charset=utf-8"}


class Handler(BaseHTTPRequestHandler):
    def log_message(self, *args):  # quieter console
        pass

    def _send(self, code: int, body: bytes, ctype: str):
        self.send_response(code)
        self.send_header("Content-Type", ctype)
        self.send_header("Content-Length", str(len(body)))
        self.end_headers()
        self.wfile.write(body)

    def _json(self, obj, code: int = 200):
        self._send(code, json.dumps(obj).encode(), "application/json")

    def do_GET(self):
        u = urlparse(self.path)
        if u.path == "/":
            self._send(200, (HERE / "index.html").read_bytes(), CONTENT_TYPES[".html"])
        elif u.path == "/api/queue":
            include_done = parse_qs(u.query).get("all", ["0"])[0] == "1"
            self._json(scan(include_done))
        elif u.path == "/file":
            rel = parse_qs(u.query).get("p", [""])[0]
            try:
                p = safe_public_path(rel)
                self._send(200, p.read_bytes(), CONTENT_TYPES.get(p.suffix, "application/octet-stream"))
            except (ValueError, FileNotFoundError):
                self._json({"error": "not found"}, 404)
        else:
            self._json({"error": "not found"}, 404)

    def do_POST(self):
        u = urlparse(self.path)
        if u.path != "/api/save":
            self._json({"error": "not found"}, 404)
            return
        length = int(self.headers.get("Content-Length", "0"))
        data = json.loads(self.rfile.read(length) or b"{}")
        try:
            quiz_rel = blur_and_save(
                data["thumb"],
                data.get("rects", []),
                float(data.get("radiusFrac", 0.02)),
            )
            self._json({"ok": True, "quiz": quiz_rel})
        except Exception as e:  # noqa: BLE001 - surface the message to the UI
            self._json({"ok": False, "error": str(e)}, 400)


def main():
    url = f"http://127.0.0.1:{PORT}/"
    pending = len(scan(False))
    print(f"quiz-prepare → {url}")
    print(f"{pending} watch face(s) awaiting a quiz mask.\n(Ctrl-C to stop.)")
    if not os.environ.get("QUIZ_PREPARE_NO_OPEN"):
        threading.Timer(0.6, lambda: webbrowser.open(url)).start()
    ThreadingHTTPServer(("127.0.0.1", PORT), Handler).serve_forever()


if __name__ == "__main__":
    main()
