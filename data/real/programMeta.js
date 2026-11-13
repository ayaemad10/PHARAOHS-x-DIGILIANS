/**
 * Programme metadata and the small classification rules shared by the server (normalize.js) and
 * the browser (lib/records/decode.js). This file must not import the catalog: it is bundled for
 * the browser, and the catalog is not.
 */

export const NOT_RECORDED = "Not recorded in source";

export const PROGRAM_LABEL = {
  "SAFFIRE-III": "SAFFIRE-III",
  "Saffire-1": "SAFFIRE-I",
  "Saffire-2": "SAFFIRE-II",
  "Saffire-IV": "SAFFIRE-IV",
  "Saffire-V": "SAFFIRE-V",
  "Saffire-VI": "SAFFIRE-VI",
  BASS: "BASS",
  "BASS-II": "BASS-II",
  LUCI: "LUCI",
  "FLEX droplet (PSI-69)": "FLEX",
};

export function slug(text) {
  return String(text ?? "unknown")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

/* What kind of test each program is, and the question it answers. Used for the Type and Topic filters. */
const KIND = {
  FLEX: ["Liquid-fuel droplet", "Droplet extinction"],
  CFI: ["Liquid-fuel droplet", "Cool flames"],
  "Cool flames": ["Liquid-fuel droplet", "Cool flames"],
  SAME: ["Smoke aerosol", "Smoke detection"],
  "SAME-R": ["Smoke aerosol", "Smoke detection"],
  SPICE: ["Gaseous fuel jet", "Soot and smoke point"],
  ACME: ["Gaseous fuel flame", "Flame extinction"],
  "Counterflow extinction": ["Counterflow flame", "Extinction limits"],
};
export const kindOf = (program) => KIND[program] ?? ["Solid fuel", "Flame spread"];

/* What each investigation set out to study (from the NASA challenge brief and the PSI tables). */
const OBJECTIVE = {
  FLEX: "Droplet flame extinction, including suppression by diluting the air with CO₂ or helium",
  CFI: "Cool flames of liquid-fuel droplets (FLEX-2 hardware, Multi-user Droplet Combustion Apparatus)",
  "Cool flames": "Cool-flame extinction diameters of fuel droplets, digitised from published figures",
  SAME: "Smoke from overheated spacecraft materials, read by smoke detectors in microgravity",
  "SAME-R": "Smoke from overheated spacecraft materials, read by smoke detectors in microgravity (reflight)",
  SPICE: "How sooty a gas flame is (smoke point) with and without gravity",
  ACME: "Gaseous-fuel flames in the Combustion Integrated Rack: when they sustain and when they put themselves out",
  "Counterflow extinction": "Ground (1 g) extinction limits of hot and cool counterflow flames, a reference for microgravity",
  "BASS-II": "Flammability of solid materials in a low-speed flow duct (Microgravity Science Glovebox)",
  BASS: "Flammability of solid materials in a low-speed flow duct (Microgravity Science Glovebox)",
  LUCI: "Flammability at simulated lunar gravity on a spinning sounding rocket",
};
export const objectiveOf = (program) =>
  OBJECTIVE[program] ?? (/saffire/i.test(program) ? "Large-scale fire spread on spacecraft materials inside an uncrewed cargo vehicle" : null);

export function gravityPreset(regime) {
  const text = String(regime ?? "").toLowerCase();
  if (text.startsWith("1 g")) return "1g";
  if (text.includes("lunar")) return "0.16g";
  if (text.includes("micro") || text.includes("low gravity") || text.includes("free")) return "microgravity";
  return null;
}

/** Short gravity label for cards and tables. The full source wording stays on the record page. */
export function gravityLabelOf(regime) {
  const preset = gravityPreset(regime);
  if (preset === "1g") return "1 g (ground)";
  if (preset === "0.16g") return "Lunar (simulated)";
  if (preset === "microgravity") return "Microgravity";
  return regime ?? NOT_RECORDED;
}

export function missionFor(regime) {
  const text = String(regime ?? "").toLowerCase();
  if (text.startsWith("1 g")) return "earth";
  if (text.includes("lunar")) return "moon";
  return "iss";
}

export function airflowClass(cmPerS) {
  if (cmPerS === null || cmPerS === undefined) return null;
  if (cmPerS <= 10) return "Low";
  if (cmPerS <= 25) return "Medium";
  return "High";
}

/**
 * Evidence level, defined once for the whole app.
 *   Measured  = a value from a PSI experimental table (data_origin "CSV table (PSI-…)") or from the
 *               SAFFIRE-III sensor workbook ("measured: …").
 *   Published = digitised from a published figure (PSI-117, PSI-142), or a published table / paper
 *               only (LUCI, BASS reports, SAFFIRE summary tables).
 */
export function evidenceLevelOf(dataOrigin) {
  const text = String(dataOrigin ?? "").toLowerCase();
  return text.startsWith("csv table") || text.startsWith("measured") ? "Measured" : "Published";
}

/** Any source date (8/26/2009, 10/24/09, 2017-03-21) to ISO yyyy-mm-dd, or null. */
export function isoDate(value) {
  if (!value) return null;
  const s = String(value).trim();
  if (/^\d{4}-\d{2}-\d{2}/.test(s)) return s.slice(0, 10);
  const m = s.match(/^(\d{1,2})\/(\d{1,2})\/(\d{2}|\d{4})$/);
  if (!m) return null;
  let year = Number(m[3]);
  if (m[3].length === 2) year += 2000;
  return `${year}-${m[1].padStart(2, "0")}-${m[2].padStart(2, "0")}`;
}
