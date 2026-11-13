/**
 * Server side: the slim record list sent to list pages (Explore, Compare, Flame Lab, Mission Lab).
 *
 * The full record (measurements, quality flags, sources) only loads on /experiments/[id]. Here each
 * record is one array, and repeated text (programme, fuel, gravity wording, outcome…) is replaced by
 * an index into a shared dictionary, so 1,412 records stay small in the page HTML. Values are copied,
 * never rounded or changed. lib/records/decode.js turns this back into record objects.
 */
import { experiments } from "@/data/experiments";

export const FIELDS = ["id", "title", "program", "psi", "fuelLabel", "gravityNote", "type", "topic", "outcome", "evidenceLevel", "flowDirection", "dataOrigin", "oxygen", "pressure", "airflowCmPerS", "date", "keyFinding"];
const DICT = new Set(["program", "psi", "fuelLabel", "gravityNote", "type", "topic", "outcome", "evidenceLevel", "flowDirection", "dataOrigin"]);

let cached = null;

export function encodeRecords(list = experiments) {
  if (cached && list === experiments) return cached;
  const dict = {};
  const index = {};
  DICT.forEach((f) => { dict[f] = []; index[f] = new Map(); });
  const value = (e, f) => (f === "outcome" ? e.variables?.extinctionBehavior ?? null : e[f] ?? null);
  const rows = list.map((e) =>
    FIELDS.map((f) => {
      const v = value(e, f);
      if (!DICT.has(f)) return v;
      if (!index[f].has(v)) { index[f].set(v, dict[f].length); dict[f].push(v); }
      return index[f].get(v);
    }),
  );
  const payload = { fields: FIELDS, dict, rows };
  if (list === experiments) cached = payload;
  return payload;
}
