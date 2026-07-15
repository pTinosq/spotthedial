import Link from "next/link";
import { GamesToggle } from "@/components/games-toggle";
import { getLiveBrands, getWatches } from "@/lib/data";
import type { BrandView } from "@/lib/types";
import { QuizClient, type QuizItem } from "./quiz-client";
import { RevealClient } from "./reveal-client";

/** Smallest pool that still yields an answer + 3 distractors. */
const MIN_POOL = 4;

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
  searchParams: Promise<{ brand?: string | string[]; mode?: string | string[] }>;
}) {
  const { brand, mode } = await searchParams;
  const brandId = Array.isArray(brand) ? brand[0] : brand;
  const modeId = Array.isArray(mode) ? mode[0] : mode;
  const liveBrands = getLiveBrands();

  // Hard mode — the whole catalogue is fair game and there are no options:
  // type the brand + model with autocomplete over every live watch.
  if (modeId === "hard") {
    const pool = liveBrands.flatMap(itemsFor);
    if (pool.length >= MIN_POOL) {
      return <QuizClient pool={pool} heading="Hard mode" twoStep={false} hard />;
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

  return <QuizSetup brands={liveBrands} />;
}

function QuizSetup({ brands }: { brands: BrandView[] }) {
  const byBrand = brands.map((b) => ({ brand: b, count: getWatches(b.id).length }));
  const total = byBrand.reduce((n, { count }) => n + count, 0);
  const focusable = byBrand.filter(({ count }) => count >= MIN_POOL);

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

      <GamesToggle active="solo" />

      <h1 className="mt-10 font-serif text-4xl tracking-tight sm:text-5xl">
        Test yourself
      </h1>
      <p className="mt-3 text-sm text-muted">
        Name the watch from its face alone. Pick a game, or focus on one brand.
      </p>

      <p className="mt-10 mb-4 text-xs uppercase tracking-[0.18em] text-muted">
        Games
      </p>
      <ul className="flex flex-col gap-2">
        <li>
          <SetupRow
            href="/quiz?brand=all"
            title="Classic"
            meta={`${total} watches · multiple choice`}
          />
        </li>
        <li>
          <SetupRow
            href="/quiz?mode=reveal&brand=all"
            title="Reveal"
            meta="uncover the dial · tile by tile"
          />
        </li>
        <li>
          <SetupRow
            href="/quiz?mode=hard"
            title="Hard mode"
            meta="type the answer · no options"
          />
        </li>
      </ul>

      {focusable.length > 0 && (
        <>
          <p className="mt-10 mb-4 text-xs uppercase tracking-[0.18em] text-muted">
            Or focus on one brand
          </p>
          <ul className="flex flex-col gap-2">
            {focusable.map(({ brand, count }) => (
              <li key={brand.id}>
                <SetupRow
                  href={`/quiz?brand=${brand.id}`}
                  title={brand.name}
                  meta={`${count} watches`}
                />
              </li>
            ))}
          </ul>
        </>
      )}
    </main>
  );
}

function SetupRow({
  href,
  title,
  meta,
}: {
  href: string;
  title: string;
  meta: string;
}) {
  return (
    <Link
      href={href}
      className="group flex items-center justify-between border border-rule px-4 py-3 transition-colors duration-150 hover:border-foreground"
    >
      <span className="font-serif text-lg tracking-tight">{title}</span>
      <span className="flex items-center gap-3">
        <span className="text-xs uppercase tracking-[0.18em] text-muted tabular-nums">
          {meta}
        </span>
        <span className="text-muted transition-transform duration-150 group-hover:translate-x-0.5 group-hover:text-foreground">
          →
        </span>
      </span>
    </Link>
  );
}
