import { getExperiments, getExperimentFacets } from "@/lib/api/experiments";
import { getMissions } from "@/lib/api/missions";
import { PROTOTYPE_LABELS } from "@/lib/constants";
import { encodeRecords } from "@/lib/records/encode";
import PageHeader from "@/components/shell/PageHeader";
import ExplorerView from "@/components/explore/ExplorerView";

export const metadata = {
  title: "Explore",
  description: "Search and filter 1,412 measured and published NASA microgravity-combustion records.",
};

export default async function ExplorePage() {
  const [experiments, facets, missions] = await Promise.all([
    getExperiments(),
    getExperimentFacets(),
    getMissions(),
  ]);

  return (
    <div className="space-y-6">
      <PageHeader
          variant="compact"
        eyebrow="Dataset explorer"
        title="Explore the dataset"
        description={`Filter ${experiments.length} experiment records by programme, fuel, gravity, airflow and evidence level. Each record links to its source.`}
      >
        <p className="mt-2 text-xs text-ink-faint">{PROTOTYPE_LABELS.sampleNote}</p>
      </PageHeader>

      <ExplorerView records={encodeRecords(experiments)} facets={facets} missions={missions} />
    </div>
  );
}