import { suggestedQuestions, defaultConversation } from "@/data/firewiseQuestions";
import { PROTOTYPE_LABELS } from "@/lib/constants";
import { detectEmergencyIntent } from "./emergencyGuard";

export { suggestedQuestions, defaultConversation };

/**
 * Firewise, browser side.
 *
 * The question goes to /api/firewise. The server matches it against the loaded records (the catalog
 * never reaches the browser) and returns either an AI answer that cites real record ids, or, when
 * the model is not available, the matched records as a short list. Either way the answer is labelled
 * "AI answer" or "Search result" in the UI.
 */

export const MAX_QUESTION = 500;
const CLIENT_TIMEOUT_MS = 9000;

const newId = () => `msg-${Date.now().toString(36)}`;

function base(question) {
  return { id: newId(), role: "assistant", question, confidence: null };
}

function emergency(question) {
  return {
    ...base(question),
    kind: "emergency",
    answerId: "emergency-notice",
    text: PROTOTYPE_LABELS.emergencyBody,
    label: PROTOTYPE_LABELS.emergency,
    evidence: [],
    caveat: null,
    source: "safety-notice",
  };
}

function problem(question, text) {
  return { ...base(question), source: "notice", answerId: "notice", text, evidence: [], items: [], caveat: null };
}

export async function askFirewiseQuestion(question) {
  const trimmed = question.trim().slice(0, MAX_QUESTION);
  if (!trimmed) return null;
  if (detectEmergencyIntent(trimmed).isEmergency) return emergency(trimmed);

  const ctl = new AbortController();
  const timer = setTimeout(() => ctl.abort(), CLIENT_TIMEOUT_MS);
  try {
    const res = await fetch("/api/firewise", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ question: trimmed }),
      signal: ctl.signal,
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) return problem(trimmed, data?.message ?? "Firewise could not answer right now. Try again in a moment.");
    if (data.mode === "emergency") return emergency(trimmed);
    if (data.mode === "ai") {
      return {
        ...base(trimmed),
        source: "model",
        answerId: "model",
        text: data.text,
        evidence: data.evidence ?? [],
        caveat: "Written by an AI model from the records and findings listed only. Open each record before relying on it.",
      };
    }
    const items = data.items ?? [];
    return {
      ...base(trimmed),
      source: "retrieval",
      answerId: items.length ? "retrieval" : "no-match",
      text: items.length
        ? `${items.length} matching item${items.length === 1 ? "" : "s"} from the loaded records:`
        : "No loaded record, finding or source matches this question. Try the names used in the records, such as SAFFIRE-III, FLEX, BASS-II, LUCI, extinction, spread, oxygen or airflow.",
      items,
      notice: data.notice ?? null,
      evidence: data.evidence ?? [],
      caveat: null,
    };
  } catch {
    return problem(trimmed, "Firewise did not get an answer from the server in time. Check the connection and try again.");
  } finally {
    clearTimeout(timer);
  }
}

export async function getSuggestedQuestions() {
  return suggestedQuestions;
}

/** Kept for stored conversations from older versions; evidence ids are checked on the server now. */
export function hydrateConversation(conversation) {
  return { ...conversation, messages: conversation.messages ?? [] };
}
