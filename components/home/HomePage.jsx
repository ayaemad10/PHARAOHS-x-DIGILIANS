import { getDashboardData } from "@/lib/api/dashboard";
import { getCoverageAndRisk } from "@/lib/api/insights";
import MetricDials from "@/components/home/MetricDials";
import CoverageWaffle from "@/components/home/CoverageWaffle";
import IgnitionTimeline from "@/components/home/IgnitionTimeline";
import FindingsSpotlight from "@/components/home/FindingsSpotlight";
import MissingPieces from "@/components/home/MissingPieces";
import { MediaPanel } from "@/components/dashboard/GapsAndMedia";
import DemoPlayer from "@/components/team/DemoPlayer";
import HomeStage from "@/components/home/HomeStage";
import catalog from "@/data/real/catalog.json";
import { habitatStats } from "@/lib/response";
import { EARTH_USES, habitatAdvice } from "@/lib/advice";
import recommendations from "@/data/ingest/recommendations.json";
import HabitatAdvice, { EarthUses } from "@/components/home/HabitatAdvice";
import detection from "@/data/real/detection.json";
import findingsPublic from "@/data/real/findings_public.json";
import insightsReal from "@/data/real/insights.json";
import saffireMeta from "@/public/data/saffire/meta.json";


/**
 * The dashboard. Every figure and sentence is read from the loaded records or the analysis outputs,
 * and each block links to the page where its evidence can be checked.
 */
export default async function HomePage({ initialView = null }) {
  const [{ dataset, saffire, findings, gaps, media }, coverage] = await Promise.all([getDashboardData(), getCoverageAndRisk()]);
  const habitats = habitatStats(catalog);

  return (
    <HomeStage
      initialView={initialView}
      saffire={saffire}
      detection={detection}
      findings={findingsPublic.filter((f) => f.quote)}
      oxygenSeries={insightsReal.series.oxygen.points}
      meta={saffireMeta}
      recordCount={dataset.records}
      habitats={habitats}
      advice={[
        { label: "By habitat", node: <HabitatAdvice key="habitat" advice={habitatAdvice(catalog, habitats, detection, recommendations.recommendations)} /> },
        { label: "Back on Earth", node: <EarthUses key="earth" uses={EARTH_USES} /> },
      ]}
      records={
        <div key="records" className="hs-stack">
          <MetricDials key="dials" dataset={dataset} />
          <CoverageWaffle key="waffle" programs={coverage.programs} sampleSize={coverage.sampleSize} />
        </div>
      }
      findingsAndGaps={[
        {
          label: "Findings & open gaps",
          node: (
            <div key="findings" className="grid gap-6 lg:grid-cols-2">
              <FindingsSpotlight findings={findings} />
              <MissingPieces gaps={gaps} />
            </div>
          ),
        },
        { label: "Ignition timeline", node: <IgnitionTimeline key="timeline" saffire={saffire} /> },
      ]}
      demo={[
        {
          label: "Demo video",
          node: (
            <section key="demo" id="demo" aria-labelledby="demo-title" className="grid items-center gap-5 lg:grid-cols-[minmax(0,1.5fr)_minmax(0,1fr)] lg:gap-8">
              <div className="space-y-3 lg:order-2">
                <p className="fx-label">Demo</p>
                <h2 id="demo-title" className="font-display text-xl font-semibold sm:text-2xl" style={{ color: "var(--fx-ink)" }}>See it in action</h2>
                <p className="text-sm leading-relaxed" style={{ color: "var(--fx-ink-muted)" }}>
                  A short walkthrough of how the app turns measured SAFFIRE data into early fire-detection insight.
                </p>
              </div>
              <div className="lg:order-1">
                <DemoPlayer />
              </div>
            </section>
          ),
        },
        { label: "NASA media", node: <div key="media" className="fx-filmstrip"><MediaPanel media={media} /></div> },
      ]}
    />
  );
}
