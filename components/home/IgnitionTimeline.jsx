"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { Play, RotateCcw } from "lucide-react";

/**
 * SAFFIRE-III timing as a live timeline. The same six measured values as the old grid, laid on
 * the clock they happened on: a playhead sweeps the ignition window and each event lights when
 * it is reached. Two lanes, one per sample.
 */
export default function IgnitionTimeline({ saffire }) {
  const s1 = saffire.sample1, s2 = saffire.sample2, ig = saffire.igniterS;
  const T0 = ig - 3, T1 = ig + Math.max(8, s1.latencyS.sampleTemp + 3);
  const events = [
    { lane: 0, t: ig, label: "Igniter enabled", value: `${ig.toFixed(1)} s`, note: "Sensor log", kind: "ig" },
    { lane: 1, t: ig, label: "Igniter enabled", value: `${ig.toFixed(1)} s`, note: "Sensor log", kind: "ig", hideCard: true },
    { lane: 0, t: s1.cameraFlameFirstVisibleS, label: "Sample 1 flame visible", value: `${s1.cameraFlameFirstVisibleS.toFixed(2)} s`, note: "Camera S1C1, after igniter", kind: "cam" },
    { lane: 0, t: ig + s1.latencyS.radiation, label: "Sample 1 radiation first", value: `+${s1.latencyS.radiation.toFixed(2)} s`, note: "Radiometer 3, k = 5", kind: "rad" },
    { lane: 0, t: ig + s1.latencyS.sampleTemp, label: "Sample 1 sample temp first", value: `+${s1.latencyS.sampleTemp.toFixed(2)} s`, note: "TC9, k = 5", kind: "tc" },
    { lane: 1, t: s2.cameraFlameFirstVisibleS, label: "Sample 2 flame line", value: `${s2.cameraFlameFirstVisibleS.toFixed(2)} s`, note: "Ignition edge, no spread in 160 s", kind: "cam" },
  ];
  const [t, setT] = useState(T1);
  const raf = useRef(0);
  const play = () => {
    cancelAnimationFrame(raf.current);
    if (window.matchMedia?.("(prefers-reduced-motion: reduce)").matches) { raf.current = requestAnimationFrame(() => setT(T1)); return; }
    const start = performance.now(), dur = 6500;
    const step = (now) => { const p = Math.min(1, (now - start) / dur); setT(T0 + (T1 - T0) * p); if (p < 1) raf.current = requestAnimationFrame(step); };
    raf.current = requestAnimationFrame(step);
  };
  useEffect(() => {
    const id = requestAnimationFrame(() => play());
    return () => { cancelAnimationFrame(id); cancelAnimationFrame(raf.current); };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps
  const X = (v) => `${((v - T0) / (T1 - T0)) * 100}%`;
  const ticks = []; for (let v = Math.ceil(T0); v <= T1; v += 1) ticks.push(v);

  return (
    <section className="fx-ignition fx-panel p-5" aria-labelledby="ign-title">
      <header className="mb-4 flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="fx-label">Measured · SAFFIRE-III</p>
          <h2 id="ign-title" className="font-display text-lg font-semibold text-ink">Ignition, flame and sensor timing</h2>
        </div>
        <div className="flex items-center gap-2">
          <span className="fx-numeric rounded-full border border-line px-2.5 py-1 text-xs text-ink">t = {t.toFixed(2)} s</span>
          <button type="button" onClick={play} className="fx-btn fx-btn-ghost text-xs" aria-label="Replay the timeline">
            {t >= T1 ? <RotateCcw className="size-3.5" /> : <Play className="size-3.5" />} Replay
          </button>
          <Link href="/saffire" className="fx-btn fx-btn-primary text-xs">Open live replay</Link>
        </div>
      </header>

      <div className="fx-tl" role="img" aria-label="Timeline of the six measured SAFFIRE-III events">
        {["Sample 1", "Sample 2"].map((name, lane) => (
          <div key={name} className="fx-tl-lane">
            <span className="fx-tl-name">{name}</span>
            <div className="fx-tl-track">
              <div className="fx-tl-burn" style={{ left: X(ig), width: `calc(${X(Math.max(ig, Math.min(t, T1)))} - ${X(ig)})`, opacity: lane === 1 ? 0.35 : 1 }} />
              {events.filter((e) => e.lane === lane).map((e) => (
                <span key={e.label + lane} className={`fx-tl-dot fx-tl-${e.kind} ${t >= e.t ? "on" : ""}`} style={{ left: X(e.t) }} title={`${e.label}: ${e.value}`} />
              ))}
            </div>
          </div>
        ))}
        <div className="fx-tl-overlay" aria-hidden="true">
          <div className="fx-tl-axis">
            {ticks.map((v) => <span key={v} style={{ left: X(v) }}>{v}</span>)}
          </div>
          <div className="fx-tl-head" style={{ left: X(t) }} />
        </div>
      </div>

      <ol className="mt-5 grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
        {events.filter((e) => !e.hideCard).concat([{ label: "Sample 2 sample temp", value: `${s2.sampleTempMaxC.toFixed(0)} °C`, note: "Stayed near ambient", t: Infinity, kind: "tc" }]).map((e) => {
          const on = t >= e.t || e.t === Infinity;
          return (
            <li key={e.label} className={`fx-tl-card ${on ? "on" : ""}`}>
              <i className={`fx-tl-dot static fx-tl-${e.kind} on`} aria-hidden="true" />
              <div className="min-w-0">
                <p className="text-xs text-ink-faint">{e.label}</p>
                <p className="fx-numeric text-lg text-ink">{e.value}</p>
                <p className="text-xs text-ink-muted">{e.note}</p>
              </div>
            </li>
          );
        })}
      </ol>
      <p className="mt-4 text-xs text-ink-faint">
        {saffire.note} Detection baseline {saffire.baselineS[0]}–{saffire.baselineS[1]} s, threshold k = {saffire.kUsed}, {saffire.persistenceSamples} consecutive samples.
      </p>
    </section>
  );
}
