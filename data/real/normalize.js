/**
 * Real-data adapter.
 *
 * Converts the measured and published records in ./catalog.json into the shape the pages already
 * consume. Nothing here invents a value. A field the source does not record is set to null, or to
 * the explicit text "Not recorded in source", so the UI shows a gap rather than a plausible number.
 *
 * Two derived fields are classifications, not measurements, and are labelled as such in their
 * consumers: `airflow` (Low / Medium / High from cm/s) and `gravity` (mapped to a preset id).
 */
import catalog from "./catalog.json";

import {
  NOT_RECORDED,
  PROGRAM_LABEL,
  airflowClass,
  evidenceLevelOf,
  gravityLabelOf,
  gravityPreset,
  isoDate,
  kindOf,
  missionFor,
  objectiveOf,
  slug,
} from "./programMeta";

export { NOT_RECORDED };

function oxygenPct(r) {
  if (typeof r.oxygen_pct === "number") return r.oxygen_pct;
  if (typeof r.oxygen_start_pct === "number") return r.oxygen_start_pct;
  if (typeof r.oxygen_mole_fraction === "number") return +(r.oxygen_mole_fraction * 100).toFixed(2);
  return null;
}

function pressureKpa(r) {
  if (typeof r.pressure_kpa === "number") return r.pressure_kpa;
  if (typeof r.pressure_mmHg === "number") return +(r.pressure_mmHg * 0.133322).toFixed(2);
  return null;
}

function normalize(r) {
  const program = PROGRAM_LABEL[r.program] ?? r.program ?? NOT_RECORDED;
  const isFlex = String(r.program).startsWith("FLEX");
  const [type, topic] = kindOf(program);
  const meas = r.measurements ?? {};
  const fuel = r.material ?? NOT_RECORDED;
  const cm = typeof r.flow_cm_s === "number" ? r.flow_cm_s : null;
  const flameDuration =
    typeof meas.burn_duration_s === "number" ? `${meas.burn_duration_s} s` : NOT_RECORDED;

  return {
    id: r.id,
    title: `${program} · ${r.sample ?? ""}`.trim().replace(/·\s*$/, ""),
    program,
    mission: missionFor(r.gravity_regime),
    platform: r.platform ?? r.data_origin ?? NOT_RECORDED,
    objective: objectiveOf(program) ?? NOT_RECORDED,
    fuel: slug(fuel),
    fuelLabel: fuel,
    type,
    topic,
    psi: r.psi ?? (isFlex ? "PSI-69" : null),
    gravity: gravityPreset(r.gravity_regime) ?? "microgravity",
    gravityNote: r.gravity_regime ?? NOT_RECORDED,
    gravityLabel: gravityLabelOf(r.gravity_regime),
    oxygen: oxygenPct(r),
    pressure: pressureKpa(r),
    airflow: airflowClass(cm),
    airflowCmPerS: cm,
    flowDirection: r.flow_direction ?? null,
    temperature: null,
    keyFinding: r.outcome_label ?? NOT_RECORDED,
    abstract: NOT_RECORDED,
    evidenceLevel: evidenceLevelOf(r.data_origin),
    dataOrigin: r.data_origin ?? null,
    evidenceScore: null,
    date: isoDate(r.test_date),
    tags: [program, r.psi, type.toLowerCase(), r.outcome_group].filter(Boolean),
    variables: {
      fuel,
      gravity: r.gravity_regime ?? NOT_RECORDED,
      oxygen: oxygenPct(r) === null ? NOT_RECORDED : `${oxygenPct(r)} %`,
      pressure: pressureKpa(r) === null ? NOT_RECORDED : `${pressureKpa(r)} kPa`,
      flow: cm === null ? NOT_RECORDED : `${cm} cm/s ${r.flow_direction ?? ""}`.trim(),
      temperature: NOT_RECORDED,
      flameDuration,
      flameSpread: r.outcome_label ?? NOT_RECORDED,
      extinctionBehavior: r.outcome_group ?? NOT_RECORDED,
    },
    observedBehavior: {
      shape: NOT_RECORDED,
      luminosity: NOT_RECORDED,
      stability: NOT_RECORDED,
    },
    findings: [],
    aiReading: null,
    relatedIds: [],
    sourceIds: r.source_ids ?? [],
    measurements: meas,
    qualityFlags: r.quality_flags ?? [],
  };
}

export const realExperiments = catalog.map(normalize);

// Related records: same program, first few others. Declared, not inferred from content.
const byProgram = new Map();
realExperiments.forEach((e) => {
  if (!byProgram.has(e.program)) byProgram.set(e.program, []);
  byProgram.get(e.program).push(e.id);
});
realExperiments.forEach((e) => {
  e.relatedIds = (byProgram.get(e.program) ?? []).filter((id) => id !== e.id).slice(0, 3);
});
