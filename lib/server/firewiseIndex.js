/**
 * Firewise retrieval index. SERVER ONLY: it reads the full catalog, so it must never be imported by a
 * client component (that is what used to put the 925 KB catalog in every page's JavaScript).
 *
 * Keyword retrieval over experiment records, published findings, patterns, gaps and sources. Used by
 * /api/firewise both to pick the evidence sent to the model and as the "Search result" answer when the
 * model is not available.
 */
import "server-only";
import { experiments } from "@/data/experiments";
import { experimentSources } from "@/data/experimentSources";
import findingsPublic from "@/data/real/findings_public.json";
import { emergingPatterns, researchGaps } from "@/data/insights";

export const RECORD_IDS = new Set(experiments.map((e) => e.id));
const BY_ID = new Map(experiments.map((e) => [e.id, e]));

function conditionsShort(e) {
  return [
    e.fuelLabel && e.fuelLabel !== "Not recorded in source" ? e.fuelLabel : null,
    e.oxygen != null ? `${e.oxygen}% O₂` : null,
    e.pressure != null ? `${e.pressure} kPa` : null,
    e.airflowCmPerS != null ? `${e.airflowCmPerS} cm/s` : null,
  ].filter(Boolean).join(", ");
}

/** Short, readable list items for a search-result answer: title, outcome, link. */
export function toListItems(hits) {
  return hits.map((h) => {
    const rec = h.kind === "record" ? BY_ID.get(h.id) : null;
    return {
      id: h.id,
      kind: h.kind,
      title: rec ? rec.title : h.title.replace(/^(pattern|research gap) /, ""),
      outcome: rec ? [rec.keyFinding, conditionsShort(rec)].filter(Boolean).join(" · ") : h.summary.replace(/^[^:]*:\s*/, ""),
      href: rec ? `/experiments/${h.id}` : h.kind === "source" ? null : "/insights",
    };
  });
}

const STOP = new Set([
  "the", "a", "an", "of", "in", "and", "or", "to", "is", "was", "were", "are", "be", "by", "for", "on",
  "at", "with", "what", "which", "who", "how", "did", "do", "does", "it", "that", "this", "from", "about",
  "there", "their", "they", "had", "has", "have", "any", "all", "not", "no", "yes", "as", "if", "into",
]);

/*
 * A few Arabic research words mapped to the English terms used in the records, so a question asked
 * in Arabic still finds evidence. The model then answers in the language of the question.
 */
const AR = [
  [/أكسج|اكسج|الأكسجين|اوكسجين/, "oxygen"], [/دخان|الدخان/, "smoke"], [/كاشف|كواشف|حساس|مستشعر/, "detector sensor"],
  [/تهوي|هواء|تدفق|مروح/, "airflow flow ventilation"], [/إطفاء|اطفاء|انطفا|خمد/, "extinction suppression"],
  [/قمر|القمر|قمري/, "lunar moon"], [/لهب|اللهب|شعل/, "flame"], [/جاذبي/, "gravity microgravity"], [/حريق|حرائق|نار/, "fire"],
  [/انتشار|ينتشر/, "spread"], [/قطر|قطير/, "droplet"], [/ثاني أكسيد الكربون|co2/i, "co2"], [/هيليوم/, "helium"],
  [/كابتون/, "kapton"], [/تفلون/, "teflon"], [/سافاير|سفاير/, "saffire"], [/مواد|خام/, "material"],
];

function tokens(text) {
  let src = String(text ?? "");
  const extra = AR.filter(([re]) => re.test(src)).map(([, en]) => en).join(" ");
  src = `${src} ${extra}`;
  return src
    .toLowerCase()
    .replace(/[^a-z0-9.\s_\/-]/g, " ")
    .split(/[\s_\/-]+/)
    .map((t) => t.replace(/^\.+|\.+$/g, ""))
    .filter((t) => (t.length > 1 || /^\d$/.test(t)) && !STOP.has(t))
    .map((t) => (t.length > 4 && t.endsWith("s") ? t.slice(0, -1) : t));
}

/** Up to three measured values, so an answer can state a number and not only a label. */
function measuredPairs(e) {
  const entries = Object.entries(e.measurements ?? {}).filter(([, v]) => typeof v === "number").slice(0, 3);
  if (!entries.length) return "";
  return ` (${entries.map(([k, v]) => `${k.replace(/_/g, " ")} ${v}`).join(", ")})`;
}

function sampleWords(title) {
  const m = String(title ?? "").match(/\bS(\d+)\b/i);
  return m ? `sample ${m[1]} s${m[1]}` : "";
}

/**
 * Condition tags derived from the record's own numbers, so questions such as "low oxygen" or
 * "low flow" match the records that actually have those values. Thresholds are labelled in the
 * tag text and are a convention, not a measurement.
 */
function conditionTags(e) {
  const tags = [];
  if (typeof e.oxygen === "number") tags.push(e.oxygen <= 16 ? "low oxygen" : e.oxygen >= 25 ? "high oxygen" : "ambient oxygen");
  if (typeof e.airflowCmPerS === "number") tags.push(e.airflowCmPerS <= 10 ? "low flow low airflow" : e.airflowCmPerS > 25 ? "high flow high airflow" : "medium flow");
  if (/lunar/i.test(e.gravityNote ?? "")) tags.push("lunar gravity moon 0.16g");
  if (/micro/i.test(e.gravityNote ?? "")) tags.push("microgravity");
  return tags.join(" ");
}

/** The test conditions in one line, so an answer can say under what air, pressure and gravity a result holds. */
function conditionsLine(e) {
  return [
    e.fuelLabel ? `fuel ${e.fuelLabel}` : null,
    e.oxygen != null ? `O2 ${e.oxygen}%` : null,
    e.pressure != null ? `${e.pressure} kPa` : null,
    e.airflowCmPerS != null ? `flow ${e.airflowCmPerS} cm/s` : null,
    e.gravityNote ? `gravity: ${e.gravityNote}` : null,
    e.psi ? e.psi : null,
  ].filter(Boolean).join(", ");
}

function recordText(e) {
  const m = e.measurements ?? {};
  return [
    e.id, e.program, e.title, sampleWords(e.title), e.fuelLabel, e.type, e.topic, e.keyFinding,
    e.flowDirection ? `${e.flowDirection} flow direction spread` : "",
    e.airflowCmPerS != null ? `${e.airflowCmPerS} cm/s airflow flow` : "",
    e.oxygen != null ? `${e.oxygen} % O2 oxygen` : "",
    e.gravityNote, e.evidenceLevel, conditionTags(e),
    Object.entries(m).filter(([, v]) => v != null).map(([k]) => k.replace(/_/g, " ")).join(" "),
    m.spread_rate_mm_s != null ? "spread rate" : "",
  ].filter(Boolean).join(" ");
}

const INDEX = [
  ...experiments.map((e) => ({
    kind: "record",
    id: e.id,
    title: `${e.program} ${e.title}`,
    body: recordText(e),
    summary: `${e.title}: ${e.keyFinding}${measuredPairs(e)}`,
    context: `${e.evidenceLevel}; ${conditionsLine(e)}`,
    weight: 2,
  })),
  ...emergingPatterns.map((p) => ({
    kind: "pattern",
    id: p.id,
    title: `pattern ${p.title}`,
    body: `${p.title} ${p.statement} ${p.topic} pattern`,
    summary: `${p.title}: ${p.statement}`,
    weight: 1,
  })),
  ...researchGaps.map((g) => ({
    kind: "gap",
    id: g.id,
    title: `research gap ${g.title}`,
    body: `${g.title} ${g.detail} gap gaps unknown`,
    summary: `${g.title}: ${g.detail}`,
    weight: 1,
  })),
  ...findingsPublic.map((f) => ({
    kind: "finding",
    id: f.id,
    title: f.id.replace(/-/g, " "),
    body: `${f.id.replace(/-/g, " ")} ${f.quote ?? ""} ${f.topics?.join(" ") ?? ""} ${f.source_id ?? ""}`,
    summary: f.quote ? `"${f.quote}" (source ${f.source_id}, p. ${f.pdf_page ?? "n/a"})` : `Quote withheld for restricted source ${f.source_id}.`,
    sourceId: f.source_id,
    weight: 1,
  })),
  ...experimentSources.map((s) => ({
    kind: "source",
    id: s.id,
    title: s.title,
    body: `${s.title} ${s.program ?? ""} ${s.typeLabel ?? ""}`,
    summary: `${s.title} (${s.typeLabel ?? "source"})`,
    weight: 1,
  })),
].map((doc) => ({ ...doc, terms: new Set(tokens(`${doc.title} ${doc.body}`)), titleTerms: new Set(tokens(doc.title)) }));

export function retrieve(question, limit = 6) {
  const terms = [...new Set(tokens(question))];
  if (!terms.length) return [];
  const scored = [];
  for (const doc of INDEX) {
    let score = 0;
    for (const t of terms) {
      if (doc.titleTerms.has(t)) score += 3 * doc.weight;
      else if (doc.terms.has(t)) score += 1 * doc.weight;
    }
    if (score > 0) scored.push({ doc, score });
  }
  scored.sort((a, b) => b.score - a.score || a.doc.id.localeCompare(b.doc.id));
  return scored.slice(0, limit).map((s) => s.doc);
}

export function buildAnswer(question) {
  const hits = retrieve(question);
  if (!hits.length) {
    return {
      answerId: "no-match",
      text: "No loaded record, finding or source matches this question. Try the names used in the records, such as SAFFIRE-III, FLEX, BASS-II, LUCI, extinction, spread, oxygen or airflow.",
      evidence: [],
      caveat: null,
    };
  }
  const lines = hits.map((h) => `${h.id}: ${h.summary}`);
  const recordIds = hits.filter((h) => h.kind === "record").map((h) => h.id);
  return {
    answerId: "retrieval",
    text: `Matched ${hits.length} loaded item${hits.length === 1 ? "" : "s"}. ${lines.join(" ")}`,
    evidence: recordIds,
    caveat: "Keyword retrieval over the loaded records. Nothing here is generated. Open each record to check the full data.",
  };
}

