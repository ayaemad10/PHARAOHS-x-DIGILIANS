import { ExternalLink } from "lucide-react";
import Panel from "@/components/shared/Panel";
import { PROGRAMMES } from "@/lib/programmes";

/**
 * The experiment the way the NASA PSI (Physical Sciences Informatics) system lays it out:
 * Description, Hardware, Data files, and the PSI dataset number. Programme-level text comes from
 * lib/programmes.js; the record's own measurements are listed by name.
 */
const FILES = {
  "PSI-159": ["psi159_all_tests.csv", "psi159_sustainment.csv"],
  "PSI-69": ["psi69_all_burns.csv", "psi69_suppression.csv"],
  "PSI-39": ["psi39_all_tests.csv", "psi39_cool_flames.csv"],
  "PSI-25": ["psi25_materials_catalogue.csv"],
  "PSI-101": ["psi101_all_tests.csv", "psi101_detection.csv"],
  "PSI-102": ["(SAME table, merged into the catalog)"],
  "PSI-107": ["psi107_smoke_point.csv", "psi107_all_platforms.csv"],
  "PSI-142": ["psi142_extinction_limits.csv", "psi142_other_measurements.csv"],
  "PSI-117": ["psi117_measurements.csv", "psi117_cool_flame_observations.csv"],
  "PSI-99": ["psi99_microgravity_vs_earth.csv"],
  "PSI-100": ["public/data/saffire/ (sensor series and camera frames)"],
};
const label = (k) => k.replace(/_/g, " ").replace(/\b(c|s|v|mm|um|mg m3|per cc)\b/g, (m) => ({ c: "°C", s: "s", v: "V", mm: "mm", um: "µm", "mg m3": "mg/m³", "per cc": "per cm³" })[m] ?? m);

export default function PsiPanel({ experiment, raw }) {
  const prog = PROGRAMMES.find((p) => p.match(experiment.program));
  const psi = experiment.psi || prog?.psi?.split(" · ")[0] || null;
  const files = psi ? FILES[psi] ?? [] : [];
  const measured = Object.entries(raw?.measurements || {}).filter(([, v]) => v != null && typeof v !== "object");
  const sources = raw?.source_ids || [];

  return (
    <Panel className="psi p-5">
      <header className="psi-head">
        <div>
          <p className="fx-label">Experiment record · PSI layout</p>
          <h2>{prog?.id ?? experiment.program}{psi ? <span className="psi-no">{psi}</span> : null}</h2>
        </div>
        {psi && /^PSI-/.test(psi) ? (
          <a className="psi-link" href="https://psi.nasa.gov/" target="_blank" rel="noreferrer">
            Find {psi} on NASA PSI <ExternalLink className="size-3.5" aria-hidden="true" />
          </a>
        ) : null}
      </header>
      <dl className="psi-grid">
        <div>
          <dt>Description</dt>
          <dd>{experiment.objective && experiment.objective !== "Not recorded" ? experiment.objective : prog?.use ?? "Not recorded"}{prog?.use && experiment.objective !== prog.use ? <span className="psi-q">{/[.!?]$/.test(experiment.objective || "") ? " " : ". "}Fire-safety question: {prog.use}.</span> : null}</dd>
        </div>
        <div>
          <dt>Hardware</dt>
          <dd>{prog ? <>{prog.where}. {prog.hardware}.<span className="psi-q"> Sensors: {prog.sensors}.</span></> : experiment.platform}</dd>
        </div>
        <div>
          <dt>This test</dt>
          <dd>
            <ul className="psi-vals">
              <li><span>Fuel or material</span>{experiment.fuelLabel || "Not recorded"}</li>
              <li><span>Gravity</span>{experiment.gravityNote}</li>
              {experiment.oxygen != null ? <li><span>Oxygen</span>{experiment.oxygen} %</li> : null}
              {experiment.pressure != null ? <li><span>Pressure</span>{experiment.pressure} kPa</li> : null}
              {experiment.airflowCmPerS != null ? <li><span>Air flow</span>{experiment.airflowCmPerS} cm/s {experiment.flowDirection ?? ""}</li> : null}
              {measured.slice(0, 8).map(([k, v]) => <li key={k}><span>{label(k)}</span>{typeof v === "number" ? +v.toFixed(3) : String(v)}</li>)}
            </ul>
          </dd>
        </div>
        <div>
          <dt>Data files</dt>
          <dd>
            {files.length ? <ul className="psi-files">{files.map((f) => <li key={f}>{f.startsWith("(") || f.includes("/") ? f : `data/psi/${f}`}</li>)}</ul> : <span>Published table; no PSI file in this package.</span>}
            {sources.length ? <p className="psi-q">Source ids: {sources.join(", ")}</p> : null}
          </dd>
        </div>
      </dl>
    </Panel>
  );
}
