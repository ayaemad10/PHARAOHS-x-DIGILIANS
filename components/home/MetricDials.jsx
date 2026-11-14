"use client";

import { useEffect, useState } from "react";

/**
 * The six dataset numbers as instrument dials. Same figures, labels and notes as the old metric
 * strip; the ring is not decoration — each one is segmented by what the number is made of
 * (high-severity problems, missions without records, the nine recorded variables).
 */
function useCountUp(target, ms = 1100) {
  const [v, setV] = useState(0);
  useEffect(() => {
    if (typeof window === "undefined") return;
    let raf = 0;
    if (window.matchMedia?.("(prefers-reduced-motion: reduce)").matches) { raf = requestAnimationFrame(() => setV(target)); return () => cancelAnimationFrame(raf); } const t0 = performance.now();
    const step = (now) => { const p = Math.min(1, (now - t0) / ms); setV(Math.round(target * (1 - Math.pow(1 - p, 3)))); if (p < 1) raf = requestAnimationFrame(step); };
    raf = requestAnimationFrame(step);
    return () => cancelAnimationFrame(raf);
  }, [target, ms]);
  return v;
}

function Ring({ segments, size = 92 }) {
  // segments: [{ n, color }] drawn as equal ticks around the ring
  const total = segments.reduce((a, s) => a + s.n, 0) || 1;
  const r = size / 2 - 7, C = 2 * Math.PI * r, gap = total > 40 ? 0 : 3;
  const arcs = [];
  let offset = 0;
  segments.forEach((s, si) => {
    const count = total > 40 ? 1 : s.n;
    for (let i = 0; i < count; i++) {
      const len = total > 40 ? (s.n / total) * C : C / total;
      arcs.push({ key: `${si}-${i}`, color: s.color, len, offset });
      offset += len;
    }
  });
  return (
    <svg viewBox={`0 0 ${size} ${size}`} width={size} height={size} aria-hidden="true" className="fx-dial-ring">
      <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="var(--fx-line)" strokeWidth="6" />
      {arcs.map((a) => (
        <circle
          key={a.key}
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          stroke={a.color}
          strokeWidth="6"
          strokeDasharray={`${Math.max(0, a.len - gap)} ${C}`}
          strokeDashoffset={-a.offset}
          transform={`rotate(-90 ${size / 2} ${size / 2})`}
          className="fx-dial-seg"
          style={{ animationDelay: `${(a.offset / C) * 900}ms` }}
        />
      ))}
    </svg>
  );
}

function Dial({ label, value, unit, hint, segments, index }) {
  const shown = useCountUp(value);
  return (
    <div className="fx-dial" title={hint}>
      <div className="relative grid place-items-center">
        <Ring segments={segments} />
        <span className="fx-numeric absolute text-2xl font-bold text-ink">{shown}</span>
      </div>
      <div className="min-w-0 text-center">
        <p className="fx-label">{label}</p>
        <p className="mt-0.5 text-[11px] leading-snug text-ink-faint">{unit}</p>
      </div>
      <span className="fx-dial-no fx-numeric" aria-hidden="true">{String(index + 1).padStart(2, "0")}</span>
    </div>
  );
}

export default function MetricDials({ dataset }) {
  const gold = "var(--fx-gold)", turq = "var(--fx-signal)", alert = "var(--fx-alert)", dim = "var(--fx-ink-disabled)";
  const without = dataset.missions - dataset.missionsWithRecords;
  const metrics = [
    { id: "records", label: "Experiments", value: dataset.records, unit: "records loaded", segments: [{ n: dataset.records, color: gold }] },
    { id: "problems", label: "Problems", value: dataset.problems, unit: `${dataset.problemsHigh} high severity`, hint: "Open research gaps — questions this dataset cannot currently answer",
      segments: [{ n: dataset.problemsHigh, color: alert }, { n: dataset.problems - dataset.problemsHigh, color: gold }] },
    { id: "sources", label: "Sources", value: dataset.sources, unit: "listed by the authors", segments: [{ n: dataset.sources, color: turq }] },
    { id: "findings", label: "Findings", value: dataset.findings, unit: "across all records", segments: [{ n: dataset.findings, color: turq }] },
    { id: "missions", label: "Missions", value: dataset.missions, unit: `${without} without records`, hint: "Destinations modelled, and how many have no experimental data at their gravity",
      segments: [{ n: dataset.missionsWithRecords, color: gold }, { n: without, color: dim }] },
    { id: "variables", label: "Variables", value: dataset.variablesPerRecord, unit: "recorded per record", segments: [{ n: dataset.variablesPerRecord, color: gold }] },
  ];
  const ev = dataset.evidence || {};
  return (
    <section aria-labelledby="dials-title" className="space-y-3">
      <h2 id="dials-title" className="sr-only">Dataset scale and open problems</h2>
      <div className="fx-dials">
        {metrics.map((m, i) => <Dial key={m.id} {...m} index={i} />)}
      </div>
      <p className="fx-telemetry flex flex-wrap items-center justify-center gap-x-3 gap-y-1 text-ink-muted">
        <span className="fx-telemetry-label">Evidence</span>
        {ev.High != null ? <span className="fx-numeric font-bold text-ink">{ev.High}</span> : null}<span className="fx-telemetry-label">High</span>
        {ev.Medium != null ? <span className="fx-numeric font-bold text-ink">{ev.Medium}</span> : null}<span className="fx-telemetry-label">Medium</span>
        {ev.Limited != null ? <span className="fx-numeric font-bold text-ink">{ev.Limited}</span> : null}<span className="fx-telemetry-label">Limited</span>
      </p>
    </section>
  );
}
