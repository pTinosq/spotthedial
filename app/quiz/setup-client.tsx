"use client";

import Link from "next/link";
import { useState } from "react";

export type BrandChoice = { id: string; name: string; count: number };

type ModeChoice = {
  id: string;
  title: string;
  blurb: string;
};

const MODES: ModeChoice[] = [
  {
    id: "classic",
    title: "Classic",
    blurb: "Multiple choice — name the brand, then the model, from the dial alone.",
  },
  {
    id: "reveal",
    title: "Reveal",
    blurb: "The dial is uncovered a tile at a time. The fewer you reveal, the higher the score.",
  },
  {
    id: "hard",
    title: "Hard",
    blurb: "No options. Type the answer with autocomplete — you have to know it.",
  },
];

/**
 * Solo options body: pick a mode (segmented switch), pick a brand, then start.
 * The Start link encodes the choice as `/quiz?mode=…&brand=…`, which the server
 * page dispatches on. Rendered inside the shared game-setup shell.
 */
export function SoloSetup({
  brands,
  total,
}: {
  /** Live brands with at least MIN_POOL watches — the focusable set. "All" is added here. */
  brands: BrandChoice[];
  /** Total watches across every live brand, for the "All" tile. */
  total: number;
}) {
  const [mode, setMode] = useState<string>("classic");
  const [brand, setBrand] = useState<string>("all");

  const choices: BrandChoice[] = [
    { id: "all", name: "All brands", count: total },
    ...brands,
  ];
  const href = `/quiz?mode=${mode}&brand=${brand}`;
  const activeMode = MODES.find((m) => m.id === mode) ?? MODES[0];

  return (
    <>
      {/* Mode — segmented switch */}
      <p className="mt-10 mb-4 text-xs uppercase tracking-[0.18em] text-muted">
        Game
      </p>
      <div
        role="radiogroup"
        aria-label="Game mode"
        className="grid grid-cols-3 border border-rule"
      >
        {MODES.map((m, i) => {
          const selected = m.id === mode;
          return (
            <button
              key={m.id}
              type="button"
              role="radio"
              aria-checked={selected}
              onClick={() => setMode(m.id)}
              className={`cursor-pointer px-4 py-3 font-serif text-lg tracking-tight transition-colors duration-150 ${
                i > 0 ? "border-l border-rule" : ""
              } ${
                selected
                  ? "bg-foreground text-background"
                  : "text-foreground hover:bg-foreground/5"
              }`}
            >
              {m.title}
            </button>
          );
        })}
      </div>
      <p className="mt-3 text-sm text-muted">{activeMode.blurb}</p>

      {/* Brand — selectable chips */}
      <p className="mt-10 mb-4 text-xs uppercase tracking-[0.18em] text-muted">
        Brand
      </p>
      <div
        role="radiogroup"
        aria-label="Brand"
        className="grid grid-cols-2 gap-2 sm:grid-cols-3"
      >
        {choices.map((c) => {
          const selected = c.id === brand;
          return (
            <button
              key={c.id}
              type="button"
              role="radio"
              aria-checked={selected}
              onClick={() => setBrand(c.id)}
              className={`flex items-center justify-between border px-4 py-3 text-left transition-colors duration-150 ${
                selected
                  ? "border-foreground bg-foreground text-background"
                  : "border-rule hover:border-foreground"
              }`}
            >
              <span className="font-serif text-base tracking-tight">
                {c.name}
              </span>
              <span
                className={`text-xs tabular-nums ${
                  selected ? "text-background/70" : "text-muted"
                }`}
              >
                {c.count}
              </span>
            </button>
          );
        })}
      </div>

      {/* Start — bottom right */}
      <div className="mt-12 flex justify-end">
        <Link
          href={href}
          className="group inline-flex items-center gap-3 border border-foreground bg-foreground px-6 py-3 font-serif text-lg tracking-tight text-background transition-opacity duration-150 hover:opacity-80"
        >
          Start game
          <span className="transition-transform duration-150 group-hover:translate-x-0.5">
            →
          </span>
        </Link>
      </div>
    </>
  );
}
