/**
 * Programme-level comparison. The ranges, fuels and outcome counts are computed from the catalog;
 * the hardware and "measured" lines are short descriptions from the PSI dataset pages and the
 * published papers listed with each record.
 */
export const PROGRAMMES = [
  { id: "ACME", match: (p) => p === "ACME", psi: "PSI-159", where: "ISS · Combustion Integrated Rack (CIR)", hardware: "Gas-jet and porous burners; flames of gaseous fuel in quiescent or slow coflowing air", sensors: "Flame imaging (colour and intensified cameras), radiometers, flame temperature", use: "When a gas flame keeps burning or puts itself out at high oxygen and low pressure" },
  { id: "FLEX", match: (p) => /^FLEX/.test(p), psi: "PSI-69", where: "ISS · CIR, Multi-user Droplet Combustion Apparatus", hardware: "Free-floating fuel droplets, about 1–5 mm, ignited by hot wires", sensors: "Droplet size over time (backlit camera), flame images, radiometers", use: "Which air mixtures, including added CO₂ or helium, put a fuel flame out" },
  { id: "CFI", match: (p) => p === "CFI", psi: "PSI-39", where: "ISS · CIR, Multi-user Droplet Combustion Apparatus", hardware: "Free-floating droplets that keep burning as a low-temperature (cool) flame", sensors: "Droplet size over time, flame images, radiometers", use: "Fuel vapour that can re-ignite after the visible flame goes out" },
  { id: "BASS", match: (p) => /^BASS/.test(p), psi: "PSI-25", where: "ISS · Microgravity Science Glovebox (MSG)", hardware: "Small flow duct; fabric, acrylic (PMMA) and other solid samples in a set air speed", sensors: "Flame-spread video; ignition, spread and extinction outcome", use: "Whether solids keep burning when the air flow is slowed: the case for cutting ventilation" },
  { id: "SAFFIRE", match: (p) => /saffire/i.test(p), psi: "PSI-100", where: "Cygnus cargo vehicle, after leaving the ISS", hardware: "Large flow duct with fabric and other material samples, up to about 0.4 × 0.94 m", sensors: "Cameras, radiometers, thermocouples, O₂ and CO₂ sensors across the vehicle", use: "Large-fire growth and when each sensor would have raised the alarm" },
  { id: "SAME", match: (p) => /^SAME/.test(p), psi: "PSI-102 · PSI-101", where: "ISS · Microgravity Science Glovebox (MSG)", hardware: "Heated samples of spacecraft materials (Kapton, Teflon, silicone, cellulose); an aging chamber", sensors: "Smoke particle size and number; responses of ISS-type ionisation and photoelectric smoke detectors", use: "Whether smoke detectors see the smoke that overheated materials give off in microgravity" },
  { id: "SPICE", match: (p) => p === "SPICE", psi: "PSI-107", where: "ISS · Microgravity Science Glovebox (MSG)", hardware: "Coflow burner; gaseous fuel jets in a coflow of air", sensors: "Flame length at the smoke point, from flame images", use: "When a flame starts to give off soot (smoke)" },
  { id: "Counterflow", match: (p) => /^Counterflow/.test(p), psi: "PSI-142", where: "Ground laboratory (1 g)", hardware: "Counterflow burner: fuel and air jets meeting head-on", sensors: "Strain rate and composition at extinction", use: "Earth (1 g) reference for extinction limits" },
  { id: "Cool flames", match: (p) => p === "Cool flames", psi: "PSI-117", where: "Published experiments", hardware: "Data points compiled from published cool-flame studies", sensors: "Cool-flame and extinction conditions", use: "Cross-check for the CFI cool-flame results" },
  { id: "LUCI", match: (p) => p === "LUCI", psi: "published paper", where: "Simulated lunar gravity", hardware: "Solid samples burned at simulated lunar gravity", sensors: "Spread and extinction", use: "The only partial-gravity burns in this dataset" },
];

const range = (vals, unit, digits = 1) => {
  const v = vals.filter((x) => x != null && Number.isFinite(+x)).map(Number);
  if (!v.length) return { text: "Not recorded", n: 0 };
  const lo = Math.min(...v), hi = Math.max(...v), f = (x) => (+x.toFixed(digits)).toString();
  return { text: lo === hi ? `${f(lo)} ${unit}` : `${f(lo)}–${f(hi)} ${unit}`, n: v.length };
};
const top = (vals, k) => {
  const c = new Map();
  vals.filter((x) => x && x !== "Not recorded").forEach((x) => c.set(x, (c.get(x) || 0) + 1));
  return [...c.entries()].sort((a, b) => b[1] - a[1]).slice(0, k);
};
const OUTCOME = { extinction: "went out", extinguished: "went out", sustained: "kept burning", completion: "burned to completion", disruption: "droplet broke up", cool_flame: "cool flame", smoke_test: "smoke sample", smoke_point: "smoke point", not_ignited: "did not ignite", ignited_no_spread: "ignited, no spread", unknown: "outcome not recorded" };

/** Server-side: one summary per programme, computed from the normalised experiments. */
export function programmeStats(experiments) {
  return PROGRAMMES.map((p) => {
    const rows = experiments.filter((e) => p.match(e.program));
    const { match, ...meta } = p; // functions cannot be passed to client components
    void match;
    return {
      ...meta,
      records: rows.length,
      measured: rows.filter((e) => e.evidenceLevel === "Measured").length,
      fuels: top(rows.map((e) => e.fuelLabel), 4),
      fuelKinds: new Set(rows.map((e) => e.fuelLabel).filter((x) => x && x !== "Not recorded")).size,
      oxygen: range(rows.map((e) => e.oxygen), "% O₂"),
      pressure: range(rows.map((e) => e.pressure), "kPa"),
      flow: range(rows.map((e) => e.airflowCmPerS), "cm/s"),
      gravity: top(rows.map((e) => e.gravityNote), 3).map(([g]) => g),
      outcomes: top(rows.map((e) => e.variables?.extinctionBehavior), 4).map(([o, n]) => [OUTCOME[o] || o, n]),
    };
  }).filter((p) => p.records > 0);
}
