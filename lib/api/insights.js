import { experiments } from "@/data/experiments";
import { riskFactors } from "@/data/fireRisk";
import { flexScatterPoints } from "@/data/insights";
import {
  airflowSpreadSeries,
  conflictingResults,
  emergingPatterns,
  highRelevanceFindings,
  missionFindings,
  modelStatements,
  oxygenFlameSeries,
  researchGaps,
} from "@/data/insights";
import { getExperimentById } from "@/data/experiments";
import { request } from "./client";
import { PROGRAMMES } from "@/lib/programmes";

export async function getPatterns() {
  return request("insights/patterns", () => emergingPatterns);
}

export async function getHighRelevanceFindings() {
  return request("insights/findings", () => highRelevanceFindings);
}

export async function getConflictingResults() {
  return request("insights/conflicts", () => conflictingResults);
}

export async function getResearchGaps() {
  return request("insights/gaps", () => researchGaps);
}

export async function getMissionFindings(missionId) {
  return request(`insights/mission/${missionId}`, () => missionFindings[missionId] ?? []);
}

/** All missions at once, so a client-side mission switch needs no further reads. */
export async function getAllMissionFindings() {
  return request("insights/mission", () => missionFindings);
}

/**
 * Per-record statements from the synthesis model.
 *
 * Each statement names one experiment, so the evidence grade is joined in here rather than in the
 * view. The join lives at the API boundary for the same reason it does everywhere else in this
 * folder: the record is the authority on its own grade, and a view that read `data/experiments`
 * to recover it would be reaching past the seam.
 *
 * A statement whose experiment cannot be resolved is dropped rather than shown at a guessed
 * grade. An insight with no traceable record is not an insight.
 */
export async function getModelStatements() {
  return request("insights/statements", () =>
    modelStatements.flatMap((statement) => {
      const experiment = getExperimentById(statement.experimentId);
      if (!experiment) return [];
      return [{ ...statement, evidenceLevel: experiment.evidenceLevel }];
    }),
  );
}

/**
 * Research coverage per program, and the risk posture to read it against.
 *
 * These two are returned together on purpose. Coverage breadth on its own is ambiguous — a
 * dataset can be broad and still leave a specific question unanswerable — and the risk factors
 * are what say which questions those are. Separating them onto different routes, as they were
 * while both sat on the dashboard, is what made them read as two unrelated widgets.
 */
export async function getCoverageAndRisk() {
  return request("insights/coverage-risk", () => {
    // Grouped into the 10 investigation families used on Compare (lib/programmes.js), so the
    // programme count is the same number everywhere in the app.
    const programs = PROGRAMMES.map((family) => {
      const rows = experiments.filter((experiment) => family.match(experiment.program));
      return {
        program: family.id === "SAFFIRE" ? "SAFFIRE" : family.id,
        count: rows.length,
        high: rows.filter((experiment) => experiment.evidenceLevel === "Measured").length,
      };
    }).filter((family) => family.count > 0);

    return {
      programs,
      sampleSize: experiments.length,
      riskFactors,
    };
  });
}

export async function getOxygenFlameSeries() {
  return request("insights/series/oxygen", () => oxygenFlameSeries);
}

export async function getAirflowSpreadSeries() {
  return request("insights/series/airflow", () => airflowSpreadSeries);
}

/**
 * FLEX droplet records with a measured extinction diameter: ambient O₂ against extinction diameter.
 *
 * Replaces the previous gravity-vs-sphericity heuristic. The sphericity index was a formula, not a
 * measurement, so it is gone. These points come straight from the FLEX table.
 */
export async function getGravityMorphologySeries() {
  return request("insights/series/gravity", () =>
    flexScatterPoints.map((point) => ({
      id: point.id,
      oxygen: point.oxygen,
      extinctionMm: point.extinctionMm,
      outcome: point.outcome,
    })),
  );
}

/** Experiment count per program and topic — the coverage matrix on the Insights page. */
export async function getCoverageMatrix() {
  return request("insights/coverage", () => {
    const programs = [...new Set(experiments.map((experiment) => experiment.program))].sort();
    const topics = [...new Set(experiments.map((experiment) => experiment.topic))].sort();
    const counts = programs.map((program) => ({
      program,
      cells: topics.map((topic) => ({
        topic,
        count: experiments.filter(
          (experiment) => experiment.program === program && experiment.topic === topic,
        ).length,
      })),
    }));
    return { programs, topics, rows: counts, total: experiments.length };
  });
}

export async function getAllInsights() {
  return request("insights", () => ({
    patterns: emergingPatterns,
    findings: highRelevanceFindings,
    conflicts: conflictingResults,
    gaps: researchGaps,
    series: { oxygen: oxygenFlameSeries, airflow: airflowSpreadSeries },
  }));
}
