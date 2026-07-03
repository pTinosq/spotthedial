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

type BrandOption = { id: string; name: string };

type Question = {
  answer: QuizItem;
  /** Brand choices for step 1 — empty in single-brand (model-only) mode. */
  brandOptions: BrandOption[];
  /** Model choices for step 2, all from the answer's brand. */
  modelOptions: QuizItem[];
};

const QUESTION_COUNT = 5;
const OPTION_COUNT = 5;

function shuffle<T>(arr: T[]): T[] {
  const out = [...arr];
  for (let i = out.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [out[i], out[j]] = [out[j], out[i]];
  }
  return out;
}

function buildQuestions(pool: QuizItem[], twoStep: boolean): Question[] {
  if (pool.length < 4) return [];

  // Distinct brands present in the pool, for step-1 distractors.
  const brandMap = new Map<string, string>();
  for (const item of pool) {
    if (!brandMap.has(item.brandId)) brandMap.set(item.brandId, item.brand);
  }
  const allBrands: BrandOption[] = [...brandMap].map(([id, name]) => ({
    id,
    name,
  }));

  const picks = shuffle(pool).slice(0, Math.min(QUESTION_COUNT, pool.length));
  return picks.map((answer) => {
    const modelDistractors = shuffle(
      pool.filter((p) => p.brandId === answer.brandId && p.id !== answer.id),
    ).slice(0, OPTION_COUNT - 1);
    const modelOptions = shuffle([answer, ...modelDistractors]);

    const brandDistractors = shuffle(
      allBrands.filter((b) => b.id !== answer.brandId),
    ).slice(0, OPTION_COUNT - 1);
    const brandOptions = twoStep
      ? shuffle([{ id: answer.brandId, name: answer.brand }, ...brandDistractors])
      : [];

    return { answer, brandOptions, modelOptions };
  });
}

function OptionList({
  options,
  picked,
  correctId,
  onPick,
}: {
  options: { id: string; label: string }[];
  picked: string | null;
  correctId: string;
  onPick: (id: string) => void;
}) {
  const revealed = picked !== null;
  return (
    <ul className="mt-4 flex flex-col gap-2">
      {options.map((opt) => {
        const chosen = picked === opt.id;
        const correct = opt.id === correctId;
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
              onClick={() => onPick(opt.id)}
              disabled={revealed}
              className={`w-full cursor-pointer select-none border px-4 py-3 text-left font-serif text-lg tracking-tight transition-colors duration-150 disabled:cursor-default ${tone}`}
            >
              {opt.label}
            </button>
          </li>
        );
      })}
    </ul>
  );
}

export function QuizClient({
  pool,
  heading,
  twoStep,
}: {
  pool: QuizItem[];
  heading: string;
  /** When true, each go is brand-then-model; otherwise model only. */
  twoStep: boolean;
}) {
  const [seed, setSeed] = useState(0);
  const questions = useMemo(
    () => buildQuestions(pool, twoStep),
    // seed is a manual reset key — bumping it deliberately rebuilds the quiz.
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [pool, twoStep, seed],
  );
  const [idx, setIdx] = useState(0);
  const [pickedBrand, setPickedBrand] = useState<string | null>(null);
  const [pickedModel, setPickedModel] = useState<string | null>(null);
  const [brandScore, setBrandScore] = useState(0);
  const [modelScore, setModelScore] = useState(0);
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
  const isLast = idx + 1 >= questions.length;

  function reset() {
    setSeed((s) => s + 1);
    setIdx(0);
    setPickedBrand(null);
    setPickedModel(null);
    setBrandScore(0);
    setModelScore(0);
    setDone(false);
  }

  function chooseBrand(optionId: string) {
    if (pickedBrand) return;
    setPickedBrand(optionId);
    if (optionId === q.answer.brandId) setBrandScore((s) => s + 1);
  }

  function chooseModel(optionId: string) {
    if (pickedModel) return;
    setPickedModel(optionId);
    if (optionId === q.answer.id) setModelScore((s) => s + 1);
  }

  function advanceQuestion() {
    if (isLast) {
      setDone(true);
      return;
    }
    setIdx((i) => i + 1);
    setPickedBrand(null);
    setPickedModel(null);
  }

  if (done) {
    const perfect = modelScore === questions.length;
    return (
      <main className="mx-auto w-full max-w-2xl px-6 py-20 text-center">
        <p className="text-xs uppercase tracking-[0.18em] text-muted">
          {perfect ? "Faultless" : "Done"}
        </p>
        <h1 className="mt-3 font-serif text-5xl tracking-tight tabular-nums sm:text-6xl">
          {modelScore} / {questions.length}
        </h1>
        {twoStep && (
          <p className="mt-3 text-xs uppercase tracking-[0.18em] text-muted tabular-nums">
            Brands {brandScore}/{questions.length} · Models {modelScore}/
            {questions.length}
          </p>
        )}
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

  const brandDone = pickedBrand !== null;
  const brandCorrect = pickedBrand === q.answer.brandId;
  // Model step is shown once the brand is right (or immediately in single-brand mode).
  const modelActive = !twoStep || brandCorrect;
  const modelDone = pickedModel !== null;
  const modelCorrect = pickedModel === q.answer.id;

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
          {/* Correct brand collapses to a single confirmed row; the model step
              then appears directly beneath it. */}
          {twoStep && brandCorrect && (
            <div className="flex items-center justify-between border border-foreground bg-foreground px-4 py-3 text-background">
              <span className="font-serif text-lg tracking-tight">
                {q.answer.brand}
              </span>
              <svg
                width="16"
                height="16"
                viewBox="0 0 16 16"
                fill="none"
                aria-hidden="true"
              >
                <path
                  d="M3 8.5l3 3 7-7"
                  stroke="currentColor"
                  strokeWidth="1.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </div>
          )}

          {twoStep && !brandCorrect && (
            <>
              <p className="text-xs uppercase tracking-[0.18em] text-muted">
                Which brand?
              </p>
              <OptionList
                options={q.brandOptions.map((b) => ({ id: b.id, label: b.name }))}
                picked={pickedBrand}
                correctId={q.answer.brandId}
                onPick={chooseBrand}
              />

              {/* Wrong brand ends the go — no model step. */}
              {brandDone && (
                <div className="mt-8 flex items-center justify-between border-t border-rule pt-6">
                  <p className="text-sm">
                    It was{" "}
                    <span className="font-serif text-base">
                      {q.answer.brand}
                    </span>
                    .
                  </p>
                  <button
                    type="button"
                    onClick={advanceQuestion}
                    className="cursor-pointer border-b border-foreground pb-1 font-serif text-lg tracking-tight hover:opacity-70"
                  >
                    {isLast ? "Finish" : "Next →"}
                  </button>
                </div>
              )}
            </>
          )}

          {/* Model step appears automatically once the brand is right. */}
          {modelActive && (
            <div className={twoStep ? "mt-2" : ""}>
              <p className="text-xs uppercase tracking-[0.18em] text-muted">
                Which model?
              </p>
              <OptionList
                options={q.modelOptions.map((m) => ({ id: m.id, label: m.name }))}
                picked={pickedModel}
                correctId={q.answer.id}
                onPick={chooseModel}
              />

              {modelDone && (
                <div className="mt-8 flex items-center justify-between border-t border-rule pt-6">
                  <p className="text-sm">
                    {modelCorrect ? (
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
                    onClick={advanceQuestion}
                    className="cursor-pointer border-b border-foreground pb-1 font-serif text-lg tracking-tight hover:opacity-70"
                  >
                    {isLast ? "Finish" : "Next →"}
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </main>
  );
}
