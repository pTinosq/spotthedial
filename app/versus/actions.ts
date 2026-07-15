"use server";

import { getQuizPool } from "@/lib/data";
import {
  materializeRounds,
  type QuizItem,
  type VersusRound,
} from "@/lib/quiz";

/** Smallest pool that still yields an answer + 3 distractors. */
const MIN_POOL = 4;

export type MaterializeResult =
  | { ok: true; questions: VersusRound[]; corpus: QuizItem[] }
  | { ok: false; error: string };

/**
 * Build a match's question set on the server, where the fs-backed data layer
 * (masked quiz images) is available. The host writes the returned payload
 * straight into the match document so both players get identical questions.
 */
export async function materializeMatch(
  brandId: string,
  rounds: number,
): Promise<MaterializeResult> {
  const pool = getQuizPool(brandId);
  if (pool.length < MIN_POOL) {
    return { ok: false, error: "Not enough watches for that selection yet." };
  }
  return { ok: true, questions: materializeRounds(pool, rounds), corpus: pool };
}
