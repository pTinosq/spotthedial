"use client";

import Link from "next/link";
import { useMemo, useState } from "react";

export type QuizItem = {
  id: string;
  name: string;
  brand: string;
  brandId: string;
  thumbnailSrc: string;
};

type Question = {
  answer: QuizItem;
  options: QuizItem[];
};

const QUESTION_COUNT = 5;

function shuffle<T>(arr: T[]): T[] {
  const out = [...arr];
  for (let i = out.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [out[i], out[j]] = [out[j], out[i]];
  }
  return out;
}

function buildQuestions(pool: QuizItem[]): Question[] {
  if (pool.length < 4) return [];
  const picks = shuffle(pool).slice(0, Math.min(QUESTION_COUNT, pool.length));
  return picks.map((answer) => {
    const distractors = shuffle(pool.filter((p) => p.id !== answer.id)).slice(
      0,
      3,
    );
    return { answer, options: shuffle([answer, ...distractors]) };
  });
}

export function QuizClient({
  pool,
  heading,
  showBrand,
}: {
  pool: QuizItem[];
  heading: string;
  showBrand: boolean;
}) {
  const [seed, setSeed] = useState(0);
  const questions = useMemo(
    () => buildQuestions(pool),
    // seed is a manual reset key — bumping it deliberately rebuilds the quiz.
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [pool, seed],
  );
  const [idx, setIdx] = useState(0);
  const [picked, setPicked] = useState<string | null>(null);
  const [score, setScore] = useState(0);
  const [done, setDone] = useState(false);

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
            ← Choose another quiz
          </Link>
        </div>
      </main>
    );
  }

  const q = questions[idx];

  function reset() {
    setSeed((s) => s + 1);
    setIdx(0);
    setPicked(null);
    setScore(0);
    setDone(false);
  }

  function choose(optionId: string) {
    if (picked) return;
    setPicked(optionId);
    if (optionId === q.answer.id) setScore((s) => s + 1);
  }

  function advance() {
    if (idx + 1 >= questions.length) {
      setDone(true);
    } else {
      setIdx((i) => i + 1);
      setPicked(null);
    }
  }

  if (done) {
    const perfect = score === questions.length;
    return (
      <main className="mx-auto w-full max-w-2xl px-6 py-20 text-center">
        <p className="text-xs uppercase tracking-[0.18em] text-muted">
          {perfect ? "Faultless" : "Done"}
        </p>
        <h1 className="mt-3 font-serif text-5xl tracking-tight tabular-nums sm:text-6xl">
          {score} / {questions.length}
        </h1>
        <p className="mt-4 text-sm text-muted">
          {perfect
            ? "Every watch named. Try another round — different models, harder distractors."
            : "Keep studying the silhouettes."}
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
            Change quiz
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

  const isCorrect = picked === q.answer.id;

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
        <div className="aspect-square overflow-hidden border border-rule bg-white">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            key={q.answer.id}
            src={q.answer.thumbnailSrc}
            alt="Which watch is this?"
            className="h-full w-full object-cover"
          />
        </div>

        <div className="flex flex-col">
          <p className="text-xs uppercase tracking-[0.18em] text-muted">
            Name this watch
          </p>

          <ul className="mt-4 flex flex-col gap-2">
            {q.options.map((opt) => {
              const chosen = picked === opt.id;
              const correct = opt.id === q.answer.id;
              const revealed = picked !== null;
              const tone = !revealed
                ? "border-rule hover:border-foreground"
                : correct
                  ? "border-foreground bg-foreground text-background"
                  : chosen
                    ? "border-rule opacity-50 line-through"
                    : "border-rule opacity-40";
              return (
                <li key={opt.id}>
                  <button
                    type="button"
                    onClick={() => choose(opt.id)}
                    disabled={revealed}
                    className={`w-full cursor-pointer select-none border px-4 py-3 text-left font-serif text-lg tracking-tight transition-colors duration-150 disabled:cursor-default ${tone}`}
                  >
                    <span>{opt.name}</span>
                    {showBrand && (
                      <span className="ml-2 text-xs uppercase tracking-[0.18em] opacity-60">
                        {opt.brand}
                      </span>
                    )}
                  </button>
                </li>
              );
            })}
          </ul>

          {picked !== null && (
            <div className="mt-8 flex items-center justify-between border-t border-rule pt-6">
              <p className="text-sm">
                {isCorrect ? (
                  <span>Correct.</span>
                ) : (
                  <span>
                    It was{" "}
                    <span className="font-serif text-base">
                      {q.answer.name}
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
                {idx + 1 >= questions.length ? "Finish" : "Next →"}
              </button>
            </div>
          )}
        </div>
      </div>
    </main>
  );
}
