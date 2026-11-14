"use client";

import { useState } from "react";
import Link from "next/link";
import Provenance from "@/components/shared/Provenance";

/**
 * Programme against programme: where each ran, on what hardware, over what range of air, and how
 * its tests ended. Up to three at a time; ACME, FLEX and BASS are shown first because they cover
 * gas, liquid and solid fuels.
 */
const ROWS = [
  ["Records", (p) => <b>{p.records.toLocaleString("en-US")}</b>],
  ["Source", (p) => p.psi],
  ["Where it ran", (p) => p.where],
  ["Hardware", (p) => p.hardware],
  ["Fuel or material", (p) => (p.fuels.length ? <>{p.fuels.map(([f, n]) => <span key={f} className="pc-chip">{f} <i>{n}</i></span>)}{p.fuelKinds > p.fuels.length ? <span className="pc-dim"> +{p.fuelKinds - p.fuels.length} more</span> : null}</> : "Not recorded")],
  ["Oxygen", (p) => <Rng r={p.oxygen} total={p.records} />],
  ["Pressure", (p) => <Rng r={p.pressure} total={p.records} />],
  ["Air flow", (p) => <Rng r={p.flow} total={p.records} />],
  ["Gravity", (p) => p.gravity.join(" · ") || "Not recorded"],
  ["Sensors and measurements", (p) => p.sensors],
  ["How the tests ended", (p) => p.outcomes.map(([o, n]) => <span key={o} className="pc-out"><b>{n}</b> {o}</span>)],
  ["Fire-safety question", (p) => p.use],
];

function Rng({ r, total }) {
  if (!r.n) return <span className="pc-dim">Not recorded</span>;
  return <>{r.text}{r.n < total ? <span className="pc-dim"> · {r.n} of {total} records</span> : null}</>;
}

export default function ProgrammeCompare({ programmes }) {
  const [picked, setPicked] = useState(["ACME", "FLEX", "BASS"].filter((id) => programmes.some((p) => p.id === id)));
  const toggle = (id) => setPicked((cur) => (cur.includes(id) ? (cur.length > 1 ? cur.filter((x) => x !== id) : cur) : cur.length >= 3 ? [...cur.slice(1), id] : [...cur, id]));
  const cols = picked.map((id) => programmes.find((p) => p.id === id)).filter(Boolean);

  return (
    <section className="pc fx-panel" aria-labelledby="pc-title">
      <header className="pc-head">
        <div>
          <p className="fx-label">Programme comparison</p>
          <h2 id="pc-title">Which investigation answers which question</h2>
          <p className="pc-lede">Pick up to three. Ranges, fuels and outcomes are counted from the catalog; hardware and sensors are from the PSI dataset pages.</p>
        </div>
        <div className="pc-picks" role="group" aria-label="Programmes to compare">
          {programmes.map((p) => (
            <button key={p.id} type="button" aria-pressed={picked.includes(p.id)} onClick={() => toggle(p.id)}>
              {p.id} <i>{p.records}</i>
            </button>
          ))}
        </div>
      </header>

      <div className="pc-scroll">
        <table className="pc-table" style={{ "--pc-cols": cols.length }}>
          <thead>
            <tr><th scope="col"><span className="sr-only">Field</span></th>{cols.map((p) => <th key={p.id} scope="col">{p.id}</th>)}</tr>
          </thead>
          <tbody>
            {ROWS.map(([label, f]) => (
              <tr key={label}><th scope="row">{label}</th>{cols.map((p) => <td key={p.id}>{f(p)}</td>)}</tr>
            ))}
          </tbody>
        </table>
      </div>
      <footer className="pc-foot">
        <Provenance kind="observed">Counts from the catalog</Provenance>
        <Link href="/explore" className="pc-link">Open these records in Explore →</Link>
      </footer>
    </section>
  );
}
