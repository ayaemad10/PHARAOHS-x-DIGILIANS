/**
 * Browser side: turns the slim payload from lib/records/encode.js back into record objects with the
 * field names the list views already use. Derived labels (fuel id, gravity preset, airflow class,
 * objective) use the same rules as data/real/normalize.js, from data/real/programMeta.js.
 */
import { NOT_RECORDED, airflowClass, gravityLabelOf, gravityPreset, kindOf, missionFor, objectiveOf, slug } from "@/data/real/programMeta";

const memo = new WeakMap();

export function decodeRecords(payload) {
  if (!payload) return [];
  if (memo.has(payload)) return memo.get(payload);
  const { fields, dict, rows } = payload;
  const out = rows.map((row) => {
    const r = {};
    fields.forEach((f, i) => { r[f] = dict[f] ? dict[f][row[i]] : row[i]; });
    const fuel = r.fuelLabel ?? NOT_RECORDED;
    const [type, topic] = r.type ? [r.type, r.topic] : kindOf(r.program);
    const cm = r.airflowCmPerS;
    return {
      ...r,
      fuel: slug(fuel),
      fuelLabel: fuel,
      type,
      topic,
      gravity: gravityPreset(r.gravityNote) ?? "microgravity",
      gravityLabel: gravityLabelOf(r.gravityNote),
      mission: missionFor(r.gravityNote),
      airflow: airflowClass(cm),
      temperature: null,
      tags: [r.program, r.psi, type?.toLowerCase(), r.outcome].filter(Boolean),
      objective: objectiveOf(r.program) ?? NOT_RECORDED,
      keyFinding: r.keyFinding ?? NOT_RECORDED,
      variables: {
        fuel,
        gravity: r.gravityNote ?? NOT_RECORDED,
        oxygen: r.oxygen == null ? NOT_RECORDED : `${r.oxygen} %`,
        pressure: r.pressure == null ? NOT_RECORDED : `${r.pressure} kPa`,
        flow: cm == null ? NOT_RECORDED : `${cm} cm/s ${r.flowDirection ?? ""}`.trim(),
        temperature: NOT_RECORDED,
        flameSpread: r.keyFinding ?? NOT_RECORDED,
        extinctionBehavior: r.outcome ?? NOT_RECORDED,
      },
    };
  });
  memo.set(payload, out);
  return out;
}
