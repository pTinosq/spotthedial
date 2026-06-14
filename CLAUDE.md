@AGENTS.md

# learnthatwatch

A horology pattern-recognition app. The point isn't a catalog or shop — it's to help someone who loves watches but can't yet *tell them apart at a glance* learn the visual vocabulary. Pick a brand (Rolex, Omega, ...), see hand-drawn line diagrams of its models, and learn to recognize the differences (Oyster vs. Daytona, etc.) from the watchface alone.

Public side project, solo dev, shipping to Vercel.

## Stack

- Next.js 16.2 (App Router) — **breaking changes vs. prior versions; the AGENTS.md warning is not boilerplate.** Check `node_modules/next/dist/docs/` before reaching for any Next API you remember.
- React 19.2
- Tailwind v4 (PostCSS-based, no `tailwind.config.js`)
- TypeScript strict
- Path alias: `@/*` → `./*` (repo root)

## Commands

Package manager is **pnpm** — do not use `npm` or `yarn` (no `package-lock.json`, only `pnpm-lock.yaml`).

Day-to-day commands are wrapped in a `justfile` — prefer `just <recipe>` over typing pnpm directly:

- `just dev` — dev server on :3000
- `just build` — production build
- `just lint` — eslint (must pass)
- `just typecheck` — `tsc --noEmit` (must pass)
- `just check` — lint + typecheck

When adding a new everyday command, add a recipe to `justfile` rather than asking the user to memorise the pnpm form.

No tests yet. Don't add a test runner until there's real logic to test (quiz scoring, filtering, etc.).

## Project shape

```
app/                          Next App Router pages, layouts, route handlers
data/
  brands.json                 The brand index — loaded by the home page
  <brand>/
    watches.json              Array of watches for that brand (brand id is implied by path)
lib/
  types.ts                    Brand, Watch types
  data.ts                     Typed loaders (e.g. getBrands())
public/
  watches/<brand>/<model>/    Hand-drawn SVG + supporting images for each model
    thumbnail.svg
    img1.png, img2.png, ...
```

Data is plain JSON, imported via `resolveJsonModule` and cast to types from `lib/types.ts` in the loader layer (`lib/data.ts`). No CMS, no DB. If a feature would need one, flag it instead of introducing one.

**Watch schema** (`data/<brand>/watches.json`):
```json
{ "id": "daytona", "name": "Cosmograph Daytona",
  "thumbnail": "daytona/thumbnail.svg",
  "images": ["daytona/img1.png", "daytona/img2.png"] }
```
Paths inside the JSON are relative to the brand. The component resolves them to `/watches/<brand>/<path>` (i.e. served from `public/watches/<brand>/...`). Keep the schema minimal — don't add `year`, `family`, `description`, etc. until a feature actually needs them.

The user authors the SVGs by hand (Figma/Illustrator → exported SVG). Treat them as content, not code:
- Don't regenerate, "optimize," or rewrite them.
- Don't inline them into JSX. Reference them as files via the resolved URL.
- A new watch model = drop files in `public/watches/<brand>/<model>/` + add an entry to that brand's `watches.json`.

Routing convention: `/brands/[brand]` for a brand's catalog. Home is `/`.

## Design system

Light mode only. Editorial / minimal — whitespace-heavy, hairline rules (`border-rule`), restrained palette:

- `--background` warm off-white `#fbfaf7`
- `--foreground` near-black `#1a1a1a`
- `--muted` `#6b6b6b` for metadata
- `--rule` `#e6e3dc` for hairline dividers

Fonts: **Fraunces** (serif, `font-serif`) for display / brand names; **Geist Sans** (default `font-sans`) for body and metadata. Use `tabular-nums` for years and counts.

## Design direction

Minimal / editorial. Whitespace-heavy, type-forward, line drawings as the hero. Think design magazine, not e-commerce. Avoid dark luxury-catalog clichés.

## MVP scope

Brand picker → grid of variant line drawings for that brand → click a variant to see its name and (eventually) a small fact. Start with 2–4 brands, a handful of models each. Don't build a quiz mode, search, accounts, or filtering until the browse experience feels right.

## How to work on this

- Just do it — make the reasonable call, ship the diff, the user reviews. No long planning rounds for small changes.
- Lint + typecheck must be clean before declaring done. Run them.
- Don't add backwards-compat shims, feature flags, or speculative abstractions — there are no users yet and no legacy to preserve.
- Don't pad the repo with READMEs, ADRs, or design docs unless asked.
- When adding a new brand or model, follow the existing folder convention exactly; if no convention exists yet, establish it cleanly on the first one.
