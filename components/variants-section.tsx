"use client";

import { useMemo, useState } from "react";
import type { VariantView } from "@/lib/types";

/**
 * Accent colours keyed by a colour word appearing in a tag. Tags that mention a
 * dial/bezel colour render in that colour; everything else (e.g. "Black
 * watchface") keeps the default black-outlined chip. Neutrals (black, white,
 * grey, silver, steel) are intentionally absent so they stay default. Ordered
 * most-specific first so "rose gold" beats "gold". Extend freely.
 */
const TAG_COLORS: [string, string][] = [
  ["rose gold", "#b76e79"],
  ["blue", "#2563eb"],
  ["green", "#16a34a"],
  ["red", "#dc2626"],
  ["burgundy", "#7c2d3a"],
  ["gold", "#b8860b"],
  ["champagne", "#c8a951"],
  ["yellow", "#ca8a04"],
  ["orange", "#ea580c"],
  ["bronze", "#9c6b30"],
  ["brown", "#92400e"],
  ["copper", "#b45309"],
  ["salmon", "#e2725b"],
  ["rose", "#e11d48"],
  ["pink", "#db2777"],
  ["purple", "#7c3aed"],
  ["teal", "#0d9488"],
];

function tagColor(tag: string): string | null {
  const t = tag.toLowerCase();
  for (const [word, hex] of TAG_COLORS) if (t.includes(word)) return hex;
  return null;
}

/**
 * The "Variants" block on a watch detail page: a row of tag chips that filter
 * (AND — selecting more chips narrows further) a horizontally scrolling,
 * snap-aligned strip of variant images. Tags that name a colour render in that
 * colour; others keep the default outline. Mobile-friendly: the strip is a
 * native touch scroller and the chips wrap.
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
            const color = tagColor(tag);
            const base =
              "cursor-pointer rounded-full border px-3 py-1 text-xs transition-colors";
            const style = color
              ? on
                ? { backgroundColor: color, borderColor: color, color: "#fff" }
                : { borderColor: color, color }
              : undefined;
            const className = color
              ? base
              : `${base} ${
                  on
                    ? "border-foreground bg-foreground text-background"
                    : "border-rule text-muted hover:text-foreground"
                }`;
            return (
              <button
                key={tag}
                type="button"
                aria-pressed={on}
                onClick={() => toggle(tag)}
                className={className}
                style={style}
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
                  {variant.tags.map((tag, t) => {
                    const color = tagColor(tag);
                    return (
                      <span key={tag}>
                        {t > 0 && " · "}
                        <span style={color ? { color } : undefined}>{tag}</span>
                      </span>
                    );
                  })}
                </p>
              )}
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
