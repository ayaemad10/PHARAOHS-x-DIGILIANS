"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import {
  CartesianGrid,
  Legend,
  Line,
  LineChart,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

/*
 * Real measured data only. Every value shown comes from /public/data/saffire, produced by
 * export.py from the SAFFIRE-III sensor workbooks and the S1C1 / S2C2 JPEG image sets.
 */

const SAMPLES = {
  sample1: { label: "Sample 1", direction: "Concurrent flow", file: "sensors_sample1.json", cam: "camera_sample1_S1C1.json" },
  sample2: { label: "Sample 2", direction: "Opposed flow", file: "sensors_sample2.json", cam: "camera_sample2_S2C2.json" },
};

const SPEEDS = [1, 5];

function avg(obj, keys, i) {
  let s = 0, n = 0;
  for (const k of keys) {
    const v = obj[k]?.[i];
    if (typeof v === "number" && !Number.isNaN(v)) { s += v; n++; }
  }
  return n ? s / n : null;
}
function max(obj, keys, i) {
  let m = null;
  for (const k of keys) {
    const v = obj[k]?.[i];
    if (typeof v === "number" && (m === null || v > m)) m = v;
  }
  return m;
}
const HEAT = ["Sample Temp 1 (TC7)", "Sample Temp 2 (TC8)", "Sample Temp 3 (TC9)", "Sample Temp 4 (TC10)", "Sample Temp 5 (TC11)", "Sample Temp 6 (TC12)"];
const PLUME = ["Plume Temp 1 (TC1)", "Plume Temp 2 (TC2)", "Plume Temp 3 (TC3)", "Plume Temp 4 (TC4)", "Plume Temp 5 (TC5)", "Plume Temp 6 (TC6)"];
const RAD = ["Radiometer 1", "Radiometer 2", "Radiometer 3", "Radiometer 4"];

function Panel({ title, children, aside }) {
  return (
    <section className="rounded-md border p-4" style={{ background: "var(--fx-panel)", borderColor: "var(--fx-line)" }}>
      <header className="mb-3 flex items-center justify-between gap-3">
        <h2 className="text-sm font-medium" style={{ color: "var(--fx-ink)" }}>{title}</h2>
        {aside}
      </header>
      {children}
    </section>
  );
}

function Readout({ label, value, unit, tone }) {
  return (
    <div className="rounded border p-3" style={{ borderColor: "var(--fx-line)" }}>
      <div className="text-xs" style={{ color: "var(--fx-ink-faint)" }}>{label}</div>
      <div className="font-mono text-lg" style={{ color: tone ?? "var(--fx-ink)" }}>
        {value === null || value === undefined ? "—" : value}
        {value !== null && value !== undefined && unit ? <span className="ml-1 text-xs">{unit}</span> : null}
      </div>
    </div>
  );
}

export default function SaffireLab() {
  const [sampleKey, setSampleKey] = useState("sample1");
  const [sensors, setSensors] = useState({});
  const [camera, setCamera] = useState({});
  const [detection, setDetection] = useState(null);
  const [frames, setFrames] = useState(null);
  const [error, setError] = useState(null);
  const [cursor, setCursor] = useState(55);
  const [playing, setPlaying] = useState(false);
  const [speed, setSpeed] = useState(1);
  const [k, setK] = useState("5");
  const lastTick = useRef(null);

  useEffect(() => {
    const base = "/data/saffire/";
    Promise.all([
      fetch(base + "sensors_sample1.json").then((r) => r.json()),
      fetch(base + "sensors_sample2.json").then((r) => r.json()),
      fetch(base + "camera_sample1_S1C1.json").then((r) => r.json()),
      fetch(base + "camera_sample2_S2C2.json").then((r) => r.json()),
      fetch(base + "detection.json").then((r) => r.json()),
      fetch(base + "frames_index.json").then((r) => r.json()),
    ])
      .then(([s1, s2, c1, c2, det, fr]) => {
        setSensors({ sample1: s1, sample2: s2 });
        setCamera({ sample1: c1, sample2: c2 });
        setDetection(det);
        setFrames(fr);
      })
      .catch((e) => setError(String(e)));
  }, []);

  const data = sensors[sampleKey];
  const cam = camera[sampleKey];
  const frameList = useMemo(() => frames?.[sampleKey] ?? [], [frames, sampleKey]);
  const tEnd = data ? data.t[data.t.length - 1] : 160;

  // Playback loop: advance the cursor by real elapsed time times the speed multiplier.
  useEffect(() => {
    if (!playing) { lastTick.current = null; return; }
    let raf;
    const step = (now) => {
      if (lastTick.current !== null) {
        const dt = (now - lastTick.current) / 1000;
        setCursor((c) => {
          const next = c + dt * speed;
          return next >= tEnd ? tEnd : next;
        });
      }
      lastTick.current = now;
      raf = requestAnimationFrame(step);
    };
    raf = requestAnimationFrame(step);
    return () => cancelAnimationFrame(raf);
  }, [playing, speed, tEnd]);

  useEffect(() => { if (cursor < tEnd) return undefined; const id = requestAnimationFrame(() => setPlaying(false)); return () => cancelAnimationFrame(id); }, [cursor, tEnd]);

  const idx = useMemo(() => {
    if (!data) return 0;
    let lo = 0, hi = data.t.length - 1;
    while (lo < hi) {
      const mid = (lo + hi) >> 1;
      if (data.t[mid] < cursor) lo = mid + 1; else hi = mid;
    }
    return lo;
  }, [data, cursor]);

  const chartData = useMemo(() => {
    if (!data) return [];
    return data.t.map((t, i) => ({
      t,
      heat: avg(data, HEAT, i),
      plume: avg(data, PLUME, i),
      rad: avg(data, RAD, i),
      co2: data.co2?.[i],
    }));
  }, [data]);

  // Camera: only LED-off frames carry flame information (LED strobes are whole-frame flashes).
  const camChart = useMemo(() => {
    if (!cam) return [];
    return cam.t.map((t, i) => (cam.ledOn[i] ? null : { t, p999: cam.p999[i] })).filter(Boolean);
  }, [cam]);

  const frameNow = useMemo(() => {
    if (!frameList.length) return null;
    let best = frameList[0];
    for (const f of frameList) if (f.t <= cursor) best = f; else break;
    return best;
  }, [frameList, cursor]);

  if (error) return <p className="p-6 text-sm" style={{ color: "var(--fx-alert)" }}>Could not load data: {error}</p>;
  if (!data) return <p className="p-6 text-sm" style={{ color: "var(--fx-ink-muted)" }}>Loading measured data…</p>;

  const detK = detection?.k_options?.[k]?.[sampleKey === "sample1" ? "sample1" : "sample2"] ?? {};
  const channelRows = [
    { name: "Sample temperature (TC9)", key: "Sample Temp 3 (TC9)" },
    { name: "Radiometer 3", key: "Radiometer 3" },
    { name: "Radiometer 2", key: "Radiometer 2" },
    { name: "Radiometer 4", key: "Radiometer 4" },
    { name: "Plume temperature (TC3)", key: "Plume Temp 3 (TC3)" },
    { name: "CO₂", key: "CO2" },
    { name: "O₂", key: "O2" },
  ];
  const igniterOn = data.igniter?.[idx] > 0.5;

  return (
    <div className="mx-auto max-w-6xl space-y-6 p-6">
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-xl font-semibold" style={{ color: "var(--fx-ink)" }}>SAFFIRE-III Live Replay</h1>
          <p className="text-sm" style={{ color: "var(--fx-ink-muted)" }}>
            Measured data · SIBAL fabric · 30 cm/s · igniter at 60.0 s
          </p>
        </div>
        <div className="flex gap-2">
          {Object.entries(SAMPLES).map(([key, s]) => (
            <button
              key={key}
              onClick={() => { setSampleKey(key); setCursor(55); setPlaying(false); }}
              className="rounded border px-3 py-1.5 text-sm"
              style={{
                borderColor: sampleKey === key ? "var(--fx-brand)" : "var(--fx-line)",
                color: sampleKey === key ? "var(--fx-brand)" : "var(--fx-ink-muted)",
              }}
            >
              {s.label} · {s.direction}
            </button>
          ))}
        </div>
      </header>

      <Panel title="Replay">
        <div className="grid gap-4 md:grid-cols-[1fr_260px]">
          <div className="aspect-[4/3] overflow-hidden rounded border" style={{ borderColor: "var(--fx-line)", background: "#000" }}>
            {frameNow ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={`/data/saffire/${frameNow.file}`} alt={`Camera frame at ${frameNow.t.toFixed(1)} s`} className="h-full w-full object-contain" />
            ) : (
              <div className="flex h-full items-center justify-center text-sm" style={{ color: "var(--fx-ink-faint)" }}>
                Frames are shown from 56 s to 160 s
              </div>
            )}
          </div>
          <div className="grid grid-cols-2 gap-3 md:grid-cols-1">
            <Readout label="Time" value={cursor.toFixed(2)} unit="s" />
            <Readout label="Igniter" value={igniterOn ? "ON" : "OFF"} tone={igniterOn ? "var(--fx-ember)" : undefined} />
            <Readout label="Max sample temp" value={max(data, HEAT, idx)?.toFixed(0)} unit="°C" />
            <Readout label="Avg radiation" value={avg(data, RAD, idx)?.toFixed(1)} unit="mW/cm²" />
            <Readout label="Max plume temp" value={max(data, PLUME, idx)?.toFixed(1)} unit="°C" />
          </div>
        </div>

        <div className="mt-4 flex flex-wrap items-center gap-3">
          <button onClick={() => setPlaying((p) => !p)} className="rounded border px-3 py-1.5 text-sm" style={{ borderColor: "var(--fx-line)", color: "var(--fx-ink)" }}>
            {playing ? "Pause" : "Play"}
          </button>
          {SPEEDS.map((s) => (
            <button key={s} onClick={() => setSpeed(s)} className="rounded border px-2.5 py-1 text-xs" style={{ borderColor: speed === s ? "var(--fx-brand)" : "var(--fx-line)", color: speed === s ? "var(--fx-brand)" : "var(--fx-ink-muted)" }}>
              {s}×
            </button>
          ))}
          <input
            type="range"
            min={data.t[0]}
            max={tEnd}
            step={0.033}
            value={cursor}
            onChange={(e) => { setCursor(Number(e.target.value)); setPlaying(false); }}
            className="flex-1"
            aria-label="Time"
          />
        </div>
      </Panel>

      <Panel title="Sensor response (10 Hz, measured)">
        <div className="h-72">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={chartData}>
              <CartesianGrid stroke="var(--fx-line)" strokeDasharray="3 3" />
              <XAxis dataKey="t" type="number" domain={[0, tEnd]} tick={{ fill: "var(--fx-ink-faint)", fontSize: 11 }} />
              <YAxis yAxisId="left" tick={{ fill: "var(--fx-ink-faint)", fontSize: 11 }} />
              <YAxis yAxisId="right" orientation="right" tick={{ fill: "var(--fx-ink-faint)", fontSize: 11 }} />
              <Tooltip contentStyle={{ background: "var(--fx-panel)", border: "1px solid var(--fx-line)" }} />
              <Legend />
              <ReferenceLine x={60} yAxisId="left" stroke="var(--fx-ember)" strokeDasharray="4 4" label={{ value: "igniter", fill: "var(--fx-ember)", fontSize: 11 }} />
              <ReferenceLine x={cursor} yAxisId="left" stroke="var(--fx-brand)" />
              <Line yAxisId="left" type="monotone" dataKey="heat" name="Sample temp avg (°C)" stroke="var(--fx-ember)" dot={false} isAnimationActive={false} />
              <Line yAxisId="left" type="monotone" dataKey="plume" name="Plume temp avg (°C)" stroke="var(--fx-signal)" dot={false} isAnimationActive={false} />
              <Line yAxisId="right" type="monotone" dataKey="rad" name="Radiation avg (mW/cm²)" stroke="var(--fx-brand)" dot={false} isAnimationActive={false} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </Panel>

      <div className="grid gap-6 md:grid-cols-2">
        <Panel
          title="Early detection"
          aside={
            <label className="flex items-center gap-2 text-xs" style={{ color: "var(--fx-ink-muted)" }}>
              Threshold k
              <select value={k} onChange={(e) => setK(e.target.value)} className="rounded border bg-transparent px-2 py-1" style={{ borderColor: "var(--fx-line)" }}>
                {Object.keys(detection.k_options).map((kk) => <option key={kk} value={kk}>{kk} σ</option>)}
              </select>
            </label>
          }
        >
          <p className="mb-3 text-xs" style={{ color: "var(--fx-ink-faint)" }}>
            Threshold = baseline mean + k·σ over 5–55 s, confirmed on 3 consecutive samples. Latency = time after igniter (60.0 s).
          </p>
          <table className="w-full text-sm">
            <thead>
              <tr style={{ color: "var(--fx-ink-faint)" }}>
                <th className="py-1 text-left font-normal">Channel</th>
                <th className="py-1 text-right font-normal">Latency (s)</th>
              </tr>
            </thead>
            <tbody>
              {channelRows.map((r) => (
                <tr key={r.key} className="border-t" style={{ borderColor: "var(--fx-line)" }}>
                  <td className="py-1.5">{r.name}</td>
                  <td className="py-1.5 text-right font-mono">{detK[r.key] ?? "none"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </Panel>

        <Panel title="Camera flame brightness (LED-off frames only)">
          <div className="h-60">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={camChart}>
                <CartesianGrid stroke="var(--fx-line)" strokeDasharray="3 3" />
                <XAxis dataKey="t" type="number" domain={[55, 160]} tick={{ fill: "var(--fx-ink-faint)", fontSize: 11 }} />
                <YAxis tick={{ fill: "var(--fx-ink-faint)", fontSize: 11 }} />
                <Tooltip contentStyle={{ background: "var(--fx-panel)", border: "1px solid var(--fx-line)" }} />
                <ReferenceLine x={60} stroke="var(--fx-ember)" strokeDasharray="4 4" />
                <ReferenceLine x={cursor} stroke="var(--fx-brand)" />
                <Line type="monotone" dataKey="p999" name="Bright-pixel level" stroke="var(--fx-ember)" dot={false} isAnimationActive={false} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </Panel>
      </div>

      <Panel title="Samples side by side (sample temperature avg)">
        <div className="h-60">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={sensorsCompare(sensors)}>
              <CartesianGrid stroke="var(--fx-line)" strokeDasharray="3 3" />
              <XAxis dataKey="t" type="number" domain={[55, 160]} tick={{ fill: "var(--fx-ink-faint)", fontSize: 11 }} />
              <YAxis tick={{ fill: "var(--fx-ink-faint)", fontSize: 11 }} />
              <Tooltip contentStyle={{ background: "var(--fx-panel)", border: "1px solid var(--fx-line)" }} />
              <Legend />
              <ReferenceLine x={60} stroke="var(--fx-ember)" strokeDasharray="4 4" />
              <Line type="monotone" dataKey="s1" name="Sample 1 (concurrent)" stroke="var(--fx-ember)" dot={false} isAnimationActive={false} />
              <Line type="monotone" dataKey="s2" name="Sample 2 (opposed)" stroke="var(--fx-brand)" dot={false} isAnimationActive={false} />
            </LineChart>
          </ResponsiveContainer>
        </div>
        <p className="mt-3 text-xs" style={{ color: "var(--fx-ink-faint)" }}>
          Sample 2 flame appeared on the ignition edge at about 61 s but did not spread; sample thermocouples stayed near 14 °C.
        </p>
      </Panel>
    </div>
  );
}

function sensorsCompare(sensors) {
  const a = sensors.sample1, b = sensors.sample2;
  if (!a || !b) return [];
  const out = [];
  for (let i = 0; i < a.t.length; i++) {
    const t = a.t[i];
    if (t < 55 || t > 160) continue;
    out.push({ t, s1: avg(a, HEAT, i) });
  }
  // Sample 2 sampled on its own clock; align by nearest time.
  let j = 0;
  for (const row of out) {
    while (j < b.t.length - 1 && b.t[j] < row.t) j++;
    row.s2 = avg(b, HEAT, j);
  }
  return out;
}
