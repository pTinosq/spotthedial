"use client";

import Link from "next/link";
import { useState } from "react";
import { VersusSetup } from "@/app/versus/entry-client";
import { type BrandChoice, SoloSetup } from "./setup-client";

type Tab = "solo" | "versus";

const SUBTITLE: Record<Tab, string> = {
  solo: "Name the watch from its face alone. Pick a game and a brand.",
  versus: "Race a friend to name the watch. Fastest correct answer scores the most.",
};

/**
 * Unified game entry: one page, one Solo/Multiplayer switch. Flipping it swaps
 * the options below in place — no page reload — so there's a single, calm set of
 * choices at a time. `/quiz` starts on Solo, `/versus` starts on Multiplayer;
 * the switch is client state, so it doesn't change the URL.
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
      <header className="mb-10 flex items-baseline justify-between">
        <Link
          href="/"
          className="text-xs uppercase tracking-[0.18em] text-muted hover:text-foreground"
        >
          ← Home
        </Link>
      </header>

      <ModeSwitch value={tab} onChange={setTab} />
      <p className="mt-6 text-center text-sm text-muted">{SUBTITLE[tab]}</p>

      {tab === "solo" ? (
        <SoloSetup brands={brands} total={total} />
      ) : (
        <VersusSetup brands={brands} total={total} configured={configured} />
      )}
    </main>
  );
}

function ModeSwitch({
  value,
  onChange,
}: {
  value: Tab;
  onChange: (v: Tab) => void;
}) {
  const isVersus = value === "versus";
  return (
    <div className="flex items-center justify-center gap-4">
      <button
        type="button"
        onClick={() => onChange("solo")}
        className={`font-serif text-lg tracking-tight transition-colors duration-150 ${
          isVersus ? "text-muted hover:text-foreground" : "text-foreground"
        }`}
      >
        Solo
      </button>
      <button
        type="button"
        role="switch"
        aria-checked={isVersus}
        aria-label="Switch between solo and multiplayer"
        onClick={() => onChange(isVersus ? "solo" : "versus")}
        className="relative h-7 w-12 shrink-0 cursor-pointer border border-foreground"
      >
        <span
          aria-hidden="true"
          className="absolute top-1/2 h-5 w-5 -translate-y-1/2 bg-foreground transition-[left] duration-200 ease-out"
          style={{ left: isVersus ? "calc(100% - 1.25rem - 0.125rem)" : "0.125rem" }}
        />
      </button>
      <button
        type="button"
        onClick={() => onChange("versus")}
        className={`font-serif text-lg tracking-tight transition-colors duration-150 ${
          isVersus ? "text-foreground" : "text-muted hover:text-foreground"
        }`}
      >
        Multiplayer
      </button>
    </div>
  );
}
