import Link from "next/link";
import { CircleFlag } from "react-circle-flags";
import { getBrands } from "@/lib/data";
import type { BrandView } from "@/lib/types";

export default function Home() {
  const brands = getBrands();

  return (
    <main className="mx-auto w-full max-w-4xl px-6 py-12 sm:py-20">
      <p className="mb-16 font-serif text-xl tracking-tight sm:mb-20 sm:text-2xl">
        learnthatwatch
      </p>

      <section>
        <div className="flex items-baseline justify-between border-b border-rule pb-3 mb-6">
          <h2 className="text-xs uppercase tracking-[0.18em] text-muted">
            Brands
          </h2>
          <span className="text-xs tabular-nums text-muted">
            {brands.length}
          </span>
        </div>

        <ul className="grid grid-cols-1 sm:grid-cols-3 border border-rule divide-y divide-rule sm:divide-y-0">
          {brands.map((brand) => (
            <li key={brand.id}>
              <BrandCard brand={brand} />
            </li>
          ))}
        </ul>
      </section>
    </main>
  );
}

function BrandCard({ brand }: { brand: BrandView }) {
  const inner = <BrandCardInner brand={brand} />;

  if (brand.comingSoon) {
    return (
      <div
        aria-disabled
        aria-label={`${brand.name} — coming soon`}
        className="group block cursor-not-allowed opacity-50 grayscale"
      >
        {inner}
      </div>
    );
  }

  return (
    <Link
      href={`/brands/${brand.id}`}
      aria-label={brand.name}
      className="group block"
    >
      {inner}
    </Link>
  );
}

function BrandCardInner({ brand }: { brand: BrandView }) {
  return (
    <>
      {/* Mobile: horizontal row */}
      <span className="flex items-center gap-4 p-4 sm:hidden">
        <span className="flex h-16 w-16 flex-shrink-0 items-center justify-center">
          <BrandMark brand={brand} />
        </span>
        <span className="min-w-0 flex-1">
          <span className="block font-serif text-xl tracking-tight">
            {brand.name}
          </span>
          <span className="mt-1 flex items-center gap-2 text-xs text-muted">
            {brand.comingSoon ? (
              <span className="uppercase tracking-[0.18em]">Coming soon</span>
            ) : (
              <>
                <span className="tabular-nums">{brand.founded}</span>
                <CircleFlag
                  countryCode={brand.countryCode}
                  height={12}
                  width={12}
                  className="inline-block"
                />
                <span>{brand.countryName}</span>
              </>
            )}
          </span>
        </span>
      </span>

      {/* Desktop: aspect-square hover swap */}
      <span className="relative hidden aspect-square sm:block">
        <span className="absolute inset-0 flex items-center justify-center p-6 transition-opacity duration-300 group-hover:opacity-0">
          <BrandMark brand={brand} />
        </span>
        <span className="absolute inset-0 flex flex-col items-center justify-center gap-2 p-6 text-center opacity-0 transition-opacity duration-300 group-hover:opacity-100">
          <span className="font-serif text-2xl tracking-tight sm:text-3xl">
            {brand.name}
          </span>
          {brand.comingSoon ? (
            <span className="text-xs uppercase tracking-[0.18em] text-muted">
              Coming soon
            </span>
          ) : (
            <span className="flex items-center gap-2 text-xs text-muted">
              <span className="tabular-nums">{brand.founded}</span>
              <CircleFlag
                countryCode={brand.countryCode}
                height={14}
                width={14}
                className="inline-block"
              />
              <span>{brand.countryName}</span>
            </span>
          )}
        </span>
      </span>
    </>
  );
}

function BrandMark({ brand }: { brand: BrandView }) {
  if (brand.logoSrc) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={brand.logoSrc}
        alt=""
        className="max-h-full max-w-full object-contain sm:max-h-[55%] sm:max-w-[70%]"
      />
    );
  }
  return (
    <span className="font-serif text-lg tracking-tight text-foreground/80 sm:text-3xl">
      {brand.name}
    </span>
  );
}
