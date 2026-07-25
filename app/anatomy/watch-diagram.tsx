"use client";

import { useCallback, useEffect, useLayoutEffect, useRef, useState } from "react";
import { PART_MAP, type PartId } from "@/lib/anatomy";

/** Tight frame around the watch within its 1000×1000 authored canvas. */
const WATCH_VIEWBOX = "235 150 530 710";

type Row = {
  id: PartId;
  /** Anchor in the SVG's 1000×1000 space — where the leader line points. */
  anchor: { x: number; y: number };
  /** Leaf group ids to light up (Case lights both its children). */
  highlight: string[];
};

const ROWS: Row[] = [
  { id: "bezel", anchor: { x: 482, y: 305 }, highlight: ["bezel"] },
  { id: "crystal", anchor: { x: 405, y: 415 }, highlight: ["crystal"] },
  { id: "case", anchor: { x: 288, y: 500 }, highlight: ["lug", "bezel"] },
  { id: "lug", anchor: { x: 628, y: 345 }, highlight: ["lug"] },
  { id: "dial", anchor: { x: 445, y: 590 }, highlight: ["dial"] },
  { id: "marker", anchor: { x: 577, y: 557 }, highlight: ["marker"] },
  { id: "hour-hand", anchor: { x: 450, y: 485 }, highlight: ["hour-hand"] },
  { id: "minute-hand", anchor: { x: 560, y: 465 }, highlight: ["minute-hand"] },
  { id: "crown", anchor: { x: 715, y: 505 }, highlight: ["crown"] },
  { id: "date", anchor: { x: 572, y: 503 }, highlight: ["date"] },
  { id: "bracelet", anchor: { x: 481, y: 230 }, highlight: ["bracelet"] },
];

/** Every individually dimmable group (containers like `case` are excluded). */
const LEAF_IDS = [
  "bracelet",
  "dial",
  "crystal",
  "lug",
  "bezel",
  "marker",
  "hour-hand",
  "minute-hand",
  "crown",
  "date",
];

type Line = { x1: number; y1: number; x2: number; y2: number };

/**
 * The interactive anatomy diagram. The authored watch is inlined so each part
 * can be faded or lit. Terms are a tappable list — hover (desktop) or tap
 * (mobile) to highlight the part and read its definition; clicking pins it.
 * On desktop a leader line is drawn from the term to the part; it's measured
 * from the live layout so it survives the responsive reflow. "Case" lights up
 * its lugs and bezel together.
 */
export function AnatomyDiagram({ watchSvg }: { watchSvg: string }) {
  const [hover, setHover] = useState<PartId | null>(null);
  const [pinned, setPinned] = useState<PartId | null>(null);
  const active = hover ?? pinned;
  const activeRow = active ? ROWS.find((r) => r.id === active) : null;
  const blurb = activeRow
    ? PART_MAP[activeRow.id].blurb
    : "Hover or tap a term to find it on the watch.";

  const wrapRef = useRef<HTMLDivElement>(null);
  const svgRef = useRef<SVGSVGElement>(null);
  const gRef = useRef<SVGGElement>(null);
  const termRefs = useRef<(HTMLButtonElement | null)[]>([]);

  const [isDesktop, setIsDesktop] = useState(false);
  const [line, setLine] = useState<Line | null>(null);
  const [overlay, setOverlay] = useState({ w: 0, h: 0 });

  // Drive per-part opacity directly on the inlined SVG's groups.
  useEffect(() => {
    const root = gRef.current;
    if (!root) return;
    const lit = active
      ? new Set(ROWS.find((r) => r.id === active)?.highlight)
      : null;
    for (const id of LEAF_IDS) {
      const el = root.querySelector<SVGElement>(`#${CSS.escape(id)}`);
      if (!el) continue;
      el.style.transition = "opacity .35s ease";
      el.style.opacity = lit ? (lit.has(id) ? "1" : "0.1") : "1";
    }
  }, [active]);

  // Track the breakpoint (connector line is desktop-only).
  useEffect(() => {
    const mq = window.matchMedia("(min-width: 768px)");
    const sync = () => setIsDesktop(mq.matches);
    sync();
    mq.addEventListener("change", sync);
    return () => mq.removeEventListener("change", sync);
  }, []);

  // Measure the leader line from the live DOM so it tracks the reflow/resize.
  const measure = useCallback(() => {
    const wrap = wrapRef.current;
    if (!wrap) return;
    const wrapRect = wrap.getBoundingClientRect();
    setOverlay({ w: wrapRect.width, h: wrapRect.height });

    const idx = active ? ROWS.findIndex((r) => r.id === active) : -1;
    const term = idx >= 0 ? termRefs.current[idx] : null;
    const ctm = gRef.current?.getScreenCTM();
    if (!isDesktop || !active || !svgRef.current || !ctm || !term) {
      setLine(null);
      return;
    }
    const pt = svgRef.current.createSVGPoint();
    pt.x = ROWS[idx].anchor.x;
    pt.y = ROWS[idx].anchor.y;
    const p = pt.matrixTransform(ctm);
    const t = term.getBoundingClientRect();
    setLine({
      x1: t.left - wrapRect.left,
      y1: t.top - wrapRect.top + t.height / 2,
      x2: p.x - wrapRect.left,
      y2: p.y - wrapRect.top,
    });
  }, [active, isDesktop]);

  useLayoutEffect(() => {
    measure();
    window.addEventListener("resize", measure);
    return () => window.removeEventListener("resize", measure);
  }, [measure]);

  return (
    <div ref={wrapRef} className="relative">
      <div className="flex flex-col items-center gap-8 md:flex-row md:items-center md:gap-12">
        {/* Watch */}
        <div className="w-full max-w-[300px] sm:max-w-[360px] md:max-w-none md:flex-1">
          <svg
            ref={svgRef}
            viewBox={WATCH_VIEWBOX}
            className="w-full select-none"
            role="img"
            aria-label="Line drawing of a watch"
          >
            <g ref={gRef} fill="none" dangerouslySetInnerHTML={{ __html: watchSvg }} />
          </svg>
        </div>

        {/* Description — on mobile it sits under the image, above the list. */}
        <p className="min-h-[3rem] w-full text-sm leading-relaxed text-muted md:hidden">
          {blurb}
        </p>

        {/* Terms */}
        <ul className="w-full divide-y divide-rule md:flex-1 md:divide-y-0">
          {ROWS.map((row, i) => {
            const on = active === row.id;
            const isPinned = pinned === row.id;
            return (
              <li key={row.id}>
                <button
                  type="button"
                  ref={(el) => {
                    termRefs.current[i] = el;
                  }}
                  onMouseEnter={() => setHover(row.id)}
                  onMouseLeave={() => setHover(null)}
                  onClick={() =>
                    setPinned((p) => (p === row.id ? null : row.id))
                  }
                  className="block w-full py-3 text-left font-serif text-lg tracking-tight transition-colors md:py-1.5 md:text-xl"
                  style={{
                    color:
                      active === null || on
                        ? "var(--foreground)"
                        : "var(--muted)",
                    fontWeight: isPinned ? 600 : 400,
                  }}
                >
                  {PART_MAP[row.id].term}
                </button>
              </li>
            );
          })}
        </ul>
      </div>

      {/* Leader line — desktop only, measured from the live layout. */}
      {line && (
        <svg
          className="pointer-events-none absolute inset-0 hidden text-foreground md:block"
          width={overlay.w}
          height={overlay.h}
        >
          <line
            x1={line.x1}
            y1={line.y1}
            x2={line.x2}
            y2={line.y2}
            stroke="currentColor"
            strokeWidth={1.25}
          />
          <circle cx={line.x2} cy={line.y2} r={5} fill="currentColor" />
        </svg>
      )}

      {/* Description — desktop shows it below the diagram. */}
      <p className="mt-8 hidden min-h-[2.5rem] max-w-md text-sm leading-relaxed text-muted md:block">
        {blurb}
      </p>
    </div>
  );
}
