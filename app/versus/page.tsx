import { getLiveBrands, getWatches } from "@/lib/data";
import { isFirebaseConfigured } from "@/lib/firebase";
import { VersusEntry } from "./entry-client";

/** Smallest pool that still yields an answer + 3 distractors. */
const MIN_POOL = 4;

export default function VersusPage() {
  const byBrand = getLiveBrands().map((b) => ({
    b,
    count: getWatches(b.id).length,
  }));
  const total = byBrand.reduce((n, { count }) => n + count, 0);
  const brands = byBrand
    .filter(({ count }) => count >= MIN_POOL)
    .map(({ b, count }) => ({ id: b.id, name: b.name, count }));

  return (
    <VersusEntry
      brands={brands}
      total={total}
      configured={isFirebaseConfigured}
    />
  );
}
