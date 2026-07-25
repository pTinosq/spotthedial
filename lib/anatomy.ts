/**
 * Watch anatomy vocabulary — the shared dataset behind the /anatomy page.
 *
 * The line-art watch lives in a 600×660 coordinate space (see `app/anatomy/watch.tsx`).
 * `CENTER` / the radii below are the single source of truth for that drawing, so
 * both the SVG and the callout anchors stay in sync.
 *
 * `anchor` is the point on the drawing a leader line / highlight should target.
 * `side` is a hint for laying labels out around the watch (left vs. right column).
 */

export const CENTER = { x: 300, y: 330 } as const;

export const RADII = {
  caseEdge: 192,
  bezelOuter: 184,
  bezelInner: 156,
  dial: 152,
  markerIn: 118,
  markerOut: 134,
  hub: 9,
} as const;

export type PartId =
  | "bracelet"
  | "lug"
  | "case"
  | "bezel"
  | "crystal"
  | "dial"
  | "marker"
  | "hour-hand"
  | "minute-hand"
  | "seconds-hand"
  | "crown"
  | "date";

export type Part = {
  id: PartId;
  /** Display term. */
  term: string;
  /** One-line plain-language definition. */
  blurb: string;
  /** Point on the drawing the highlight / leader line targets. */
  anchor: { x: number; y: number };
  /** Which side of the watch the term naturally sits on. */
  side: "left" | "right";
};

/** Ordered roughly outside-in, then the details — reads well top-to-bottom in a list. */
export const PARTS: Part[] = [
  {
    id: "bezel",
    term: "Bezel",
    blurb:
      "The ring framing the crystal. Can be fixed, or rotate to time a dive or track a second zone.",
    anchor: { x: 300, y: 152 },
    side: "left",
  },
  {
    id: "crystal",
    term: "Crystal",
    blurb:
      "The transparent cover over the dial — today almost always scratch-resistant sapphire.",
    anchor: { x: 224, y: 236 },
    side: "left",
  },
  {
    id: "case",
    term: "Case",
    blurb: "The metal body that houses and protects the movement.",
    anchor: { x: 160, y: 452 },
    side: "left",
  },
  {
    id: "lug",
    term: "Lugs",
    blurb: "The horns projecting from the case that anchor the strap or bracelet.",
    anchor: { x: 128, y: 176 },
    side: "left",
  },
  {
    id: "dial",
    term: "Dial",
    blurb: "The face of the watch — the backdrop the hands and markers sit on.",
    anchor: { x: 240, y: 402 },
    side: "left",
  },
  {
    id: "marker",
    term: "Hour markers",
    blurb: "The indices at each hour — batons, dots, numerals — that stand in for numbers.",
    anchor: { x: 408, y: 392 },
    side: "right",
  },
  {
    id: "hour-hand",
    term: "Hour hand",
    blurb: "The shorter, broader hand pointing to the hour.",
    anchor: { x: 258, y: 300 },
    side: "left",
  },
  {
    id: "minute-hand",
    term: "Minute hand",
    blurb: "The longer, slimmer hand reaching almost to the minute track.",
    anchor: { x: 384, y: 276 },
    side: "right",
  },
  {
    id: "seconds-hand",
    term: "Seconds hand",
    blurb: "The thin, fast-moving hand, often with a counterweight tail past the centre.",
    anchor: { x: 306, y: 448 },
    side: "right",
  },
  {
    id: "crown",
    term: "Crown",
    blurb: "The knurled knob for winding the mainspring and setting the time and date.",
    anchor: { x: 500, y: 330 },
    side: "right",
  },
  {
    id: "date",
    term: "Date window",
    blurb: "A small aperture in the dial revealing the current date on a rotating disc.",
    anchor: { x: 392, y: 330 },
    side: "right",
  },
  {
    id: "bracelet",
    term: "Bracelet",
    blurb: "The metal band of articulated links (a leather or rubber band is a strap).",
    anchor: { x: 300, y: 96 },
    side: "left",
  },
];

export const PART_MAP: Record<PartId, Part> = Object.fromEntries(
  PARTS.map((p) => [p.id, p]),
) as Record<PartId, Part>;
