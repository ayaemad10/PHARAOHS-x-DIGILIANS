"use client";

import { useState } from "react";
import Link from "next/link";

/**
 * Evidence library: the team's data-ingest package (data/ingest/*.json), shown as it was
 * delivered. It adds investigations the catalog does not hold yet (SAME-R smoke detection, ACME,
 * SPICE, cool flames, a materials catalogue), the four research objectives, the recommendations
 * with their sample sizes and limits, a descriptive model, and the verification log.
 *
 * The test-level tables are merged into the catalog by scripts/merge_psi.py (see
 * data/real/merge_report.json); this view shows the package itself: what was planned, checked and
 * recommended, and which tables were merged or left out and why.
 */
const TABS = [
  { id: "objectives", label: "Objectives" },
  { id: "datasets", label: "Datasets" },
  { id: "checks", label: "Verification" },
];
const STATUS = { "Partly supported": "mid", "Model built, weak": "mid", "Data ready, model not built": "low" };

export default function EvidenceLibrary({ objectives, recommendations, manifest, verification, merge }) {
  const [tab, setTab] = useState("objectives");
  const tables = manifest.filter((m) => /measured|summary|experimental table/.test(m.kind) && !/duplicate/.test(m.kind));
  const invs = [...new Set(tables.map((m) => (m.investigation || "").split(" ")[0]).filter(Boolean))];

  return (
    <section className="ev" aria-labelledby="ev-title">
      <header className="ev-head">
        <div>
          <p className="fx-label">Evidence library · team data ingest</p>
          <h2 id="ev-title">More NASA investigations, checked before use</h2>
          <p className="ev-lede">Tables from {invs.length} PSI investigations, including SAME-R smoke detection, ACME and SPICE. {merge.total_records - merge.core_records} tests from them are now part of the catalog ({merge.total_records.toLocaleString("en-US")} records in all) and appear in Explore, Compare and Fire Response. Subsets, duplicates and model output were left out; the Datasets tab says which.</p>
        </div>
        <ul className="ev-kpis">
          <li><b>{tables.length}</b>tables</li>
          <li><b>{(merge.total_records - merge.core_records).toLocaleString("en-US")}</b>tests merged</li>
          <li><b>{recommendations.length}</b>recommendations</li>
        </ul>
      </header>

      <div className="ev-tabs" role="tablist" aria-label="Evidence library sections">
        {TABS.map((t) => <button key={t.id} type="button" role="tab" aria-selected={tab === t.id} onClick={() => setTab(t.id)}>{t.label}</button>)}
      </div>

      <ul className="ev-moved">
        <li>The {recommendations.length} recommendations, with their sample sizes and what they must not be used for, are on <Link href="/#advice">Home › Recommendations</Link>.</li>
        <li>The FLEX extinction model and its accuracy against the data are in <Link href="/flame-lab">Flame Lab › What the data says</Link>.</li>
      </ul>

      <div className="ev-body" key={tab} role="tabpanel">
        {tab === "objectives" ? (
          <ol className="ev-obj">
            {objectives.map((o) => (
              <li key={o.priority}>
                <span className="ev-n">{o.priority}</span>
                <div>
                  <h3>{o.goal} <small>{o.investigation}</small></h3>
                  <p>{o.what_is_possible}</p>
                  {o.result ? <p className="ev-dim">Result: {o.result}</p> : null}
                  {o.gap ? <p className="ev-dim">Gap: {o.gap}</p> : null}
                  <p className="ev-chips">{o.datasets.map((d) => <span key={d}>{d}</span>)}</p>
                </div>
                <em data-level={STATUS[o.status] || "low"}>{o.status}</em>
              </li>
            ))}
          </ol>
        ) : null}

        {tab === "datasets" ? (
          <div className="ev-table">
            <table>
              <thead><tr><th>Investigation</th><th>Table</th><th>Rows</th><th>Note</th></tr></thead>
              <tbody>
                {tables.map((m) => (
                  <tr key={m.file}><td>{m.investigation}</td><td className="mono">{m.file.split("/").pop()}</td><td className="num">{m.rows ?? "—"}</td><td>{m.note}</td></tr>
                ))}
              </tbody>
            </table>
            <div className="ev-merge">
              <div><p className="ev-id">Merged into the catalog</p><ul>{Object.entries(merge.added).map(([k, v]) => <li key={k}><b>{v}</b>{k}</li>)}</ul></div>
              <div><p className="ev-id">Enriched</p><ul>{Object.entries(merge.enriched).map(([k, v]) => <li key={k}><b>{v}</b>{k}</li>)}</ul>
                <p className="ev-id" style={{ marginTop: 14 }}>Not added as records</p><ul>{Object.entries(merge.skipped).map(([k, v]) => <li key={k}><span>{k}</span><em>{v}</em></li>)}</ul></div>
            </div>
            <p className="ev-dim">The processed tables ship with the app in data/psi/. Rebuild the catalog with: python3 scripts/merge_psi.py</p>
          </div>
        ) : null}

        {tab === "checks" ? (
          <ul className="ev-checks">
            {verification.map((v) => (
              <li key={v.claim} data-ok={v.status === "Verified"}>
                <em>{v.status === "Verified" ? "Verified" : "Not verified"}</em>
                <div><b>{v.claim}</b><p>{v.check}</p><p className="ev-dim">{v.source}</p></div>
              </li>
            ))}
          </ul>
        ) : null}
      </div>
    </section>
  );
}
