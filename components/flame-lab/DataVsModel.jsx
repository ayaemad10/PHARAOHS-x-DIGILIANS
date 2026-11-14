"use client";

import { useMemo, useState } from "react";
import Provenance from "@/components/shared/Provenance";

/**
 * "What the data says": for a droplet flame in the chosen air, how often the FLEX tests actually
 * went out, next to what the descriptive model fitted on those same tests gives. The model does
 * not beat always guessing "extinction", and the panel says so; it is shown so the reader can see
 * how far a fitted curve sits from the counted tests.
 */
const FUELS = [{ id: 0, label: "Methanol" }, { id: 1, label: "Heptane" }];
const GASES = [{ id: "none", label: "Air only" }, { id: "co2", label: "+ CO₂" }, { id: "he", label: "+ Helium" }];
const PRESS = [{ id: 760, label: "1 atm · station air" }, { id: 527, label: "0.7 atm · Moon Base air" }];
const DIL = 0.2; // added-gas fraction used for the model curve (median in the table: CO₂ 0.20, He 0.25)
const D0 = 3; // droplet diameter, mm (median 3.02)
const O2 = [12, 36];

const gasOf = (r) => (r[4] > 0 ? "he" : r[3] > 0 ? "co2" : "none");

export default function DataVsModel({ rows, model }) {
  const [o2, setO2] = useState(21);
  const [fuel, setFuel] = useState(0);
  const [gas, setGas] = useState("none");
  const [press, setPress] = useState(760);

  const prob = (x) => {
    const c = model.coef, co2 = gas === "co2" ? DIL : 0, he = gas === "he" ? DIL : 0;
    const z = model.intercept + c.o2_frac * x + c.pressure_mmhg * press + c.d0_mm * D0 + c.n2_frac * (1 - x - co2 - he) + c.he_frac * he + c.co2_frac * co2 + c.fuel_heptane * fuel;
    return 1 / (1 + Math.exp(-z));
  };

  const same = useMemo(() => rows.filter((r) => r[0] === fuel && gasOf(r) === gas && Math.abs(r[2] - press) < 120), [rows, fuel, gas, press]);
  const near = same.filter((r) => Math.abs(r[1] * 100 - o2) <= 2);
  const ext = near.filter((r) => r[5] === "E").length, comp = near.filter((r) => r[5] === "C").length, dis = near.filter((r) => r[5] === "D").length;
  const clean = ext + comp;
  const share = clean ? ext / clean : null;
  const p = prob(o2 / 100);
  const allO2 = same.map((r) => r[1] * 100);
  const covered = allO2.length ? [Math.min(...allO2), Math.max(...allO2)] : null;
  const outside = !covered || o2 < covered[0] - 2 || o2 > covered[1] + 2;

  /* chart: dots = counted share per 2-point oxygen bin, line = model */
  const W = 900, H = 250, L = 40, R = 12, T = 12, B = 28;
  const X = (v) => L + ((v - O2[0]) / (O2[1] - O2[0])) * (W - L - R), Y = (v) => T + (1 - v) * (H - T - B);
  const bins = useMemo(() => {
    const m = new Map();
    same.filter((r) => r[5] !== "D").forEach((r) => { const k = Math.round((r[1] * 100) / 2) * 2; const b = m.get(k) || [0, 0]; b[0] += r[5] === "E" ? 1 : 0; b[1] += 1; m.set(k, b); });
    return [...m.entries()].sort((a, b) => a[0] - b[0]);
  }, [same]);
  const curve = Array.from({ length: 49 }, (_, i) => O2[0] + (i / 48) * (O2[1] - O2[0])).map((v) => `${X(v).toFixed(1)},${Y(prob(v / 100)).toFixed(1)}`).join(" ");
  const pct = (v) => `${Math.round(v * 100)}%`;
  const m = model.metrics;

  return (
    <section className="dvm fx-panel" aria-labelledby="dvm-title">
      <header className="dvm-head">
        <div>
          <p className="fx-label">What the data says · FLEX droplet tests (PSI-69)</p>
          <h2 id="dvm-title">Does a fuel-droplet flame go out in this air?</h2>
        </div>
        <span className="dvm-provs"><Provenance kind="observed">Counted tests</Provenance><Provenance kind="model">Model curve</Provenance></span>
      </header>

      <div className="dvm-controls">
        <label className="dvm-o2"><span>Oxygen <b>{o2}%</b></span>
          <input type="range" min={O2[0]} max={O2[1] - 1} step={1} value={o2} onChange={(e) => setO2(+e.target.value)} aria-label="Oxygen percent" />
        </label>
        <Seg label="Fuel" items={FUELS} value={fuel} onChange={setFuel} />
        <Seg label="Added gas" items={GASES} value={gas} onChange={setGas} />
        <Seg label="Pressure" items={PRESS} value={press} onChange={setPress} />
      </div>

      <div className="dvm-body">
        <div className="dvm-nums">
          <div className="dvm-num" data-kind="observed">
            <span>Measured, {o2 - 2}–{o2 + 2}% O₂</span>
            <b>{share == null ? "—" : pct(share)}</b>
            <small>{clean ? `${ext} of ${clean} tests went out` : "no clean test in this range"}{dis ? ` · ${dis} more broke up` : ""}</small>
          </div>
          <div className="dvm-num" data-kind="model">
            <span>Model probability</span>
            <b>{outside ? "—" : pct(p)}</b>
            <small>{outside ? "outside the tested range: no estimate" : `${FUELS[fuel].label}, ${D0} mm droplet${gas !== "none" ? `, ${DIL * 100}% ${gas === "co2" ? "CO₂" : "helium"}` : ""}`}</small>
          </div>
          {clean > 0 && clean < 5 ? <p className="dvm-warn">Only {clean} test{clean > 1 ? "s" : ""} here. Treat the measured share as an anecdote.</p> : null}
        </div>

        <figure className="dvm-chart">
          <svg viewBox={`0 0 ${W} ${H}`} role="img" aria-label={`Extinction share by oxygen for ${FUELS[fuel].label}, ${GASES[gas === "none" ? 0 : gas === "co2" ? 1 : 2].label}: ${bins.map(([k, [e, n]]) => `${k}%: ${e} of ${n}`).join("; ") || "no tests"}`}>
            {[0, 0.5, 1].map((v) => <g key={v}><line x1={L} x2={W - R} y1={Y(v)} y2={Y(v)} className="dvm-grid" /><text x={L - 6} y={Y(v) + 3.5} textAnchor="end">{v * 100}%</text></g>)}
            {[12, 16, 20, 24, 28, 32, 36].map((v) => <text key={v} x={X(v)} y={H - 8} textAnchor="middle">{v}</text>)}
            {covered ? <rect x={X(Math.max(O2[0], covered[0] - 1))} width={Math.max(0, X(Math.min(O2[1], covered[1] + 1)) - X(Math.max(O2[0], covered[0] - 1)))} y={T} height={H - T - B} className="dvm-cover" /> : null}
            <polyline points={curve} className="dvm-curve" />
            {bins.map(([k, [e, n]]) => <circle key={k} cx={X(k)} cy={Y(e / n)} r={3 + Math.sqrt(n) * 1.3} className="dvm-dot"><title>{`${k}% O₂: ${e} of ${n} went out`}</title></circle>)}
            <line x1={X(o2)} x2={X(o2)} y1={T} y2={H - B} className="dvm-now" />
          </svg>
          <figcaption><i className="k-dot" /> share of tests that went out (bigger = more tests) <i className="k-line" /> model <i className="k-band" /> oxygen range tested · x: oxygen (%)</figcaption>
        </figure>
      </div>

      <p className="dvm-verdict">
        <b>The model does not beat a simple guess.</b> Cross-validated accuracy {m.model_cv_accuracy_mean.toFixed(3)} against {m.baseline_cv_accuracy_mean.toFixed(3)} for always answering &ldquo;it goes out&rdquo; ({m.n_extinction} of {m.n_train} clean tests did). Trust the counted share; the curve only shows the direction (more oxygen, fewer flames go out; heptane burns to the end more often than methanol). It describes this test campaign, not flames in a real cabin.
      </p>
    </section>
  );
}

function Seg({ label, items, value, onChange }) {
  return (
    <div className="dvm-seg" role="group" aria-label={label}>
      <span>{label}</span>
      <div>{items.map((it) => <button key={it.id} type="button" aria-pressed={value === it.id} onClick={() => onChange(it.id)}>{it.label}</button>)}</div>
    </div>
  );
}
