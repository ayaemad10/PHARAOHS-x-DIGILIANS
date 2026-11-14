import { RECORD_IDS, retrieve, toListItems } from "@/lib/server/firewiseIndex";
import { detectEmergencyIntent } from "@/lib/api/emergencyGuard";

/**
 * Firewise AI: one endpoint, two kinds of answer.
 *
 *   mode "ai"      the question and the best-matching records go to a Groq model, which answers from
 *                  those items only and cites them by id. Only ids of real records come back as links.
 *   mode "search"  no key, the model is busy (429), slow or unreachable: the matched records come back
 *                  as a short list (title, outcome, link), with no generated text.
 *
 * The catalog and the key stay on the server. GROQ_API_KEY is read from process.env only (.env.local
 * locally, Settings > Environment Variables on the host); it is never sent to the browser or logged.
 */
export const runtime = "nodejs";

const MODEL = process.env.GROQ_MODEL || "openai/gpt-oss-120b";
const MAX_QUESTION = 500;
const MODEL_TIMEOUT_MS = 6000; // the search fallback must reach the reader within 8 s
const RATE_LIMIT = { windowMs: 60_000, max: 8 };

const SYSTEM = [
  "You are Firewise, the research assistant of Flame in Freefall, a dashboard of NASA microgravity combustion experiments (PSI data, SAFFIRE, BASS, FLEX, ACME, CFI, SAME, SPICE, LUCI).",
  "Answer ONLY from the EVIDENCE items given. Do not use outside knowledge for numbers, dates or results.",
  "Cite every factual sentence with the id of the item it comes from, in square brackets, e.g. [flex-12] or [PAT-FLEX-O2]. Copy ids exactly as written.",
  "If the evidence does not answer the question, say so plainly and name what is missing. Never invent a value.",
  "Say whether a result is measured, published or a model, and note when evidence comes from one programme, one test or 1 g ground tests.",
  "Be concise: at most 150 words, plain sentences, no headings. Answer in the language of the question.",
  "You give research information, not operational safety instructions for a real emergency.",
].join(" ");

/* Simple per-IP limit. In memory, so it resets when the server instance restarts; enough to stop one
   visitor from using up the shared Groq quota of a public demo. */
const hits = new Map();
function limited(ip) {
  const now = Date.now();
  const list = (hits.get(ip) ?? []).filter((t) => now - t < RATE_LIMIT.windowMs);
  list.push(now);
  hits.set(ip, list);
  if (hits.size > 5000) hits.clear();
  return list.length > RATE_LIMIT.max;
}

const json = (body, status = 200) => Response.json(body, { status, headers: { "Cache-Control": "no-store" } });

function searchAnswer(found, notice) {
  return json({ mode: "search", items: toListItems(found), evidence: found.filter((h) => h.kind === "record").map((h) => h.id), notice: notice ?? null });
}

export async function POST(request) {
  const ip = (request.headers.get("x-forwarded-for") ?? "").split(",")[0].trim() || request.headers.get("x-real-ip") || "local";
  if (limited(ip)) {
    return json({ error: "rate-limited", message: "Too many questions in a minute. Wait a moment and ask again." }, 429);
  }

  let question = "";
  try { question = String((await request.json())?.question ?? "").trim(); } catch { /* empty */ }
  if (!question) return json({ error: "empty", message: "Type a question first." }, 400);
  if (question.length > MAX_QUESTION) {
    return json({ error: "too-long", message: `Questions are limited to ${MAX_QUESTION} characters.` }, 413);
  }
  if (detectEmergencyIntent(question).isEmergency) return json({ mode: "emergency" });

  const found = retrieve(question, 14);
  if (!found.length) return json({ mode: "search", items: [], evidence: [], notice: null });

  const key = process.env.GROQ_API_KEY;
  const top = found.slice(0, 6);
  if (!key) return searchAnswer(top, null);

  const evidence = found.map((h) => `[${h.id}] (${h.kind}${h.context ? `; ${h.context}` : ""}) ${h.summary}`).join("\n");
  const ctl = new AbortController();
  const timer = setTimeout(() => ctl.abort(), MODEL_TIMEOUT_MS);
  try {
    const res = await fetch(`${process.env.GROQ_BASE_URL || "https://api.groq.com/openai/v1"}/chat/completions`, {
      method: "POST",
      headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        model: MODEL,
        temperature: 0.2,
        // gpt-oss is a reasoning model: keep the reasoning short so the answer fits and stays fast.
        reasoning_effort: "low",
        max_tokens: 1200,
        messages: [
          { role: "system", content: SYSTEM },
          { role: "user", content: `EVIDENCE:\n${evidence}\n\nQUESTION: ${question}` },
        ],
      }),
      signal: ctl.signal,
    });
    if (res.status === 429) {
      return searchAnswer(top, "The AI model is busy right now (rate limit reached), so here are the matching records instead. Try again in a minute for an AI answer.");
    }
    if (!res.ok) {
      // Logged server-side only (Vercel runtime logs), so a bad key or retired model is easy to spot.
      const detail = await res.text().catch(() => "");
      console.error(`[firewise] Groq returned ${res.status}: ${detail.slice(0, 300)}`);
      return searchAnswer(top, "The AI model did not answer, so here are the matching records instead.");
    }
    const data = await res.json();
    const text = data?.choices?.[0]?.message?.content?.trim();
    if (!text) return searchAnswer(top, "The AI model returned an empty answer, so here are the matching records instead.");
    const cited = new Set([...text.matchAll(/\[([^\]\s]+)\]/g)].map((m) => m[1]));
    const recordIds = found.filter((h) => h.kind === "record").map((h) => h.id);
    const citedRecords = [...cited].filter((id) => RECORD_IDS.has(id));
    return json({ mode: "ai", text, evidence: citedRecords.length ? citedRecords : recordIds.slice(0, 4), model: MODEL });
  } catch {
    return searchAnswer(top, "The AI model took too long, so here are the matching records instead.");
  } finally {
    clearTimeout(timer);
  }
}
