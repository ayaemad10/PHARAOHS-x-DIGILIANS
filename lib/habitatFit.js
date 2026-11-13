/**
 * How closely one test resembles a habitat's conditions. A transparent points score, not a model:
 * every point comes with the reason shown on the card.
 *
 *   air      3  oxygen AND pressure inside the habitat's band (same bands as Fire Response)
 *            1  only the oxygen is inside the band
 *   gravity  2  gravity the habitat has (microgravity for the station, partial gravity for Moon / rover)
 *            1  microgravity, for a Moon or rover habitat (closer than 1 g)
 *   sensors  1  smoke or fire-sensor data (SAME, SAFFIRE), useful for detection anywhere
 *   source   1  measured on the test, not only published
 * Max 7. Tests on the ground (1 g) never get gravity points.
 */
export const HABITAT_OPTIONS = [
  { id: "", label: "Any habitat" },
  { id: "station", label: "Space station", o2: [19.5, 22.5], kpa: [93, 107] },
  { id: "moon", label: "Moon Base", o2: [29.5, 100], kpa: [0.01, 80] },
  { id: "rover", label: "Pressurized rover", o2: [29.5, 100], kpa: [0.01, 80] },
];
export const FIT_MAX = 7;

const inBand = (v, [lo, hi]) => v != null && v >= lo && v <= hi;

export function habitatFit(e, habitatId) {
  const h = HABITAT_OPTIONS.find((x) => x.id === habitatId);
  if (!h || !h.o2) return null;
  let score = 0;
  const why = [];
  const o2ok = inBand(e.oxygen, h.o2), pok = inBand(e.pressure, h.kpa);
  if (o2ok && pok) { score += 3; why.push("same air"); }
  else if (o2ok) { score += 1; why.push("same oxygen"); }
  const g = e.gravity;
  if (habitatId === "station" && g === "microgravity") { score += 2; why.push("microgravity"); }
  if (habitatId !== "station") {
    if (g === "0.16g") { score += 2; why.push("lunar gravity"); }
    else if (g === "microgravity") { score += 1; why.push("low gravity"); }
  }
  if (/^(SAME|SAFFIRE)/i.test(e.program)) { score += 1; why.push("sensor data"); }
  if (e.evidenceLevel === "Measured") { score += 1; why.push("measured"); }
  return { score, why };
}

/* ---------- CSV ---------- */
const COLS = [
  ["id", (e) => e.id],
  ["programme", (e) => e.program],
  ["psi", (e) => e.psi],
  ["title", (e) => e.title],
  ["type", (e) => e.type],
  ["topic", (e) => e.topic],
  ["fuel", (e) => e.fuelLabel],
  ["gravity", (e) => e.gravityNote],
  ["oxygen_pct", (e) => e.oxygen],
  ["pressure_kpa", (e) => e.pressure],
  ["flow_cm_per_s", (e) => e.airflowCmPerS],
  ["outcome", (e) => e.variables?.extinctionBehavior],
  ["finding", (e) => e.keyFinding],
  ["evidence", (e) => e.evidenceLevel],
  ["date", (e) => e.date],
];
const cell = (v) => {
  if (v == null || v === "Not recorded") return "";
  const s = String(v);
  return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
};

export function toCsv(rows, habitatId = "") {
  const extra = habitatId ? [["habitat_fit", (e) => habitatFit(e, habitatId)?.score], ["fit_reasons", (e) => habitatFit(e, habitatId)?.why.join("; ")]] : [];
  const cols = [...COLS, ...extra];
  return [cols.map((c) => c[0]).join(","), ...rows.map((e) => cols.map(([, f]) => cell(f(e))).join(","))].join("\r\n");
}

export function downloadCsv(text, name) {
  const blob = new Blob(["﻿" + text], { type: "text/csv;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url; a.download = name; document.body.appendChild(a); a.click(); a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
