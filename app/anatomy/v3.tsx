"use client";

import { useCallback, useState } from "react";
import { PARTS } from "@/lib/anatomy";
import { WatchSVG } from "./watch";

/**
 * v3 — Spotlight. A guided walk through the vocabulary: one term at a time, the
 * matching part lit and everything else faded. Step with the arrows, the keys,
 * or by jumping to any term in the list.
 */
export function AnatomyV3() {
  const [index, setIndex] = useState(0);
  const part = PARTS[index];

  const go = useCallback((next: number) => {
    setIndex((next + PARTS.length) % PARTS.length);
  }, []);

  return (
    <div
      className="grid gap-10 md:grid-cols-2 md:items-center outline-none"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === "ArrowRight" || e.key === "ArrowDown") {
          e.preventDefault();
          go(index + 1);
        } else if (e.key === "ArrowLeft" || e.key === "ArrowUp") {
          e.preventDefault();
          go(index - 1);
        }
      }}
    >
      <div className="relative">
        <WatchSVG active={part.id} className="w-full select-none" />
      </div>

      <div>
        <p className="text-xs uppercase tracking-[0.18em] text-muted tabular-nums">
          {String(index + 1).padStart(2, "0")} / {String(PARTS.length).padStart(2, "0")}
        </p>
        <h2 className="mt-3 font-serif text-4xl tracking-tight sm:text-5xl">
          {part.term}
        </h2>
        <p className="mt-4 max-w-md text-base leading-relaxed text-muted">
          {part.blurb}
        </p>

        <div className="mt-8 flex items-center gap-3">
          <button
            type="button"
            onClick={() => go(index - 1)}
            className="inline-flex h-10 w-10 items-center justify-center border border-rule text-lg transition-colors hover:border-foreground"
            aria-label="Previous term"
          >
            ←
          </button>
          <button
            type="button"
            onClick={() => go(index + 1)}
            className="inline-flex h-10 w-10 items-center justify-center border border-rule text-lg transition-colors hover:border-foreground"
            aria-label="Next term"
          >
            →
          </button>
        </div>

        <ul className="mt-8 flex flex-wrap gap-x-4 gap-y-2 border-t border-rule pt-6">
          {PARTS.map((p, i) => (
            <li key={p.id}>
              <button
                type="button"
                onClick={() => setIndex(i)}
                className="text-sm transition-colors"
                style={{
                  color: i === index ? "var(--foreground)" : "var(--muted)",
                  fontWeight: i === index ? 600 : 400,
                }}
              >
                {p.term}
              </button>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
