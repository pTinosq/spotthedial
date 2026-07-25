"use client";

import { useState } from "react";
import { AnatomyV1 } from "./v1";
import { AnatomyV2 } from "./v2";
import { AnatomyV3 } from "./v3";

const VERSIONS = [
  { id: "v1", label: "Connectors", note: "Hover a term, follow the line" },
  { id: "v2", label: "Plate", note: "Labelled figure, both sides" },
  { id: "v3", label: "Spotlight", note: "One term at a time" },
] as const;

type VersionId = (typeof VERSIONS)[number]["id"];

export function AnatomyClient() {
  const [version, setVersion] = useState<VersionId>("v1");
  const current = VERSIONS.find((v) => v.id === version)!;

  return (
    <div>
      <div className="mb-8 flex flex-wrap items-center gap-2 border-b border-rule pb-4">
        {VERSIONS.map((v) => {
          const on = v.id === version;
          return (
            <button
              key={v.id}
              type="button"
              onClick={() => setVersion(v.id)}
              className="border px-3 py-1.5 text-sm tracking-tight transition-colors"
              style={{
                borderColor: on ? "var(--foreground)" : "var(--rule)",
                background: on ? "var(--foreground)" : "transparent",
                color: on ? "var(--background)" : "var(--muted)",
              }}
            >
              <span className="tabular-nums opacity-60">{v.id}</span>{" "}
              <span className="font-serif">{v.label}</span>
            </button>
          );
        })}
        <span className="ml-auto text-xs text-muted">{current.note}</span>
      </div>

      {version === "v1" && <AnatomyV1 />}
      {version === "v2" && <AnatomyV2 />}
      {version === "v3" && <AnatomyV3 />}
    </div>
  );
}
