import Link from "next/link";
import type { ReactNode } from "react";

type TileProps = {
  /** Visual face of the tile (logo, photo, illustration). Caller controls fit. */
  thumbnail: ReactNode;
  /** Hover overlay (desktop) / always-visible meta (mobile). */
  children: ReactNode;
  /** When provided and not disabled, the whole tile becomes a Link to this href. */
  href?: string;
  /** Disable interaction and apply the coming-soon styling (grayscale + cursor-not-allowed). */
  disabled?: boolean;
  /** Accessible label for the tile as a whole. */
  ariaLabel?: string;
};

export function Tile({
  thumbnail,
  children,
  href,
  disabled,
  ariaLabel,
}: TileProps) {
  const body = (
    <>
      {/* Mobile: horizontal row, thumbnail + meta always visible */}
      <span className="flex items-center gap-4 p-4 sm:hidden">
        <span className="flex h-16 w-16 flex-shrink-0 items-center justify-center overflow-hidden">
          {thumbnail}
        </span>
        <span className="min-w-0 flex-1">{children}</span>
      </span>

      {/* Desktop: aspect-square, hover swaps thumbnail for meta */}
      <span className="relative hidden aspect-square sm:block">
        <span className="absolute inset-0 flex items-center justify-center p-6 transition-opacity duration-300 group-hover:opacity-0">
          {thumbnail}
        </span>
        <span className="absolute inset-0 flex flex-col items-center justify-center gap-2 p-6 text-center opacity-0 transition-opacity duration-300 group-hover:opacity-100">
          {children}
        </span>
      </span>
    </>
  );

  const sharedClass = `group block ${disabled ? "cursor-not-allowed opacity-50 grayscale" : ""}`;

  if (disabled || !href) {
    return (
      <div
        aria-disabled={disabled || undefined}
        aria-label={ariaLabel}
        className={sharedClass}
      >
        {body}
      </div>
    );
  }

  return (
    <Link href={href} aria-label={ariaLabel} className={sharedClass}>
      {body}
    </Link>
  );
}
