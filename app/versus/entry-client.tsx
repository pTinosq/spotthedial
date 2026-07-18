"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import type { VersusMode } from "@/lib/quiz";
import { materializeMatch } from "./actions";

/** Remember the player's chosen name across visits — it's almost always the
 *  same person on the same device, so re-typing it every session is friction. */
const NAME_KEY = "spotthedial:player-name";

function readSavedName(): string {
  if (typeof window === "undefined") return "";
  try {
    return localStorage.getItem(NAME_KEY) ?? "";
  } catch {
    return "";
  }
}

type BrandChoice = { id: string; name: string; count: number };

const MODES: { id: VersusMode; title: string; blurb: string }[] = [
  { id: "classic", title: "Classic", blurb: "" },
  { id: "reveal", title: "Reveal", blurb: "The dial uncovers tile by tile in sync. Guess early to win big." },
  { id: "blur", title: "Blur", blurb: "The dial sharpens from a blur in sync. First to name it while it's soft wins." },
  { id: "hard", title: "Hard", blurb: "No options — type the answer. Fastest correct wins." },
];

// Per-mode timer slider range. Reveal uncovers 64 tiles over the timer and blur
// sharpens across it, so both need longer than a snap-judgement round — hence
// the minute(ish) scale (and coarser step) for reveal.
const TIMER_RANGE_BY_MODE: Record<
  VersusMode,
  { min: number; max: number; step: number }
> = {
  classic: { min: 5, max: 30, step: 5 },
  hard: { min: 5, max: 30, step: 5 },
  reveal: { min: 60, max: 180, step: 10 },
  blur: { min: 5, max: 30, step: 5 },
};
const DEFAULT_TIMER_BY_MODE: Record<VersusMode, number> = {
  classic: 10,
  hard: 10,
  reveal: 120,
  blur: 15,
};
const ROUNDS = 5;

function formatTimer(s: number): string {
  if (s < 60) return `${s}s`;
  const m = Math.floor(s / 60);
  const r = s % 60;
  return r === 0 ? `${m}m` : `${m}m${r}s`;
}

/** Multiplayer options body: name, create-a-match (mode/brand/timer), join.
 *  Rendered inside the shared game-setup shell. */
export function VersusSetup({
  brands,
  total,
  configured,
}: {
  brands: BrandChoice[];
  total: number;
  configured: boolean;
}) {
  const router = useRouter();
  const [panel, setPanel] = useState<"create" | "join">("create");
  // Seed from the remembered name (client-only; "" on the server, so the input
  // is marked suppressHydrationWarning for the server-empty → client-filled gap).
  const [name, setName] = useState(readSavedName);
  const [mode, setMode] = useState<VersusMode>("classic");
  const [brand, setBrand] = useState("all");
  const [timerS, setTimerS] = useState(10);
  const [code, setCode] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function updateName(value: string) {
    setName(value);
    try {
      localStorage.setItem(NAME_KEY, value);
    } catch {
      // Private-mode / storage-disabled: persistence is best-effort.
    }
  }

  const choices: BrandChoice[] = [
    { id: "all", name: "All brands", count: total },
    ...brands,
  ];

  async function handleCreate() {
    if (busy) return;
    const player = name.trim();
    if (!player) return setError("Enter a name first.");
    setError(null);
    setBusy(true);
    try {
      const { createMatch } = await import("@/lib/versus");
      const built = await materializeMatch(brand, ROUNDS);
      if (!built.ok) {
        setError(built.error);
        return;
      }
      const newCode = await createMatch(
        { mode, brandId: brand, timerMs: timerS * 1000, rounds: ROUNDS },
        built.questions,
        built.corpus,
        player,
      );
      router.push(`/versus/${newCode}`);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Something went wrong.");
      setBusy(false);
    }
  }

  async function handleJoin() {
    if (busy) return;
    const player = name.trim();
    const joinCode = code.trim().toUpperCase();
    if (!player) return setError("Enter a name first.");
    if (joinCode.length < 4) return setError("Enter a match code.");
    setError(null);
    setBusy(true);
    try {
      const { joinMatch } = await import("@/lib/versus");
      await joinMatch(joinCode, player);
      router.push(`/versus/${joinCode}`);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Something went wrong.");
      setBusy(false);
    }
  }

  return (
    <>
      {!configured ? (
        <div className="mt-10 border border-rule px-5 py-6">
          <p className="text-sm">
            Multiplayer isn&apos;t configured on this deployment yet.
          </p>
          <p className="mt-2 text-sm text-muted">
            Set the <code className="font-mono text-xs">NEXT_PUBLIC_FIREBASE_*</code>{" "}
            environment variables (see <code className="font-mono text-xs">.env.example</code>)
            to enable it.
          </p>
        </div>
      ) : (
        <>
          <label className="mt-10 block">
            <span className="mb-2 block text-xs uppercase tracking-[0.18em] text-muted">
              Your name
            </span>
            <input
              type="text"
              value={name}
              suppressHydrationWarning
              maxLength={20}
              onChange={(e) => updateName(e.target.value)}
              placeholder="e.g. Alex"
              className="w-full border border-rule bg-transparent px-4 py-3 font-serif text-lg tracking-tight outline-none transition-colors duration-150 focus:border-foreground"
            />
          </label>

          {/* Create / Join: underline tabs, so switching panels reads as
              navigation rather than another filled option control. */}
          <div
            role="tablist"
            aria-label="Create or join"
            className="mt-10 flex gap-8 border-b border-rule"
          >
            {(["create", "join"] as const).map((p) => {
              const selected = p === panel;
              return (
                <button
                  key={p}
                  type="button"
                  role="tab"
                  aria-selected={selected}
                  onClick={() => setPanel(p)}
                  className={`-mb-px cursor-pointer border-b-2 pb-3 font-serif text-lg tracking-tight transition-colors duration-150 ${
                    selected
                      ? "border-foreground text-foreground"
                      : "border-transparent text-muted hover:text-foreground"
                  }`}
                >
                  {p === "create" ? "Create a match" : "Join a match"}
                </button>
              );
            })}
          </div>

          {panel === "create" ? (
            <section className="mt-8">
              <p className="mb-3 text-xs uppercase tracking-[0.18em] text-muted">
                Game mode
              </p>
            <div role="radiogroup" className="grid grid-cols-4 border border-rule">
              {MODES.map((m, i) => {
                const selected = m.id === mode;
                return (
                  <button
                    key={m.id}
                    type="button"
                    role="radio"
                    aria-checked={selected}
                    onClick={() => {
                      setMode(m.id);
                      setTimerS(DEFAULT_TIMER_BY_MODE[m.id]);
                    }}
                    className={`cursor-pointer px-2 py-3 font-serif text-base tracking-tight transition-colors duration-150 sm:px-3 sm:text-lg ${
                      i > 0 ? "border-l border-rule" : ""
                    } ${
                      selected
                        ? "bg-foreground text-background"
                        : "hover:bg-foreground/5"
                    }`}
                  >
                    {m.title}
                  </button>
                );
              })}
            </div>
            {MODES.find((m) => m.id === mode)?.blurb && (
              <p className="mt-3 text-sm text-muted">
                {MODES.find((m) => m.id === mode)?.blurb}
              </p>
            )}

            <p className="mt-8 mb-3 text-xs uppercase tracking-[0.18em] text-muted">
              Brand
            </p>
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
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

            <div className="mt-8 mb-3 flex items-baseline justify-between">
              <p className="text-xs uppercase tracking-[0.18em] text-muted">
                Time per watch
              </p>
              <p className="font-serif text-lg tracking-tight tabular-nums">
                {formatTimer(timerS)}
              </p>
            </div>
            <input
              type="range"
              min={TIMER_RANGE_BY_MODE[mode].min}
              max={TIMER_RANGE_BY_MODE[mode].max}
              step={TIMER_RANGE_BY_MODE[mode].step}
              value={timerS}
              onChange={(e) => setTimerS(Number(e.target.value))}
              aria-label="Time per watch"
              className="w-full cursor-pointer accent-foreground"
            />
            <div className="mt-1 flex justify-between text-xs text-muted tabular-nums">
              <span>{formatTimer(TIMER_RANGE_BY_MODE[mode].min)}</span>
              <span>{formatTimer(TIMER_RANGE_BY_MODE[mode].max)}</span>
            </div>

            <div className="mt-8 flex justify-end">
              <button
                type="button"
                onClick={handleCreate}
                disabled={busy}
                className="group inline-flex cursor-pointer items-center gap-3 border border-foreground bg-foreground px-6 py-3 font-serif text-lg tracking-tight text-background transition-opacity duration-150 hover:opacity-80 disabled:opacity-50"
              >
                {busy ? "Creating…" : "Create match"}
                <span className="transition-transform duration-150 group-hover:translate-x-0.5">
                  →
                </span>
              </button>
            </div>
            </section>
          ) : (
            <section className="mt-8">
              <div className="flex flex-col gap-3 sm:flex-row">
              <input
                type="text"
                value={code}
                maxLength={4}
                onChange={(e) => setCode(e.target.value.toUpperCase())}
                placeholder="CODE"
                className="w-full border border-rule bg-transparent px-4 py-3 text-center font-serif text-2xl uppercase tracking-[0.3em] outline-none transition-colors duration-150 focus:border-foreground sm:w-48"
              />
              <button
                type="button"
                onClick={handleJoin}
                disabled={busy}
                className="group inline-flex cursor-pointer items-center justify-center gap-3 border border-foreground px-6 py-3 font-serif text-lg tracking-tight transition-colors duration-150 hover:bg-foreground hover:text-background disabled:opacity-50"
              >
                Join
                <span className="transition-transform duration-150 group-hover:translate-x-0.5">
                  →
                </span>
              </button>
            </div>
            </section>
          )}

          {error && <p className="mt-6 text-sm text-red-700">{error}</p>}
        </>
      )}
    </>
  );
}
