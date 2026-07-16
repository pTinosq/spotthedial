"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  REVEAL_GRID_SIZE,
  blurPxFor,
  itemKey,
  labelFor,
  type QuizItem,
} from "@/lib/quiz";
import { ensureUid } from "@/lib/firebase";
import {
  COUNTDOWN_MS,
  buildSchedule,
  currentState,
  estimateServerOffset,
  finishGame,
  heartbeat,
  type MatchDoc,
  type Player,
  type RoundAnswerInfo,
  type Schedule,
  revealedTileCount,
  scoreForAnswer,
  startGame,
  subscribeMatch,
  subscribePlayers,
  submitAnswer,
} from "@/lib/versus";
import { HardInput } from "@/app/quiz/quiz-client";

export function VersusRoom({ code }: { code: string }) {
  const [uid, setUid] = useState<string | null>(null);
  const [match, setMatch] = useState<MatchDoc | null>(null);
  const [players, setPlayers] = useState<Player[]>([]);
  const [loaded, setLoaded] = useState(false);
  const [offset, setOffset] = useState(0);
  const [now, setNow] = useState(0);
  // Local optimistic pick, so the UI locks the instant you answer.
  const [pick, setPick] = useState<{ round: number; item: QuizItem } | null>(null);

  // Auth + live subscriptions.
  useEffect(() => {
    let unsubMatch = () => {};
    let unsubPlayers = () => {};
    let cancelled = false;
    ensureUid().then((id) => {
      if (cancelled) return;
      setUid(id);
      unsubMatch = subscribeMatch(code, (m) => {
        setMatch(m);
        setLoaded(true);
      });
      unsubPlayers = subscribePlayers(code, setPlayers);
      estimateServerOffset(code)
        .then((o) => !cancelled && setOffset(o))
        .catch(() => {});
    });
    return () => {
      cancelled = true;
      unsubMatch();
      unsubPlayers();
    };
  }, [code]);

  // Presence heartbeat.
  useEffect(() => {
    if (!uid) return;
    const id = setInterval(() => heartbeat(code).catch(() => {}), 4000);
    return () => clearInterval(id);
  }, [code, uid]);

  // Drive the shared clock. Date.now() lives in the effect (not render) to stay
  // pure; `now` state ticks the derived round state forward.
  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 100);
    return () => clearInterval(id);
  }, []);

  const serverNow = now + offset;
  const timerMs = match?.config.timerMs ?? 10_000;
  const rounds = match?.config.rounds ?? 5;
  const gameStartedMs = match?.gameStartedAt?.toMillis() ?? null;

  // Per-round answer summary → schedule. A round ends the instant everyone has
  // locked in (or at the buzzer), computed identically on every client.
  const info = useMemo<RoundAnswerInfo[]>(() => {
    return Array.from({ length: rounds }, (_, i) => {
      let allAnswered = players.length > 0;
      let lastAnswerMs = 0;
      for (const p of players) {
        const t = p.answers?.[i]?.answeredAt?.toMillis();
        if (t == null) allAnswered = false;
        else lastAnswerMs = Math.max(lastAnswerMs, t);
      }
      return { allAnswered, lastAnswerMs };
    });
  }, [players, rounds]);

  const schedule = useMemo<Schedule | null>(
    () => (gameStartedMs != null ? buildSchedule(gameStartedMs, timerMs, rounds, info) : null),
    [gameStartedMs, timerMs, rounds, info],
  );

  const rs = useMemo(
    () =>
      schedule && gameStartedMs != null
        ? currentState(schedule, gameStartedMs, serverNow, rounds)
        : {
            phase: "countdown" as const,
            index: 0,
            elapsedInRoundMs: 0,
            countdownRemainingMs: COUNTDOWN_MS,
          },
    [schedule, gameStartedMs, serverNow, rounds],
  );

  const isHost = !!uid && match?.hostUid === uid;

  // Host closes the match once the clock runs past the last round.
  const finishedRef = useRef(false);
  useEffect(() => {
    if (isHost && match?.status === "running" && rs.phase === "done" && !finishedRef.current) {
      finishedRef.current = true;
      finishGame(code).catch(() => {});
    }
  }, [isHost, match?.status, rs.phase, code]);

  const me = players.find((p) => p.uid === uid);
  const question = match?.questions[rs.index];

  const submittedKey = me?.answers?.[rs.index]?.choiceKey ?? null;
  const localKey = pick && pick.round === rs.index ? itemKey(pick.item) : null;
  const myKey = submittedKey ?? localKey;

  const choose = useCallback(
    (item: QuizItem) => {
      if (myKey || rs.phase !== "playing") return;
      setPick({ round: rs.index, item });
      submitAnswer(code, rs.index, itemKey(item)).catch(() => {});
    },
    [myKey, rs.phase, rs.index, code],
  );

  // ── Render states ──────────────────────────────────────────────────────────
  if (!loaded) {
    return <Centered>Loading…</Centered>;
  }
  if (!match) {
    return (
      <Centered>
        <p className="text-sm text-muted">No match with the code {code}.</p>
        <BackLink />
      </Centered>
    );
  }

  if (match.status === "lobby") {
    return (
      <Shell code={code}>
        <div className="mt-16 text-center">
          <p className="text-xs uppercase tracking-[0.18em] text-muted">Match code</p>
          <p className="mt-2 font-serif text-6xl tracking-[0.2em] tabular-nums">{code}</p>
          <p className="mt-4 text-sm text-muted">
            Share it, then start when everyone&apos;s in.
          </p>
        </div>
        <PlayerList players={players} />
        <div className="mt-10 flex justify-center">
          {isHost ? (
            <button
              type="button"
              onClick={() => startGame(code)}
              disabled={players.length < 2}
              className="cursor-pointer border border-foreground bg-foreground px-6 py-3 font-serif text-lg tracking-tight text-background transition-opacity duration-150 hover:opacity-80 disabled:opacity-40"
            >
              {players.length < 2 ? "Waiting for players…" : "Start game →"}
            </button>
          ) : (
            <p className="text-sm text-muted">Waiting for the host to start…</p>
          )}
        </div>
      </Shell>
    );
  }

  if (rs.phase === "countdown") {
    return (
      <Centered>
        <p className="text-xs uppercase tracking-[0.18em] text-muted">Get ready</p>
        <p className="mt-4 font-serif text-8xl tabular-nums">
          {Math.ceil(rs.countdownRemainingMs / 1000)}
        </p>
      </Centered>
    );
  }

  if (match.status === "finished" || rs.phase === "done") {
    return <FinalScreen match={match} players={players} schedule={schedule} />;
  }

  // Playing or results for the current round.
  if (!question) return <Centered>Loading round…</Centered>;

  const revealed = rs.phase === "results";
  const correctKey = itemKey(question.answer);
  const answeredCount = players.filter(
    (p) => p.answers?.[rs.index]?.choiceKey != null,
  ).length;
  const remaining = Math.max(0, Math.ceil((timerMs - rs.elapsedInRoundMs) / 1000));
  const isReveal = match.config.mode === "reveal";
  const isBlur = match.config.mode === "blur";
  const tilesShown = isReveal
    ? revealedTileCount(rs.elapsedInRoundMs, timerMs)
    : 0;
  // Both reveal and blur keep the dial obscured until the results phase.
  const showFull = revealed || (!isReveal && !isBlur);
  const blurPx = isBlur && !showFull ? blurPxFor(rs.elapsedInRoundMs / timerMs) : 0;

  return (
    <Shell code={code}>
      <div className="mb-6 flex items-baseline justify-between gap-4">
        <p className="text-xs uppercase tracking-[0.18em] text-muted tabular-nums">
          Round {rs.index + 1} / {rounds}
        </p>
        <p className="text-xs uppercase tracking-[0.18em] text-muted tabular-nums">
          {revealed ? "Next up…" : `${remaining}s`}
        </p>
      </div>

      {/* Timer bar */}
      <div className="mb-8 h-0.5 w-full bg-rule">
        <div
          className="h-full bg-foreground transition-[width] duration-100 ease-linear"
          style={{
            width: revealed
              ? "0%"
              : `${Math.max(0, 100 - (rs.elapsedInRoundMs / timerMs) * 100)}%`,
          }}
        />
      </div>

      <div className="grid gap-10 sm:grid-cols-[3fr_2fr] sm:gap-12">
        <div className="relative aspect-square overflow-hidden border border-rule bg-white">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            key={question.answer.id}
            src={question.answer.thumbnailSrc}
            alt="Which watch is this?"
            className={`absolute inset-0 h-full w-full ${
              isReveal || isBlur ? "object-contain" : "object-cover"
            }`}
            style={
              isBlur
                ? { filter: `blur(${blurPx}px)`, transition: "filter 120ms linear" }
                : undefined
            }
          />
          {isReveal && !showFull && (
            <RevealMask order={question.tileOrder} shown={tilesShown} round={rs.index} />
          )}
        </div>

        <div className="flex flex-col">
          <p className="text-xs uppercase tracking-[0.18em] text-muted">
            {match.config.mode === "hard" ? "Name the watch" : "Which watch is this?"}
          </p>

          {match.config.mode === "hard" ? (
            <HardInput
              key={rs.index}
              corpus={match.corpus}
              picked={myKey ? question.answer : null}
              onPick={choose}
            />
          ) : (
            <Options
              options={question.options}
              myKey={myKey}
              revealed={revealed}
              correctKey={correctKey}
              onPick={choose}
            />
          )}

          {revealed ? (
            <p className="mt-6 border-t border-rule pt-6 text-sm">
              It was{" "}
              <span className="font-serif text-base">{labelFor(question.answer)}</span>.
            </p>
          ) : (
            <p className="mt-6 text-xs uppercase tracking-[0.18em] text-muted tabular-nums">
              {myKey ? "Locked in · " : ""}
              {answeredCount} / {players.length} answered
            </p>
          )}

          <LiveScores
            players={players}
            match={match}
            schedule={schedule}
            uid={uid}
            upTo={revealed ? rs.index : rs.index - 1}
          />
        </div>
      </div>
    </Shell>
  );
}

// ── Sub-components ─────────────────────────────────────────────────────────────

function Options({
  options,
  myKey,
  revealed,
  correctKey,
  onPick,
}: {
  options: QuizItem[];
  myKey: string | null;
  revealed: boolean;
  correctKey: string;
  onPick: (item: QuizItem) => void;
}) {
  return (
    <ul className="mt-4 flex flex-col gap-2">
      {options.map((opt) => {
        const key = itemKey(opt);
        const chosen = myKey === key;
        const correct = key === correctKey;
        const tone = revealed
          ? correct
            ? "border-foreground bg-foreground text-background"
            : chosen
              ? "border-rule opacity-50 line-through"
              : "border-rule opacity-40"
          : chosen
            ? "border-foreground"
            : myKey
              ? "border-rule opacity-50"
              : "border-rule hover:border-foreground";
        return (
          <li key={key}>
            <button
              type="button"
              onClick={() => onPick(opt)}
              disabled={myKey !== null || revealed}
              className={`w-full cursor-pointer select-none border px-4 py-3 text-left font-serif text-lg tracking-tight transition-colors duration-150 disabled:cursor-default ${tone}`}
            >
              {labelFor(opt)}
            </button>
          </li>
        );
      })}
    </ul>
  );
}

function RevealMask({
  order,
  shown,
  round,
}: {
  order: number[];
  shown: number;
  round: number;
}) {
  const revealedTiles = new Set(order.slice(0, shown));
  return (
    <div
      key={round}
      className="absolute inset-0 grid"
      style={{ gridTemplateColumns: `repeat(${REVEAL_GRID_SIZE}, 1fr)` }}
      aria-hidden="true"
    >
      {order.map((_, i) => (
        <div
          key={i}
          className="transition-opacity duration-200 ease-out"
          style={{ background: "var(--foreground)", opacity: revealedTiles.has(i) ? 0 : 1 }}
        />
      ))}
    </div>
  );
}

function scoreboard(
  players: Player[],
  match: MatchDoc,
  schedule: Schedule | null,
  upTo: number,
) {
  return players
    .map((p) => {
      let score = 0;
      if (schedule) {
        for (let i = 0; i <= upTo && i < match.questions.length; i++) {
          score += scoreForAnswer(
            p.answers?.[i],
            itemKey(match.questions[i].answer),
            schedule.playStart[i],
            match.config.timerMs,
          );
        }
      }
      return { uid: p.uid, name: p.name, score };
    })
    .sort((a, b) => b.score - a.score || a.name.localeCompare(b.name));
}

function LiveScores({
  players,
  match,
  schedule,
  uid,
  upTo,
}: {
  players: Player[];
  match: MatchDoc;
  schedule: Schedule | null;
  uid: string | null;
  upTo: number;
}) {
  const board = scoreboard(players, match, schedule, upTo);
  return (
    <ul className="mt-8 flex flex-col gap-1 border-t border-rule pt-6">
      {board.map((row) => (
        <li
          key={row.uid}
          className={`flex items-center justify-between text-sm ${
            row.uid === uid ? "font-medium" : "text-muted"
          }`}
        >
          <span className="font-serif tracking-tight">{row.name}</span>
          <span className="tabular-nums">{row.score}</span>
        </li>
      ))}
    </ul>
  );
}

function FinalScreen({
  match,
  players,
  schedule,
}: {
  match: MatchDoc;
  players: Player[];
  schedule: Schedule | null;
}) {
  const board = scoreboard(players, match, schedule, match.questions.length - 1);
  const top = board[0]?.score ?? 0;
  return (
    <main className="mx-auto w-full max-w-2xl px-6 py-20 text-center">
      <p className="text-xs uppercase tracking-[0.18em] text-muted">Final</p>
      <ul className="mx-auto mt-8 flex max-w-sm flex-col gap-3">
        {board.map((row, i) => (
          <li
            key={row.uid}
            className="flex items-baseline justify-between border-b border-rule pb-3"
          >
            <span className="flex items-baseline gap-3">
              <span className="text-xs tabular-nums text-muted">{i + 1}</span>
              <span
                className={`font-serif text-xl tracking-tight ${
                  row.score === top && top > 0 ? "" : "text-muted"
                }`}
              >
                {row.name}
              </span>
            </span>
            <span className="font-serif text-xl tabular-nums">{row.score}</span>
          </li>
        ))}
      </ul>
      <div className="mt-12 flex items-center justify-center gap-6 text-sm">
        <Link
          href="/versus"
          className="border-b border-foreground pb-1 font-serif text-lg tracking-tight hover:opacity-70"
        >
          New match
        </Link>
        <Link href="/" className="border-b border-rule pb-1 text-muted hover:text-foreground">
          Home
        </Link>
      </div>
    </main>
  );
}

function PlayerList({ players }: { players: Player[] }) {
  return (
    <ul className="mx-auto mt-12 flex max-w-sm flex-col gap-2">
      {players.map((p) => (
        <li
          key={p.uid}
          className="flex items-center justify-between border border-rule px-4 py-3"
        >
          <span className="font-serif text-lg tracking-tight">{p.name}</span>
          {p.isHost && (
            <span className="text-xs uppercase tracking-[0.18em] text-muted">Host</span>
          )}
        </li>
      ))}
    </ul>
  );
}

function Shell({ code, children }: { code: string; children: React.ReactNode }) {
  return (
    <main className="mx-auto w-full max-w-3xl px-6 py-12 sm:py-20">
      <header className="mb-4 flex items-baseline justify-between">
        <Link
          href="/versus"
          className="text-xs uppercase tracking-[0.18em] text-muted hover:text-foreground"
        >
          ← Leave
        </Link>
        <span className="text-xs uppercase tracking-[0.18em] text-muted tabular-nums">
          {code}
        </span>
      </header>
      {children}
    </main>
  );
}

function Centered({ children }: { children: React.ReactNode }) {
  return (
    <main className="mx-auto flex min-h-[60vh] w-full max-w-2xl flex-col items-center justify-center px-6 py-20 text-center">
      {children}
    </main>
  );
}

function BackLink() {
  return (
    <div className="mt-8">
      <Link
        href="/versus"
        className="border-b border-rule pb-1 text-sm text-muted hover:text-foreground"
      >
        ← Back to versus
      </Link>
    </div>
  );
}
