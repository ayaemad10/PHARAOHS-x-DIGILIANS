/**
 * Source documents, from the source list supplied with the experiment data.
 *
 * Replaces the earlier placeholder identifiers. Sources whose copyright may cover third-party
 * material are listed as metadata only: their abstracts were removed from the public file.
 */
import sourcesPublic from "./real/sources_public.json";

const SOURCE_TYPES = {
  article: "Journal article",
  conference: "Conference paper",
  report: "Report",
  dataset: "Dataset",
  "flight-report": "Flight report",
  "analog-report": "Analog report",
  "ground-report": "Ground report",
};

export const experimentSources = sourcesPublic.map((s) => ({
  id: s.source_id,
  type: s.document_type ?? "report",
  typeLabel: SOURCE_TYPES[s.document_type] ?? s.document_type ?? "Source",
  program: s.program ?? s.organization ?? null,
  year: s.year ?? s.date ?? null,
  title: s.title ?? s.source_id,
  note: s.note ?? s.copyright ?? "",
  copyright: s.copyright ?? null,
}));

const BY_ID = new Map(experimentSources.map((entry) => [entry.id, entry]));

export function getSourceById(id) {
  return BY_ID.get(id) ?? null;
}

export function getSourcesForExperiment(experiment) {
  return (experiment?.sourceIds ?? []).map(getSourceById).filter(Boolean);
}
