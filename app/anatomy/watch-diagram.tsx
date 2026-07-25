"use client";

import { useEffect, useRef, useState } from "react";
import { PART_MAP, type PartId } from "@/lib/anatomy";

// The authored SVG is a 1000×1000 canvas; we drop it into the outer coordinate
// space with this transform, and the same transform maps a part's anchor (given
// in 1000-space) to where the leader line should point.
const S = 700;
const WX = -70;
const WY = 20;
const toOuter = (a: { x: number; y: number }) => ({
  x: WX + (a.x * S) / 1000,
  y: WY + (a.y * S) / 1000,
});

const ROW_TOP = 78;
const ROW_STEP = 46;
const WORD_X = 782;
const LEAD_X = 766;

type Row = {
  id: PartId;
  /** Anchor in the SVG's 1000×1000 space. */
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

/** Every individually dimmable group in the drawing (containers like `case` are excluded). */
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

const rowY = (i: number) => ROW_TOP + i * ROW_STEP;

/**
 * The interactive anatomy diagram. The authored watch is inlined so each part
 * can be faded or lit; hovering a term draws a leader line to it, clicking pins
 * it (click again to unpin). "Case" lights up its lugs and bezel together.
 */
export function AnatomyDiagram({ watchSvg }: { watchSvg: string }) {
  const [hover, setHover] = useState<PartId | null>(null);
  const [pinned, setPinned] = useState<PartId | null>(null);
  const active = hover ?? pinned;
  const gRef = useRef<SVGGElement>(null);

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

  const activeRow = active ? ROWS.find((r) => r.id === active) : null;
  const target = activeRow ? toOuter(activeRow.anchor) : null;

  return (
    <div>
      <svg
        viewBox="0 0 1200 760"
        className="w-full select-none"
        role="group"
        aria-label="Watch anatomy — hover or click a term to locate the part"
      >
        <g
          ref={gRef}
          fill="none"
          transform={`translate(${WX} ${WY}) scale(${S / 1000})`}
          dangerouslySetInnerHTML={{ __html: watchSvg }}
        />

        {target && (
          <g className="text-foreground" style={{ pointerEvents: "none" }}>
            <line
              x1={WORD_X - 6}
              y1={rowY(ROWS.findIndex((r) => r.id === active)) - 7}
              x2={LEAD_X}
              y2={rowY(ROWS.findIndex((r) => r.id === active)) - 7}
              stroke="currentColor"
              strokeWidth={1.25}
            />
            <line
              x1={LEAD_X}
              y1={rowY(ROWS.findIndex((r) => r.id === active)) - 7}
              x2={target.x}
              y2={target.y}
              stroke="currentColor"
              strokeWidth={1.25}
            />
            <circle cx={target.x} cy={target.y} r={5} fill="currentColor" />
          </g>
        )}

        {ROWS.map((row, i) => {
          const y = rowY(i);
          const on = active === row.id;
          const isPinned = pinned === row.id;
          return (
            <g
              key={row.id}
              onMouseEnter={() => setHover(row.id)}
              onMouseLeave={() => setHover(null)}
              onClick={() =>
                setPinned((p) => (p === row.id ? null : row.id))
              }
              style={{ cursor: "pointer" }}
            >
              <rect x={740} y={y - 26} width={440} height={40} fill="transparent" />
              <text
                x={WORD_X}
                y={y}
                fontSize={22}
                className="font-serif"
                fill="currentColor"
                style={{
                  opacity: active === null || on ? 1 : 0.4,
                  fontWeight: isPinned ? 600 : 400,
                  transition: "opacity .3s ease",
                }}
              >
                {PART_MAP[row.id].term}
              </text>
            </g>
          );
        })}
      </svg>

      <p className="mt-2 min-h-[2.5rem] max-w-xl text-sm leading-relaxed text-muted">
        {activeRow
          ? PART_MAP[activeRow.id].blurb
          : "Hover a term to find it on the watch."}
      </p>
    </div>
  );
}
