"use client";

import { useState } from "react";

const PALETTE = ["#E3B341", "#33C7B8", "#5B83FF", "#FF8A3D", "#C77DFF", "#7BD389", "#FF6B8A", "#8FB3FF", "#D9A066", "#4FD1E8", "#B5E36B", "#F28FD0", "#A08CFF", "#E86A4F", "#6FE3B5", "#C9B27A", "#9AA4B5"];

/**
 * Coverage by programme as a waffle: one square per record, so a share of the whole is something you
 * see rather than read off an axis. Hover or tap a programme to light only its records.
 */
export default function CoverageWaffle({ programs, sampleSize }) {
  const [hot, setHot] = useState(null);
  const sorted = [...programs].sort((a, b) => b.count - a.count);
  const color = Object.fromEntries(sorted.map((p, i) => [p.program, PALETTE[i % PALETTE.length]]));
  const cells = sorted.flatMap((p) => Array.from({ length: p.count }, () => p.program));
  const top = sorted[0];
  return (
    <section className="fx-panel flex flex-col gap-4 p-5" aria-labelledby="cov-title">
      <div>
        <p className="fx-label">Dataset</p>
        <h2 id="cov-title" className="font-display text-lg font-semibold text-ink">Coverage by research programme</h2>
        <p className="mt-1 text-sm text-ink-muted">{sampleSize} records from measured and published sources, across {programs.length} programmes.</p>
      </div>
      <div className="fx-waffle" role="img" aria-label={sorted.map((p) => `${p.program} ${p.count}`).join(", ")}>
        {cells.map((p, i) => (
          <i key={i} style={{ background: color[p], opacity: hot && hot !== p ? 0.12 : 1, animationDelay: `${i * 3}ms` }} />
        ))}
      </div>
      <ul className="flex flex-wrap gap-1.5">
        {sorted.map((p) => (
          <li key={p.program}>
            <button type="button" className="fx-waffle-key" aria-pressed={hot === p.program}
              onMouseEnter={() => setHot(p.program)} onMouseLeave={() => setHot(null)} onFocus={() => setHot(p.program)} onBlur={() => setHot(null)}
              onClick={() => setHot((h) => (h === p.program ? null : p.program))}>
              <i style={{ background: color[p.program] }} />{p.program}<span className="fx-numeric">{p.count}</span>
            </button>
          </li>
        ))}
      </ul>
      {top ? (
        <p className="text-[11px] leading-relaxed text-ink-faint">
          {top.program} carries the largest share: {top.count} of {sampleSize} records. Each record keeps its programme, so evidence can be compared by facility and scale rather than treated as one dataset.
        </p>
      ) : null}
    </section>
  );
}
