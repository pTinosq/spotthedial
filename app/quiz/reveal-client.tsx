"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import {
  OptionList,
  labelFor,
  shuffle,
  type QuizItem,
} from "./quiz-client";

/**
 * The only knob for the reveal game: the dial is covered by a GRID_SIZE ×
 * GRID_SIZE mask of opaque tiles. Bump this for a finer (harder, more clicks)
 * or coarser (easier) reveal. Everything else — scoring, click count, tile
 * sizing — is derived from it.
 */
const GRID_SIZE = 8;
const TILE_COUNT = GRID_SIZE * GRID_SIZE;

const QUESTION_COUNT = 5;
const OPTION_COUNT = 5;
/** Smallest pool that still yields an answer + distractors. */
const MIN_POOL = 4;
/** Points a single flawless (first-tile) guess is worth. */
const MAX_POINTS = 100;

type RevealQuestion = {
  answer: QuizItem;
  options: QuizItem[];
  /** Tile indices in the order they get uncovered. */
  order: number[];
};

function sameItem(a: QuizItem, b: QuizItem): boolean {
  return a.brandId === b.brandId && a.id === b.id;
}

function itemKey(item: QuizItem): string {
  return `${item.brandId}:${item.id}`;
}

function buildQuestions(pool: QuizItem[]): RevealQuestion[] {
  if (pool.length < MIN_POOL) return [];
  const picks = shuffle(pool).slice(0, Math.min(QUESTION_COUNT, pool.length));
  return picks.map((answer) => {
    const distractors = shuffle(
      pool.filter((p) => !sameItem(p, answer)),
    ).slice(0, OPTION_COUNT - 1);
    const options = shuffle([answer, ...distractors]);
    const order = shuffle(Array.from({ length: TILE_COUNT }, (_, i) => i));
    return { answer, options, order };
  });
}

/**
 * Score for a correct guess: full marks when guessed with a single tile shown,
 * decaying linearly to zero as more tiles are uncovered. A wrong guess (handled
 * by the caller) is worth nothing.
 */
function scoreFor(tilesShown: number): number {
  const fraction = (TILE_COUNT - tilesShown) / (TILE_COUNT - 1);
  return Math.round(MAX_POINTS * fraction);
}

export function RevealClient({
  pool,
  heading,
}: {
  pool: QuizItem[];
  heading: string;
}) {
  const [seed, setSeed] = useState(0);
  const questions = useMemo(
    () => buildQuestions(pool),
    // seed is a manual reset key — bumping it deliberately rebuilds the game.
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [pool, seed],
  );

  const [idx, setIdx] = useState(0);
  // One tile is uncovered for free at the start of every watch.
  const [shown, setShown] = useState(1);
  const [picked, setPicked] = useState<QuizItem | null>(null);
  const [gained, setGained] = useState(0);
  const [score, setScore] = useState(0);
  const [done, setDone] = useState(false);

  const q = questions[idx];
  const revealedTiles = useMemo(
    () => new Set(q ? q.order.slice(0, shown) : []),
    [q, shown],
  );

  if (questions.length === 0) {
    return (
      <main className="mx-auto w-full max-w-2xl px-6 py-20 text-center">
        <p className="text-sm text-muted">
          Not enough watches yet — come back once more brands are live.
        </p>
        <div className="mt-8">
          <Link
            href="/quiz"
            className="border-b border-rule pb-1 text-sm text-muted hover:text-foreground"
          >
            ← Choose another game
          </Link>
        </div>
      </main>
    );
  }

  const isLast = idx + 1 >= questions.length;
  const revealed = picked !== null;
  const correct = picked !== null && sameItem(picked, q.answer);

  function reset() {
    setSeed((s) => s + 1);
    setIdx(0);
    setShown(1);
    setPicked(null);
    setGained(0);
    setScore(0);
    setDone(false);
  }

  function revealOne() {
    if (revealed) return;
    setShown((n) => Math.min(n + 1, TILE_COUNT));
  }

  function choose(item: QuizItem) {
    if (revealed) return;
    const points = sameItem(item, q.answer) ? scoreFor(shown) : 0;
    setPicked(item);
    setGained(points);
    setScore((s) => s + points);
    // Drop the mask entirely so the whole dial is on show for the reveal.
    setShown(TILE_COUNT);
  }

  function advance() {
    if (isLast) {
      setDone(true);
      return;
    }
    setIdx((i) => i + 1);
    setShown(1);
    setPicked(null);
    setGained(0);
  }

  if (done) {
    const maxScore = questions.length * MAX_POINTS;
    const perfect = score === maxScore;
    return (
      <main className="mx-auto w-full max-w-2xl px-6 py-20 text-center">
        <p className="text-xs uppercase tracking-[0.18em] text-muted">
          {perfect ? "Clairvoyant" : "Done"}
        </p>
        <h1 className="mt-3 font-serif text-5xl tracking-tight tabular-nums sm:text-6xl">
          {score} / {maxScore}
        </h1>
        <p className="mt-4 text-sm text-muted">
          {perfect
            ? "Every dial named at a glance. Nothing left to teach you."
            : "The fewer tiles you uncover, the higher the score."}
        </p>
        <div className="mt-10 flex items-center justify-center gap-6 text-sm">
          <button
            type="button"
            onClick={reset}
            className="cursor-pointer border-b border-foreground pb-1 font-serif text-lg tracking-tight hover:opacity-70"
          >
            Play again
          </button>
          <Link
            href="/quiz"
            className="border-b border-rule pb-1 text-muted hover:text-foreground"
          >
            Change game
          </Link>
          <Link
            href="/"
            className="border-b border-rule pb-1 text-muted hover:text-foreground"
          >
            Home
          </Link>
        </div>
      </main>
    );
  }

  return (
    <main className="mx-auto w-full max-w-3xl px-6 py-12 sm:py-20">
      <header className="mb-10 flex items-baseline justify-between gap-4">
        <Link
          href="/quiz"
          className="text-xs uppercase tracking-[0.18em] text-muted hover:text-foreground"
        >
          ← Change
        </Link>
        <p className="text-xs uppercase tracking-[0.18em] text-muted tabular-nums">
          <span className="text-foreground">{heading}</span> · {idx + 1} /{" "}
          {questions.length}
        </p>
      </header>

      <div className="grid gap-10 sm:grid-cols-[3fr_2fr] sm:gap-12">
        {/* 1:1 stage — the dial is contained inside it, then covered by the
            tile mask. The watch never fills the frame edge-to-edge, so the
            mask sits over letterboxing too, which is fine. */}
        <div className="relative aspect-square overflow-hidden border border-rule bg-white">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            key={q.answer.id}
            src={q.answer.thumbnailSrc}
            alt="Which watch is this?"
            className="absolute inset-0 h-full w-full object-contain"
          />
          <div
            // Remount per question so the mask snaps back to fully covered
            // instantly — without the key, the tiles animate opacity 0→1 on
            // advance and the whole dial flashes through for a moment.
            key={idx}
            className="absolute inset-0 grid"
            style={{ gridTemplateColumns: `repeat(${GRID_SIZE}, 1fr)` }}
            aria-hidden="true"
          >
            {Array.from({ length: TILE_COUNT }, (_, i) => (
              <div
                key={i}
                className="transition-opacity duration-300 ease-out"
                style={{
                  background: "var(--foreground)",
                  opacity: revealedTiles.has(i) ? 0 : 1,
                }}
              />
            ))}
          </div>
        </div>

        <div className="flex flex-col">
          <p className="text-xs uppercase tracking-[0.18em] text-muted">
            Which watch is this?
          </p>

          {!revealed && (
            <button
              type="button"
              onClick={revealOne}
              disabled={shown >= TILE_COUNT}
              className="mt-4 flex cursor-pointer items-center justify-between border border-rule px-4 py-3 text-left transition-colors duration-150 hover:border-foreground disabled:cursor-default disabled:opacity-40"
            >
              <span className="font-serif text-lg tracking-tight">
                Reveal a tile
              </span>
              <span className="text-xs uppercase tracking-[0.18em] text-muted tabular-nums">
                {shown} / {TILE_COUNT}
              </span>
            </button>
          )}

          <OptionList
            options={q.options.map((o) => ({ id: itemKey(o), label: labelFor(o) }))}
            picked={picked ? itemKey(picked) : null}
            correctId={itemKey(q.answer)}
            onPick={(id) => {
              const choice = q.options.find((o) => itemKey(o) === id);
              if (choice) choose(choice);
            }}
          />

          {revealed && (
            <div className="mt-8 flex items-center justify-between border-t border-rule pt-6">
              <p className="text-sm">
                {correct ? (
                  <span>
                    Correct — <span className="tabular-nums">+{gained}</span>
                  </span>
                ) : (
                  <span>
                    It was{" "}
                    <span className="font-serif text-base">
                      {labelFor(q.answer)}
                    </span>
                    .
                  </span>
                )}
              </p>
              <button
                type="button"
                onClick={advance}
                className="cursor-pointer border-b border-foreground pb-1 font-serif text-lg tracking-tight hover:opacity-70"
              >
                {isLast ? "Finish" : "Next →"}
              </button>
            </div>
          )}
        </div>
      </div>
    </main>
  );
}
