import Link from "next/link";
import { notFound } from "next/navigation";
import { CircleFlag } from "react-circle-flags";
import { getBrand, getBrands, getWatches } from "@/lib/data";

export function generateStaticParams() {
  return getBrands().map((b) => ({ brand: b.id }));
}

export default async function BrandPage({
  params,
}: {
  params: Promise<{ brand: string }>;
}) {
  const { brand: brandId } = await params;
  const brand = getBrand(brandId);
  if (!brand) notFound();

  const watches = getWatches(brand.id);

  return (
    <main className="mx-auto w-full max-w-4xl px-6 py-24 sm:py-32">
      <nav className="mb-12 text-xs uppercase tracking-[0.18em] text-muted">
        <Link href="/" className="hover:text-foreground">
          ← Brands
        </Link>
      </nav>

      <header className="mb-16 flex flex-col gap-6 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="font-serif text-4xl sm:text-5xl tracking-tight">
            {brand.name}
          </h1>
          <p className="mt-4 flex items-center gap-2 text-sm text-muted">
            <span className="tabular-nums">Est. {brand.founded}</span>
            <CircleFlag
              countryCode={brand.countryCode}
              height={14}
              width={14}
              className="inline-block"
            />
            <span>{brand.countryName}</span>
          </p>
        </div>
        {brand.logoSrc ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={brand.logoSrc}
            alt=""
            className={`h-12 max-w-[180px] object-contain sm:h-16 ${brand.comingSoon ? "grayscale opacity-50" : ""}`}
          />
        ) : null}
      </header>

      {brand.comingSoon ? (
        <section className="border-t border-rule pt-16">
          <p className="text-xs uppercase tracking-[0.18em] text-muted">
            Coming soon
          </p>
          <p className="mt-4 max-w-md text-base text-muted leading-relaxed">
            {brand.name} hasn&apos;t been drawn up yet. Check back as new
            brands come online.
          </p>
        </section>
      ) : (
        <section>
        <div className="flex items-baseline justify-between border-b border-rule pb-3 mb-6">
          <h2 className="text-xs uppercase tracking-[0.18em] text-muted">
            Models
          </h2>
          <span className="text-xs tabular-nums text-muted">
            {watches.length}
          </span>
        </div>

        {watches.length === 0 ? (
          <p className="text-sm text-muted">No models yet.</p>
        ) : (
          <ul className="grid grid-cols-2 gap-px bg-rule sm:grid-cols-3 border border-rule">
            {watches.map((watch) => (
              <li key={watch.id} className="bg-background">
                <div className="group relative block aspect-square">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={watch.thumbnailSrc}
                    alt=""
                    className="absolute inset-0 h-full w-full object-cover"
                  />
                  <div className="absolute inset-0 flex items-end bg-gradient-to-t from-background/90 via-background/0 to-background/0 p-4 opacity-0 transition-opacity duration-300 group-hover:opacity-100">
                    <span className="font-serif text-lg tracking-tight">
                      {watch.name}
                    </span>
                  </div>
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>
      )}
    </main>
  );
}
