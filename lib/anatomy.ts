/**
 * Watch anatomy vocabulary — the terms behind the /anatomy page.
 *
 * Each id matches a group in the authored drawing (`public/anatomy/watch.svg`),
 * so the diagram can light up a part by id. Placement of the terms and where the
 * leader lines point lives with the diagram itself (`app/anatomy/watch-diagram.tsx`).
 */

export type PartId =
  | "bezel"
  | "crystal"
  | "case"
  | "lug"
  | "dial"
  | "marker"
  | "hour-hand"
  | "minute-hand"
  | "crown"
  | "date"
  | "bracelet";

export type Part = {
  id: PartId;
  /** Display term. */
  term: string;
  /** One-line plain-language definition. */
  blurb: string;
};

export const PARTS: Part[] = [
  {
    id: "bezel",
    term: "Bezel",
    blurb:
      "The ring framing the crystal. Can be fixed, or rotate to time a dive or track a second zone.",
  },
  {
    id: "crystal",
    term: "Crystal",
    blurb:
      "The transparent cover over the dial — today almost always scratch-resistant sapphire.",
  },
  {
    id: "case",
    term: "Case",
    blurb: "The metal body that houses and protects the movement — here, its bezel and lugs.",
  },
  {
    id: "lug",
    term: "Lugs",
    blurb: "The horns projecting from the case that anchor the strap or bracelet.",
  },
  {
    id: "dial",
    term: "Dial",
    blurb: "The face of the watch — the backdrop the hands and markers sit on.",
  },
  {
    id: "marker",
    term: "Hour markers",
    blurb: "The indices at each hour — batons, dots, numerals — that stand in for numbers.",
  },
  {
    id: "hour-hand",
    term: "Hour hand",
    blurb: "The shorter, broader hand pointing to the hour.",
  },
  {
    id: "minute-hand",
    term: "Minute hand",
    blurb: "The longer, slimmer hand reaching almost to the dial edge.",
  },
  {
    id: "crown",
    term: "Crown",
    blurb: "The knurled knob for winding the mainspring and setting the time and date.",
  },
  {
    id: "date",
    term: "Date window",
    blurb: "A small aperture in the dial revealing the current date on a rotating disc.",
  },
  {
    id: "bracelet",
    term: "Bracelet",
    blurb: "The metal band of articulated links (a leather or rubber band is a strap).",
  },
];

export const PART_MAP: Record<PartId, Part> = Object.fromEntries(
  PARTS.map((p) => [p.id, p]),
) as Record<PartId, Part>;
