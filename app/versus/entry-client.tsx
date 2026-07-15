"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import type { VersusMode } from "@/lib/quiz";
import { materializeMatch } from "./actions";

type BrandChoice = { id: string; name: string; count: number };

const MODES: { id: VersusMode; title: string; blurb: string }[] = [
  { id: "classic", title: "Classic", blurb: "Multiple choice — first to name the watch scores most." },
  { id: "reveal", title: "Reveal", blurb: "The dial uncovers tile by tile in sync. Guess early to win big." },
  { id: "hard", title: "Hard", blurb: "No options — type the answer. Fastest correct wins." },
];

// Reveal uncovers 64 tiles over the timer, so it needs far longer than a
// snap-judgement round — hence minute-scale options and a 2-minute default.
const TIMERS_BY_MODE: Record<VersusMode, number[]> = {
  classic: [5, 10, 15, 30],
  hard: [5, 10, 15, 30],
  reveal: [60, 90, 120, 180],
};
const DEFAULT_TIMER_BY_MODE: Record<VersusMode, number> = {
  classic: 10,
  hard: 10,
  reveal: 120,
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
  const [name, setName] = useState("");
  const [mode, setMode] = useState<VersusMode>("classic");
  const [brand, setBrand] = useState("all");
  const [timerS, setTimerS] = useState(10);
  const [code, setCode] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

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
              maxLength={20}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Alex"
              className="w-full border border-rule bg-transparent px-4 py-3 font-serif text-lg tracking-tight outline-none transition-colors duration-150 focus:border-foreground"
            />
          </label>

          {/* Create */}
          <section className="mt-12 border-t border-rule pt-10">
            <h2 className="font-serif text-2xl tracking-tight">Create a match</h2>

            <p className="mt-6 mb-3 text-xs uppercase tracking-[0.18em] text-muted">
              Game
            </p>
            <div role="radiogroup" className="grid grid-cols-3 border border-rule">
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
                    className={`cursor-pointer px-3 py-3 font-serif text-lg tracking-tight transition-colors duration-150 ${
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
            <p className="mt-3 text-sm text-muted">
              {MODES.find((m) => m.id === mode)?.blurb}
            </p>

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

            <p className="mt-8 mb-3 text-xs uppercase tracking-[0.18em] text-muted">
              Time per watch
            </p>
            <div role="radiogroup" className="grid grid-cols-4 border border-rule">
              {TIMERS_BY_MODE[mode].map((t, i) => {
                const selected = t === timerS;
                return (
                  <button
                    key={t}
                    type="button"
                    role="radio"
                    aria-checked={selected}
                    onClick={() => setTimerS(t)}
                    className={`cursor-pointer px-3 py-3 font-serif text-lg tracking-tight tabular-nums transition-colors duration-150 ${
                      i > 0 ? "border-l border-rule" : ""
                    } ${
                      selected
                        ? "bg-foreground text-background"
                        : "hover:bg-foreground/5"
                    }`}
                  >
                    {formatTimer(t)}
                  </button>
                );
              })}
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

          {/* Join */}
          <section className="mt-12 border-t border-rule pt-10">
            <h2 className="font-serif text-2xl tracking-tight">Join a match</h2>
            <div className="mt-6 flex flex-col gap-3 sm:flex-row">
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

          {error && <p className="mt-6 text-sm text-red-700">{error}</p>}
        </>
      )}
    </>
  );
}
