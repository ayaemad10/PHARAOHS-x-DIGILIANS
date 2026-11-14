import { getExperiments } from "@/lib/api/experiments";
import { MAX_COMPARISON_SIZE } from "@/lib/constants";
import { encodeRecords } from "@/lib/records/encode";
import PageHeader from "@/components/shell/PageHeader";
import CompareView from "@/components/compare/CompareView";
import ProgrammeCompare from "@/components/compare/ProgrammeCompare";
import { programmeStats } from "@/lib/programmes";

export const metadata = {
  title: "Compare",
  description: "Compare up to three microgravity combustion experiments side by side.",
};

export default async function ComparePage() {
  const experiments = await getExperiments();

  return (
    <div className="space-y-6">
      <PageHeader
          variant="compact"
        eyebrow="Side-by-side analysis"
        title="Compare programmes and experiments"
        description={`Compare whole investigations (hardware, air, fuel, outcomes), then up to ${MAX_COMPARISON_SIZE} individual records side by side.`}
      />

      <ProgrammeCompare programmes={programmeStats(experiments)} />

      <div className="space-y-3">
        <p className="fx-label">Experiment comparison</p>
        <CompareView records={encodeRecords(experiments)} />
      </div>
    </div>
  );
}