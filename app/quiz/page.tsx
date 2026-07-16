import { getLiveBrands, getWatches } from "@/lib/data";
import { isFirebaseConfigured } from "@/lib/firebase";
import { materializeRounds } from "@/lib/quiz";
import type { BrandView } from "@/lib/types";
import { GameSetup } from "./game-client";
import { QuizClient, type QuizItem } from "./quiz-client";
import { RevealClient } from "./reveal-client";
import { BlurClient } from "./blur-client";

/** Smallest pool that still yields an answer + 3 distractors. */
const MIN_POOL = 4;

/** Blur-mode sharpen durations (seconds) offered in setup, and the default. */
const BLUR_SECONDS = [5, 15, 30];
const DEFAULT_BLUR_SECONDS = 15;
/** Watches per blur game. */
const BLUR_QUESTION_COUNT = 5;

function itemsFor(brand: BrandView): QuizItem[] {
  return getWatches(brand.id).map((w) => ({
    id: w.id,
    name: w.name,
    brand: brand.name,
    brandId: brand.id,
    thumbnailSrc: w.thumbnailTestSrc,
  }));
}

export default async function QuizPage({
  searchParams,
}: {
  searchParams: Promise<{
    brand?: string | string[];
    mode?: string | string[];
    seconds?: string | string[];
  }>;
}) {
  const { brand, mode, seconds } = await searchParams;
  const brandId = Array.isArray(brand) ? brand[0] : brand;
  const modeId = Array.isArray(mode) ? mode[0] : mode;
  const secondsRaw = Array.isArray(seconds) ? seconds[0] : seconds;
  const liveBrands = getLiveBrands();

  // Hard mode — no options: type the brand + model with autocomplete. All live
  // brands by default, or a single brand when one is named.
  if (modeId === "hard") {
    const brand =
      brandId && brandId !== "all"
        ? liveBrands.find((b) => b.id === brandId)
        : undefined;
    const pool = brand ? itemsFor(brand) : liveBrands.flatMap(itemsFor);
    if (pool.length >= MIN_POOL) {
      return (
        <QuizClient
          pool={pool}
          heading={brand ? brand.name : "Hard mode"}
          twoStep={false}
          hard
        />
      );
    }
  }

  // Reveal mode — the masked dial is uncovered a tile at a time; guess with
  // fewer tiles showing for a higher score. All live brands by default, or a
  // single brand when one is named.
  if (modeId === "reveal") {
    const brand =
      brandId && brandId !== "all"
        ? liveBrands.find((b) => b.id === brandId)
        : undefined;
    const pool = brand ? itemsFor(brand) : liveBrands.flatMap(itemsFor);
    if (pool.length >= MIN_POOL) {
      return <RevealClient pool={pool} heading={brand ? brand.name : "Reveal"} />;
    }
  }

  // Blur mode — the masked dial sharpens from a heavy blur to nothing over the
  // chosen duration; name it while it's still soft for a higher score. All live
  // brands by default, or a single brand when one is named.
  if (modeId === "blur") {
    const brand =
      brandId && brandId !== "all"
        ? liveBrands.find((b) => b.id === brandId)
        : undefined;
    const pool = brand ? itemsFor(brand) : liveBrands.flatMap(itemsFor);
    const parsed = Number(secondsRaw);
    const secs = BLUR_SECONDS.includes(parsed) ? parsed : DEFAULT_BLUR_SECONDS;
    if (pool.length >= MIN_POOL) {
      return (
        <BlurClient
          pool={pool}
          initialQuestions={materializeRounds(pool, BLUR_QUESTION_COUNT)}
          heading={brand ? brand.name : "Blur"}
          durationMs={secs * 1000}
        />
      );
    }
  }

  // Random mix across every live brand — two-step: guess the brand, then the model.
  if (brandId === "all") {
    const pool = liveBrands.flatMap(itemsFor);
    return <QuizClient pool={pool} heading="Random mix" twoStep />;
  }

  // Single-brand practice — brand is known, so it's model-only (one step).
  if (brandId) {
    const brand = liveBrands.find((b) => b.id === brandId);
    if (brand && itemsFor(brand).length >= MIN_POOL) {
      return (
        <QuizClient pool={itemsFor(brand)} heading={brand.name} twoStep={false} />
      );
    }
    // Unknown brand or too few watches — fall through to setup.
  }

  const byBrand = liveBrands.map((b) => ({ b, count: getWatches(b.id).length }));
  const total = byBrand.reduce((n, { count }) => n + count, 0);
  const focusable = byBrand
    .filter(({ count }) => count >= MIN_POOL)
    .map(({ b, count }) => ({ id: b.id, name: b.name, count }));

  return (
    <GameSetup
      brands={focusable}
      total={total}
      configured={isFirebaseConfigured}
      initialTab="solo"
    />
  );
}
