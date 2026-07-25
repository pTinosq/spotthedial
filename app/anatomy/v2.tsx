"use client";

import { useMemo, useState } from "react";
import { PARTS, PART_MAP, type Part, type PartId } from "@/lib/anatomy";
import { WatchGraphic } from "./watch";

// The watch (0..600 × 0..660) sits centred in a wider plate.
const OFFSET = { x: 150, y: 30 };
const LEFT_CONNECT = 196;
const RIGHT_CONNECT = 704;
const SLOT_TOP = 78;
const SLOT_BOTTOM = 694;

/**
 * v2 — Plate. A textbook-style figure: terms flank the watch on both sides with
 * thin leader lines always drawn to each part. Hovering a label — or the part
 * itself — brings that pair forward.
 */
export function AnatomyV2() {
  const [active, setActive] = useState<PartId | null>(null);
  const activePart = active ? PART_MAP[active] : null;

  const placed = useMemo(() => {
    const left = PARTS.filter((p) => p.side === "left");
    const right = PARTS.filter((p) => p.side === "right");
    const slot = (i: number, n: number) =>
      n === 1 ? (SLOT_TOP + SLOT_BOTTOM) / 2 : SLOT_TOP + ((SLOT_BOTTOM - SLOT_TOP) * i) / (n - 1);
    return [
      ...left.map((part, i) => ({ part, side: "left" as const, y: slot(i, left.length) })),
      ...right.map((part, i) => ({ part, side: "right" as const, y: slot(i, right.length) })),
    ];
  }, []);

  return (
    <div>
      <svg
        viewBox="0 0 900 750"
        className="w-full select-none"
        role="group"
        aria-label="Watch anatomy plate — hover a term or a part"
      >
        <g transform={`translate(${OFFSET.x} ${OFFSET.y})`}>
          <WatchGraphic active={active} />
        </g>

        {/* Leader lines — always drawn, faint; the active one brightens. */}
        {placed.map(({ part, side, y }) => {
          const ax = part.anchor.x + OFFSET.x;
          const ay = part.anchor.y + OFFSET.y;
          const cx = side === "left" ? LEFT_CONNECT : RIGHT_CONNECT;
          const on = active === part.id;
          return (
            <g
              key={`lead-${part.id}`}
              style={{ pointerEvents: "none", transition: "opacity .3s ease" }}
              opacity={active === null ? 0.28 : on ? 1 : 0.08}
            >
              <line
                x1={cx}
                y1={y - 6}
                x2={ax}
                y2={ay}
                stroke="currentColor"
                strokeWidth={on ? 1.4 : 1}
              />
              <circle cx={ax} cy={ay} r={on ? 4 : 2.5} fill="currentColor" />
            </g>
          );
        })}

        {/* Labels */}
        {placed.map(({ part, side, y }) => (
          <Label
            key={part.id}
            part={part}
            side={side}
            y={y}
            active={active}
            onEnter={() => setActive(part.id)}
            onLeave={() => setActive(null)}
          />
        ))}

        {/* Invisible hit targets over each part so the watch itself is hoverable. */}
        {PARTS.map((part) => (
          <circle
            key={`hit-${part.id}`}
            cx={part.anchor.x + OFFSET.x}
            cy={part.anchor.y + OFFSET.y}
            r={24}
            fill="transparent"
            style={{ cursor: "pointer" }}
            onMouseEnter={() => setActive(part.id)}
            onMouseLeave={() => setActive(null)}
          />
        ))}
      </svg>

      <p className="mt-2 min-h-[2.5rem] max-w-xl text-sm leading-relaxed text-muted">
        {activePart?.blurb ?? "Hover a label or a part of the watch."}
      </p>
    </div>
  );
}

function Label({
  part,
  side,
  y,
  active,
  onEnter,
  onLeave,
}: {
  part: Part;
  side: "left" | "right";
  y: number;
  active: PartId | null;
  onEnter: () => void;
  onLeave: () => void;
}) {
  const on = active === part.id;
  const x = side === "left" ? 24 : 876;
  return (
    <g
      onMouseEnter={onEnter}
      onMouseLeave={onLeave}
      onClick={onEnter}
      style={{ cursor: "pointer" }}
    >
      <rect x={side === "left" ? 0 : 700} y={y - 24} width={200} height={34} fill="transparent" />
      <text
        x={x}
        y={y}
        textAnchor={side === "left" ? "start" : "end"}
        fontSize={20}
        className="font-serif"
        fill="currentColor"
        style={{
          opacity: active === null || on ? 1 : 0.35,
          transition: "opacity .3s ease",
        }}
      >
        {part.term}
      </text>
    </g>
  );
}
