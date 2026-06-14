import { existsSync } from "node:fs";
import path from "node:path";
import Link from "next/link";
import { CircleFlag } from "react-circle-flags";
import { getBrands } from "@/lib/data";

const regionNames = new Intl.DisplayNames(["en"], { type: "region" });

export default function Home() {
  const brands = getBrands().map((brand) => ({
    ...brand,
    hasLogo: existsSync(
      path.join(process.cwd(), "public", "brands", brand.id, "logo.svg"),
    ),
    countryName: regionNames.of(brand.country) ?? brand.country,
  }));

  return (
    <main className="mx-auto w-full max-w-4xl px-6 py-24 sm:py-32">
      <header className="mb-24">
        <h1 className="font-serif text-4xl sm:text-5xl tracking-tight">
          learnthatwatch
        </h1>
        <p className="mt-4 max-w-md text-base text-muted leading-relaxed">
          Learn to recognise watches by sight. Choose a brand and study the
          silhouettes that set each model apart.
        </p>
      </header>

      <section>
        <div className="flex items-baseline justify-between border-b border-rule pb-3 mb-6">
          <h2 className="text-xs uppercase tracking-[0.18em] text-muted">
            Brands
          </h2>
          <span className="text-xs tabular-nums text-muted">
            {brands.length}
          </span>
        </div>

        <ul className="grid grid-cols-2 gap-px bg-rule sm:grid-cols-3 border border-rule">
          {brands.map((brand) => (
            <li key={brand.id} className="bg-background">
              <Link
                href={`/brands/${brand.id}`}
                aria-label={brand.name}
                className="group relative block aspect-square"
              >
                <span className="absolute inset-0 flex items-center justify-center p-6 transition-opacity duration-300 group-hover:opacity-0">
                  {brand.hasLogo ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={`/brands/${brand.id}/logo.svg`}
                      alt=""
                      className="max-h-[55%] max-w-[70%] object-contain"
                    />
                  ) : (
                    <span className="font-serif text-2xl tracking-tight text-foreground/80 sm:text-3xl">
                      {brand.name}
                    </span>
                  )}
                </span>

                <span className="absolute inset-0 flex flex-col items-center justify-center gap-2 p-6 text-center opacity-0 transition-opacity duration-300 group-hover:opacity-100">
                  <span className="font-serif text-2xl tracking-tight sm:text-3xl">
                    {brand.name}
                  </span>
                  <span className="flex items-center gap-2 text-xs text-muted">
                    <span className="tabular-nums">{brand.founded}</span>
                    <span aria-hidden>·</span>
                    <CircleFlag
                      countryCode={brand.country.toLowerCase()}
                      height={14}
                      width={14}
                      className="inline-block"
                    />
                    <span>{brand.countryName}</span>
                  </span>
                  <span
                    aria-hidden
                    className="mt-2 text-foreground/50 transition-transform duration-300 group-hover:translate-x-1"
                  >
                    →
                  </span>
                </span>
              </Link>
            </li>
          ))}
        </ul>
      </section>
    </main>
  );
}
