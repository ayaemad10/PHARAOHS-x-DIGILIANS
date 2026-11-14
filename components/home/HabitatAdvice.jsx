"use client";

import { useState } from "react";
import Link from "next/link";
import Provenance from "@/components/shared/Provenance";

/** Recommendations by habitat, each with the tests behind it and what it must not be used for. */
const TABS = [
  { id: "station", label: "Space station", air: "21% O₂ · 1 atm" },
  { id: "moon", label: "Moon Base", air: "30%+ O₂ · 0.7 atm" },
  { id: "rover", label: "Pressurized rover", air: "30%+ O₂ · 0.7 atm, small cabin" },
  { id: "mars", label: "Mars base", air: "no evidence yet" },
];

export default function HabitatAdvice({ advice }) {
  const [h, setH] = useState("station");
  const items = advice[h] || [];
  const tab = TABS.find((t) => t.id === h);
  return (
    <section className="ad" aria-labelledby="ad-title">
      <header className="ad-head">
        <div>
          <p className="fx-label">Recommendations · by habitat</p>
          <h2 id="ad-title">What the tests say to do in a {tab.label.toLowerCase()}</h2>
          <p className="ad-air">{tab.air}</p>
        </div>
        <div className="ad-tabs" role="tablist" aria-label="Habitat">
          {TABS.map((t) => <button key={t.id} type="button" role="tab" aria-selected={h === t.id} onClick={() => setH(t.id)}>{t.label}</button>)}
        </div>
      </header>
      {items.length ? (
        <ol className="ad-list" key={h}>
          {items.map((a, i) => (
            <li key={a.title} style={{ "--i": i }}>
              <span className="ad-topic">{a.topic}</span>
              <div>
                <h3>{a.title}</h3>
                <p>{a.text}</p>
                <p className="ad-meta">
                  <Provenance kind="observed">{a.level} · {a.n}</Provenance>
                  <span className="ad-not">Not for: {a.notFor}</span>
                  <Link href={a.href}>Check the evidence →</Link>
                </p>
              </div>
            </li>
          ))}
        </ol>
      ) : (
        <p className="ad-empty">No test in this dataset was run at Mars gravity (0.38 g) or in a Mars-habitat atmosphere, so there is nothing to recommend yet. This is the largest gap the data leaves open.</p>
      )}
    </section>
  );
}

export function EarthUses({ uses }) {
  return (
    <section className="ad" aria-labelledby="eu-title">
      <header className="ad-head">
        <div>
          <p className="fx-label">Back on Earth</p>
          <h2 id="eu-title">Where the same evidence is used on the ground</h2>
        </div>
      </header>
      <ul className="eu-grid">
        {uses.map((u) => (
          <li key={u.title}>
            <h3>{u.title}</h3>
            <p>{u.text}</p>
            <p className="ad-meta"><span className="eu-ev">{u.evidence}</span><Link href={u.href}>See the records →</Link></p>
          </li>
        ))}
      </ul>
    </section>
  );
}
