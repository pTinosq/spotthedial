import { readFileSync } from "node:fs";
import { join } from "node:path";
import Link from "next/link";
import type { Metadata } from "next";
import { AnatomyClient } from "./anatomy-client";

export const metadata: Metadata = {
  title: "Anatomy of a watch — Spot the Dial",
  description: "Learn the vocabulary of a watch, part by part.",
};

/** The hand-authored watch, inlined so its parts can be highlighted individually. */
function watchInnerSvg(): string {
  const raw = readFileSync(
    join(process.cwd(), "public/anatomy/watch.svg"),
    "utf8",
  );
  return raw
    .replace(/^[\s\S]*?<svg[^>]*>/, "") // drop the outer <svg> wrapper…
    .replace(/<\/svg>\s*$/, "") // …and its close…
    .replace(/<rect[^>]*fill="white"[^>]*\/>/, ""); // …and the opaque backdrop.
}

export default function AnatomyPage() {
  const watchSvg = watchInnerSvg();
  return (
    <main className="mx-auto w-full max-w-5xl px-6 py-12 sm:py-20">
      <nav className="mb-8 text-xs uppercase tracking-[0.18em] text-muted">
        <Link href="/" className="hover:text-foreground">
          ← Home
        </Link>
      </nav>

      <header className="mb-10 max-w-xl">
        <h1 className="font-serif text-4xl sm:text-5xl tracking-tight">
          Anatomy of a watch
        </h1>
        <p className="mt-3 text-base leading-relaxed text-muted">
          The vocabulary, part by part. Three ways to explore it — pick whichever
          clicks.
        </p>
      </header>

      <AnatomyClient watchSvg={watchSvg} />
    </main>
  );
}
