"use client";

import { useState } from "react";
import Link from "next/link";

const links = [
  { href: "/anatomy", label: "Anatomy" },
  { href: "/quiz", label: "Play a game", arrow: true },
];

export function SiteHeader() {
  const [open, setOpen] = useState(false);

  return (
    <header className="mb-16 sm:mb-20">
      <div className="flex items-center justify-between gap-4">
        <Link
          href="/"
          className="font-serif text-xl tracking-tight sm:text-2xl"
        >
          Spot the Dial
        </Link>

        {/* Desktop nav */}
        <nav className="hidden items-center gap-3 sm:flex sm:gap-4">
          {links.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="group inline-flex items-center gap-2 border border-rule px-4 py-2 font-serif text-sm tracking-tight text-foreground transition-colors duration-150 hover:border-foreground sm:text-base"
            >
              {link.label}
              {link.arrow && (
                <span
                  aria-hidden="true"
                  className="transition-transform duration-150 group-hover:translate-x-0.5"
                >
                  →
                </span>
              )}
            </Link>
          ))}
        </nav>

        {/* Mobile burger */}
        <button
          type="button"
          onClick={() => setOpen((v) => !v)}
          aria-expanded={open}
          aria-label={open ? "Close menu" : "Open menu"}
          className="inline-flex h-10 w-10 items-center justify-center border border-rule text-foreground transition-colors duration-150 hover:border-foreground sm:hidden"
        >
          <span className="relative block h-4 w-5">
            <span
              className={`absolute left-0 block h-px w-5 bg-current transition-all duration-200 ${
                open ? "top-1/2 -translate-y-1/2 rotate-45" : "top-0.5"
              }`}
            />
            <span
              className={`absolute left-0 top-1/2 block h-px w-5 -translate-y-1/2 bg-current transition-opacity duration-200 ${
                open ? "opacity-0" : "opacity-100"
              }`}
            />
            <span
              className={`absolute left-0 block h-px w-5 bg-current transition-all duration-200 ${
                open ? "top-1/2 -translate-y-1/2 -rotate-45" : "bottom-0.5"
              }`}
            />
          </span>
        </button>
      </div>

      {/* Mobile menu */}
      {open && (
        <nav className="mt-4 flex flex-col border border-rule divide-y divide-rule sm:hidden">
          {links.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              onClick={() => setOpen(false)}
              className="group flex items-center justify-between px-4 py-3 font-serif text-base tracking-tight text-foreground transition-colors duration-150 hover:bg-foreground/[0.03]"
            >
              {link.label}
              {link.arrow && (
                <span
                  aria-hidden="true"
                  className="transition-transform duration-150 group-hover:translate-x-0.5"
                >
                  →
                </span>
              )}
            </Link>
          ))}
        </nav>
      )}
    </header>
  );
}
