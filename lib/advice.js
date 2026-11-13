/**
 * Recommendations by habitat. Each one is a sentence built from counts in the catalog, the
 * SAFFIRE-III detection table and the team's recommendations file, with the number of tests behind
 * it and what it must not be used for. Nothing here is a design value.
 */
const med = (a) => { const v = a.filter((x) => x != null).sort((x, y) => x - y); return v.length ? v[Math.floor((v.length - 1) / 2)] : null; };
const pct = (a, b) => (b ? Math.round((a / b) * 100) : 0);
const fmt = (x, d = 1) => (+x.toFixed(d)).toString();

/** Smoke evidence: how strongly the ISS scatter detector saw each material's smoke (SAME, SAME-R). */
export function smoke(catalog) {
  const rows = catalog.filter((r) => /^SAME/.test(r.program) && !(r.quality_flags || []).includes("calibration_aerosol"));
  const by = new Map();
  rows.forEach((r) => { const m = r.measurements || {}; if (m.iss_smoke_detector_scatter_v == null) return; const a = by.get(r.material) || []; a.push(m); by.set(r.material, a); });
  const mats = [...by.entries()].map(([name, ms]) => ({ name, n: ms.length, scatter: med(ms.map((m) => m.iss_smoke_detector_scatter_v)), ion: med(ms.map((m) => m.ionization_detector_change_v)), diam: med(ms.map((m) => m.mass_average_diameter_um)) })).sort((a, b) => a.scatter - b.scatter);
  return { tests: rows.length, mats };
}

export function habitatAdvice(catalog, stats, detection, recs) {
  const det = detection.k_options["5"].sample1;
  const radiometer = Math.min(...Object.entries(det).filter(([k, v]) => /^Radiometer/.test(k) && v != null).map(([, v]) => v));
  const co2 = det.CO2;
  const sm = smoke(catalog);
  const weak = sm.mats.slice(0, 2), strong = sm.mats.slice(-2);
  const rec = (id) => recs.find((r) => r.id === id);
  const bass = catalog.filter((r) => /^BASS/.test(r.program) && r.flow_cm_s != null && r.flow_cm_s <= 10);
  const bassOut = bass.filter((r) => r.outcome_group === "extinguished").length, bassKnown = bass.filter((r) => !["unknown"].includes(r.outcome_group)).length;

  const detect = {
    topic: "Detect",
    title: "Alarm on light first, confirm with temperature",
    text: `In SAFFIRE-III the camera saw the flame 0.86 s after ignition and the fastest radiometer ${fmt(radiometer, 2)} s; the CO₂ sensor needed ${fmt(co2, 1)} s. Use an optical channel to raise the alarm and the sample thermocouple to confirm it within 15 s, because radiation and plume channels also alarmed in Sample 2 without the sample heating.`,
    n: "2 burns", level: "Measured", notFor: rec("R-SAF-2")?.not_for ?? "Final alarm logic.", href: "/#response",
  };
  const smokeAdv = weak.length && strong.length ? {
    topic: "Detect",
    title: "Don't rely on the scatter smoke detector alone near wiring",
    text: `Across ${sm.tests} smoke samples, the ISS scatter detector read a median ${fmt(weak[0].scatter, 2)} V for ${weak[0].name} and ${fmt(weak[1].scatter, 2)} V for ${weak[1].name} smoke (small particles, about ${fmt(weak[0].diam, 2)}–${fmt(weak[1].diam, 2)} µm), against about ${fmt(strong[1].scatter, 1)} V for ${strong[0].name} and ${strong[1].name}. Pair it with an ionisation or particle-count channel where insulation can overheat.`,
    n: `${sm.tests} tests`, level: "Measured", notFor: "Detector thresholds: the voltages depend on the instrument set-up.", href: "/explore",
  } : null;

  const out = {};
  const st = stats.station;
  const f = st.flex, fAll = f.none.tests + f.co2.tests + f.he.tests;
  out.station = [
    detect,
    smokeAdv,
    {
      topic: "Contain",
      title: "Cut the ventilation",
      text: `Solid samples in BASS burned in a slow air flow (≤ 10 cm/s): ${bassOut} of the ${bassKnown} tests with a stated outcome went out on their own. Less air flow means less oxygen reaches the flame.`,
      n: `${bassKnown} tests`, level: "Published", notFor: "Spread rates: most BASS-II records do not state a final outcome.", href: "/compare",
    },
    {
      topic: "Suppress",
      title: "What added gas did to droplet flames in station air",
      text: `${fAll} FLEX droplet tests near 21% O₂ and 1 atm: with no added gas ${f.none.out} of ${f.none.tests} went out; with CO₂ ${f.co2.out} of ${f.co2.tests}; with helium ${f.he.out} of ${f.he.tests}.`,
      n: `${fAll} tests`, level: "Measured", notFor: "Agent choice for a cabin: these are millimetre droplets, not a cabin fire.", href: "/flame-lab",
    },
  ].filter(Boolean);

  const mo = stats.moon, mf = mo.flex, mfAll = mf.none.tests + mf.co2.tests + mf.he.tests, mfOut = mf.none.out + mf.co2.out + mf.he.out;
  const r2 = rec("R-FLEX-2");
  const band = { completion: 0, disruption: 0 };
  catalog.filter((r) => /^FLEX/.test(r.program) && +r.oxygen_mole_fraction >= 0.295 && +r.pressure_mmHg > 0 && +r.pressure_mmHg < 600).forEach((r) => { if (r.outcome_group in band) band[r.outcome_group] += 1; });
  const lunar = [
    {
      topic: "Plan for",
      title: "Richer air makes flames harder to stop",
      text: `In this habitat's air (≥ 29.5% O₂, ≤ 80 kPa) ${mfOut ? `only ${mfOut}` : "none"} of the ${mfAll} FLEX droplet tests ended with the flame going out: ${band.completion} burned to the end and ${band.disruption} broke up. Across all FLEX tests at 25% O₂ and above, 2 of 30 went out. Assume a flame here will not stop by itself.`,
      n: `${mfAll} tests in band`, level: "Measured", notFor: r2?.not_for ?? "Suppression design.", href: "/flame-lab",
    },
    {
      topic: "Plan for",
      title: "Some gas flames put themselves out at low pressure",
      text: `${mo.acme.out} of ${mo.acme.tests} ACME gas flames in this oxygen and pressure range went out on their own. Gas flames only; solids and fabrics were not tested in this air.`,
      n: `${mo.acme.tests} tests`, level: "Measured", notFor: "Solid materials or crew-cabin fires.", href: "/explore",
    },
    detect,
    {
      topic: "Gap",
      title: "No extinction limit exists for lunar gravity",
      text: rec("R-LUNAR-1")?.statement ?? "No lunar-gravity extinction threshold in the loaded records.",
      n: "2 records", level: "Published", notFor: rec("R-LUNAR-1")?.not_for ?? "Any lunar design value.", href: "/insights",
    },
  ];
  out.moon = lunar;
  out.rover = [
    { ...lunar[0] },
    { ...detect, title: "In a small cabin, every second of detection counts", text: `${detect.text} A rover cabin is much smaller than the Cygnus volume SAFFIRE burned in, so smoke and heat build up faster; the sensor order is evidence, the timing is not transferable.` },
    lunar[1],
    lunar[3],
  ];
  out.mars = [];
  return out;
}

/** Earth applications: where the same evidence is used on the ground. */
export const EARTH_USES = [
  { title: "Inert-gas extinguishers", text: "FLEX measured how much CO₂ or helium in the air puts a fuel flame out. The same question sizes inert-gas systems for server rooms, aircraft holds and archives, where water would do more damage than the fire.", evidence: "FLEX · PSI-69", href: "/flame-lab" },
  { title: "Smoke detectors that see small particles", text: "SAME and SAME-R found that smoke from overheated insulation (Kapton, Teflon) is made of small particles that a light-scatter detector barely sees. Detectors in data centres, aircraft and hospitals face the same smoke.", evidence: "SAME · PSI-102, SAME-R · PSI-101", href: "/explore" },
  { title: "Fire-resistant fabrics and firefighter gear", text: "BASS and SAFFIRE burned the cotton-fiberglass fabric used in spacecraft in slow air flows. Flame spread against and with the air flow is the same physics that rates protective clothing and furniture fabrics.", evidence: "BASS-II · PSI-25, SAFFIRE · PSI-100", href: "/compare" },
  { title: "Cleaner engines and burners", text: "Cool flames (CFI) and smoke points (SPICE) are the chemistry behind engine knock and soot. Without gravity there is no buoyancy, so the measurements are clean enough to check engine and burner models.", evidence: "CFI · PSI-39, SPICE · PSI-107", href: "/explore" },
];
