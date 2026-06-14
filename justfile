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

# Convert every PNG under public/ to WebP (q=82) and remove the original.
# Requires `cwebp` — install once with `brew install webp`.
webp:
    @command -v cwebp >/dev/null || (echo "cwebp not found — run: brew install webp" && exit 1)
    @find public -type f -name '*.png' -print0 | while IFS= read -r -d '' f; do \
      out="${f%.png}.webp"; \
      cwebp -q 82 -quiet "$f" -o "$out" && rm "$f" && echo "✓ $f → $out"; \
    done
