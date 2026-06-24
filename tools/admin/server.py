#!/usr/bin/env python3
"""Local-only admin console for Spot the Dial.

A single localhost server hosting the content-authoring tools that aren't part
of the deployed site. Launch a specific tool via the justfile:

  just quiz-prepare     -> /quiz-prepare    mask watch-face logos/text for the quiz
  just variant-prepare  -> /variant-prepare  upload + tag real-world variants

Both share this server, the `/file` image proxy, and the path-safety helpers.
Binds to 127.0.0.1 only. Requires Pillow (and numpy for variant-prepare).

  ADMIN_PORT     port to bind (default 4321)
  ADMIN_OPEN     path to open in the browser on start (default "/")
  ADMIN_NO_OPEN  set to skip auto-opening the browser
"""

import base64
import json
import os
import re
import sys
import tempfile
import threading
import webbrowser
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path
from urllib.parse import parse_qs, urlparse

from PIL import Image, ImageFilter

ROOT = Path(__file__).resolve().parents[2]
PUBLIC = ROOT / "public"
WATCHES = PUBLIC / "watches"
DATA = ROOT / "data"
TAGS_FILE = DATA / "tags.json"
HERE = Path(__file__).resolve().parent
PORT = int(os.environ.get("ADMIN_PORT", "4321"))
OPEN_PATH = os.environ.get("ADMIN_OPEN", "/")
QUIZ_NAME = "thumbnail-quiz.webp"

# prepare_images lives in scripts/ — reuse its normalisation so variant images
# get the same transparent-canvas, consistent-footprint treatment as the rest
# of the catalogue.
sys.path.insert(0, str(ROOT / "scripts"))


# --------------------------------------------------------------------------- #
# shared helpers
# --------------------------------------------------------------------------- #
def safe_public_path(rel: str) -> Path:
    """Resolve `rel` under PUBLIC, rejecting traversal outside it."""
    p = (PUBLIC / rel).resolve()
    if not str(p).startswith(str(PUBLIC.resolve()) + os.sep):
        raise ValueError("path escapes public/")
    return p


def write_json(path: Path, obj) -> None:
    path.write_text(json.dumps(obj, indent=2, ensure_ascii=False) + "\n", encoding="utf-8")


def live_brands() -> list[dict]:
    """Brands in brands.json order, excluding `comingSoon` ones — mirrors what
    the site actually shows (see `getLiveBrands` in lib/data.ts)."""
    try:
        brands = json.loads((DATA / "brands.json").read_text(encoding="utf-8"))
    except (FileNotFoundError, json.JSONDecodeError):
        return []
    return [b for b in brands if not b.get("comingSoon")]


# --------------------------------------------------------------------------- #
# quiz-prepare
# --------------------------------------------------------------------------- #
def scan_quiz(include_done: bool) -> list[dict]:
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


# --------------------------------------------------------------------------- #
# variant-prepare
# --------------------------------------------------------------------------- #
def watches_path(brand: str) -> Path:
    p = (DATA / brand / "watches.json").resolve()
    if not str(p).startswith(str(DATA.resolve()) + os.sep):
        raise ValueError("path escapes data/")
    return p


def load_watches(brand: str) -> list[dict]:
    return json.loads(watches_path(brand).read_text(encoding="utf-8"))


def list_models() -> list[dict]:
    out = []
    for b in live_brands():
        brand = b["id"]
        try:
            watches = json.loads((DATA / brand / "watches.json").read_text(encoding="utf-8"))
        except (FileNotFoundError, json.JSONDecodeError):
            continue
        for w in watches:
            out.append(
                {
                    "brand": brand,
                    "brandName": b.get("name", brand),
                    "model": w["id"],
                    "name": w.get("name", w["id"]),
                    "variantCount": len(w.get("variants", [])),
                }
            )
    return out


def all_tags() -> list[str]:
    """Union of the saved tag library and every tag in use across watches.json."""
    tags: set[str] = set()
    try:
        tags.update(json.loads(TAGS_FILE.read_text(encoding="utf-8")))
    except (FileNotFoundError, json.JSONDecodeError):
        pass
    for wf in DATA.glob("*/watches.json"):
        try:
            for w in json.loads(wf.read_text(encoding="utf-8")):
                for v in w.get("variants", []):
                    tags.update(v.get("tags", []))
        except json.JSONDecodeError:
            continue
    return sorted(tags, key=str.casefold)


def merge_tags(new_tags: list[str]) -> None:
    try:
        existing = set(json.loads(TAGS_FILE.read_text(encoding="utf-8")))
    except (FileNotFoundError, json.JSONDecodeError):
        existing = set()
    existing.update(t for t in new_tags if t)
    write_json(TAGS_FILE, sorted(existing, key=str.casefold))


def next_variant_index(variants_dir: Path) -> int:
    n = 0
    for f in variants_dir.glob("variant-*.webp"):
        m = re.match(r"variant-(\d+)\.webp$", f.name)
        if m:
            n = max(n, int(m.group(1)))
    return n + 1


def save_variants(brand: str, model: str, items: list[dict]) -> dict:
    from prepare_images import normalise  # noqa: PLC0415 — needs numpy, lazy import

    watches = load_watches(brand)
    watch = next((w for w in watches if w["id"] == model), None)
    if watch is None:
        raise ValueError(f"no watch '{model}' in {brand}/watches.json")

    variants_dir = (WATCHES / brand / model / "variants").resolve()
    if not str(variants_dir).startswith(str(WATCHES.resolve()) + os.sep):
        raise ValueError("path escapes watches/")
    variants_dir.mkdir(parents=True, exist_ok=True)

    idx = next_variant_index(variants_dir)
    added = []
    all_new_tags: list[str] = []
    for item in items:
        data_url = item["dataUrl"]
        raw = base64.b64decode(data_url.split(",", 1)[1] if "," in data_url else data_url)
        tags = [t.strip() for t in item.get("tags", []) if t.strip()]

        # normalise() reads from a path; round-trip the upload through a temp PNG.
        tmp = tempfile.NamedTemporaryFile(suffix=".png", delete=False)
        try:
            tmp.write(raw)
            tmp.close()
            canvas = normalise(Path(tmp.name), 2048, 64, 90, 230)
        finally:
            os.unlink(tmp.name)

        dst = variants_dir / f"variant-{idx}.webp"
        canvas.save(dst, "WEBP", quality=82, method=6)
        added.append({"image": f"{model}/variants/{dst.name}", "tags": tags})
        all_new_tags += tags
        idx += 1

    watch.setdefault("variants", []).extend(added)
    write_json(watches_path(brand), watches)
    merge_tags(all_new_tags)
    return {"ok": True, "added": len(added), "variants": added}


# --------------------------------------------------------------------------- #
# HTTP
# --------------------------------------------------------------------------- #
CONTENT_TYPES = {".webp": "image/webp", ".png": "image/png", ".html": "text/html; charset=utf-8"}

LANDING = b"""<!doctype html><meta charset=utf-8>
<title>admin - Spot the Dial</title>
<style>body{font:15px/1.6 ui-sans-serif,system-ui,sans-serif;background:#fbfaf7;color:#1a1a1a;
max-width:560px;margin:80px auto;padding:0 24px}h1{font-size:13px;letter-spacing:.18em;
text-transform:uppercase;color:#6b6b6b}a{display:block;padding:16px 0;border-top:1px solid #e6e3dc;
color:#1a1a1a;text-decoration:none;font-size:20px}a:hover{color:#6b6b6b}a span{display:block;
font-size:13px;color:#6b6b6b}</style>
<h1>admin console</h1>
<a href=/quiz-prepare>quiz-prepare<span>Mask logos/text on thumbnails for the quiz.</span></a>
<a href=/variant-prepare>variant-prepare<span>Upload and tag real-world variants of a model.</span></a>
"""


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

    def _page(self, name: str):
        path = HERE / f"{name}.html"
        if not path.exists():
            self._json({"error": "not found"}, 404)
            return
        self._send(200, path.read_bytes(), CONTENT_TYPES[".html"])

    def do_GET(self):
        u = urlparse(self.path)
        if u.path == "/":
            self._send(200, LANDING, CONTENT_TYPES[".html"])
        elif u.path in ("/quiz-prepare", "/variant-prepare"):
            self._page(u.path.strip("/"))
        elif u.path == "/api/queue":
            include_done = parse_qs(u.query).get("all", ["0"])[0] == "1"
            self._json(scan_quiz(include_done))
        elif u.path == "/api/models":
            self._json(list_models())
        elif u.path == "/api/tags":
            self._json(all_tags())
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
        length = int(self.headers.get("Content-Length", "0"))
        data = json.loads(self.rfile.read(length) or b"{}")
        try:
            if u.path == "/api/save":
                quiz_rel = blur_and_save(
                    data["thumb"], data.get("rects", []), float(data.get("radiusFrac", 0.02))
                )
                self._json({"ok": True, "quiz": quiz_rel})
            elif u.path == "/api/variants":
                self._json(save_variants(data["brand"], data["model"], data.get("items", [])))
            else:
                self._json({"error": "not found"}, 404)
        except Exception as e:  # noqa: BLE001 - surface the message to the UI
            self._json({"ok": False, "error": str(e)}, 400)


def main():
    url = f"http://127.0.0.1:{PORT}{OPEN_PATH}"
    print(f"admin console -> http://127.0.0.1:{PORT}/")
    print(f"opening {OPEN_PATH}\n(Ctrl-C to stop.)")
    if not os.environ.get("ADMIN_NO_OPEN"):
        threading.Timer(0.6, lambda: webbrowser.open(url)).start()
    ThreadingHTTPServer(("127.0.0.1", PORT), Handler).serve_forever()


if __name__ == "__main__":
    main()
