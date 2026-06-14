import Link from "next/link";
import { getBrands } from "@/lib/data";

export default function Home() {
  const brands = getBrands();

  return (
    <main className="mx-auto w-full max-w-2xl px-6 py-24 sm:py-32">
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
        <div className="flex items-baseline justify-between border-b border-rule pb-3 mb-1">
          <h2 className="text-xs uppercase tracking-[0.18em] text-muted">
            Brands
          </h2>
          <span className="text-xs tabular-nums text-muted">
            {brands.length}
          </span>
        </div>

        <ul>
          {brands.map((brand) => (
            <li key={brand.id} className="border-b border-rule">
              <Link
                href={`/brands/${brand.id}`}
                className="group flex items-baseline justify-between gap-6 py-5 transition-colors hover:bg-black/[0.02]"
              >
                <span className="font-serif text-2xl sm:text-3xl tracking-tight">
                  {brand.name}
                </span>
                <span className="flex items-baseline gap-4 text-xs tabular-nums text-muted">
                  <span>{brand.founded}</span>
                  <span className="hidden sm:inline">·</span>
                  <span className="hidden sm:inline">{brand.country}</span>
                  <span
                    aria-hidden
                    className="text-foreground/40 transition-transform group-hover:translate-x-1"
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
