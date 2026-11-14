"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import dynamic from "next/dynamic";
import { ArrowRight, Camera, Gauge, Info, Pause, Play, RotateCcw, SkipBack, Sun, Thermometer, Volume2, VolumeX, Wind, X } from "lucide-react";
import { SENSORS, detectionAt } from "@/components/mission-control/sensors";
import FlameCompare from "@/components/mission-control/FlameCompare";
import Provenance from "@/components/shared/Provenance";
import FireResponse from "./FireResponse";
import { PRE, POST, tx } from "@/lib/response";
import { sfx } from "@/lib/sfx";
import useScrollHint from "@/lib/useScrollHint";

const IntroScene = dynamic(() => import("./IntroScene"), { ssr: false, loading: () => <div className="hs-intro-canvas is-fallback" /> });
const CabinStage = dynamic(() => import("@/components/mission-control/CabinStage"), { ssr: false, loading: () => <div className="mc-stage mc-loading">Loading the 3D cabin…</div> });

/**
 * Home, on one screen.
 *
 * The 3D cabin fills the page and never scrolls. Everything else is laid over it and swaps in
 * place: the replay of the SAFFIRE-III burn (sensors, cabin conditions, timeline) is the default
 * view; the other views open as a sheet over the same cabin. Same data, same controls and the
 * same wording as the earlier stacked Home; only the arrangement changed. The 3D model is drawn
 * once here and nowhere else on Home.
 */
const ICON = { camera: Camera, sun: Sun, thermometer: Thermometer, wind: Wind, gauge: Gauge };
const KS = [3, 4, 5, 6, 8];
const VIEWS = [
  { id: "replay", label: "Dashboard" },
  { id: "response", label: "Fire Response" },
  { id: "advice", label: "Recommendations" },
  { id: "flame", label: "Flame behaviour" },
  { id: "results", label: "Results" },
  { id: "records", label: "Records" },
  { id: "findings", label: "Findings & gaps" },
  { id: "demo", label: "Demo & media" },
];
/* Results, Records and Findings & gaps share one tab, "Evidence", so the bar fits at 1280 px. */
const EVIDENCE = ["results", "records", "findings"];
const NAV = [
  { id: "replay", label: "Dashboard" },
  { id: "response", label: "Fire Response" },
  { id: "advice", label: "Recommendations" },
  { id: "flame", label: "Flame behaviour" },
  { id: "results", label: "Evidence", group: EVIDENCE },
  { id: "demo", label: "Demo & media" },
];

/* The 0.9 MB sensor series loads only once the replay can be seen (after the opening scene). */
function useSensorSeries(sample, enabled = true) {
  const [data, setData] = useState({});
  useEffect(() => {
    let alive = true;
    if (!enabled || data[sample]) return undefined;
    Promise.all([
      fetch(`/data/saffire/sensors_${sample}.json`).then((r) => (r.ok ? r.json() : Promise.reject(new Error(r.status)))),
      fetch("/data/saffire/frames_index.json").then((r) => (r.ok ? r.json() : {})),
    ])
      .then(([s, frames]) => { if (alive) setData((d) => ({ ...d, [sample]: { s, frames: frames[sample] || [] } })); })
      .catch(() => { if (alive) setData((d) => ({ ...d, [sample]: { error: true } })); });
    return () => { alive = false; };
  }, [sample, enabled]); // eslint-disable-line react-hooks/exhaustive-deps
  return data[sample];
}
function indexAt(ts, x) { let lo = 0, hi = ts.length - 1; while (lo < hi) { const m = (lo + hi) >> 1; if (ts[m] < x) lo = m + 1; else hi = m; } return lo; }
const maxOf = (s, keys, i) => keys.reduce((m, k) => (s[k]?.[i] != null && s[k][i] > m ? s[k][i] : m), -Infinity);

function Spark({ series, ts, ig, now, detT, color }) {
  if (!series || !ts) return <span className="mc-spark-empty">image feed</span>;
  const W = 72, H = 24, a = indexAt(ts, ig - PRE), b = indexAt(ts, ig + POST);
  const step = Math.max(1, Math.floor((b - a) / 90));
  let lo = Infinity, hi = -Infinity; for (let i = a; i < b; i += step) { const v = series[i]; if (v != null) { lo = Math.min(lo, v); hi = Math.max(hi, v); } }
  const span = hi - lo || 1, pts = [];
  for (let i = a; i < b; i += step) { if (ts[i] > now) break; const v = series[i]; if (v == null) continue; pts.push(`${(tx(ts[i] - ig) / 100 * W).toFixed(1)},${(H - 2 - ((v - lo) / span) * (H - 4)).toFixed(1)}`); }
  return (
    <svg viewBox={`0 0 ${W} ${H}`} width={W} height={H} className="mc-spark" aria-hidden="true">
      <polyline points={pts.join(" ")} fill="none" stroke={color} strokeWidth="1.5" />
      {detT != null ? <line x1={tx(detT) / 100 * W} x2={tx(detT) / 100 * W} y1="0" y2={H} stroke={color} strokeDasharray="2 2" opacity=".7" /> : null}
    </svg>
  );
}

/** A view with more than one screenful: its parts swap in place instead of stacking. */
function SubViews({ items }) {
  const [i, setI] = useState(0);
  return (
    <div className="hs-sub">
      <div className="mc-seg" role="group" aria-label="Sections of this view">
        {items.map((it, n) => <button key={it.label} type="button" aria-pressed={i === n} onClick={() => setI(n)}>{it.label}</button>)}
      </div>
      <div className="hs-sub-body" key={i}>{items[i].node}</div>
    </div>
  );
}

export default function HomeStage({ initialView = null, saffire, detection, findings, oxygenSeries, meta, records, findingsAndGaps, demo, advice, recordCount, habitats }) {
  const ig = saffire.igniterS;
  const [view, setView] = useState(initialView ?? "replay");
  const [sample, setSample] = useState("sample1");
  const [k, setK] = useState(5);
  const [t, setT] = useState(ig - PRE);
  const [playing, setPlaying] = useState(false);
  const [focus, setFocus] = useState(null);
  const [pop, setPop] = useState(null); // "legend" | "about" | null
  // "on" → "flying" → "leaving" → "off". Coming back to Home from another page starts at "off".
  const [intro, setIntro] = useState(() => (initialView || (typeof window !== "undefined" && window.__fxEntered) ? "off" : "on"));
  const series = useSensorSeries(sample, intro !== "on" && intro !== "flying");
  const sheet = view !== "replay" && view !== "response";
  const viewsRef = useScrollHint(view);
  const [fx, setFx] = useState(null); // what Fire Response asks the 3D scene to show
  const [sound, setSound] = useState(true); // on by default; the browser lets it start at the first click or key press
  const [guess, setGuess] = useState(null); // the visitor's prediction: which sensor notices first
  const [guessShut, setGuessShut] = useState(false);
  const [seen, setSeen] = useState(-PRE); // furthest second the replay has reached: results are revealed as they happen

  /* the view lives in the hash so /#demo and /#results open the right one */
  useEffect(() => {
    const read = () => {
      const h = window.location.hash.slice(1);
      if (VIEWS.some((v) => v.id === h)) { setView(h); setIntro("off"); }
      // the opening scene plays once per browser session
      try { if (window.sessionStorage.getItem("fx:entered")) { window.__fxEntered = true; setIntro("off"); } } catch { /* ignore */ }
    };
    const id = requestAnimationFrame(read);
    window.addEventListener("hashchange", read);
    return () => { cancelAnimationFrame(id); window.removeEventListener("hashchange", read); };
  }, []);
  const go = (id) => { if (id !== view) sfx.swap(); if (id === "response") { setPlaying(false); setK(5); } setView(id); setFocus(null); setPop(null); try { const base = initialView ? "/" : window.location.pathname; window.history.replaceState(null, "", id === "replay" ? base : `${base}#${id}`); } catch { /* ignore */ } };

  /* the opening plays by itself: a few seconds at the window, then the camera glides in */
  const enter = useCallback(() => setIntro((v) => (v === "on" ? "flying" : v)), []);
  const arrived = useCallback(() => {
    try { window.sessionStorage.setItem("fx:entered", "1"); } catch { /* ignore */ }
    window.__fxEntered = true; document.documentElement.setAttribute("data-entered", "1");
    setIntro("leaving");
    window.setTimeout(() => { setIntro("off"); setT(ig - PRE); }, 1100);
  }, [ig]);
  // fetch the cabin code while the opening plays, so it is ready the moment the camera arrives
  useEffect(() => { import("@/components/mission-control/CabinStage").catch(() => {}); }, []);
  useEffect(() => {
    if (intro !== "on") return undefined;
    const id = window.setTimeout(enter, 4200);
    const skip = (e) => { if (e.type !== "keydown" || ["Enter", " ", "ArrowDown", "Escape"].includes(e.key)) enter(); };
    window.addEventListener("wheel", skip, { passive: true }); window.addEventListener("keydown", skip);
    return () => { window.clearTimeout(id); window.removeEventListener("wheel", skip); window.removeEventListener("keydown", skip); };
  }, [intro, enter]);

  const det = useMemo(() => detectionAt(detection, saffire, sample, k), [detection, saffire, sample, k]);
  const times = useMemo(() => Object.fromEntries(SENSORS.map((s) => [s.id, det[s.id] ? ig + det[s.id].t : null])), [det, ig]);
  const ranked = SENSORS.filter((s) => det[s.id]).sort((a, b) => det[a.id].t - det[b.id].t);
  const fastest = ranked[0], slowest = ranked[ranked.length - 1];
  const rel = t - ig;
  const detectedNow = ranked.filter((s) => rel >= det[s.id].t).length;
  const sm = meta.samples[sample];
  const sampleName = sample === "sample1" ? "Sample 1" : "Sample 2";

  /* clock */
  const raf = useRef(0);
  useEffect(() => {
    if (!playing) return undefined;
    let last = performance.now();
    const step = (now) => {
      const dt = Math.min(0.1, (now - last) / 1000); last = now;
      setT((x) => { const r = x - ig, sp = r < 10 ? 1 : 7; const nx = Math.min(ig + POST, x + dt * sp); if (nx >= ig + POST) setPlaying(false); return nx; });
      raf.current = requestAnimationFrame(step);
    };
    raf.current = requestAnimationFrame(step);
    return () => cancelAnimationFrame(raf.current);
  }, [playing, ig]);
  /* sound: the cabin hums while the replay runs; each event on the clock has its own short sound */
  const toggleSound = () => { const v = !sound; setSound(v); sfx.setOn(v); if (v) sfx.chime(); };
  useEffect(() => {
    const want = sfx.wanted(); const id = requestAnimationFrame(() => setSound(want));
    if (!want) return () => cancelAnimationFrame(id);
    const wake = () => { sfx.setOn(true); if (typeof window !== "undefined") window.__fxSfx = sfx; };
    window.addEventListener("pointerdown", wake); window.addEventListener("keydown", wake);
    return () => { cancelAnimationFrame(id); window.removeEventListener("pointerdown", wake); window.removeEventListener("keydown", wake); };
  }, []);
  useEffect(() => { sfx.hum(sound && playing && intro === "off" && !sheet, fx?.fan ?? 1); }, [sound, playing, intro, fx, sheet]);
  useEffect(() => () => sfx.hum(false), []);
  useEffect(() => { if (rel <= seen) return undefined; const id = requestAnimationFrame(() => setSeen(rel)); return () => cancelAnimationFrame(id); }, [rel, seen]);
  const prevRel = useRef(rel);
  useEffect(() => {
    const a = prevRel.current, b = rel; prevRel.current = b;
    if (!playing || b <= a || b - a > 2) return; // only while the clock is running forward
    if (Math.floor(b) > Math.floor(a) && b > 0 && b < 10) sfx.tick();
    if (a < 0 && b >= 0) sfx.ignite();
    if (view !== "replay") return;
    ranked.forEach((s) => { const d = det[s.id].t; if (a < d && b >= d) sfx.detect(s.id); });
    if (slowest && a < det[slowest.id].t && b >= det[slowest.id].t) window.setTimeout(() => sfx.allDetected(), 350);
  }, [rel]); // eslint-disable-line react-hooks/exhaustive-deps

  const play = () => { if (t >= ig + POST) setT(ig - PRE); setPlaying(true); };
  const replay = () => { setT(ig - PRE); setPlaying(true); };
  const reset = () => { setPlaying(false); setT(ig - PRE); };

  const reading = useMemo(() => {
    const s = series?.s; if (!s?.t) return null;
    const i = Math.min(s.t.length - 1, indexAt(s.t, t));
    return { o2: s.o2?.[i], co2: s.co2?.[i], flow: s.flow1?.[i], sampleT: maxOf(s, SENSORS[2].channels, i), plumeT: maxOf(s, SENSORS[3].channels, i) };
  }, [series, t]);
  const frame = useMemo(() => {
    const f = series?.frames, s = series?.s; if (!f?.length) return null;
    let i = Math.max(0, Math.min(f.length - 1, indexAt(f.map((x) => x.t), t)));
    for (let j = 0; j < 4 && s?.led && s.led[indexAt(s.t, f[i].t)] > 0.5 && i > 0; j++) i--;
    return f[i];
  }, [series, t]);

  const onPick = useCallback((id) => { if (id) setPop(null); setFocus(id); }, []);
  const fs = focus ? SENSORS.find((s) => s.id === focus) : null;
  const status = rel < 0 ? "Before ignition" : detectedNow === 0 ? "Burning · not yet detected" : detectedNow < ranked.length ? `Burning · detected by ${detectedNow} of ${ranked.length}` : `Burning · detected by all ${ranked.length}`;
  const response = view === "response";
  const allSeen = ranked.length > 0 && detectedNow === ranked.length;
  const guessed = guess ? SENSORS.find((s) => s.id === guess) : null;

  return (
    <section className={`mc hs ${sheet ? "has-sheet" : ""}`} aria-labelledby="hs-title">
      {/* the one 3D model */}

      {/* title + view switch */}
      <header className="hs-top">
        <div className="hs-title">
          <p>{response ? "Decision support on a recorded NASA burn" : "NASA experiment data · interactive replay"}</p>
          <h1 id="hs-title">{response ? "Can We Stop a Fire in Time?" : "Can We Detect a Fire in Time?"}</h1>
        </div>
        <nav ref={viewsRef} className="hs-views fx-scrollhint" aria-label="Home views">
          {NAV.map((v) => {
            const on = v.group ? v.group.includes(view) : view === v.id;
            return <button key={v.id} type="button" data-view={v.id} aria-current={on ? "true" : undefined} onClick={() => go(v.group && v.group.includes(view) ? view : v.id)}>{v.label}</button>;
          })}
        </nav>
        <button type="button" className="hs-sound" aria-pressed={sound} onClick={toggleSound} title={sound ? "Turn sound off" : "Turn sound on"}>
          {sound ? <Volume2 className="size-4" /> : <VolumeX className="size-4" />}<span>{sound ? "Sound on" : "Sound off"}</span>
        </button>
      </header>

      {/* the one 3D model: its own frame, nothing laid over it */}
      <div className="hs-cabin" aria-hidden={sheet}>
        {intro === "leaving" || intro === "off" ? <CabinStage t={t} ig={ig} times={times} spreads={sample === "sample1"} focus={sheet ? null : focus} view="full" onPick={onPick} showParts={!sheet} fx={response ? fx : null} paused={sheet} /> : null}
        <Provenance kind={response && fx ? "illustration" : "replay"} className="hs-cabin-tag">{response && fx ? "Illustration · fan, flame and gas follow your choices, not a measurement" : "3D illustration · sensor timings replayed"}</Provenance>
      </div>

      {/* ---------- Fire Response: same cabin, same clock, different question ---------- */}
      {response ? (
        <FireResponse series={series} ig={ig} det={det} sample={sample} setSample={setSample} t={t} setT={setT} playing={playing} setPlaying={setPlaying}
          stats={habitats} findings={findings} onFx={setFx} onDashboard={() => go("replay")} />
      ) : null}

      {/* ---------- replay: floating instruments ---------- */}
      {view === "replay" ? (
        <>
          <div className="hs-bar">
            <span className={`mc-badge status ${rel >= 0 ? "on" : ""}`}><i />{status}</span>
            <div className="mc-seg" role="group" aria-label="Sample">
              {["sample1", "sample2"].map((s) => (
                <button key={s} type="button" aria-pressed={sample === s} onClick={() => { setSample(s); setFocus(null); setSeen(-PRE); replay(); }}>{s === "sample1" ? "Sample 1" : "Sample 2"}</button>
              ))}
            </div>
            <button type="button" className="mc-legend-btn" onClick={() => { setFocus(null); setPop(pop === "about" ? null : "about"); }} aria-expanded={pop === "about"}><Info className="size-3.5" /> About this burn</button>
            <button type="button" className="mc-legend-btn" onClick={() => { setFocus(null); setPop(pop === "legend" ? null : "legend"); }} aria-expanded={pop === "legend"}>Legend</button>
            <p className="hs-run">SAFFIRE-III · {sm.material} · {sm.flow_cm_s} cm/s {sm.direction.toLowerCase()} flow</p>
            <ul className="hs-kpis" aria-label="Key figures">
              <li><b>{recordCount}</b> records</li>
              <li><b>{SENSORS.length}</b> sensors</li>
              {fastest && slowest ? <li><b>{seen >= det[slowest.id].t ? `${(det[slowest.id].t - det[fastest.id].t).toFixed(1)} s` : "?"}</b> first → last</li> : null}
            </ul>
          </div>
          <aside className="hs-right">
            <div className="hs-block">
              <div className="hs-block-h"><h2>Sensor status</h2><Provenance kind="replay">Replay · k = {k}</Provenance></div>
              <ul className="hs-sensors">
                {SENSORS.map((s) => {
                  const Icon = ICON[s.icon], d = det[s.id], lit = d && rel >= d.t;
                  const key = (c) => (c === "CO2" ? "co2" : c);
                  const ch = s.id === "camera" || !series?.s ? null : series.s[key(d?.ch && series.s[key(d.ch)] ? d.ch : s.channels[0])];
                  return (
                    <li key={s.id}>
                      <button type="button" className={lit ? "lit" : ""} style={{ "--c": s.css }} onClick={() => { setPop(null); setFocus(focus === s.id ? null : s.id); }} aria-pressed={focus === s.id}>
                        <span className="ic"><Icon className="size-3.5" /></span>
                        <span className="nm"><b>{s.plain}</b><small>{!d ? "no detection" : lit ? "DETECTED" : rel < 0 ? "standby" : "monitoring…"}</small></span>
                        <Spark series={ch} ts={series?.s?.t} ig={ig} now={t} detT={d && seen >= d.t ? d.t : null} color={s.css} />
                        <span className="tm">{!d ? "—" : seen >= d.t ? `${d.t.toFixed(1)} s` : "· · ·"}</span>
                      </button>
                    </li>
                  );
                })}
              </ul>
            </div>
            <div className="hs-block">
              <div className="hs-block-h"><h2>Cabin conditions</h2><span>{reading ? `at ${rel >= 0 ? "+" : ""}${rel.toFixed(1)} s` : series?.error ? "data unavailable" : "loading…"}</span></div>
              <dl className="hs-env">
                <div><dt>Oxygen</dt><dd>{reading?.o2 != null ? reading.o2.toFixed(2) : "—"}<small>%</small></dd></div>
                <div><dt>Airflow</dt><dd>{reading?.flow != null ? (reading.flow / 100).toFixed(2) : "—"}<small>m/s</small></dd></div>
                <div><dt>CO₂</dt><dd>{reading?.co2 != null ? reading.co2.toFixed(3) : "—"}<small>%</small></dd></div>
                <div><dt>Sample temp (max)</dt><dd>{reading && isFinite(reading.sampleT) ? reading.sampleT.toFixed(0) : "—"}<small>°C</small></dd></div>
                <div><dt>Plume temp (max)</dt><dd>{reading && isFinite(reading.plumeT) ? reading.plumeT.toFixed(0) : "—"}<small>°C</small></dd></div>
                <div><dt>Gravity</dt><dd className="txt">Low gravity, in orbit<small>platform not stated in DoD</small></dd></div>
              </dl>
              <p className="hs-note">Values from the SAFFIRE-III calibrated sensor workbook. O₂ and CO₂ are measured in the avionics bay at the inlet, not at the fire.</p>
            </div>
            {/* details open here, in the column, so nothing covers the cabin; the camera frame returns when they close */}
            {fs || pop ? (
              <div className="hs-info">
            {pop === "legend" ? (
              <div className="hs-pop" role="dialog" aria-label="Legend">
                <button type="button" className="mc-x" onClick={() => setPop(null)} aria-label="Close legend"><X className="size-4" /></button>
                <ul className="hs-legend">
                  <li><i className="lg-flame" />Flame on the sample: blue at its base, leaning with the airflow (low-gravity combustion; shape is illustrative)</li>
                  <li><i className="lg-sensor" />Boxes with coloured lights: the five detection devices (positions illustrative)</li>
                  <li><i className="lg-dot" />Coloured light on: that sensor has detected the fire</li>
                  <li><i className="lg-air" />Moving particles: cabin airflow · grey haze: hot combustion gas drifting downstream</li>
                  <li><i className="lg-line" />Timeline below: when each sensor responded, in real seconds after ignition</li>
                  <li><i className="lg-screen" />Wall screen: real NASA footage from a later Saffire-V burn</li>
                </ul>
                <div className="mc-prov-legend"><Provenance kind="observed" /><Provenance kind="replay" /><Provenance kind="illustration">Illustration (3D shapes, positions)</Provenance></div>
              </div>
            ) : null}
            {pop === "about" ? (
              <div className="hs-pop" role="dialog" aria-label="About this burn">
                <button type="button" className="mc-x" onClick={() => setPop(null)} aria-label="Close"><X className="size-4" /></button>
                <p>Inside an uncrewed cargo spacecraft, NASA switched on a hot igniter wire against a sheet of <b>{sm.material}</b> (a cotton–fiberglass fabric used in spacecraft tests) to start a real fire on purpose.</p>
                <p>The igniter switched on at <b>{ig.toFixed(1)} s</b> on the experiment clock. Everything on this page is timed from that moment.</p>
                <p>There is almost no gravity here, so hot gas does not rise the way it does on Earth. A fan pushes air through the test duct at about <b>{(sm.flow_cm_s / 100).toFixed(2)} m/s</b>; that airflow, not buoyancy, decides where heat and smoke go.</p>
                <ul className="mc-facts">
                  <li><span>Ignition</span><b>{ig.toFixed(1)} s</b></li>
                  <li><span>Flame first visible on camera</span><b>{saffire[sample].cameraFlameFirstVisibleS.toFixed(2)} s</b></li>
                  <li><span>Recording length</span><b>{sm.duration_s.toFixed(0)} s</b></li>
                  <li><span>Outcome</span><b className="text-[12px] font-normal">{sample === "sample1" ? "Flame spread across the sample" : "Flame line on the ignition edge, no spread in 160 s"}</b></li>
                </ul>
                <p className="mc-note">Detection time ≠ ignition time. Ignition is the igniter switching on at {ig.toFixed(1)} s; a detection is the first time a sensor&apos;s signal rose above its own normal noise (mean + k × standard deviation of the 5–55 s baseline, held for 3 samples). The camera time comes from frame analysis instead.</p>
              </div>
            ) : null}
            {fs ? (
              <div className="hs-pop" style={{ "--c": fs.css }}>
                <button type="button" className="mc-x" onClick={() => setFocus(null)} aria-label="Close sensor details"><X className="size-4" /></button>
                <p className="mc-detail-k">{fs.plain}</p>
                <dl className="hs-dl">
                  <dt>Measures</dt><dd>{fs.measures}</dd>
                  <dt>Location</dt><dd>{fs.location}</dd>
                  <dt>Detected</dt><dd>{det[fs.id] ? <><b>{det[fs.id].t.toFixed(2)} s</b> after ignition <span className="opacity-70">({det[fs.id].ch})</span></> : "No detection in this run"}</dd>
                  <dt>Why it matters</dt><dd>{fs.why}</dd>
                </dl>
              </div>
            ) : null}
              </div>
            ) : !guessShut && (guess == null ? rel < 0.5 : true) ? (
              <div className="hs-info hs-guess">
                <button type="button" className="mc-x" onClick={() => setGuessShut(true)} aria-label="Close"><X className="size-4" /></button>
                {guess == null ? (
                  <>
                    <p className="fr-n">Before you press play</p>
                    <h3>Which sensor notices the fire first?</h3>
                    <div className="hs-guess-opts">
                      {SENSORS.map((s) => <button key={s.id} type="button" style={{ "--c": s.css }} onClick={() => { setGuess(s.id); sfx.click(); replay(); }}><i aria-hidden="true" />{s.plain}</button>)}
                    </div>
                  </>
                ) : !fastest || rel < det[fastest.id].t ? (
                  <><p className="fr-n">Your pick</p><h3 style={{ color: guessed.css }}>{guessed.plain}</h3><p>Watch the timeline. The first light to come on is the answer.</p></>
                ) : (
                  <>
                    <p className="fr-n">{guess === fastest.id ? "You were right" : "Not this time"}</p>
                    <h3>{fastest.plain} was first, at {det[fastest.id].t.toFixed(2)} s.</h3>
                    {guess !== fastest.id ? <p>You picked the <b style={{ color: guessed.css }}>{guessed.plain}</b>{det[guess] ? <>: it came <b>{(det[guess].t - det[fastest.id].t).toFixed(1)} s</b> later.</> : ": it never detected the fire in this run."}</p> : <p>The slowest was the {slowest.plain}, {(det[slowest.id].t - det[fastest.id].t).toFixed(1)} s behind.</p>}
                  </>
                )}
              </div>
            ) : frame ? (
              <figure className="hs-feed">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={`/data/saffire/${frame.file}`} alt={`Camera frame at ${frame.t.toFixed(1)} s`} />
                <figcaption>Real camera frame · {sm.camera} · {frame.t.toFixed(1)} s</figcaption>
              </figure>
            ) : null}
          </aside>

          <div className="hs-bottom" aria-label="Detection timeline">
            <div className="mc-controls">
              <button type="button" className="mc-btn primary" onClick={() => (playing ? setPlaying(false) : play())} aria-label={playing ? "Pause" : "Play"}>{playing ? <Pause className="size-4" /> : <Play className="size-4" />}{playing ? "Pause" : "Play"}</button>
              <button type="button" className="mc-btn" onClick={replay}><RotateCcw className="size-4" />Replay</button>
              <button type="button" className="mc-btn" onClick={reset}><SkipBack className="size-4" />Reset</button>
              <div className="mc-seg hs-k" role="group" aria-label="Detection threshold k (stricter means later detection)" title="Detection threshold k: stricter → later detection. Default is 5. Uses the precomputed results for each threshold.">
                {KS.map((v) => <button key={v} type="button" aria-pressed={k === v} onClick={() => setK(v)}>k={v}</button>)}
              </div>
              <span className="mc-clock"><b>{rel >= 0 ? "+" : "−"}{Math.abs(rel).toFixed(1)} s</b> {rel >= 0 ? "after ignition" : "to ignition"} <span>· experiment clock {t.toFixed(1)} s</span></span>
              {allSeen ? <button type="button" className="hs-next" onClick={() => go("response")}>What do we do now? <ArrowRight className="size-4" /></button> : null}
            </div>
            <div className="mc-track">
              <input type="range" min={ig - PRE} max={ig + POST} step={0.05} value={t} onChange={(e) => { setPlaying(false); setT(+e.target.value); }} aria-label="Scrub the replay clock" />
              <div className="mc-track-vis" aria-hidden="true">
                <div className="mc-ig" style={{ left: `${tx(0)}%` }}><span>Ignition · {ig.toFixed(0)} s</span></div>
                {fastest && slowest && fastest !== slowest && seen >= det[slowest.id].t ? (
                  <div className="mc-bracket" style={{ left: `${tx(det[fastest.id].t)}%`, width: `${tx(det[slowest.id].t) - tx(det[fastest.id].t)}%` }}>
                    <span>{(det[slowest.id].t - det[fastest.id].t).toFixed(1)} s between first and last detection</span>
                  </div>
                ) : null}
                {ranked.filter((s) => seen >= det[s.id].t).map((s, i) => (
                  <button key={s.id} type="button" className={`mc-mark ${rel >= det[s.id].t ? "on" : ""}`} style={{ left: `${tx(det[s.id].t)}%`, "--c": s.css, "--row": i % 2 }} onClick={() => { setPop(null); setFocus(s.id); }} tabIndex={-1}>
                    <i /><span>{s.short} · {det[s.id].t.toFixed(1)} s</span>
                  </button>
                ))}
                <div className="mc-head-line" style={{ left: `${tx(rel)}%` }} />
                <div className="mc-axis">{[0, 2, 4, 6, 8, 10, 30, 50, 70].map((v) => <span key={v} style={{ left: `${tx(v)}%` }}>{v}s</span>)}</div>
              </div>
            </div>
          </div>
        </>
      ) : null}

      {/* ---------- the other views: one sheet over the same cabin ---------- */}
      {sheet ? (
        <div className={`hs-sheet ${view === "demo" ? "is-media" : ""}`} role="region" aria-label={VIEWS.find((v) => v.id === view)?.label}>
          {EVIDENCE.includes(view) ? (
            <div className="mc-seg hs-evidence-seg" role="group" aria-label="Evidence sections">
              {EVIDENCE.map((id) => <button key={id} type="button" aria-pressed={view === id} onClick={() => go(id)}>{VIEWS.find((v) => v.id === id).label}</button>)}
            </div>
          ) : null}
          {view === "flame" ? (
            <>
              <h2 className="hs-sheet-h">Fire Behaves Differently in Microgravity</h2>
              <FlameCompare findings={findings} oxygenSeries={oxygenSeries} />
            </>
          ) : null}

          {view === "results" ? (
            <div className="hs-results">
              <div className="hs-results-a">
                <h2 className="hs-sheet-h">What Do the Results Tell Us?</h2>
                <div className="hs-results-ctl">
                  <div className="mc-seg" role="group" aria-label="Sample">
                    {["sample1", "sample2"].map((s) => <button key={s} type="button" aria-pressed={sample === s} onClick={() => setSample(s)}>{s === "sample1" ? "Sample 1" : "Sample 2"}</button>)}
                  </div>
                  <div className="mc-seg" role="group" aria-label="Threshold k">
                    {KS.map((v) => <button key={v} type="button" aria-pressed={k === v} onClick={() => setK(v)}>k = {v}</button>)}
                  </div>
                </div>
                <div className="mc-kpis">
                  <div><span>Fastest</span><b style={{ color: fastest?.css }}>{fastest?.plain}</b><small>{det[fastest?.id]?.t.toFixed(2)} s</small></div>
                  <div><span>Slowest</span><b style={{ color: slowest?.css }}>{slowest?.plain}</b><small>{det[slowest?.id]?.t.toFixed(2)} s</small></div>
                  <div><span>Spread</span><b>{fastest && slowest ? (det[slowest.id].t - det[fastest.id].t).toFixed(1) : "—"} s</b><small>first → last</small></div>
                </div>
                <p className="mc-label">Response ranking · {sampleName} · k = {k}</p>
                <ol className="mc-rank">
                  {ranked.map((s, i) => (
                    <li key={s.id} style={{ "--c": s.css }}>
                      <span className="mc-rank-n">{i + 1}</span><span className="mc-rank-name">{s.plain}</span>
                      <span className="mc-rank-bar"><i style={{ width: `${Math.max(2, (det[s.id].t / (det[slowest.id].t || 1)) * 100)}%` }} /></span>
                      <span className="mc-rank-t">{det[s.id].t.toFixed(2)} s</span>
                    </li>
                  ))}
                  {SENSORS.filter((s) => !det[s.id]).map((s) => (
                    <li key={s.id} style={{ "--c": s.css }} className="none"><span className="mc-rank-n">–</span><span className="mc-rank-name">{s.plain}</span><span className="mc-rank-bar" /><span className="mc-rank-t">no detection</span></li>
                  ))}
                </ol>
                {fastest && slowest ? (
                  <p className="mc-insight">Detection performance varies significantly between sensing technologies: the <b>{fastest.plain.toLowerCase()}</b> responded after <b>{det[fastest.id].t.toFixed(2)} s</b>, the <b>{slowest.plain}</b> after <b>{det[slowest.id].t.toFixed(2)} s</b> — a gap of <b>{(det[slowest.id].t - det[fastest.id].t).toFixed(1)} s</b>.</p>
                ) : null}
              </div>
              <div className="hs-results-b">
                <div className="table-wrap-mc">
                  <table className="mc-table">
                    <caption>Detection time (s after ignition) by threshold — {sampleName}</caption>
                    <thead><tr><th>Sensor</th>{KS.map((v) => <th key={v}>k = {v}</th>)}</tr></thead>
                    <tbody>
                      {SENSORS.map((s) => (
                        <tr key={s.id}><td><i className="mc-dot" style={{ background: s.css }} />{s.plain}</td>
                          {KS.map((v) => { const d = detectionAt(detection, saffire, sample, v)[s.id]; return <td key={v} className={v === k ? "cur" : ""}>{d ? d.t.toFixed(2) : "—"}</td>; })}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                <div className="hs-two">
                  <div>
                    <p className="mc-label">What the data shows</p>
                    <ul className="mc-list">
                      <li>Sensors that respond to the flame&apos;s <b>radiation</b> or <b>image</b> react within seconds, because they do not need anything to travel through the air.</li>
                      <li>Thermocouples react only when heat reaches them: the one <b>on the sample</b> in the flame&apos;s path fires next, the ones <b>downstream in the plume</b> after the airflow carries hot gas to them.</li>
                      <li>The <b>CO₂ sensor</b> is slowest: combustion gas has to mix through the air and reach a sensor that sits at the inlet, far from the fire.</li>
                      <li>Each sensor measures a different physical thing, so &ldquo;fastest&rdquo; here is not &ldquo;best&rdquo; everywhere: a radiometer that cannot see a hidden fire, or a camera nobody watches, detects nothing.</li>
                    </ul>
                  </div>
                  <div>
                    <p className="mc-label">Limitations</p>
                    <ul className="mc-list">
                      <li>One run per sample; repeatability is not measured.</li>
                      <li>Sensor positions are not documented, so distance to the flame cannot be accounted for. Positions in the 3D cabin are illustrative.</li>
                      <li>O₂/CO₂ sensors sit in the avionics bay at the inlet, so gas response is delayed and diluted.</li>
                      <li>Times depend on the threshold rule (k).</li>
                      <li>The flame shape in the 3D view is illustrative; the measured timings are not.</li>
                    </ul>
                  </div>
                </div>
                <p className="mc-note">Sources: SAFFIRE-III calibrated sensor workbooks, camera image sets S1C1/S2C2, SAFFIRE-I/III DoD. Changing k uses the precomputed results for each threshold; it shows how much a result depends on the rule, not a new measurement.</p>
              </div>
            </div>
          ) : null}

          {view === "records" ? records : null}
          {view === "findings" ? <SubViews key="findings" items={findingsAndGaps} /> : null}
          {view === "demo" ? <SubViews key="demo" items={demo} /> : null}
          {view === "advice" ? <SubViews key="advice" items={advice} /> : null}
        </div>
      ) : null}

      {intro !== "off" ? (
        <div className={`hs-intro is-${intro}`} onClick={enter}>
          <IntroScene go={intro !== "on"} onArrive={arrived} />
          <div className="hs-intro-shade" aria-hidden="true" />
          <div className="hs-intro-type">
            <p className="hs-intro-k">Flame in Freefall · microgravity fire safety</p>
            <h2>Fire doesn&apos;t behave the same <em>in space.</em></h2>
            <p className="hs-intro-s">Through the window: with no buoyancy, a burning droplet wraps itself in a sphere of flame. Inside a spacecraft, even how we detect a fire changes.</p>
            <button type="button" className="hs-skip" onClick={enter}><i aria-hidden="true" />Entering the cabin</button>
            <p className="hs-intro-tag">Illustration · droplet flame based on FLEX tests</p>
          </div>
        </div>
      ) : null}
    </section>
  );
}
