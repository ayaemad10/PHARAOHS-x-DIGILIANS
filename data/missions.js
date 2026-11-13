import { HABITATS } from "@/lib/response";

/* Habitat air comes from the one definition the whole app uses (lib/response.js). */
const HAB = Object.fromEntries(HABITATS.map((h) => [h.id, h]));
/**
 * Mission environments. Gravity and atmosphere values are reference facts. Every description, count
 * and concern below is derived from the loaded records, so an environment with no records says so.
 *
 * The prototype descriptions are kept as missions.prototype.js and are not imported.
 */
import { experiments } from "./experiments";
import { missionFindings } from "./insights";

const of = (mission) => experiments.filter((e) => e.mission === mission);
const programs = (list) => [...new Set(list.map((e) => e.program))].join(", ") || "none";
const count = (mission) => of(mission).length;

function describe(mission, ref) {
  const recs = of(mission.id);
  if (!recs.length) {
    return {
      context: `No loaded records at ${ref.gravityLabel}. The records here cannot describe this environment.`,
      combustionEnvironment: "No measured or published record in the loaded catalog.",
      primaryConcern: "Unknown from the loaded records.",
      concerns: [`0 records at ${ref.gravityLabel}`],
      caveat: "Reference environment only. Gravity and atmosphere values are reference facts, not combustion results.",
    };
  }
  const outcomes = [...new Set(recs.map((e) => e.keyFinding))].slice(0, 3);
  return {
    context: `${recs.length} loaded record${recs.length === 1 ? "" : "s"} at ${ref.gravityLabel} from ${programs(recs)}.`,
    combustionEnvironment: `Records use ${[...new Set(recs.map((e) => e.type))].join(" and ")}. Gravity is recorded as: ${[...new Set(recs.map((e) => e.gravityNote))].slice(0, 2).join("; ")}.`,
    primaryConcern: outcomes.length ? `Recorded outcomes: ${outcomes.join("; ")}.` : "No outcome recorded.",
    concerns: (missionFindings[mission.id] ?? []).slice(0, 3).map((f) => f.statement || f.title),
    caveat: "Counts and outcomes are taken from the loaded records. Reference values are not combustion results.",
  };
}

const BASE = [
  { id: "earth", name: "Earth", shortName: "1g", gravityLabel: "1 g", gravityValue: 1, atmosphereLabel: "21% O₂", atmosphereShort: "Nitrogen–oxygen, ambient", oxygenValue: 21, indicator: "reference" },
  { id: "iss", name: "ISS", shortName: "Orbital μg", gravityLabel: "μg (orbital)", gravityValue: 0.000001, atmosphereLabel: HAB.station.air, atmosphereShort: HAB.station.note, oxygenValue: 21, indicator: "orbital" },
  { id: "moon", name: "Moon", shortName: "0.16g", gravityLabel: "0.16 g", gravityValue: 0.16, atmosphereLabel: HAB.moon.air, atmosphereShort: HAB.moon.note, oxygenValue: 30, indicator: "airless" },
  { id: "mars", name: "Mars", shortName: "0.38g", gravityLabel: "0.38 g", gravityValue: 0.38, atmosphereLabel: "Habitat air not defined", atmosphereShort: HAB.mars.note, oxygenValue: 0, indicator: "inert-rich" },
];

export const missions = BASE.map((m) => ({
  ...m,
  ...describe(m, m),
  combustionEnvironment: describe(m, m).combustionEnvironment,
  recordCount: count(m.id),
}));

const BY_ID = new Map(missions.map((mission) => [mission.id, mission]));

export function getMissionById(id) {
  return BY_ID.get(id) ?? missions[0];
}

export function getDefaultMission() {
  return missions[0];
}

/** Row definitions for the Moon vs Mars comparison card. Each cell is read from the record-derived fields. */
export const MISSION_COMPARISON_ROWS = [
  { id: "gravity", label: "Gravity", pick: (mission) => mission.gravityLabel },
  { id: "atmosphere", label: "Atmospheric context", pick: (mission) => mission.atmosphereShort },
  { id: "records", label: "Loaded records", pick: (mission) => String(mission.recordCount) },
  { id: "combustion", label: "Combustion environment", pick: (mission) => mission.combustionEnvironment },
  { id: "concern", label: "Recorded outcomes", pick: (mission) => mission.primaryConcern },
];
