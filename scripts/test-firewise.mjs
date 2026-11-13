/**
 * Firewise AI check against the real Groq API.
 *
 *   1. Put your key in .env.local:   GROQ_API_KEY=gsk_...
 *   2. Start the app (RUN-APP.bat, or: npm run build && npm start)
 *   3. In a second window:           node scripts/test-firewise.mjs
 *      (another address:             node scripts/test-firewise.mjs http://localhost:3000)
 *
 * Asks seven questions (one per topic, one in Arabic, one emergency that must be refused) and
 * checks that each cited record id exists and its page opens. The key is never printed.
 */
const BASE = (process.argv[2] || "http://localhost:3005").replace(/\/$/, "");

const QUESTIONS = [
  { topic: "oxygen", q: "How does ambient oxygen change whether FLEX droplet flames go out?" },
  { topic: "smoke detection", q: "Does the ISS scatter smoke detector see Kapton and Teflon smoke?" },
  { topic: "ventilation", q: "What happens to solid-fuel flames when the air flow is slowed below 10 cm/s?" },
  { topic: "suppression", q: "Did adding CO2 or helium to the air put droplet flames out?" },
  { topic: "lunar gravity", q: "What is known about burning in lunar gravity?" },
  { topic: "Arabic", q: "ما تأثير زيادة الأكسجين على انطفاء اللهب في الجاذبية الصغرى؟", arabic: true },
  { topic: "emergency", q: "There is a fire in our cabin right now, what should we do?", emergency: true },
];

const ok = (b) => (b ? "PASS" : "FAIL");
let failures = 0;

for (const item of QUESTIONS) {
  const t0 = Date.now();
  let data = {};
  let status = 0;
  try {
    const res = await fetch(`${BASE}/api/firewise`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ question: item.q }),
    });
    status = res.status;
    data = await res.json();
  } catch (e) {
    console.log(`FAIL ${item.topic}: cannot reach ${BASE} (${e.message}). Is the app running?`);
    failures += 1;
    continue;
  }
  const secs = ((Date.now() - t0) / 1000).toFixed(1);

  if (item.emergency) {
    const pass = data.mode === "emergency";
    if (!pass) failures += 1;
    console.log(`${ok(pass)} ${item.topic} (${secs} s): ${pass ? "refused, safety notice shown" : `answered with mode "${data.mode}"`}`);
    continue;
  }

  const ids = data.evidence ?? [];
  const checks = await Promise.all(ids.map(async (id) => [id, (await fetch(`${BASE}/experiments/${encodeURIComponent(id)}`)).status]));
  const broken = checks.filter(([, s]) => s !== 200).map(([id, s]) => `${id} (${s})`);
  const isAi = data.mode === "ai";
  const arabicOk = !item.arabic || /[؀-ۿ]/.test(data.text ?? "");
  const pass = status === 200 && isAi && ids.length > 0 && broken.length === 0 && arabicOk;
  if (!pass) failures += 1;
  console.log(`${ok(pass)} ${item.topic} (${secs} s): mode=${data.mode}${data.notice ? ` (${data.notice})` : ""}; cited ${ids.length} record(s)${broken.length ? `; BROKEN: ${broken.join(", ")}` : ", all open"}${item.arabic ? `; Arabic answer: ${arabicOk ? "yes" : "no"}` : ""}`);
  if (data.text) console.log(`     ${data.text.replace(/\s+/g, " ").slice(0, 220)}${data.text.length > 220 ? "…" : ""}`);
}

console.log(failures ? `\n${failures} check(s) failed.` : "\nAll Firewise checks passed.");
process.exit(failures ? 1 : 0);
