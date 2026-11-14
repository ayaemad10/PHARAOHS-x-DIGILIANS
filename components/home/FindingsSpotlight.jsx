"use client";

import { useEffect, useState } from "react";

/** Findings with their source, one at a time in a spotlight that advances on its own. Every finding stays one click away in the numbered strip. */
export default function FindingsSpotlight({ findings }) {
  const [i, setI] = useState(0);
  const [paused, setPaused] = useState(false);
  useEffect(() => {
    if (paused || findings.length < 2) return;
    if (window.matchMedia?.("(prefers-reduced-motion: reduce)").matches) return;
    const id = setTimeout(() => setI((x) => (x + 1) % findings.length), 7000);
    return () => clearTimeout(id);
  }, [i, paused, findings.length]);
  const f = findings[i];
  if (!f) return null;
  return (
    <section className="fx-panel flex flex-col gap-4 p-5" aria-labelledby="find-title" onMouseEnter={() => setPaused(true)} onMouseLeave={() => setPaused(false)}>
      <div>
        <p className="fx-label">Observed in sources</p>
        <h2 id="find-title" className="font-display text-lg font-semibold text-ink">Findings with their source</h2>
      </div>
      <figure key={f.id} className="fx-quote" aria-live="polite">
        <blockquote className="text-lg leading-relaxed text-ink">{f.quote ? `“${f.quote}”` : f.note}</blockquote>
        <figcaption className="fx-numeric mt-3 text-xs text-ink-faint">Source {f.sourceId}{f.page ? `, p. ${f.page}` : ""}</figcaption>
        {!paused ? <span className="fx-quote-timer" /> : null}
      </figure>
      <div className="mt-auto flex flex-wrap gap-1.5" role="tablist" aria-label="Choose a finding">
        {findings.map((x, k) => (
          <button key={x.id} role="tab" aria-selected={k === i} onClick={() => setI(k)} className="fx-quote-tab fx-numeric">{String(k + 1).padStart(2, "0")}</button>
        ))}
      </div>
    </section>
  );
}
