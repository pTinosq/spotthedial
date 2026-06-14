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

- `npm run dev` — dev server on :3000
- `npm run build` — production build
- `npm run lint` — eslint (must pass)
- `npx tsc --noEmit` — typecheck (must pass)

No tests yet. Don't add a test runner until there's real logic to test (quiz scoring, filtering, etc.).

## Project shape

```
app/                Next App Router pages, layouts, route handlers
data/<brand>/       One folder per brand
  models.ts         Typed model data for that brand
  svgs/             Hand-drawn SVG line art, one per model
public/             Static assets that aren't watch SVGs
```

The user authors the SVGs by hand (Figma/Illustrator → exported SVG). Treat them as content, not code:
- Don't regenerate, "optimize," or rewrite them.
- Don't inline them into JSX. Reference them as files.
- A new watch model = a new SVG file + a new entry in that brand's `models.ts`.

Watch data lives in TS modules — no CMS, no DB. If a feature would need one, flag it instead of introducing one.

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
