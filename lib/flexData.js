import { readFile } from "node:fs/promises";
import path from "node:path";
import model from "@/data/ingest/flex_extinction_model.json";

/**
 * Server-only: the FLEX droplet table (PSI-69, data/psi/psi69_all_burns.csv) in a compact form for
 * the "What the data says" panel, plus the descriptive model that was fitted on it.
 * Row: [heptane 0/1, O₂ fraction, pressure mmHg, CO₂ fraction, He fraction, end "E" | "C" | "D"].
 */
export async function getFlexPanelData() {
  const text = await readFile(path.join(process.cwd(), "data/psi/psi69_all_burns.csv"), "utf8");
  const [head, ...lines] = text.trim().split(/\r?\n/);
  const h = head.split(",");
  const col = (n) => h.indexOf(n);
  const ix = { fuel: col("fuel"), o2: col("o2_frac"), p: col("pressure_mmhg"), co2: col("co2_frac"), he: col("he_frac"), end: col("test_end") };
  const rows = lines.map((l) => l.split(",")).filter((c) => c[ix.end]).map((c) => [
    /heptane/i.test(c[ix.fuel]) ? 1 : 0, +c[ix.o2], +c[ix.p] || 0, +c[ix.co2] || 0, +c[ix.he] || 0, c[ix.end][0],
  ]);
  return {
    rows,
    model: {
      coef: Object.fromEntries(Object.entries(model.coefficients_raw_units).map(([k, v]) => [k, v.per_unit])),
      intercept: model.intercept_raw_units,
      metrics: model.metrics,
      limitations: model.limitations,
    },
  };
}
