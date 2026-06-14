import { CircleFlag } from "react-circle-flags";
import { Tile } from "@/components/tile";
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
              <Tile
                href={`/brands/${brand.id}`}
                disabled={brand.comingSoon}
                ariaLabel={
                  brand.comingSoon ? `${brand.name} — coming soon` : brand.name
                }
                thumbnail={<BrandMark brand={brand} />}
              >
                <span className="block font-serif text-xl tracking-tight sm:text-2xl">
                  {brand.name}
                </span>
                {brand.comingSoon ? (
                  <span className="mt-1 block text-xs uppercase tracking-[0.18em] text-muted">
                    Coming soon
                  </span>
                ) : (
                  <span className="mt-1 flex items-center gap-2 text-xs text-muted sm:justify-center">
                    <span className="tabular-nums">{brand.founded}</span>
                    <CircleFlag
                      countryCode={brand.countryCode}
                      height={12}
                      width={12}
                      className="inline-block"
                    />
                    <span>{brand.countryName}</span>
                  </span>
                )}
              </Tile>
            </li>
          ))}
        </ul>
      </section>
    </main>
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
