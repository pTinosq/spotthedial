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

# Launch the admin console at /quiz-prepare: draw blur masks over watch-face
# logos/text and save them as `thumbnail-quiz.webp` (which the quiz then uses
# automatically). Localhost-only. Requires Pillow (pip3 install pillow).
quiz-prepare:
    @python3 -c 'import PIL' 2>/dev/null || (echo "missing dep — run: pip3 install pillow" && exit 1)
    @ADMIN_OPEN=/quiz-prepare python3 tools/admin/server.py

# Launch the admin console at /variant-prepare: pick a model, drop in watch-face
# images, tag each (with fuzzy autocomplete from the shared tag library), and save.
# Images are normalised + saved as WebP and written into the model's `variants`.
# Localhost-only. Requires Python deps (one-time): pip3 install pillow numpy
variant-prepare:
    @python3 -c 'import PIL, numpy' 2>/dev/null || (echo "missing deps — run: pip3 install pillow numpy" && exit 1)
    @ADMIN_OPEN=/variant-prepare python3 tools/admin/server.py

# Convert every PNG under public/ to WebP (q=82) and remove the original.
# Requires `cwebp` — install once with `brew install webp`.
webp:
    @command -v cwebp >/dev/null || (echo "cwebp not found — run: brew install webp" && exit 1)
    @find public -type f -name '*.png' -print0 | while IFS= read -r -d '' f; do \
      out="${f%.png}.webp"; \
      cwebp -q 82 -quiet "$f" -o "$out" && rm "$f" && echo "✓ $f → $out"; \
    done
