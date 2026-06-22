default:
    @just --list

install:
    pnpm install

dev:
    pnpm dev

build:
    pnpm build

start:
    pnpm start

lint:
    pnpm lint

typecheck:
    pnpm exec tsc --noEmit

check: lint typecheck

# Normalise watch images: remove the white background, then centre the watch on a
# 2048px transparent canvas with 64px padding so every watch renders at a consistent
# size. Pass a file or a folder (searched recursively). Overwrites in place — commit
# first. Optional second arg writes siblings instead, e.g. `just prepare-images testimages -result`.
# Requires Python deps (one-time): pip3 install pillow numpy
prepare-images path suffix="":
    @python3 -c 'import PIL, numpy' 2>/dev/null || (echo "missing deps — run: pip3 install pillow numpy" && exit 1)
    @python3 scripts/prepare_images.py "{{path}}" --suffix="{{suffix}}"

# Launch the local quiz-prepare tool: draw blur masks over watch-face logos/text
# and save them as `thumbnail-quiz.webp` (which the quiz then uses automatically).
# Opens a localhost-only page in your browser. Requires Pillow (pip3 install pillow).
quiz-prepare:
    @python3 -c 'import PIL' 2>/dev/null || (echo "missing dep — run: pip3 install pillow" && exit 1)
    @python3 tools/quiz-prepare/server.py

# Convert every PNG under public/ to WebP (q=82) and remove the original.
# Requires `cwebp` — install once with `brew install webp`.
webp:
    @command -v cwebp >/dev/null || (echo "cwebp not found — run: brew install webp" && exit 1)
    @find public -type f -name '*.png' -print0 | while IFS= read -r -d '' f; do \
      out="${f%.png}.webp"; \
      cwebp -q 82 -quiet "$f" -o "$out" && rm "$f" && echo "✓ $f → $out"; \
    done
