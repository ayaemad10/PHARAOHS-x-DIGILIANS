/**
 * Evidence timelines from measured data only.
 *
 * Previously held authored dates and stages for synthetic records. Now a timeline exists only where
 * we have measured event times: the SAFFIRE-III sensor and camera analysis. Every other record
 * returns an empty list, and the panel says so, rather than showing invented history.
 */

const STAGE_LABEL = {
  igniter: "Igniter enabled",
  flame: "Flame visible",
  sensor: "Sensor response",
  threshold: "Threshold crossed",
};

const SAMPLE1 = [
  { t: 60.0, stage: "igniter", label: "Igniter enabled", detail: "Igniter power enable, sensor log." },
  { t: 60.86, stage: "flame", label: "Flame first visible (camera)", detail: "S1C1, bright-pixel level above threshold on LED-off frames." },
  { t: 63.06, stage: "sensor", label: "Radiometer 3 threshold", detail: "Baseline 5-55 s, k = 5, 3 samples." },
  { t: 64.19, stage: "sensor", label: "Sample temperature TC9 threshold", detail: "Baseline 5-55 s, k = 5, 3 samples." },
  { t: 66.46, stage: "sensor", label: "Sample temperature TC9 above 100 C", detail: "Measured absolute value." },
  { t: 67.91, stage: "sensor", label: "Plume temperature TC3 threshold", detail: "Baseline 5-55 s, k = 5, 3 samples." },
];

const SAMPLE2 = [
  { t: 60.0, stage: "igniter", label: "Igniter enabled", detail: "Igniter power enable, sensor log." },
  { t: 60.81, stage: "flame", label: "Flame line first visible (camera)", detail: "S2C2, ignition edge; did not spread within 160 s recorded." },
  { t: 63.19, stage: "sensor", label: "Radiometer 2 threshold", detail: "Baseline 5-55 s, k = 5, 3 samples." },
  { t: 68.97, stage: "sensor", label: "Plume temperature TC3 threshold", detail: "Baseline 5-55 s, k = 5, 3 samples." },
];

function toEntries(experimentId, rows) {
  return rows.map((row) => ({
    experimentId,
    stage: row.stage,
    stageLabel: STAGE_LABEL[row.stage] ?? row.stage,
    weight: null,
    icon: null,
    date: `t = ${row.t.toFixed(2)} s`,
    label: row.label,
    detail: row.detail,
  }));
}

const timelines = {
  "saffire-iii-s1": toEntries("saffire-iii-s1", SAMPLE1),
  "saffire-iii-s2": toEntries("saffire-iii-s2", SAMPLE2),
};

export const experimentTimelines = timelines;

export function getTimelineForExperiment(id) {
  return timelines[id] ?? [];
}

export const TIMELINE_STAGES = Object.fromEntries(
  Object.entries(STAGE_LABEL).map(([key, label]) => [key, { label, order: 0, weight: null, icon: null }]),
);
