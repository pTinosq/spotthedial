import Link from "next/link";

const TABS = [
  { id: "solo", label: "Solo", href: "/quiz" },
  { id: "versus", label: "Multiplayer", href: "/versus" },
] as const;

/** Segmented switch between the solo (`/quiz`) and multiplayer (`/versus`) game
 *  entry screens. Pure links — no client state — so it works in both the
 *  server-rendered solo page and the client versus page. */
export function GamesToggle({ active }: { active: "solo" | "versus" }) {
  return (
    <div role="tablist" aria-label="Game type" className="grid grid-cols-2 border border-rule">
      {TABS.map((tab, i) => {
        const on = tab.id === active;
        return (
          <Link
            key={tab.id}
            href={tab.href}
            role="tab"
            aria-selected={on}
            className={`px-4 py-3 text-center font-serif text-lg tracking-tight transition-colors duration-150 ${
              i > 0 ? "border-l border-rule" : ""
            } ${on ? "bg-foreground text-background" : "text-foreground hover:bg-foreground/5"}`}
          >
            {tab.label}
          </Link>
        );
      })}
    </div>
  );
}
