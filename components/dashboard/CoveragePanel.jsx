"use client";

import { Layers } from "lucide-react";
import BaseBarChart from "@/components/charts/BaseBarChart";
import Panel from "@/components/shared/Panel";
import SectionHeader from "@/components/shared/SectionHeader";

export default function CoveragePanel({ programs, sampleSize }) {
  return (
    <Panel className="flex flex-col gap-4 p-5">
      <SectionHeader
        eyebrow="Dataset"
        icon={Layers}
        title="Coverage by research programme"
        description={`${sampleSize} records from measured and published sources, across ${programs.length} programmes.`}
      />

      <BaseBarChart
        data={programs}
        xKey="program"
        series={[{ key: "count", name: "Records", color: "fx-brand" }]}
        yLabel="records"
        height={200}
        caption="Distribution of the loaded records. Counts describe this dataset, not the wider literature."
      />

      {programs.length ? (() => {
        const top = [...programs].sort((a, b) => b.count - a.count)[0];
        return (
          <p className="text-[11px] leading-relaxed text-ink-faint">
            {top.program} carries the largest share: {top.count} of {sampleSize} records. Each record keeps its
            programme, so evidence can be compared by facility and scale rather than treated as one dataset.
          </p>
        );
      })() : null}

    </Panel>
  );
}