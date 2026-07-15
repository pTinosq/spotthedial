import {
  type Timestamp,
  collection,
  doc,
  getDoc,
  onSnapshot,
  serverTimestamp,
  setDoc,
  updateDoc,
} from "firebase/firestore";
import { ensureUid, getDb } from "./firebase";
import { REVEAL_TILE_COUNT, type QuizItem, type VersusMode, type VersusRound } from "./quiz";

// ── Tunables ────────────────────────────────────────────────────────────────
export const DEFAULT_TIMER_MS = 10_000;
export const MIN_TIMER_MS = 5_000;
export const MAX_TIMER_MS = 180_000;
/** Shared countdown before round 0, and the results pause between rounds. */
export const COUNTDOWN_MS = 3_000;
export const RESULTS_MS = 3_500;
/** Points for an instant correct answer; decays linearly to 0 at the buzzer. */
export const MAX_POINTS = 1_000;
export const DEFAULT_ROUNDS = 5;

// ── Firestore document shapes ────────────────────────────────────────────────
export type MatchStatus = "lobby" | "running" | "finished";

export type MatchConfig = {
  mode: VersusMode;
  brandId: string;
  timerMs: number;
  rounds: number;
};

export type MatchDoc = {
  hostUid: string;
  status: MatchStatus;
  config: MatchConfig;
  questions: VersusRound[];
  /** Full identification corpus for hard-mode autocomplete. */
  corpus: QuizItem[];
  gameStartedAt: Timestamp | null;
  createdAt: Timestamp | null;
};

export type AnswerDoc = { choiceKey: string; answeredAt: Timestamp | null };

export type PlayerDoc = {
  name: string;
  isHost: boolean;
  joinedAt: Timestamp | null;
  lastSeen: Timestamp | null;
  answers: Record<string, AnswerDoc>;
};

export type Player = PlayerDoc & { uid: string };

// ── Mutations ────────────────────────────────────────────────────────────────
const CODE_ALPHABET = "ABCDEFGHJKMNPQRSTUVWXYZ23456789"; // no ambiguous 0/O/1/I/L
const CODE_LENGTH = 4;

function genCode(): string {
  let out = "";
  for (let i = 0; i < CODE_LENGTH; i++) {
    out += CODE_ALPHABET[Math.floor(Math.random() * CODE_ALPHABET.length)];
  }
  return out;
}

/** Host creates the match: materialised questions live in the doc so every
 *  player renders the same game. Returns the join code. */
export async function createMatch(
  config: MatchConfig,
  questions: VersusRound[],
  corpus: QuizItem[],
  name: string,
): Promise<string> {
  const uid = await ensureUid();
  const db = getDb();
  for (let attempt = 0; attempt < 6; attempt++) {
    const code = genCode();
    const matchRef = doc(db, "matches", code);
    if ((await getDoc(matchRef)).exists()) continue;
    await setDoc(matchRef, {
      hostUid: uid,
      status: "lobby",
      config,
      questions,
      corpus,
      gameStartedAt: null,
      createdAt: serverTimestamp(),
    });
    await setDoc(playerRef(code, uid), {
      name,
      isHost: true,
      joinedAt: serverTimestamp(),
      lastSeen: serverTimestamp(),
      answers: {},
    });
    return code;
  }
  throw new Error("Couldn't allocate a match code — please try again.");
}

/** Join an existing lobby (or reconnect to a match already in progress). */
export async function joinMatch(code: string, name: string): Promise<void> {
  const uid = await ensureUid();
  const db = getDb();
  const snap = await getDoc(doc(db, "matches", code));
  if (!snap.exists()) throw new Error("No match with that code.");
  const existing = await getDoc(playerRef(code, uid));
  if (existing.exists()) {
    await updateDoc(playerRef(code, uid), { name, lastSeen: serverTimestamp() });
    return;
  }
  if ((snap.data() as MatchDoc).status !== "lobby") {
    throw new Error("That match has already started.");
  }
  await setDoc(playerRef(code, uid), {
    name,
    isHost: false,
    joinedAt: serverTimestamp(),
    lastSeen: serverTimestamp(),
    answers: {},
  });
}

/** Host kicks off the game: a single server timestamp from which every round
 *  boundary is derived on each client. */
export async function startGame(code: string): Promise<void> {
  await updateDoc(doc(getDb(), "matches", code), {
    status: "running",
    gameStartedAt: serverTimestamp(),
  });
}

export async function finishGame(code: string): Promise<void> {
  await updateDoc(doc(getDb(), "matches", code), { status: "finished" });
}

/** Record one answer for a round. `answeredAt` is a server timestamp so the
 *  reaction time can't be forged; points are derived from it, never stored. */
export async function submitAnswer(
  code: string,
  roundIndex: number,
  choiceKey: string,
): Promise<void> {
  const uid = await ensureUid();
  await updateDoc(playerRef(code, uid), {
    [`answers.${roundIndex}`]: { choiceKey, answeredAt: serverTimestamp() },
  });
}

export async function heartbeat(code: string): Promise<void> {
  const uid = await ensureUid();
  await updateDoc(playerRef(code, uid), { lastSeen: serverTimestamp() });
}

// ── Subscriptions ────────────────────────────────────────────────────────────
export function subscribeMatch(
  code: string,
  cb: (match: MatchDoc | null) => void,
): () => void {
  return onSnapshot(doc(getDb(), "matches", code), (snap) => {
    cb(snap.exists() ? (snap.data() as MatchDoc) : null);
  });
}

export function subscribePlayers(
  code: string,
  cb: (players: Player[]) => void,
): () => void {
  return onSnapshot(collection(getDb(), "matches", code, "players"), (snap) => {
    cb(snap.docs.map((d) => ({ uid: d.id, ...(d.data() as PlayerDoc) })));
  });
}

/**
 * Estimate this client's clock offset from the server (serverNow ≈ Date.now() +
 * offset) via one timestamp round-trip. Needed so the synced reveal uncovers the
 * same tiles at the same instant on every screen.
 */
export async function estimateServerOffset(code: string): Promise<number> {
  const uid = await ensureUid();
  const ref = playerRef(code, uid);
  const t0 = Date.now();
  await updateDoc(ref, { clockPing: serverTimestamp() });
  const t1 = Date.now();
  const snap = await getDoc(ref);
  const ping = snap.data()?.clockPing as Timestamp | undefined;
  if (!ping) return 0;
  return ping.toMillis() - (t0 + t1) / 2;
}

function playerRef(code: string, uid: string) {
  return doc(getDb(), "matches", code, "players", uid);
}

// ── Pure timing + scoring (unit-testable, no Firestore) ──────────────────────
export function pointsFor(reactionMs: number, timerMs: number): number {
  if (reactionMs <= 0) return MAX_POINTS;
  if (reactionMs >= timerMs) return 0;
  return Math.round((MAX_POINTS * (timerMs - reactionMs)) / timerMs);
}

export type RoundPhase = "countdown" | "playing" | "results" | "done";

export type RoundState = {
  phase: RoundPhase;
  index: number;
  /** Time into the current round's *playing* window. */
  elapsedInRoundMs: number;
  countdownRemainingMs: number;
};

/** Per-round answer summary, derived identically on every client from the
 *  shared (server-stamped) answers — the basis for early reveal. */
export type RoundAnswerInfo = {
  /** Every player has locked in an answer for this round. */
  allAnswered: boolean;
  /** Server time (ms) of the last answer, when all answered. */
  lastAnswerMs: number;
};

/** Server-time boundaries of every round. */
export type Schedule = {
  playStart: number[];
  playEnd: number[];
  resultsEnd: number[];
};

/**
 * Compute each round's boundaries from the single `gameStartedAt` timestamp plus
 * the per-round answer info. A round's play window ends at the buzzer OR the
 * moment everyone has answered, whichever comes first — so the reveal fires
 * instantly once all guesses are in. Every client derives this identically (same
 * server timestamps in, same schedule out), so no coordinating writes are needed.
 */
export function buildSchedule(
  gameStartedMs: number,
  timerMs: number,
  rounds: number,
  info: RoundAnswerInfo[],
): Schedule {
  const playStart: number[] = [];
  const playEnd: number[] = [];
  const resultsEnd: number[] = [];
  let cursor = gameStartedMs + COUNTDOWN_MS;
  for (let i = 0; i < rounds; i++) {
    const maxEnd = cursor + timerMs;
    const ri = info[i];
    const end = ri?.allAnswered ? Math.min(maxEnd, ri.lastAnswerMs) : maxEnd;
    playStart.push(cursor);
    playEnd.push(end);
    resultsEnd.push(end + RESULTS_MS);
    cursor = end + RESULTS_MS;
  }
  return { playStart, playEnd, resultsEnd };
}

export function currentState(
  schedule: Schedule,
  gameStartedMs: number,
  serverNow: number,
  rounds: number,
): RoundState {
  const firstStart = gameStartedMs + COUNTDOWN_MS;
  if (serverNow < firstStart) {
    return {
      phase: "countdown",
      index: 0,
      elapsedInRoundMs: 0,
      countdownRemainingMs: firstStart - serverNow,
    };
  }
  for (let i = 0; i < rounds; i++) {
    if (serverNow < schedule.resultsEnd[i]) {
      const playing = serverNow < schedule.playEnd[i];
      return {
        phase: playing ? "playing" : "results",
        index: i,
        elapsedInRoundMs:
          (playing ? serverNow : schedule.playEnd[i]) - schedule.playStart[i],
        countdownRemainingMs: 0,
      };
    }
  }
  return { phase: "done", index: rounds, elapsedInRoundMs: 0, countdownRemainingMs: 0 };
}

/** Tiles uncovered so far in reveal mode: one free tile, then one more every
 *  timerMs/TILE_COUNT, reaching the full grid by the buzzer. */
export function revealedTileCount(elapsedInRoundMs: number, timerMs: number): number {
  const step = timerMs / REVEAL_TILE_COUNT;
  return Math.max(1, Math.min(REVEAL_TILE_COUNT, 1 + Math.floor(elapsedInRoundMs / step)));
}

/** Points a player earned on a round given the server-stamped answer and the
 *  round's (dynamic) play-start instant. */
export function scoreForAnswer(
  answer: AnswerDoc | undefined,
  answerKey: string,
  playStartMs: number,
  timerMs: number,
): number {
  if (!answer?.answeredAt || answer.choiceKey !== answerKey) return 0;
  return pointsFor(answer.answeredAt.toMillis() - playStartMs, timerMs);
}
