import Link from "next/link";
import { getLiveBrands, getWatches } from "@/lib/data";
import type { BrandView } from "@/lib/types";
import { QuizClient, type QuizItem } from "./quiz-client";

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
  searchParams: Promise<{ brand?: string | string[] }>;
}) {
  const { brand } = await searchParams;
  const brandId = Array.isArray(brand) ? brand[0] : brand;
  const liveBrands = getLiveBrands();

  // Random mix across every live brand.
  if (brandId === "all") {
    const pool = liveBrands.flatMap(itemsFor);
    return <QuizClient pool={pool} heading="Random mix" showBrand />;
  }

  // Single-brand practice (distractors drawn from the same brand).
  if (brandId) {
    const brand = liveBrands.find((b) => b.id === brandId);
    if (brand && itemsFor(brand).length >= MIN_POOL) {
      return (
        <QuizClient pool={itemsFor(brand)} heading={brand.name} showBrand={false} />
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
      <header className="mb-10 flex items-baseline justify-between">
        <Link
          href="/"
          className="text-xs uppercase tracking-[0.18em] text-muted hover:text-foreground"
        >
          ← Home
        </Link>
      </header>

      <h1 className="font-serif text-4xl tracking-tight sm:text-5xl">
        Test yourself
      </h1>
      <p className="mt-3 text-sm text-muted">
        Name the watch from its face alone. Mix every brand, or focus on one.
      </p>

      <ul className="mt-10 flex flex-col gap-2">
        <li>
          <SetupRow
            href="/quiz?brand=all"
            title="All brands"
            meta={`${total} watches · random mix`}
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
