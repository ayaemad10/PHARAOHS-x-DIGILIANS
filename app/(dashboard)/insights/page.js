import { getAllInsights, getAllMissionFindings, getGravityMorphologySeries, getModelStatements } from "@/lib/api/insights";
import PageHeader from "@/components/shell/PageHeader";
import InsightsView from "@/components/insights/InsightsView";
import EvidenceLibrary from "@/components/insights/EvidenceLibrary";
import ingestObjectives from "@/data/ingest/objectives.json";
import ingestRecs from "@/data/ingest/recommendations.json";
import ingestManifest from "@/data/ingest/manifest.json";
import ingestChecks from "@/data/ingest/verification.json";
import mergeReport from "@/data/real/merge_report.json";
import catalog from "@/data/real/catalog.json";
import sourcesPublic from "@/data/real/sources_public.json";
import { keyFindings, smokeByMaterial } from "@/lib/keyFindings";
import { titleForFinding } from "@/lib/missionFindingTitles";

export const metadata = {
  title: "Insights",
  description: "What the records say: key findings, cross-experiment patterns, conflicts and research gaps.",
};

export default async function InsightsPage() {
  const [insights, missionFindings, flexScatter, statements] = await Promise.all([
    getAllInsights(),
    getAllMissionFindings(),
    getGravityMorphologySeries(),
    getModelStatements(),
  ]);

  // Supporting ids that are publications, not test records, link to the publication itself.
  const sourceLinks = Object.fromEntries(sourcesPublic.filter((s) => s.url).map((s) => [s.source_id, s.url]));
  const missions = Object.fromEntries(
    Object.entries(missionFindings)
      .filter(([, list]) => list.length)
      .map(([id, list]) => [id, list.map((f) => ({ ...f, title: titleForFinding(f) }))]),
  );

  return (
    <div className="space-y-6">
      <PageHeader
        variant="compact"
        eyebrow="Interpret"
        title="Insights"
        description="What the records say when they are read together: four key findings, the patterns and gaps behind them, and what each target habitat can take from them."
      />

      <InsightsView
        cards={keyFindings({ catalog, oxygenSeries: insights.series.oxygen, patterns: insights.patterns })}
        smoke={smokeByMaterial(catalog)}
        flexScatter={flexScatter}
        patterns={insights.patterns}
        findings={insights.findings}
        statements={statements}
        conflicts={insights.conflicts}
        gaps={insights.gaps}
        missionFindings={missions}
        sourceLinks={sourceLinks}
      />

      <EvidenceLibrary objectives={ingestObjectives} recommendations={ingestRecs.recommendations} manifest={ingestManifest} verification={ingestChecks} merge={mergeReport} />
    </div>
  );
}
