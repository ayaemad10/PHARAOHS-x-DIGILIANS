/**
 * Insight content, derived from measured and published records only.
 *
 * Previously this file held authored syntheses. It now reads data/real/insights.json, which is
 * produced by build_insights.py from the catalog, the FLEX table and the findings file. Every
 * statement is a count, a ratio or a quoted finding with its record ids. Where the loaded records
 * do not support a category, it is empty and the page says so.
 *
 * The export names and shapes are unchanged, so the views that import them are unchanged.
 */
import insights from "./real/insights.json";

export const emergingPatterns = insights.patterns;
export const highRelevanceFindings = insights.findings;
export const conflictingResults = insights.conflicts;
export const researchGaps = insights.gaps;
export const missionFindings = insights.mission;
export const oxygenFlameSeries = insights.series.oxygen;
export const airflowSpreadSeries = insights.series.airflow;
export const modelStatements = insights.statements;
export const flexScatterPoints = insights.flexScatter;

export function getInsightById(id) {
  const all = [...emergingPatterns, ...highRelevanceFindings, ...conflictingResults, ...researchGaps];
  return all.find((insight) => insight.id === id) ?? null;
}

export const INSIGHT_CATEGORIES = [
  { id: "patterns", label: "Emerging Patterns", icon: "activity" },
  { id: "findings", label: "High-Relevance Findings", icon: "target" },
  { id: "conflicts", label: "Conflicting Results", icon: "gitCompareArrows" },
  { id: "gaps", label: "Research Gaps", icon: "search" },
  { id: "mission", label: "Mission-Specific Findings", icon: "orbit" },
];
