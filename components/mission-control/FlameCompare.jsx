"use client";

import { useEffect, useRef, useState } from "react";
import Provenance from "@/components/shared/Provenance";

/**
 * Stage 02: the same flame on Earth and in microgravity, side by side. The airflow buttons swap
 * in the published finding for that flow range (quoted, with source); the oxygen slider reads the
 * measured FLEX droplet extinction share. The drawings are illustrations of those findings — they
 * are labelled as such and are not a combustion model.
 */
const FLOW = [
  { id: "still", label: "< 1 cm/s", ids: ["dim-blue-low-flow", "flames-survive-below-1"], look: { size: 0.55, blue: 1, lean: 0, bright: 0.45, flicker: 0.02 } },
  { id: "quench", label: "1–5 cm/s", ids: ["sibal-quench-speeds", "low-flow-sensitivity"], look: { size: 0.6, blue: 0.75, lean: 0.25, bright: 0.55, flicker: 0.12 } },
  { id: "mid", label: "5–10 cm/s", ids: ["sibal-10-vs-5", "sibal-spread-trends"], look: { size: 0.85, blue: 0.45, lean: 0.6, bright: 0.8, flicker: 0.05 } },
  { id: "fast", label: "20–30 cm/s (SAFFIRE-III)", ids: ["saffire-steady-wide-flame"], look: { size: 1.05, blue: 0.3, lean: 1, bright: 1, flicker: 0.04 } },
];

function draw(c, kind, look, time, reduced) {
  const r = c.getBoundingClientRect(), d = Math.min(window.devicePixelRatio || 1, 2);
  if (c.width !== Math.round(r.width * d)) { c.width = Math.round(r.width * d); c.height = Math.round(r.height * d); }
  const x = c.getContext("2d"), W = c.width, H = c.height, cx = W * (kind === "earth" ? 0.5 : 0.42), cy = H * 0.62;
  x.fillStyle = "#05070c"; x.fillRect(0, 0, W, H);
  x.strokeStyle = "rgba(255,255,255,.05)"; for (let i = 0; i < W; i += 24 * d) { x.beginPath(); x.moveTo(i, 0); x.lineTo(i, H); x.stroke(); }
  const t = reduced ? 0 : time;
  if (kind === "earth") {
    // buoyant plume: smoke rising to a ceiling detector
    x.fillStyle = "rgba(160,150,140,.18)";
    for (let i = 0; i < 26; i++) { const a = ((i / 26 + t * 0.25) % 1); x.beginPath(); x.arc(cx + Math.sin(i * 3.1 + t) * 10 * d * a, cy - a * H * 0.6, (4 + a * 14) * d, 0, 7); x.fill(); }
    x.fillStyle = "#3a3f4a"; x.fillRect(cx - 14 * d, 6 * d, 28 * d, 8 * d);
    x.fillStyle = "#ff5350"; x.beginPath(); x.arc(cx, 16 * d, 3 * d, 0, 7); x.fill();
    const fl = 1 + Math.sin(t * 9) * 0.06 + Math.sin(t * 17) * 0.03, Hh = H * 0.42 * fl, Ww = H * 0.08;
    const g = x.createLinearGradient(0, cy - Hh, 0, cy + 6 * d);
    g.addColorStop(0, "rgba(255,190,60,0)"); g.addColorStop(0.3, "rgba(255,160,50,.9)"); g.addColorStop(0.85, "rgba(255,235,150,1)"); g.addColorStop(1, "rgba(80,120,255,.95)");
    x.fillStyle = g; x.beginPath(); x.moveTo(cx, cy - Hh); x.bezierCurveTo(cx + Ww * 1.6, cy - Hh * 0.45, cx + Ww * 1.2, cy + 4 * d, cx, cy + 6 * d); x.bezierCurveTo(cx - Ww * 1.2, cy + 4 * d, cx - Ww * 1.6, cy - Hh * 0.45, cx, cy - Hh); x.fill();
  } else {
    // airflow streaks left → right
    x.strokeStyle = "rgba(52,213,208,.35)"; x.lineWidth = d;
    const speed = 0.2 + look.lean * 1.3;
    for (let i = 0; i < 14; i++) { const y = H * (0.15 + (i / 14) * 0.75), off = ((t * speed * 120 * d + i * 37 * d) % (W + 60 * d)) - 60 * d; x.beginPath(); x.moveTo(off, y); x.lineTo(off + (16 + look.lean * 30) * d, y); x.stroke(); }
    const R = H * 0.16 * look.size * (1 + Math.sin(t * 7) * look.flicker), lean = look.lean * R * 1.6;
    // hot gas drifts sideways with the flow, not up
    x.fillStyle = "rgba(160,150,140,.12)";
    for (let i = 0; i < 16; i++) { const a = ((i / 16 + t * 0.2 * speed) % 1); x.beginPath(); x.arc(cx + R + a * W * 0.5, cy + Math.sin(i * 2.3) * R * 0.6, (3 + a * 10) * d, 0, 7); x.fill(); }
    x.save(); x.translate(cx + lean * 0.5, cy); x.scale(1 + look.lean * 0.9, 1);
    const g = x.createRadialGradient(0, 0, R * 0.35, 0, 0, R);
    const b = look.blue, br = look.bright;
    g.addColorStop(0, "rgba(0,0,0,0)");
    g.addColorStop(0.68, `rgba(${Math.round(70 + 185 * (1 - b))},${Math.round(120 + 60 * (1 - b))},${Math.round(255 - 205 * (1 - b))},${0.25 * br})`);
    g.addColorStop(0.9, `rgba(${Math.round(120 + 135 * (1 - b))},${Math.round(170 + 40 * (1 - b))},${Math.round(255 - 175 * (1 - b))},${0.65 * br})`);
    g.addColorStop(1, "rgba(0,0,0,0)");
    x.fillStyle = g; x.beginPath(); x.arc(0, 0, R, 0, 7); x.fill(); x.restore();
    x.fillStyle = "#6b5a3a"; x.beginPath(); x.arc(cx, cy, 3 * d, 0, 7); x.fill();
    x.fillStyle = "#3a3f4a"; x.fillRect(cx - 14 * d, 6 * d, 28 * d, 8 * d);
    x.fillStyle = "#4a4458"; x.beginPath(); x.arc(cx, 16 * d, 3 * d, 0, 7); x.fill();
  }
}

export default function FlameCompare({ findings, oxygenSeries }) {
  const [flow, setFlow] = useState(0);
  const [o2, setO2] = useState(21);
  const earth = useRef(null), micro = useRef(null), lookRef = useRef(FLOW[0].look);
  useEffect(() => { lookRef.current = FLOW[flow].look; }, [flow]);
  useEffect(() => {
    const reduced = window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;
    let raf = 0; const t0 = performance.now();
    const loop = (now) => { const t = (now - t0) / 1000; if (earth.current) draw(earth.current, "earth", null, t, reduced); if (micro.current) draw(micro.current, "micro", lookRef.current, t, reduced); raf = requestAnimationFrame(loop); };
    raf = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(raf);
  }, []);
  const quotes = FLOW[flow].ids.map((id) => findings.find((f) => f.id === id)).filter(Boolean);
  const bin = oxygenSeries.reduce((best, p) => (Math.abs(p.oxygen - o2) < Math.abs(best.oxygen - o2) ? p : best), oxygenSeries[0]);

  return (
    <div className="mc-compare">
      <div className="mc-compare-views">
        <figure>
          <canvas ref={earth} aria-label="Illustration: a flame on Earth, tall and pointing up, smoke rising to a ceiling detector" />
          <figcaption><b>On Earth (1 g)</b> Hot gas is lighter, so it rises: a tall teardrop flame, smoke goes up to the ceiling detector (red light).</figcaption>
        </figure>
        <figure>
          <canvas ref={micro} aria-label="Illustration: a flame in microgravity, rounder and dimmer, gas drifting with the airflow" />
          <figcaption><b>In microgravity</b> Nothing is &ldquo;up&rdquo;. The flame becomes rounder and bluer, and hot gas only goes where the airflow carries it — the ceiling detector stays dark.</figcaption>
        </figure>
      </div>
      <p className="mc-tag"><Provenance kind="illustration">Illustration of published findings, not a combustion model</Provenance></p>

      <div className="mc-cols">
        <div className="space-y-2">
          <p className="mc-label">Cabin airflow</p>
          <div className="mc-seg wrap" role="group" aria-label="Airflow speed">
            {FLOW.map((f, i) => <button key={f.id} type="button" aria-pressed={flow === i} onClick={() => setFlow(i)}>{f.label}</button>)}
          </div>
          {quotes.map((q) => (
            <blockquote key={q.id} className="mc-quote">&ldquo;{q.quote}&rdquo;<cite>Published finding · source {q.source_id}{q.pdf_page ? `, p. ${q.pdf_page}` : ""}</cite></blockquote>
          ))}
        </div>
        <div className="space-y-2">
          <label className="mc-label" htmlFor="mc-o2">Ambient oxygen: <b>{o2}%</b></label>
          <input id="mc-o2" type="range" min={12} max={34} step={1} value={o2} onChange={(e) => setO2(+e.target.value)} className="w-full accent-[#FF9B50]" />
          <div className="mc-o2">
            <b>{bin.extinctionShare.toFixed(0)}%</b>
            <span>of the <b>{bin.tests}</b> FLEX droplet tests at <b>{bin.oxygen}% O₂</b> ended with the flame going out.</span>
          </div>
          <div className="mc-o2-bars" aria-hidden="true">
            {oxygenSeries.map((p) => <i key={p.oxygen} className={p === bin ? "on" : ""} style={{ height: `${Math.max(4, p.extinctionShare)}%` }} title={`${p.oxygen}%: ${p.extinctionShare}%`} />)}
          </div>
          <p className="mc-note"><Provenance kind="observed">Measured counts</Provenance> From the FLEX droplet table (PSI-69), binned by initial O₂. Less oxygen → more flames go out; but crews need oxygen to breathe.</p>
        </div>
      </div>
    </div>
  );
}
