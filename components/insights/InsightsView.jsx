"use client";

import Link from "next/link";
import dynamic from "next/dynamic";
import { useState } from "react";
import { Activity, ArrowUpRight, FileText, GitCompareArrows, Orbit, Search, Target } from "lucide-react";
import Panel from "@/components/shared/Panel";
import Tabs from "@/components/shared/Tabs";
import SectionHeader from "@/components/shared/SectionHeader";
import PrototypeNotice from "@/components/shared/PrototypeNotice";
import { EvidenceBadge } from "@/components/shared/StatusBadges";
import InsightCard, { EvidenceLink } from "./InsightCard";

/* The chart library loads only when this page draws a chart, never on the other pages. */
const chartLoading = () => <div className="fx-skeleton h-[260px] rounded-[var(--radius-hud)]" aria-hidden="true" />;
const BaseScatterChart = dynamic(() => import("@/components/charts/BaseScatterChart"), { ssr: false, loading: chartLoading });
const BaseBarChart = dynamic(() => import("@/components/charts/BaseBarChart"), { ssr: false, loading: chartLoading });

const TABS = [
  { id: "patterns", label: "Emerging patterns", icon: Activity, count: 0 },
  { id: "findings", label: "High-relevance findings", icon: Target, count: 0 },
  { id: "statements", label: "Model statements", icon: FileText, count: 0 },
  { id: "conflicts", label: "Conflicting results", icon: GitCompareArrows, count: 0 },
  { id: "gaps", label: "Research gaps", icon: Search, count: 0 },
];

const HABITAT_NAME = { iss: "Space station (ISS)", moon: "Moon base", mars: "Mars", earth: "Earth (1 g)" };

function toCards(statements) {
  return statements.map((statement) => ({
    id: statement.id,
    topic: statement.topic,
    title: statement.title,
    statement: statement.summary,
    strength: statement.evidenceLevel,
    supportingIds: [statement.experimentId],
    meta: statement.relevance == null ? undefined : `${statement.relevance}% relevance`,
  }));
}

/** Four findings, each with its number, its evidence level and the records it rests on. */
function KeyFindings({ cards }) {
  return (
    <section aria-labelledby="kf-title" className="space-y-3">
      <h2 id="kf-title" className="fx-label">Key findings</h2>
      <ul className="kf-grid">
        {cards.map((c) => (
          <li key={c.id} className="kf-card">
            <p className="kf-topic">
              {c.topic}
              <EvidenceBadge level={c.level} showLabel={false} />
            </p>
            <p className="kf-value fx-numeric">{c.value}</p>
            <h3 className="kf-title">{c.title}</h3>
            <p className="kf-text">{c.text}</p>
            <p className="kf-n">{c.n} · {c.level}</p>
            <div className="kf-links">
              {c.records.map((id) => (
                <Link key={id} href={`/experiments/${id}`} className="kf-rec fx-numeric">{id}</Link>
              ))}
              <a href={c.link.href} className="kf-more">
                {c.link.label}
                <ArrowUpRight className="size-3" aria-hidden="true" />
              </a>
            </div>
          </li>
        ))}
      </ul>
    </section>
  );
}

function Charts({ flexScatter, smoke }) {
  return (
    <div className="grid gap-4 lg:grid-cols-2">
      <Panel className="p-5">
        <SectionHeader
          eyebrow="Measured · FLEX (PSI-69)"
          title="Ambient O₂ vs. extinction diameter (FLEX)"
          description={`Each point is one FLEX droplet test that recorded a visible extinction diameter (${flexScatter.length} tests).`}
        />
        <div className="mt-4">
          <BaseScatterChart
            data={flexScatter}
            xKey="oxygen"
            yKey="extinctionMm"
            xLabel="ambient O₂ (%)"
            yLabel="extinction diameter (mm)"
            height={280}
            name="FLEX droplet tests"
            captionLabel="Measured"
            caption="Diameter is the visible flame extinction diameter as recorded in the FLEX table. Points only, no fitted line."
          />
        </div>
      </Panel>

      <Panel className="p-5" id="smoke-chart">
        <SectionHeader
          eyebrow="Measured · SAME (PSI-102), SAME-R (PSI-101)"
          title="ISS smoke detector reading by material (median)"
          description={`Median reading of the ISS-type light-scatter smoke detector for each material's smoke, from ${smoke.tests} SAME and SAME-R samples (calibration aerosol excluded).`}
        />
        <div className="mt-4">
          <BaseBarChart
            data={smoke.rows.map((r) => ({ ...r, label: `${r.material} (n=${r.samples})` }))}
            xKey="label"
            yLabel="scatter detector (V)"
            series={[{ key: "scatter", name: "Median scatter-detector reading (V)", color: "fx-brand" }]}
            height={280}
            captionLabel="Measured"
            caption="Voltages depend on the instrument set-up, so compare materials with each other, not with an alarm threshold."
          />
        </div>
      </Panel>

      <p className="ins-more lg:col-span-2">
        The share of FLEX droplet tests that went out at each oxygen level, with the model beside it, is in{" "}
        <Link href="/flame-lab" className="text-brand hover:underline">Flame Lab · What the data says</Link>.
      </p>
    </div>
  );
}

export default function InsightsView({ cards, smoke, flexScatter, patterns, findings, statements, conflicts, gaps, missionFindings, sourceLinks }) {
  const [tab, setTab] = useState("patterns");

  const sources = { patterns, findings, statements, conflicts, gaps };
  const counts = Object.fromEntries(Object.entries(sources).map(([id, list]) => [id, list.length]));
  const tabs = TABS.map((item) => ({ ...item, count: counts[item.id] }));
  const active = tab === "statements" ? toCards(statements) : sources[tab];
  const missionIds = Object.keys(missionFindings);

  return (
    <div className="space-y-6">
      <KeyFindings cards={cards} />

      <Charts flexScatter={flexScatter} smoke={smoke} />

      <Panel className="p-5">
        <div className="space-y-5">
          <SectionHeader
            eyebrow="Synthesis"
            icon={Activity}
            title="Cross-experiment insights"
            description="Each entry links to the experiment records it rests on, so the claim and its evidence can be checked together."
          />
          <Tabs tabs={tabs} activeId={tab} onChange={setTab} label="Insight categories" />
          <ul className="grid gap-3 lg:grid-cols-2">
            {active.map((insight) => (
              <InsightCard
                key={insight.id}
                insight={insight}
                accent={tab === "gaps" ? "ember" : "brand"}
                meta={insight.meta}
                sourceLinks={sourceLinks}
              />
            ))}
          </ul>
          <PrototypeNotice
            label="Source-linked counts"
            message="Every statement here is a count, a ratio or a quoted finding, each linked to its record ids. Nothing is generated. Quotes from restricted sources are withheld."
          />
        </div>
      </Panel>

      <Panel className="p-5">
        <SectionHeader
          eyebrow="Published findings"
          icon={Orbit}
          title="Mission-specific findings"
          description="Findings quoted from the source reports, grouped by the habitat they matter for. Each links to its report. The recommendations built on them are on Home › Recommendations."
        />
        <div className={`mt-4 grid gap-4 ${missionIds.length > 1 ? "md:grid-cols-2" : ""}`}>
          {missionIds.map((missionId) => (
            <div key={missionId}>
              <p className="fx-label mb-2">{HABITAT_NAME[missionId] ?? missionId} · {missionFindings[missionId].length}</p>
              <ul className="space-y-2">
                {missionFindings[missionId].map((finding) => (
                  <li key={finding.id} className="rounded-lg border border-line bg-elevated/25 px-3 py-2.5">
                    <p className="text-xs font-semibold leading-snug text-ink">{finding.title}</p>
                    <p className="mt-1 text-[11px] leading-relaxed text-ink-muted">{finding.statement}</p>
                    <div className="mt-2 flex flex-wrap gap-1">
                      {finding.supportingIds.map((id) => (
                        <EvidenceLink key={id} id={id} sourceLinks={sourceLinks} className="fx-chip border-line text-ink-faint hover:text-brand" />
                      ))}
                    </div>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </Panel>
    </div>
  );
}
