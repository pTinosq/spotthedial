#!/usr/bin/env python3
"""Normalise watch-face images to a consistent size on a transparent canvas.

For each input image (a watch photographed on a white background) this:
  1. Removes the background by flood-filling from near-white border pixels,
     so the interior of the watch (e.g. a white dial) is preserved while the
     surrounding white — and soft drop shadows — become transparent.
  2. Crops to the bounding box of what's left.
  3. Scales the watch so its longest side is `size - 2*pad`, then centres it on
     a transparent `size`x`size` canvas — giving every watch the same footprint
     and padding regardless of how the source was cropped.

Reads/writes PNG and WebP. WebP is saved lossy at the same q=82 as `just webp`.

Usage:
    prepare_images.py PATH [PATH ...] [options]

PATH may be a file or a directory (directories are searched recursively for
.png/.webp). By default the source file is overwritten in place; pass --suffix
to write a sibling file instead (e.g. --suffix -result -> thumbnail-result.webp).
"""

from __future__ import annotations

import argparse
import sys
from pathlib import Path

import numpy as np
from PIL import Image, ImageDraw

EXTS = {".png", ".webp"}
SENTINEL = (0, 255, 1)  # marker colour for "background"; not plausible in a watch photo


def remove_background(rgb: Image.Image, thresh: int, white_min: int) -> np.ndarray:
    """Return an alpha channel (uint8 HxW): 0 where background, 255 where watch.

    Flood-fills from every near-white border pixel using PIL's C flood fill, so
    only white connected to the edge is removed. Interior whites stay opaque.
    """
    w, h = rgb.size
    work = rgb.copy()
    px = work.load()

    # Seed points: walk the border, only seed from pixels that are themselves
    # near-white (so we never start a fill inside the watch if it touches an edge).
    step = max(1, min(w, h) // 200)
    seeds = []
    for x in range(0, w, step):
        seeds.append((x, 0))
        seeds.append((x, h - 1))
    for y in range(0, h, step):
        seeds.append((0, y))
        seeds.append((w - 1, y))

    for sx, sy in seeds:
        r, g, b = px[sx, sy][:3]
        if min(r, g, b) < white_min:
            continue  # not background here (watch reaches the edge)
        if (r, g, b) == SENTINEL:
            continue  # already filled by an earlier seed
        ImageDraw.floodfill(work, (sx, sy), SENTINEL, thresh=thresh)

    arr = np.asarray(work, dtype=np.int16)
    is_bg = np.all(arr == np.array(SENTINEL, dtype=np.int16), axis=-1)
    alpha = np.where(is_bg, 0, 255).astype(np.uint8)
    return alpha


def normalise(path: Path, size: int, pad: int, thresh: int, white_min: int) -> Image.Image:
    rgb = Image.open(path).convert("RGB")
    alpha = remove_background(rgb, thresh, white_min)

    ys, xs = np.where(alpha > 0)
    if len(xs) == 0:
        raise ValueError(f"{path}: nothing left after background removal (thresh too high?)")
    x0, x1 = xs.min(), xs.max() + 1
    y0, y1 = ys.min(), ys.max() + 1

    rgba = np.dstack([np.asarray(rgb, dtype=np.uint8), alpha])
    cropped = Image.fromarray(rgba[y0:y1, x0:x1], "RGBA")

    target = size - 2 * pad
    cw, ch = cropped.size
    scale = target / max(cw, ch)
    new = (max(1, round(cw * scale)), max(1, round(ch * scale)))
    cropped = cropped.resize(new, Image.LANCZOS)

    canvas = Image.new("RGBA", (size, size), (0, 0, 0, 0))
    offset = ((size - new[0]) // 2, (size - new[1]) // 2)
    canvas.paste(cropped, offset, cropped)
    return canvas


def save(img: Image.Image, dest: Path) -> None:
    if dest.suffix.lower() == ".webp":
        img.save(dest, "WEBP", quality=82, method=6)
    else:
        img.save(dest, "PNG")


def iter_inputs(paths: list[str], suffix: str):
    for raw in paths:
        p = Path(raw)
        if p.is_dir():
            for f in sorted(p.rglob("*")):
                if f.suffix.lower() in EXTS and not f.stem.endswith(suffix or "\0"):
                    yield f
        elif p.is_file():
            yield p
        else:
            print(f"skip (not found): {p}", file=sys.stderr)


def main() -> int:
    ap = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    ap.add_argument("paths", nargs="+", help="image file(s) or directory(ies)")
    ap.add_argument("--size", type=int, default=2048, help="output canvas size (default 2048)")
    ap.add_argument("--pad", type=int, default=64, help="transparent padding on each side (default 64)")
    ap.add_argument("--thresh", type=int, default=90,
                    help="background colour tolerance, summed over RGB (default 90); raise to eat shadows, lower if it bites the watch")
    ap.add_argument("--white-min", type=int, default=230,
                    help="min per-channel value for a border pixel to count as background (default 230)")
    ap.add_argument("--suffix", default="",
                    help="write a sibling file with this suffix instead of overwriting (e.g. -result)")
    args = ap.parse_args()

    count = 0
    for src in iter_inputs(args.paths, args.suffix):
        dest = src.with_name(f"{src.stem}{args.suffix}{src.suffix}")
        try:
            out = normalise(src, args.size, args.pad, args.thresh, args.white_min)
        except Exception as e:  # noqa: BLE001 - report and continue the batch
            print(f"FAIL {src}: {e}", file=sys.stderr)
            continue
        save(out, dest)
        print(f"✓ {src} → {dest}")
        count += 1

    if count == 0:
        print("no images processed", file=sys.stderr)
        return 1
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
