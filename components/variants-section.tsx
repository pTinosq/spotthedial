"use client";

import { useMemo, useState } from "react";
import type { VariantView } from "@/lib/types";

/**
 * The "Variants" block on a watch detail page: a row of tag chips that filter
 * (AND — selecting more chips narrows further) a horizontally scrolling,
 * snap-aligned strip of variant images. Mobile-friendly: the strip is a native
 * touch scroller and the chips wrap.
 */
export function VariantsSection({ variants }: { variants: VariantView[] }) {
  const allTags = useMemo(() => {
    const seen = new Set<string>();
    for (const v of variants) for (const t of v.tags) seen.add(t);
    return [...seen].sort((a, b) => a.localeCompare(b));
  }, [variants]);

  const [active, setActive] = useState<string[]>([]);

  const shown = useMemo(
    () =>
      active.length === 0
        ? variants
        : variants.filter((v) => active.every((t) => v.tags.includes(t))),
    [variants, active],
  );

  function toggle(tag: string) {
    setActive((prev) =>
      prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag],
    );
  }

  if (variants.length === 0) return null;

  return (
    <section className="mt-16 border-t border-rule pt-8">
      <div className="flex items-baseline justify-between">
        <h2 className="text-xs uppercase tracking-[0.18em] text-muted">
          Variants
        </h2>
        <span className="text-xs tabular-nums text-muted">{shown.length}</span>
      </div>

      {allTags.length > 0 && (
        <div className="mt-4 flex flex-wrap gap-2">
          {active.length > 0 && (
            <button
              type="button"
              onClick={() => setActive([])}
              className="cursor-pointer rounded-full border border-rule px-3 py-1 text-xs text-muted transition-colors hover:text-foreground"
            >
              Clear
            </button>
          )}
          {allTags.map((tag) => {
            const on = active.includes(tag);
            return (
              <button
                key={tag}
                type="button"
                aria-pressed={on}
                onClick={() => toggle(tag)}
                className={`cursor-pointer rounded-full border px-3 py-1 text-xs transition-colors ${
                  on
                    ? "border-foreground bg-foreground text-background"
                    : "border-rule text-muted hover:text-foreground"
                }`}
              >
                {tag}
              </button>
            );
          })}
        </div>
      )}

      {shown.length === 0 ? (
        <p className="mt-6 text-sm text-muted">
          No variants match those tags.
        </p>
      ) : (
        <ul
          className="mt-6 -mx-6 flex snap-x snap-mandatory gap-4 overflow-x-auto px-6 pb-4 [scrollbar-width:thin]"
          style={{ WebkitOverflowScrolling: "touch" }}
        >
          {shown.map((variant, i) => (
            <li
              key={`${variant.image}-${i}`}
              className="w-44 flex-shrink-0 snap-start sm:w-56"
            >
              <div className="aspect-square overflow-hidden border border-rule bg-white">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={variant.imageSrc}
                  alt={variant.tags.join(", ") || "Variant"}
                  loading="lazy"
                  className="h-full w-full object-cover"
                />
              </div>
              {variant.tags.length > 0 && (
                <p className="mt-2 text-[11px] leading-snug text-muted">
                  {variant.tags.join(" · ")}
                </p>
              )}
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
