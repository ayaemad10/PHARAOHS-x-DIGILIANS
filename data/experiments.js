/**
 * Experiment records, from measured and published sources only.
 *
 * Previously this file held synthetic demonstration records. It now re-exports the normalized
 * catalog in ./real, with the same export names the rest of the app already imports, so no page
 * or API module had to change its imports. The prototype file is kept as experiments.prototype.js
 * for reference and is not imported anywhere.
 */
import { realExperiments } from "./real/normalize";

export const experiments = realExperiments;

const BY_ID = new Map(experiments.map((experiment) => [experiment.id, experiment]));

export function getExperimentById(id) {
  return BY_ID.get(id) ?? null;
}

export function getExperimentsByIds(ids) {
  return (ids ?? []).map((id) => BY_ID.get(id)).filter(Boolean);
}

export function getDistinctFieldValues(field) {
  return [...new Set(experiments.map((experiment) => experiment[field]).filter(Boolean))].sort();
}

export const EXPERIMENT_COUNT = experiments.length;
