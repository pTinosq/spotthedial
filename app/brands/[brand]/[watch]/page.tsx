import Link from "next/link";
import { notFound } from "next/navigation";
import { CircleFlag } from "react-circle-flags";
import { VariantsSection } from "@/components/variants-section";
import { getBrand, getBrands, getWatch, getWatches } from "@/lib/data";

export function generateStaticParams() {
  return getBrands().flatMap((b) =>
    getWatches(b.id).map((w) => ({ brand: b.id, watch: w.id })),
  );
}

export default async function WatchPage({
  params,
}: {
  params: Promise<{ brand: string; watch: string }>;
}) {
  const { brand: brandId, watch: watchId } = await params;
  const brand = getBrand(brandId);
  const watch = getWatch(brandId, watchId);
  if (!brand || !watch) notFound();

  const allWatches = getWatches(brandId);
  const idx = allWatches.findIndex((w) => w.id === watchId);
  const prev = idx > 0 ? allWatches[idx - 1] : null;
  const next = idx < allWatches.length - 1 ? allWatches[idx + 1] : null;

  return (
    <main className="mx-auto w-full max-w-4xl px-6 py-12 sm:py-20">
      <nav className="mb-8 flex items-center gap-3 text-xs uppercase tracking-[0.18em] text-muted">
        <Link href="/" className="hover:text-foreground">
          Brands
        </Link>
        <span aria-hidden>/</span>
        <Link href={`/brands/${brand.id}`} className="hover:text-foreground">
          {brand.name}
        </Link>
      </nav>

      <div className="grid gap-10 sm:grid-cols-[3fr_2fr] sm:gap-16">
        <div className="aspect-square overflow-hidden border border-rule bg-white">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={watch.thumbnailSrc}
            alt={watch.name}
            className="h-full w-full object-cover"
          />
        </div>

        <div className="flex flex-col">
          <p className="text-xs uppercase tracking-[0.18em] text-muted">
            {brand.name}
          </p>
          <h1 className="mt-2 font-serif text-4xl tracking-tight sm:text-5xl">
            {watch.name}
          </h1>

          <dl className="mt-8 grid grid-cols-2 gap-y-4 border-t border-rule pt-6 text-sm">
            <dt className="text-muted">House</dt>
            <dd>{brand.name}</dd>
            <dt className="text-muted">Founded</dt>
            <dd className="tabular-nums">{brand.founded}</dd>
            <dt className="text-muted">Origin</dt>
            <dd className="flex items-center gap-2">
              <CircleFlag
                countryCode={brand.countryCode}
                height={14}
                width={14}
                className="inline-block"
              />
              {brand.countryName}
            </dd>
          </dl>

          <p className="mt-8 max-w-prose text-sm text-muted leading-relaxed">
            {watch.description ??
              `Study the silhouette. Notice the case shape, the bezel, the indices, the hands. These are the cues that will let you name a ${watch.name} the next time you see one in the wild.`}
          </p>
        </div>
      </div>

      <VariantsSection variants={watch.variants} />

      {(prev || next) && (
        <nav className="mt-16 grid grid-cols-2 gap-6 border-t border-rule pt-8 text-sm">
          <div>
            {prev && (
              <Link
                href={`/brands/${brand.id}/${prev.id}`}
                className="group block"
              >
                <span className="block text-xs uppercase tracking-[0.18em] text-muted">
                  ← Previous
                </span>
                <span className="mt-1 block font-serif text-lg tracking-tight group-hover:text-foreground/70">
                  {prev.name}
                </span>
              </Link>
            )}
          </div>
          <div className="text-right">
            {next && (
              <Link
                href={`/brands/${brand.id}/${next.id}`}
                className="group block"
              >
                <span className="block text-xs uppercase tracking-[0.18em] text-muted">
                  Next →
                </span>
                <span className="mt-1 block font-serif text-lg tracking-tight group-hover:text-foreground/70">
                  {next.name}
                </span>
              </Link>
            )}
          </div>
        </nav>
      )}
    </main>
  );
}
