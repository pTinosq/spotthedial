"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { blurPxFor } from "@/lib/quiz";
import {
  OptionList,
  labelFor,
  shuffle,
  type QuizItem,
} from "./quiz-client";

const QUESTION_COUNT = 5;
const OPTION_COUNT = 5;
/** Smallest pool that still yields an answer + distractors. */
const MIN_POOL = 4;
/** Points a single instant (fully-blurred) guess is worth. */
const MAX_POINTS = 100;

type BlurQuestion = {
  answer: QuizItem;
  options: QuizItem[];
};

function sameItem(a: QuizItem, b: QuizItem): boolean {
  return a.brandId === b.brandId && a.id === b.id;
}

function itemKey(item: QuizItem): string {
  return `${item.brandId}:${item.id}`;
}

function buildQuestions(pool: QuizItem[]): BlurQuestion[] {
  if (pool.length < MIN_POOL) return [];
  const picks = shuffle(pool).slice(0, Math.min(QUESTION_COUNT, pool.length));
  return picks.map((answer) => {
    const distractors = shuffle(
      pool.filter((p) => !sameItem(p, answer)),
    ).slice(0, OPTION_COUNT - 1);
    const options = shuffle([answer, ...distractors]);
    return { answer, options };
  });
}

/**
 * Score for a correct guess: full marks while the dial is still at full blur,
 * decaying linearly to zero as it sharpens to nothing over the round. A wrong
 * guess (handled by the caller) is worth nothing.
 */
function scoreFor(progress: number): number {
  return Math.round(MAX_POINTS * Math.max(0, 1 - progress));
}

export function BlurClient({
  pool,
  initialQuestions,
  heading,
  durationMs,
}: {
  pool: QuizItem[];
  /** Built on the server so SSR and the client's first render agree (no
   *  Math.random() during render). Reshuffled client-side on "Play again". */
  initialQuestions: BlurQuestion[];
  heading: string;
  /** How long the dial takes to sharpen from full blur to zero. */
  durationMs: number;
}) {
  const [questions, setQuestions] = useState<BlurQuestion[]>(initialQuestions);

  const [idx, setIdx] = useState(0);
  const [picked, setPicked] = useState<QuizItem | null>(null);
  const [gained, setGained] = useState(0);
  const [score, setScore] = useState(0);
  const [done, setDone] = useState(false);
  // elapsedMs accumulates the time the current watch has been on screen, driven
  // by the interval below. Date.now() lives only in the interval callback and the
  // click handler (never in render), so render stays pure.
  const [elapsedMs, setElapsedMs] = useState(0);
  const lastTickRef = useRef(0);

  // Tick the sharpening clock while a watch is live and unanswered. Freezes on a
  // guess (picked) and restarts fresh on each watch (idx), so elapsedMs is
  // always time-into-the-current-watch.
  useEffect(() => {
    if (done || picked) return;
    lastTickRef.current = Date.now();
    const id = setInterval(() => {
      const t = Date.now();
      setElapsedMs((e) => e + (t - lastTickRef.current));
      lastTickRef.current = t;
    }, 80);
    return () => clearInterval(id);
  }, [done, picked, idx]);

  const q = questions[idx];

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

  const progress = durationMs > 0 ? elapsedMs / durationMs : 1;
  const blurPx = revealed ? 0 : blurPxFor(progress);
  const remainingS = Math.max(0, Math.ceil((durationMs - elapsedMs) / 1000));

  function reset() {
    // Reshuffle client-side — this only runs after a click, well past hydration,
    // so Math.random() here can't cause a server/client mismatch.
    setQuestions(buildQuestions(pool));
    setIdx(0);
    setPicked(null);
    setGained(0);
    setScore(0);
    setElapsedMs(0);
    setDone(false);
  }

  function choose(item: QuizItem) {
    if (revealed) return;
    // Take the score at the exact click instant, not the last 80ms tick.
    const preciseMs = elapsedMs + (Date.now() - lastTickRef.current);
    const p = durationMs > 0 ? preciseMs / durationMs : 1;
    const points = sameItem(item, q.answer) ? scoreFor(p) : 0;
    setPicked(item);
    setGained(points);
    setScore((s) => s + points);
  }

  function advance() {
    if (isLast) {
      setDone(true);
      return;
    }
    setIdx((i) => i + 1);
    setPicked(null);
    setGained(0);
    setElapsedMs(0);
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
            ? "Every dial named through the haze. Nothing left to teach you."
            : "The sooner you name it through the blur, the higher the score."}
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
      <header className="mb-6 flex items-baseline justify-between gap-4">
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

      {/* Sharpening clock — mirrors how far the blur has burned down. */}
      <div className="mb-8 h-0.5 w-full bg-rule">
        <div
          className="h-full bg-foreground transition-[width] duration-100 ease-linear"
          style={{
            width: revealed
              ? "0%"
              : `${Math.max(0, 100 - progress * 100)}%`,
          }}
        />
      </div>

      <div className="grid gap-10 sm:grid-cols-[3fr_2fr] sm:gap-12">
        {/* 1:1 stage — the dial sits inside it under a CSS blur that eases to
            zero. overflow-hidden clips the soft edges to the frame. */}
        <div className="relative aspect-square overflow-hidden border border-rule bg-white">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            key={q.answer.id}
            src={q.answer.thumbnailSrc}
            alt="Which watch is this?"
            className="absolute inset-0 h-full w-full object-contain"
            style={{ filter: `blur(${blurPx}px)`, transition: "filter 120ms linear" }}
          />
        </div>

        <div className="flex flex-col">
          <div className="flex items-baseline justify-between">
            <p className="text-xs uppercase tracking-[0.18em] text-muted">
              Which watch is this?
            </p>
            {!revealed && (
              <p className="text-xs uppercase tracking-[0.18em] text-muted tabular-nums">
                {remainingS}s
              </p>
            )}
          </div>

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
