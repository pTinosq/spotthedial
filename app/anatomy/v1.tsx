"use client";

import { useState } from "react";
import { PARTS, PART_MAP, type PartId } from "@/lib/anatomy";
import { WatchGraphic } from "./watch";

const ROW_TOP = 72;
const ROW_STEP = 43;
const WORD_X = 726;
const LEAD_X = 710;

/**
 * v1 — Connectors. Words listed on the right; hovering one draws a leader line
 * to the part on the drawing and fades everything else. Clicking a word pins it
 * so the arrow stays after the pointer leaves (click again to unpin). The whole
 * thing is a single SVG so the line and the watch share one coordinate space.
 */
export function AnatomyV1() {
  const [hover, setHover] = useState<PartId | null>(null);
  const [pinned, setPinned] = useState<PartId | null>(null);
  // Hover previews; a pin holds when nothing is hovered.
  const active = hover ?? pinned;
  const activePart = active ? PART_MAP[active] : null;

  return (
    <div>
      <svg
        viewBox="0 0 1180 660"
        className="w-full select-none"
        role="group"
        aria-label="Watch anatomy — hover or click a term to locate the part"
      >
        <WatchGraphic active={active} />

        {activePart && (
          <g className="text-foreground" style={{ pointerEvents: "none" }}>
            <line
              x1={WORD_X - 6}
              y1={rowY(active!) - 7}
              x2={LEAD_X}
              y2={rowY(active!) - 7}
              stroke="currentColor"
              strokeWidth={1.25}
            />
            <line
              x1={LEAD_X}
              y1={rowY(active!) - 7}
              x2={activePart.anchor.x}
              y2={activePart.anchor.y}
              stroke="currentColor"
              strokeWidth={1.25}
            />
            <circle
              cx={activePart.anchor.x}
              cy={activePart.anchor.y}
              r={4.5}
              fill="currentColor"
            />
          </g>
        )}

        {PARTS.map((part) => {
          const y = rowY(part.id);
          const on = active === part.id;
          const isPinned = pinned === part.id;
          return (
            <g
              key={part.id}
              onMouseEnter={() => setHover(part.id)}
              onMouseLeave={() => setHover(null)}
              onClick={() => setPinned((p) => (p === part.id ? null : part.id))}
              style={{ cursor: "pointer" }}
            >
              <rect
                x={680}
                y={y - 26}
                width={480}
                height={38}
                fill="transparent"
              />
              <text
                x={WORD_X}
                y={y}
                fontSize={21}
                className="font-serif"
                fill="currentColor"
                style={{
                  opacity: active === null || on ? 1 : 0.4,
                  fontWeight: isPinned ? 600 : 400,
                  transition: "opacity .3s ease",
                }}
              >
                {part.term}
              </text>
            </g>
          );
        })}
      </svg>

      <Caption blurb={activePart?.blurb} />
    </div>
  );
}

function rowY(id: PartId) {
  return ROW_TOP + PARTS.findIndex((p) => p.id === id) * ROW_STEP;
}

function Caption({ blurb }: { blurb?: string }) {
  return (
    <p className="mt-4 min-h-[2.5rem] max-w-xl text-sm leading-relaxed text-muted">
      {blurb ?? "Hover a term to find it on the watch."}
    </p>
  );
}
