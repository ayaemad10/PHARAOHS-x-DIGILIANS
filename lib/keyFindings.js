/**
 * The four key findings at the top of Insights. Every number is computed here from the loaded
 * records (catalog, FLEX series, SAME smoke tables, SAFFIRE-III measurements); nothing is typed in.
 * Each card names the records it rests on and links to where they can be checked.
 */
import { smoke } from "@/lib/advice";

const fmt = (x, d = 1) => (+Number(x).toFixed(d)).toString();

export function keyFindings({ catalog, oxygenSeries, patterns }) {
  const cards = [];

  /* 1. Oxygen vs extinction (FLEX, binned counts) */
  const pts = (oxygenSeries?.points ?? []).filter((p) => p.tests > 0);
  if (pts.length >= 2) {
    const lo = pts[0], hi = pts[pts.length - 1];
    const pat = patterns.find((p) => p.id === "PAT-FLEX-O2");
    cards.push({
      id: "kf-oxygen",
      topic: "Oxygen",
      value: `${fmt(lo.extinctionShare, 0)}% → ${fmt(hi.extinctionShare, 0)}%`,
      title: "More oxygen, fewer flames go out",
      text: `FLEX droplet tests ending in extinction: ${fmt(lo.extinctionShare, 0)}% of ${lo.tests} at ${fmt(lo.oxygen, 0)}% O₂, ${fmt(hi.extinctionShare, 0)}% of ${hi.tests} at ${fmt(hi.oxygen, 0)}% O₂.`,
      level: "Measured",
      n: `${pts.reduce((a, p) => a + p.tests, 0)} tests`,
      records: pat?.supportingIds?.slice(0, 3) ?? [],
      link: { href: "/flame-lab", label: "Full curve in Flame Lab" },
    });
  }

  /* 2. ISS scatter smoke detector vs Kapton / Teflon smoke (SAME, SAME-R) */
  const sm = smoke(catalog);
  const weak = sm.mats.slice(0, 2), strong = sm.mats.slice(-1)[0];
  if (weak.length === 2 && strong) {
    const ids = catalog
      .filter((r) => /^SAME/.test(r.program) && weak.some((w) => w.name === r.material) && r.measurements?.iss_smoke_detector_scatter_v != null)
      .slice(0, 2)
      .map((r) => r.id);
    cards.push({
      id: "kf-smoke",
      topic: "Smoke detection",
      value: `${fmt(weak[0].scatter, 2)} V vs ${fmt(strong.scatter, 1)} V`,
      title: `The ISS scatter detector barely sees ${weak[0].name} and ${weak[1].name} smoke`,
      text: `Median scatter-detector reading: ${weak[0].name} ${fmt(weak[0].scatter, 2)} V, ${weak[1].name} ${fmt(weak[1].scatter, 2)} V, against ${fmt(strong.scatter, 2)} V for ${strong.name}. Their smoke particles are smaller.`,
      level: "Measured",
      n: `${sm.tests} smoke samples`,
      records: ids,
      link: { href: "#smoke-chart", label: "Chart below" },
    });
  }

  /* 3. Ventilation (BASS, slow flow) */
  const bass = catalog.filter((r) => /^BASS/.test(r.program) && r.flow_cm_s != null && r.flow_cm_s <= 10);
  const known = bass.filter((r) => r.outcome_group !== "unknown");
  const out = known.filter((r) => r.outcome_group === "extinguished");
  if (known.length) {
    cards.push({
      id: "kf-ventilation",
      topic: "Ventilation",
      value: `${out.length} of ${known.length}`,
      title: "Slow air lets solid flames go out on their own",
      text: `In BASS tests at 10 cm/s or less, ${out.length} of the ${known.length} with a stated outcome went out by themselves. ${bass.length - known.length} more do not state an outcome.`,
      level: "Measured",
      n: `${known.length} tests`,
      records: out.slice(0, 3).map((r) => r.id),
      link: { href: "/compare", label: "Compare programmes" },
    });
  }

  /* 4. Sensor order (SAFFIRE-III Sample 1, measured latencies after ignition) */
  const s1 = catalog.find((r) => r.id === "saffire-iii-s1");
  const m = s1?.measurements;
  if (m) {
    const order = [
      ["Camera", m.camera_flame_first_visible_s - m.igniter_on_s],
      ["Radiometer", m.radiometer_latency_s],
      ["Sample thermocouple", m.sample_tc_latency_s],
      ["Plume thermocouple", m.plume_latency_s],
      ["CO₂ sensor", m.co2_latency_s],
    ].filter(([, v]) => typeof v === "number").sort((a, b) => a[1] - b[1]);
    cards.push({
      id: "kf-sensors",
      topic: "Sensor order",
      value: `${fmt(order[0][1], 2)} s → ${fmt(order[order.length - 1][1], 1)} s`,
      title: "Light is seen first, CO₂ last",
      text: `After ignition in SAFFIRE-III Sample 1: ${order.map(([k, v]) => `${k} ${fmt(v, 2)} s`).join(", ")}.`,
      level: "Measured",
      n: "1 large-scale burn",
      records: ["saffire-iii-s1"],
      link: { href: "/#response", label: "Replay on Home" },
    });
  }

  return cards;
}

/** Median ISS scatter-detector reading per material, for the Insights chart. */
export function smokeByMaterial(catalog) {
  const sm = smoke(catalog);
  return {
    tests: sm.tests,
    rows: sm.mats.map((m) => ({ material: m.name, scatter: m.scatter, ionization: m.ion, samples: m.n })),
  };
}
