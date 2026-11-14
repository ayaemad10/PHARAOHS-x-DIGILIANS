"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { ArrowRight, RotateCcw } from "lucide-react";
import { SENSORS } from "@/components/mission-control/sensors";
import Provenance from "@/components/shared/Provenance";
import { HABITATS, PRE, alarmTable, fabricHeating, tx } from "@/lib/response";
import { sfx } from "@/lib/sfx";

/**
 * Fire Response: the same cabin and the same recorded burn as the Dashboard, but the replay
 * stops at the alarm and asks what to do. Three steps, one at a time.
 *
 *   1 Detect    which sensor the alarm is wired to, and which rule it uses. Run over the
 *               recorded SAFFIRE-III series (lib/response.js), so the second is measured.
 *   2 Decide    cut the ventilation or not. Answered with published BASS findings.
 *   3 Suppress  what is added to the air. Answered with counts of FLEX droplet tests.
 *
 * What the 3D flame does after a decision is an illustration of those findings; SAFFIRE-III
 * never had its fan cut or a suppressant released, and the panel says so.
 */
const STEPS = ["Detect", "Decide", "Suppress", "Debrief"];
const WIRES = [...SENSORS.map((s) => ({ id: s.id, label: s.plain, css: s.css })), { id: "two", label: "Any two agree", css: "var(--fx-ink)" }];
const DIL = [{ id: "none", label: "Nothing" }, { id: "co2", label: "CO₂" }, { id: "he", label: "Helium" }];
const pct = (d) => (d.tests ? Math.round((d.out / d.tests) * 100) : null);

export default function FireResponse({ series, ig, det, sample, setSample, t, setT, playing, setPlaying, stats, findings, onFx, onDashboard }) {
  const [habitat, setHabitat] = useState("station");
  const [wire, setWire] = useState("radiation");
  const [rule, setRule] = useState("threshold");
  const [step, setStep] = useState(0);
  const [vent, setVent] = useState(null); // "cut" | "keep"
  const [dil, setDil] = useState(null); // "none" | "co2" | "he"
  const rel = t - ig;
  const hab = HABITATS.find((h) => h.id === habitat);
  const hs = stats[habitat] || stats.station;

  const table = useMemo(() => alarmTable(series?.s, ig, det, SENSORS), [series, ig, det]);
  const heat = useMemo(() => fabricHeating(series?.s, ig, SENSORS[2].channels), [series, ig]);
  const twoAgree = useMemo(() => { if (!table) return null; const v = Object.values(table).map((x) => x.threshold).filter((x) => x != null).sort((a, b) => a - b); return v[1] ?? null; }, [table]);
  const alarmFor = (w, r) => (!table ? null : w === "two" ? twoAgree : table[w]?.[r] ?? null);
  const alarm = alarmFor(wire, wire === "two" ? "threshold" : rule);
  const baseline = table?.co2?.threshold ?? null; // a gas sensor at the inlet, on its own
  const head = alarm != null && baseline != null ? baseline - alarm : null;
  const hotAtAlarm = alarm != null ? heat.filter((x) => x <= alarm).length : 0;
  const hotAtBaseline = baseline != null ? heat.filter((x) => x <= baseline).length : 0;
  const nextHot = alarm != null ? heat.find((x) => x > alarm) : null;
  const quote = (id) => findings.find((f) => f.id === id);

  /* the replay runs up to the alarm, then stops for the decision */
  const fired = useRef(false);
  useEffect(() => {
    if (step !== 0 || !playing || alarm == null || fired.current) return;
    if (rel >= alarm) { fired.current = true; setPlaying(false); setT(ig + alarm); sfx.alarm(); const id = requestAnimationFrame(() => setStep(1)); return () => cancelAnimationFrame(id); }
    return undefined;
  }, [rel, step, playing, alarm, ig, setPlaying, setT]);

  /* what the 3D scene shows for the choices made so far (illustrative) */
  useEffect(() => {
    const fan = vent === "cut" ? 0.07 : 1;
    const flame = (vent === "cut" ? hab.cutFlame : 1) * (dil === "co2" ? 0.4 : dil === "he" ? 0.3 : 1);
    onFx(step === 0 ? null : { fan, flame, gas: dil && dil !== "none" ? dil : null });
  }, [vent, dil, step, hab, onFx]);
  useEffect(() => () => onFx(null), [onFx]);

  const start = () => { fired.current = false; setVent(null); setDil(null); setStep(0); setT(ig - PRE); setPlaying(true); sfx.click(); };
  const restart = () => { fired.current = false; setPlaying(false); setVent(null); setDil(null); setStep(0); setT(ig - PRE); sfx.swap(); };
  const pickHabitat = (id) => { setHabitat(id); sfx.click(); };
  const chooseVent = (v) => { setVent(v); if (v === "cut") sfx.fanDown(); else sfx.fanKeep(); };
  const chooseDil = (v) => { setDil(v); if (v === "none") sfx.click(); else sfx.gas(); };
  const toDebrief = () => { setStep(3); sfx.outcome(vent === "cut" || (dil && dil !== "none")); };

  const flexFor = hs.flexTests ? hs.flex : stats.all.flex;
  const flexScope = hs.flexTests ? `${hs.flexTests} FLEX tests at ${hab.air}` : `all ${stats.all.flexTests} FLEX tests (none match ${hab.air})`;
  const selfOut = hs.flexTests ? hs.flex.none : null;

  return (
    <>
      {/* ---------- where is the fire ---------- */}
      <div className="hs-bar">
        <span className="fr-where">Where is the fire?</span>
        <div className="fr-habs" role="group" aria-label="Habitat">
          {HABITATS.map((h) => (
            <button key={h.id} type="button" disabled={h.disabled} aria-pressed={habitat === h.id} onClick={() => pickHabitat(h.id)} title={h.note}>
              <b>{h.label}</b><small>{h.air}</small>
            </button>
          ))}
        </div>
        <div className="mc-seg" role="group" aria-label="Sample">
          {["sample1", "sample2"].map((s) => <button key={s} type="button" aria-pressed={sample === s} onClick={() => { setSample(s); restart(); }}>{s === "sample1" ? "Sample 1" : "Sample 2"}</button>)}
        </div>
        <ul className="hs-kpis" aria-label="Evidence for this habitat">
          <li><b>{hs.total}</b> records relevant here</li>
          <li><b>0</b> at lunar gravity in PSI</li>
        </ul>
      </div>

      {/* ---------- the step, one at a time ---------- */}
      <aside className="hs-right fr">
        <div className={`fr-head ${head != null && head > 0.05 ? "good" : head != null && head < -0.05 ? "bad" : ""}`}>
          <small>{head == null ? "Head start" : head >= 0 ? "Your head start" : "You are behind"}</small>
          <b>{head == null ? "—" : `${Math.abs(head).toFixed(1)} s`}</b>
          <span>{alarm == null ? "this alarm never fires in this run" : wire === "co2" && rule === "threshold" ? "this is the gas-sensor-only alarm" : `${head >= 0 ? "ahead of" : "later than"} a CO₂-sensor-only alarm (${baseline?.toFixed(1)} s)`}</span>
        </div>

        <div className="hs-block fr-step" key={step}>
          {step === 0 ? (
            <>
              <p className="fr-n">Step 1 · Detect</p>
              <h2>Choose your alarm</h2>
              <p className="fr-q">Which sensor is the cabin alarm wired to, and what rule does it use? It runs on the recorded burn.</p>
              <div className="fr-wires" role="group" aria-label="Alarm sensor">
                {WIRES.map((w) => {
                  const a = alarmFor(w.id, w.id === "two" ? "threshold" : rule);
                  return (
                    <button key={w.id} type="button" aria-pressed={wire === w.id} style={{ "--c": w.css }} onClick={() => { setWire(w.id); sfx.click(); }}>
                      <i aria-hidden="true" /><span>{w.label}</span><em>{!table ? "…" : a == null ? "no alarm" : `${a.toFixed(1)} s`}</em>
                    </button>
                  );
                })}
              </div>
              <div className="fr-row">
                <div className="mc-seg" role="group" aria-label="Alarm rule">
                  <button type="button" aria-pressed={rule === "threshold"} onClick={() => { setRule("threshold"); sfx.click(); }}>Fixed threshold</button>
                  <button type="button" aria-pressed={rule === "rise"} disabled={wire === "two" || wire === "camera"} onClick={() => { setRule("rise"); sfx.click(); }}>Rate of rise</button>
                </div>
              </div>
              {table && wire !== "two" && wire !== "camera" ? (
                <p className="fr-note">
                  {table[wire].rise == null ? "Rate of rise never alarms on this sensor in this run." : table[wire].threshold == null ? "A fixed threshold never alarms on this sensor in this run." : Math.abs(table[wire].threshold - table[wire].rise) < 0.05 ? "Both rules alarm at the same moment on this sensor." : `Rate of rise alarms ${Math.abs(table[wire].threshold - table[wire].rise).toFixed(1)} s ${table[wire].rise < table[wire].threshold ? "earlier" : "later"} than a fixed threshold here.`}
                </p>
              ) : null}
              <button type="button" className="fr-go" disabled={alarm == null || !table} onClick={start}>{playing ? "Running…" : rel > -PRE + 0.1 && !playing ? "Restart the burn" : "Start the burn"} <ArrowRight className="size-4" /></button>
              <p className="fr-src"><Provenance kind="replay">Computed on the recording</Provenance> mean + 5σ of the 5–55 s baseline, held 3 samples</p>
            </>
          ) : null}

          {step === 1 ? (
            <>
              <p className="fr-alarm"><i aria-hidden="true" />Alarm · +{alarm.toFixed(1)} s after ignition</p>
              <h2>The fan is feeding the fire. Your move.</h2>
              <p className="fr-q">{hotAtAlarm ? `The flame has already heated ${hotAtAlarm} of ${heat.length} thermocouples on the fabric past 100 °C.` : nextHot != null ? `The first thermocouple on the fabric passes 100 °C in ${(nextHot - alarm).toFixed(1)} s.` : "No thermocouple on the fabric passes 100 °C in this run."}</p>
              <div className="fr-choices">
                <button type="button" aria-pressed={vent === "cut"} onClick={() => chooseVent("cut")}><b>Cut ventilation</b><span>starve the flame of fresh air</span></button>
                <button type="button" aria-pressed={vent === "keep"} onClick={() => chooseVent("keep")}><b>Keep fan on</b><span>keep smoke moving to the sensors</span></button>
              </div>
              {vent ? (
                <div className="fr-ev">
                  <q>{quote("sibal-quench-speeds")?.quote}</q>
                  <q>{quote("flames-survive-below-1")?.quote}</q>
                  <p>{vent === "cut" ? `Cutting the fan can put a fabric flame out, but it is not guaranteed${habitat === "station" ? "." : ", and richer oxygen makes it harder."}` : "With the fan on, the flame keeps its air supply; the airflow also carries heat and smoke to the downstream sensors."}</p>
                  <p className="fr-src"><Provenance kind="observed">Published findings</Provenance>{habitat === "station" ? "BASS-II, SIBAL fabric" : `not measured at ${hab.air}`}</p>
                </div>
              ) : null}
              <button type="button" className="fr-go" disabled={!vent} onClick={() => { setStep(2); sfx.swap(); }}>Next: suppress <ArrowRight className="size-4" /></button>
            </>
          ) : null}

          {step === 2 ? (
            <>
              <p className="fr-n">Step 3 · Suppress</p>
              <h2>What do you add to the air?</h2>
              <p className="fr-q">Share of FLEX droplet flames that went out, by what was in the chamber.</p>
              <div className="fr-bars">
                {DIL.map((d) => {
                  const v = flexFor[d.id], p = pct(v);
                  return (
                    <button key={d.id} type="button" aria-pressed={dil === d.id} onClick={() => chooseDil(d.id)}>
                      <span>{d.label}</span><i style={{ "--w": `${p ?? 0}%` }} /><b>{p == null ? "no tests" : `${p}%`}</b><small>{v.tests ? `${v.out} of ${v.tests}` : "—"}</small>
                    </button>
                  );
                })}
              </div>
              {selfOut && selfOut.tests ? <p className="fr-callout"><b>{selfOut.out} of {selfOut.tests}</b> flames went out on their own in this air.</p> : null}
              {hs.acme?.tests ? <p className="fr-callout"><b>{hs.acme.out} of {hs.acme.tests}</b> ACME gas flames in this air put themselves out.</p> : null}
              <p className="fr-src"><Provenance kind="observed">Measured counts</Provenance>{flexScope} · droplets, not fabric · not a controlled comparison</p>
              <button type="button" className="fr-go" disabled={!dil} onClick={toDebrief}>See the debrief <ArrowRight className="size-4" /></button>
            </>
          ) : null}

          {step === 3 ? (
            <>
              <p className="fr-n">Debrief · {hab.label}</p>
              <h2>{head != null && head > 0.05 ? `You acted ${head.toFixed(1)} s before a gas sensor would have.` : "A gas sensor alone gave no head start."}</h2>
              <p className="fr-q">By {baseline?.toFixed(1)} s, when the CO₂ sensor alarmed, <b>{hotAtBaseline} of {heat.length}</b> thermocouples on the fabric had passed 100 °C. At your alarm it was <b>{hotAtAlarm}</b>.</p>
              <ul className="fr-meter" aria-label="Evidence behind each step">
                <li><span>Detect</span><em>measured on SAFFIRE-III</em><i className="l3" /></li>
                <li><span>Ventilation</span><em>{habitat === "station" ? "published, same fabric" : "published, other air"}</em><i className={habitat === "station" ? "l2" : "l1"} /></li>
                <li><span>Suppressant</span><em>{hs.flexTests ? `${hs.flexTests} droplet tests` : "no test in this air"}</em><i className={hs.flexTests ? "l2" : "l0"} /></li>
                <li><span>Lunar gravity</span><em>none in PSI</em><i className="l0" /></li>
              </ul>
              <p className="fr-sub">Most relevant evidence for {hab.label}</p>
              <ol className="fr-rank">
                {hs.ranked.map((r) => <li key={r.family} title={r.why}><b>{r.family}</b><span>{r.n} records{r.caveat ? ` · ${r.caveat}` : ""}</span></li>)}
              </ol>
              <p className="fr-src"><Provenance kind="illustration" />The flame in the 3D view after your choices is a drawing of these findings, not a measurement.</p>
              <div className="fr-row">
                <button type="button" className="fr-go ghost" onClick={restart}><RotateCcw className="size-4" /> Run again</button>
                <Link href="/firewise" className="fr-go ghost">Ask Firewise AI <ArrowRight className="size-4" /></Link>
              </div>
            </>
          ) : null}
        </div>
      </aside>

      {/* ---------- the race: the fire against you ---------- */}
      <div className="hs-bottom fr-race" aria-label="Fire against response timeline">
        <div className="fr-race-h">
          <ol className="fr-steps">
            {STEPS.map((s, i) => <li key={s} className={i < step ? "done" : i === step ? "now" : ""}>{i + 1} {s}</li>)}
          </ol>
          <span className="mc-clock"><b>{rel >= 0 ? "+" : "−"}{Math.abs(rel).toFixed(1)} s</b> {step === 0 ? (playing ? "replaying" : rel < 0 ? "to ignition" : "after ignition") : "replay paused at the alarm"}</span>
          <button type="button" className="mc-btn" onClick={onDashboard}>Back to Dashboard</button>
        </div>
        <div className="fr-lane"><b>FIRE</b>
          <div className="fr-trk">
            <i className="fr-fill fire" style={{ left: `${tx(0)}%`, width: `${tx(Math.max(0, rel)) - tx(0)}%` }} />
            <span className="fr-mk up on" style={{ left: `${tx(0)}%` }}><i /><em>ignition</em></span>
            {heat.slice(0, 5).map((h, i) => <span key={h} className={`fr-mk sq ${i % 2 ? "" : "up"} ${rel >= h ? "on" : ""}`} style={{ left: `${tx(h)}%` }}><i /><em>{i === 0 ? "fabric 100 °C · " : ""}{h.toFixed(1)} s</em></span>)}
            <span className="fr-now" style={{ left: `${tx(rel)}%` }} />
          </div>
        </div>
        <div className="fr-lane"><b>YOU</b>
          <div className="fr-trk">
            {alarm != null ? <i className="fr-fill you" style={{ left: `${tx(0)}%`, width: `${tx(Math.min(Math.max(0, rel), alarm)) - tx(0)}%` }} /> : null}
            {alarm != null ? <span className={`fr-mk ${rel >= alarm ? "on" : ""}`} style={{ left: `${tx(alarm)}%`, "--c": "var(--fx-brand)" }}><i /><em>your alarm · {alarm.toFixed(1)} s</em></span> : null}
            {baseline != null && !(wire === "co2" && rule === "threshold") ? <span className="fr-mk ghost" style={{ left: `${tx(baseline)}%` }}><i /><em>CO₂ only · {baseline.toFixed(1)} s</em></span> : null}
            {head != null && head > 0.5 ? <span className="fr-brk" style={{ left: `${tx(alarm)}%`, width: `${tx(baseline) - tx(alarm)}%` }}><em>{head.toFixed(1)} s gained</em></span> : null}
            <span className="fr-now" style={{ left: `${tx(rel)}%` }} />
          </div>
        </div>
        <div className="fr-axis" aria-hidden="true"><b /><div>{[0, 2, 4, 6, 8, 10, 30, 50, 70].map((v) => <span key={v} style={{ left: `${tx(v)}%` }}>{v}s</span>)}</div></div>
      </div>
    </>
  );
}
