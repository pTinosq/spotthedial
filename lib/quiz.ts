/**
 * Shared, framework-free quiz primitives. Lives outside the "use client" quiz
 * components so both the single-player clients and the server-side versus
 * question builder can use it (a "use client" module can't be imported cleanly
 * into a server action).
 */

export type QuizItem = {
  id: string;
  name: string;
  brand: string;
  brandId: string;
  thumbnailSrc: string;
};

/** A single versus round: the answer, its multiple-choice options, and the
 *  tile-reveal order (used only by reveal mode). Serialisable — stored verbatim
 *  in the match document so both players get identical questions. */
export type VersusRound = {
  answer: QuizItem;
  options: QuizItem[];
  tileOrder: number[];
};

export type VersusMode = "classic" | "hard" | "reveal" | "blur";

/** Reveal grid: TILE_COUNT opaque tiles uncovered over the round timer. */
export const REVEAL_GRID_SIZE = 8;
export const REVEAL_TILE_COUNT = REVEAL_GRID_SIZE * REVEAL_GRID_SIZE;

/**
 * Blur mode: the dial starts at MAX_BLUR_PX of CSS blur and sharpens to 0 over
 * the round. Bump this to start harder (more blur) — perceptually a ~450px stage
 * is already unrecognisable by ~40px, so this is the effective ceiling.
 */
export const MAX_BLUR_PX = 44;

/** Remaining blur (px) at a given progress fraction (0 = round start, 1 = end).
 *  Linear from MAX_BLUR_PX down to 0, clamped, rounded to whole px to avoid
 *  sub-pixel jitter as the clock ticks. */
export function blurPxFor(progress: number): number {
  const clamped = Math.max(0, Math.min(1, progress));
  return Math.round(MAX_BLUR_PX * (1 - clamped));
}

const OPTION_COUNT = 5;

export function shuffle<T>(arr: T[]): T[] {
  const out = [...arr];
  for (let i = out.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [out[i], out[j]] = [out[j], out[i]];
  }
  return out;
}

/** Stable global key for a watch (brand + model). */
export function itemKey(item: QuizItem): string {
  return `${item.brandId}:${item.id}`;
}

/** Display label for a watch — "Brand — Model". */
export function labelFor(item: QuizItem): string {
  return `${item.brand} — ${item.name}`;
}

/**
 * Build a fixed set of versus rounds from a pool. Called once by the host (on
 * the server) and stored in the match doc, so every client renders the exact
 * same questions, options, and tile order.
 */
export function materializeRounds(
  pool: QuizItem[],
  count: number,
): VersusRound[] {
  const picks = shuffle(pool).slice(0, Math.min(count, pool.length));
  return picks.map((answer) => {
    const distractors = shuffle(
      pool.filter((p) => itemKey(p) !== itemKey(answer)),
    ).slice(0, OPTION_COUNT - 1);
    const options = shuffle([answer, ...distractors]);
    const tileOrder = shuffle(
      Array.from({ length: REVEAL_TILE_COUNT }, (_, i) => i),
    );
    return { answer, options, tileOrder };
  });
}
