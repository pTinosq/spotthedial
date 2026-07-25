import { CENTER as C, RADII as R, type PartId } from "@/lib/anatomy";

/** Round to 2dp so server and client serialise the float identically (no hydration drift). */
const r2 = (n: number) => Math.round(n * 100) / 100;

/** Angle in degrees, clockwise from 12 o'clock, to a point at radius `r` from centre. */
function polar(r: number, deg: number) {
  const rad = ((deg - 90) * Math.PI) / 180;
  return { x: r2(C.x + r * Math.cos(rad)), y: r2(C.y + r * Math.sin(rad)) };
}

// A pleasant, non-overlapping hand layout (≈10:10:40).
const HOUR_DEG = 305;
const MIN_DEG = 60;
const SEC_DEG = 182;

type GroupProps = {
  id: PartId;
  active: PartId | null;
  /** Base stroke width; active parts thicken slightly. */
  width: number;
  children: React.ReactNode;
};

/** Wraps one anatomical part: dims when another part is active, thickens when it is the active one. */
function Group({ id, active, width, children }: GroupProps) {
  const on = active === id;
  const dimmed = active !== null && !on;
  return (
    <g
      data-part={id}
      fill="none"
      stroke="currentColor"
      strokeWidth={on ? width + 1.5 : width}
      strokeLinecap="round"
      strokeLinejoin="round"
      style={{
        opacity: dimmed ? 0.1 : 1,
        transition: "opacity .35s ease, stroke-width .2s ease",
      }}
    >
      {children}
    </g>
  );
}

/**
 * The generic three-hand-with-date sports watch, drawn as line art in a 600×660
 * space. Every anatomical part is its own <Group> so callers can highlight one
 * and fade the rest via `active`.
 */
export function WatchGraphic({ active }: { active: PartId | null }) {
  // Hour markers — batons at each hour, skipping 3 o'clock (the date lives there),
  // doubled at 12.
  const markers: React.ReactNode[] = [];
  for (let i = 0; i < 12; i++) {
    if (i === 3) continue;
    const deg = i * 30;
    if (i === 0) {
      for (const dx of [-8, 8]) {
        const a = polar(R.markerIn, deg);
        const b = polar(R.markerOut, deg);
        markers.push(
          <line key={`m0-${dx}`} x1={a.x + dx} y1={a.y} x2={b.x + dx} y2={b.y} />,
        );
      }
    } else {
      const a = polar(R.markerIn, deg);
      const b = polar(R.markerOut, deg);
      markers.push(<line key={`m-${i}`} x1={a.x} y1={a.y} x2={b.x} y2={b.y} />);
    }
  }

  const hourTip = polar(92, HOUR_DEG);
  const minTip = polar(128, MIN_DEG);
  const secTip = polar(140, SEC_DEG);
  const secTail = polar(34, SEC_DEG + 180);

  return (
    <>
      {/* Bracelet — two tapered bands behind the case */}
      <Group id="bracelet" active={active} width={2}>
        <path d="M256 150 L250 26 Q250 14 262 14 L338 14 Q350 14 350 26 L344 150 Z" />
        <path d="M256 510 L250 634 Q250 646 262 646 L338 646 Q350 646 350 634 L344 510 Z" />
        <line x1="252" y1="58" x2="348" y2="58" />
        <line x1="251" y1="100" x2="349" y2="100" />
        <line x1="252" y1="602" x2="348" y2="602" />
        <line x1="251" y1="560" x2="349" y2="560" />
      </Group>

      {/* Lugs — four horns bridging case and bracelet */}
      <Group id="lug" active={active} width={11}>
        <line x1="248" y1="176" x2="242" y2="140" />
        <line x1="352" y1="176" x2="358" y2="140" />
        <line x1="248" y1="484" x2="242" y2="520" />
        <line x1="352" y1="484" x2="358" y2="520" />
      </Group>

      {/* Case — outer silhouette + flank band */}
      <Group id="case" active={active} width={2}>
        <circle cx={C.x} cy={C.y} r={R.caseEdge} />
        <circle cx={C.x} cy={C.y} r={R.bezelOuter} />
      </Group>

      {/* Bezel — the ring around the crystal */}
      <Group id="bezel" active={active} width={2}>
        <circle cx={C.x} cy={C.y} r={R.bezelInner} />
      </Group>

      {/* Dial — the face */}
      <Group id="dial" active={active} width={1.5}>
        <circle cx={C.x} cy={C.y} r={R.dial} />
      </Group>

      {/* Hour markers */}
      <Group id="marker" active={active} width={8}>
        {markers}
      </Group>

      {/* Date window */}
      <Group id="date" active={active} width={1.5}>
        <rect x={380} y={315} width={32} height={30} rx={2} />
        <text
          x={396}
          y={336}
          textAnchor="middle"
          fontSize={16}
          fill="currentColor"
          stroke="none"
          className="font-sans"
        >
          24
        </text>
      </Group>

      {/* Hands */}
      <Group id="hour-hand" active={active} width={9}>
        <line x1={C.x} y1={C.y} x2={hourTip.x} y2={hourTip.y} />
      </Group>
      <Group id="minute-hand" active={active} width={6}>
        <line x1={C.x} y1={C.y} x2={minTip.x} y2={minTip.y} />
      </Group>
      <Group id="seconds-hand" active={active} width={2.5}>
        <line x1={secTail.x} y1={secTail.y} x2={secTip.x} y2={secTip.y} />
        <circle cx={C.x} cy={C.y} r={R.hub} />
      </Group>

      {/* Crown */}
      <Group id="crown" active={active} width={2}>
        <rect x={489} y={317} width={26} height={26} rx={4} />
        <line x1={495} y1={322} x2={495} y2={338} />
        <line x1={502} y1={322} x2={502} y2={338} />
        <line x1={509} y1={322} x2={509} y2={338} />
      </Group>

      {/* Crystal — suggested by two glare strokes across the glass */}
      <Group id="crystal" active={active} width={2}>
        <line x1={232} y1={248} x2={198} y2={300} />
        <line x1={256} y1={244} x2={214} y2={312} />
      </Group>
    </>
  );
}

/** Standalone framed drawing for the versions that show the watch on its own. */
export function WatchSVG({
  active,
  className,
}: {
  active: PartId | null;
  className?: string;
}) {
  return (
    <svg
      viewBox="0 0 600 660"
      className={className}
      role="img"
      aria-label="Line drawing of a watch"
    >
      <WatchGraphic active={active} />
    </svg>
  );
}
