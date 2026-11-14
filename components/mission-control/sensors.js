/**
 * The five detection systems of SAFFIRE-III, named for what they physically measure.
 * Detection times come from public/data/saffire/detection.json (threshold rule k·σ over the
 * 5–55 s baseline, 3 consecutive samples) — except the camera, which comes from the frame
 * analysis in saffire_summary.json. Positions in the 3D cabin are illustrative: the sensor
 * workbook does not document where each sensor sat (open gap GAP-03).
 */
export const SENSORS = [
  {
    id: "camera", plain: "Camera", short: "Camera", icon: "camera", color: 0xffd166, css: "#FFD166",
    channels: null,
    measures: "Video of the sample (camera S1C1 / S2C2). Detection = first frame where the flame is visible.",
    location: "Looking at the sample through the flow-duct window.",
    why: "Sees the flame itself, but a person or an image algorithm has to be watching the feed.",
    pos: [0.5, 1.5, 1.2],
  },
  {
    id: "radiation", plain: "Radiometer", short: "Radiometer", icon: "sun", color: 0x34d5d0, css: "#34D5D0",
    channels: ["Radiometer 1", "Radiometer 2", "Radiometer 3", "Radiometer 4"],
    measures: "Radiant heat flux from the flame (mW/cm²) — the flame's glow, including infrared. This is the 'light sensor'.",
    location: "Facing the sample (four radiometers; exact positions not documented).",
    why: "Radiation travels at the speed of light, so it does not wait for hot gas to drift to a sensor.",
    pos: [-1.3, 1.3, 0.9],
  },
  {
    id: "sampleTemp", plain: "Sample thermocouple", short: "Heat (sample)", icon: "thermometer", color: 0xff9b50, css: "#FF9B50",
    channels: ["Sample Temp 1 (TC7)", "Sample Temp 2 (TC8)", "Sample Temp 3 (TC9)", "Sample Temp 4 (TC10)", "Sample Temp 5 (TC11)", "Sample Temp 6 (TC12)"],
    measures: "Temperature of the fabric itself (°C), six thermocouples TC7–TC12.",
    location: "On the sample; only the thermocouple the flame reaches first reacts early.",
    why: "Very direct, but only works if the fire starts where the sensor is.",
    pos: [0.3, -0.35, 0.18],
  },
  {
    id: "plume", plain: "Plume thermocouple", short: "Hot gas (plume)", icon: "wind", color: 0xc77dff, css: "#C77DFF",
    channels: ["Plume Temp 1 (TC1)", "Plume Temp 2 (TC2)", "Plume Temp 3 (TC3)", "Plume Temp 4 (TC4)", "Plume Temp 5 (TC5)", "Plume Temp 6 (TC6)"],
    measures: "Temperature of the hot gas (°C) carried downstream by the airflow, TC1–TC6. This is not a smoke detector.",
    location: "Downstream of the sample, in the flow.",
    why: "In microgravity hot gas does not rise; it only arrives if the airflow carries it there.",
    pos: [2.9, 0.6, 0.2],
  },
  {
    id: "co2", plain: "CO₂ sensor", short: "Gas (CO₂)", icon: "gauge", color: 0x4da3ff, css: "#4DA3FF",
    channels: ["CO2"],
    measures: "Carbon dioxide concentration (%) — a product of combustion.",
    location: "In the avionics bay at the air inlet (per the DoD), not next to the fire — so its signal is delayed and diluted.",
    why: "Gas sensors are common on spacecraft, but they only respond after combustion products mix through the air.",
    pos: [5.2, 1.6, -1.85],
  },
];

/** Earliest detection per sensor group at threshold k (seconds after ignition), plus the channel that fired. */
export function detectionAt(detection, saffire, sample, k) {
  const g = detection?.k_options?.[String(k)]?.[sample] || {};
  const s = sample === "sample1" ? saffire.sample1 : saffire.sample2;
  const out = {};
  SENSORS.forEach((sn) => {
    if (sn.id === "camera") { out.camera = s.cameraFlameFirstVisibleS != null ? { t: s.cameraFlameFirstVisibleS - saffire.igniterS, ch: "frame analysis" } : null; return; }
    let best = null;
    sn.channels.forEach((ch) => { const v = g[ch]; if (v != null && (best == null || v < best.t)) best = { t: v, ch }; });
    out[sn.id] = best;
  });
  return out;
}
