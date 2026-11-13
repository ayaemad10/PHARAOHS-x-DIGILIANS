/**
 * Fire Response: everything the decision view computes, in one place.
 *
 * Nothing here predicts a fire. The alarm rules are run over the recorded SAFFIRE-III sensor
 * series, and the suppression figures are counts of FLEX droplet tests. Where a habitat has no
 * matching record the functions return zero tests, and the view says so.
 */

export const HABITATS = [
  { id: "station", label: "Space station", air: "21% O₂ · 14.7 psi", cutFlame: 0.35, note: "Close to the air the SAFFIRE and most BASS burns used." },
  { id: "moon", label: "Moon Base", air: "30%+ O₂ · 10.2 psi", cutFlame: 0.7, note: "Richer oxygen at lower pressure, as planned for lunar surface habitats." },
  { id: "rover", label: "Pressurized rover", air: "30%+ O₂ · 10.2 psi", cutFlame: 0.7, note: "Same planned atmosphere as the Moon Base, in a much smaller volume." },
  { id: "mars", label: "Mars base", air: "no evidence yet", disabled: true, note: "No record in this dataset was taken at Mars gravity." },
];

/* 10.2 psi = 527 mmHg = 70.3 kPa. FLEX pressures are in mmHg, BASS in kPa. */
const BAND = {
  station: { flex: (r) => +r.oxygen_mole_fraction >= 0.195 && +r.oxygen_mole_fraction <= 0.225 && +r.pressure_mmHg >= 700 && +r.pressure_mmHg <= 800, bass: (r) => +r.oxygen_pct >= 19.5 && +r.oxygen_pct <= 22.5 && +r.pressure_kpa >= 93 && +r.pressure_kpa <= 107 },
  moon: { flex: (r) => +r.oxygen_mole_fraction >= 0.295 && +r.pressure_mmHg > 0 && +r.pressure_mmHg < 600, bass: (r) => +r.oxygen_pct >= 29.5 && +r.pressure_kpa > 0 && +r.pressure_kpa <= 80 },
};
BAND.station.gas = (r) => +r.oxygen_pct >= 19.5 && +r.oxygen_pct <= 22.5 && +r.pressure_kpa >= 93 && +r.pressure_kpa <= 107;
BAND.moon.gas = (r) => +r.oxygen_pct >= 29.5 && +r.pressure_kpa > 0 && +r.pressure_kpa <= 80;
BAND.rover = BAND.moon;

const fam = (p) => (/saffire/i.test(p) ? "SAFFIRE" : /bass/i.test(p) ? "BASS" : /flex/i.test(p) ? "FLEX" : /luci/i.test(p) ? "LUCI" : /^same/i.test(p) ? "SAME" : p === "ACME" ? "ACME" : p === "CFI" ? "CFI" : "Other");
const diluent = (r) => (+r.he_mole_fraction > 0 ? "he" : +r.co_mole_fraction > 0 ? "co2" : "none");
const tally = (rows) => {
  const out = { none: { tests: 0, out: 0 }, co2: { tests: 0, out: 0 }, he: { tests: 0, out: 0 } };
  rows.forEach((r) => { const d = out[diluent(r)]; d.tests += 1; if (r.outcome_group === "extinction") d.out += 1; });
  return out;
};

/**
 * Server-side: what the catalog holds for each habitat.
 * `flex` = extinction counts by what was added to the air (the PSI-69 table's `co` column is the
 * CO₂ diluent: fractions reach 0.7 and the four gas columns sum to 1).
 */
export function habitatStats(catalog) {
  const flexAll = catalog.filter((r) => fam(r.program) === "FLEX");
  const bassAll = catalog.filter((r) => fam(r.program) === "BASS");
  const saffire = catalog.filter((r) => fam(r.program) === "SAFFIRE").length;
  const luci = catalog.filter((r) => fam(r.program) === "LUCI").length;
  const acmeAll = catalog.filter((r) => fam(r.program) === "ACME" && r.outcome_group !== "unknown");
  const cfiAll = catalog.filter((r) => fam(r.program) === "CFI");
  const same = catalog.filter((r) => fam(r.program) === "SAME").length;
  const stats = { all: { flex: tally(flexAll), flexTests: flexAll.length } };
  for (const id of ["station", "moon", "rover"]) {
    const fx = flexAll.filter(BAND[id].flex), bs = bassAll.filter(BAND[id].bass);
    const ac = acmeAll.filter(BAND[id].gas), cf = cfiAll.filter(BAND[id].gas);
    const lunar = id !== "station";
    const ranked = [
      { family: "FLEX", n: fx.length, why: "Droplet flames in this oxygen and pressure range: how they ended, with and without CO₂ or helium." },
      { family: "BASS", n: bs.length, why: "Fabric and acrylic samples in a low-speed flow duct: the evidence behind cutting ventilation." },
      { family: "SAFFIRE", n: lunar ? 0 : saffire, why: lunar ? "Large fabric fires with sensor data, but SAFFIRE-III measured about 20% oxygen. Useful for detection timing only." : "Large fabric fires in an orbiting vehicle; SAFFIRE-III carries the sensor data used for detection.", caveat: lunar ? "different atmosphere" : "oxygen is not in most records" },
      { family: "ACME", n: ac.length, why: "Gaseous-fuel flames in this oxygen and pressure range: how many put themselves out.", caveat: "gas flames, not solids" },
      { family: "CFI", n: cf.length, why: "Cool-flame droplet tests (FLEX-2) in this air.", caveat: "" },
      { family: "SAME", n: same, why: "Smoke from overheated spacecraft materials, read by ISS-type smoke detectors. Relevant to detection in any habitat.", caveat: "smoke, not flame" },
      { family: "LUCI", n: lunar ? luci : 0, why: lunar ? "The only partial-gravity burns here: simulated lunar gravity on a sounding rocket. From a published paper, not from PSI." : "Lunar-gravity burns; not this habitat.", caveat: lunar ? "published, not in PSI" : "" },
    ].sort((a, b) => (a.family === "SAME") - (b.family === "SAME") || b.n - a.n); // smoke evidence is listed last: it applies everywhere
    stats[id] = { flex: tally(fx), flexTests: fx.length, bassTests: bs.length, acme: { tests: ac.length, out: ac.filter((r) => r.outcome_group === "extinction").length }, ranked: ranked.filter((r) => r.n > 0), total: ranked.reduce((s, r) => s + r.n, 0) };
  }
  return stats;
}

/* ---------- client-side: alarm rules over the recorded series ---------- */
const stat = (a) => { const m = a.reduce((s, v) => s + v, 0) / a.length; return [m, Math.sqrt(a.reduce((s, v) => s + (v - m) ** 2, 0) / a.length)]; };
const at = (t, x) => { let lo = 0, hi = t.length - 1; while (lo < hi) { const m = (lo + hi) >> 1; if (t[m] < x) lo = m + 1; else hi = m; } return lo; };
function firstHeld(t, arr, thr, from, ig, hold) { let c = 0; for (let i = from; i < arr.length; i++) { if (arr[i] > thr) { c += 1; if (c >= hold) return t[i - hold + 1] - ig; } else c = 0; } return null; }

/**
 * For each sensor: when a fixed threshold and a rate-of-rise rule would have alarmed.
 * Both use mean + k·σ of the 5–55 s baseline, held for 3 samples; rate of rise applies it to the
 * 1-second slope instead of the value. `det` supplies the camera time (frame analysis) and the
 * channel each sensor group detected on.
 */
export function alarmTable(s, ig, det, sensors, k = 5) {
  if (!s?.t) return null;
  const t = s.t, a = at(t, 5), b = at(t, 55), i0 = at(t, ig), W = Math.max(1, Math.round(1 / (t[1] - t[0])));
  const out = {};
  for (const sn of sensors) {
    if (sn.id === "camera") { out.camera = { threshold: det.camera?.t ?? null, rise: null }; continue; }
    const key = (c) => (c === "CO2" ? "co2" : c);
    const y = s[key(det[sn.id]?.ch)] || s[key(sn.channels[0])];
    if (!y) { out[sn.id] = { threshold: null, rise: null }; continue; }
    const slope = y.map((v, i) => (i >= W ? (v - y[i - W]) / (t[i] - t[i - W]) : 0));
    const [m, sd] = stat(y.slice(a, b)), [ms, ss] = stat(slope.slice(a + W, b));
    out[sn.id] = { threshold: firstHeld(t, y, m + k * sd, i0, ig, 3), rise: firstHeld(t, slope, ms + k * ss, i0, ig, 3) };
  }
  return out;
}

/** Seconds after ignition at which each thermocouple on the fabric first passed 100 °C, earliest first. */
export function fabricHeating(s, ig, channels) {
  if (!s?.t) return [];
  const i0 = at(s.t, ig);
  return channels.map((c) => { const y = s[c]; if (!y) return null; for (let i = i0; i < y.length; i++) if (y[i] > 100) return s.t[i] - ig; return null; }).filter((v) => v != null).sort((x, y) => x - y);
}

/* ---------- shared replay scale (Dashboard timeline and Fire Response race) ---------- */
export const PRE = 2, POST = 72;
/** Seconds after ignition → percent across the track. The first 10 s get 60 % of the width. */
export const tx = (rel) => { const r = Math.max(-PRE, Math.min(POST, rel)); if (r <= 10) return ((r + PRE) / (10 + PRE)) * 60; return 60 + ((r - 10) / (POST - 10)) * 40; };
