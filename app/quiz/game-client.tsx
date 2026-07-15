"use client";

import Link from "next/link";
import { useState } from "react";
import { VersusSetup } from "@/app/versus/entry-client";
import { type BrandChoice, SoloSetup } from "./setup-client";

type Tab = "solo" | "versus";

const COPY: Record<Tab, { title: string; subtitle: string }> = {
  solo: {
    title: "Test yourself",
    subtitle: "Name the watch from its face alone. Pick a game and a brand.",
  },
  versus: {
    title: "Versus",
    subtitle: "Race a friend to name the watch. Fastest correct answer scores the most.",
  },
};

/**
 * Unified game entry: one page, one Solo/Multiplayer toggle. Flipping it swaps
 * the options below in place — no page reload — so there's a single, calm set of
 * choices at a time. `/quiz` starts on Solo, `/versus` on Multiplayer; the
 * toggle is client state, so it doesn't change the URL.
 */
export function GameSetup({
  brands,
  total,
  configured,
  initialTab,
}: {
  brands: BrandChoice[];
  total: number;
  configured: boolean;
  initialTab: Tab;
}) {
  const [tab, setTab] = useState<Tab>(initialTab);

  return (
    <main className="mx-auto w-full max-w-2xl px-6 py-12 sm:py-20">
      <header className="mb-8 flex items-baseline justify-between">
        <Link
          href="/"
          className="text-xs uppercase tracking-[0.18em] text-muted hover:text-foreground"
        >
          ← Home
        </Link>
      </header>

      <div role="tablist" aria-label="Game type" className="grid grid-cols-2 border border-rule">
        {(["solo", "versus"] as const).map((t, i) => {
          const on = t === tab;
          return (
            <button
              key={t}
              type="button"
              role="tab"
              aria-selected={on}
              onClick={() => setTab(t)}
              className={`cursor-pointer px-4 py-3 text-center font-serif text-lg tracking-tight transition-colors duration-150 ${
                i > 0 ? "border-l border-rule" : ""
              } ${
                on
                  ? "bg-foreground text-background"
                  : "text-foreground hover:bg-foreground/5"
              }`}
            >
              {t === "solo" ? "Solo" : "Multiplayer"}
            </button>
          );
        })}
      </div>

      <h1 className="mt-10 font-serif text-4xl tracking-tight sm:text-5xl">
        {COPY[tab].title}
      </h1>
      <p className="mt-3 text-sm text-muted">{COPY[tab].subtitle}</p>

      {tab === "solo" ? (
        <SoloSetup brands={brands} total={total} />
      ) : (
        <VersusSetup brands={brands} total={total} configured={configured} />
      )}
    </main>
  );
}
