import express from "express";
import rateLimit from "express-rate-limit";
import crypto from "crypto";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const { GROQ_API_KEY, APP_USER, APP_PASSWORD } = process.env;
const MODEL = process.env.GROQ_MODEL || "llama-3.3-70b-versatile"; // check console.groq.com/docs/models for current models
if (!GROQ_API_KEY || !APP_USER || !APP_PASSWORD) {
  console.error("Set GROQ_API_KEY, APP_USER and APP_PASSWORD environment variables.");
  process.exit(1);
}

const app = express();
app.set("trust proxy", 1);
app.get("/healthz", (_q, r) => r.send("ok")); // no auth, no data

const eq = (a, b) => { const x = Buffer.from(a), y = Buffer.from(b); return x.length === y.length && crypto.timingSafeEqual(x, y); };
app.use((req, res, next) => {
  const [u, ...p] = Buffer.from((req.headers.authorization || "").replace(/^Basic /, ""), "base64").toString().split(":");
  if (u !== undefined && eq(u, APP_USER) && eq(p.join(":"), APP_PASSWORD)) return next();
  res.set("WWW-Authenticate", 'Basic realm="Clinical Dashboard"').status(401).send("Login required");
});
app.use((_q, res, next) => { res.set({ "Cache-Control": "no-store", "X-Content-Type-Options": "nosniff", "Referrer-Policy": "no-referrer" }); next(); });
app.use(express.json({ limit: "1mb" }));
app.use(express.static(path.join(__dirname, "public")));

app.post("/api/ai", rateLimit({ windowMs: 60_000, max: 12 }), async (req, res) => {
  const prompt = req.body && req.body.prompt;
  if (typeof prompt !== "string" || !prompt || prompt.length > 60000) return res.status(400).json({ error: "bad prompt" });
  try {
    const r = await fetch("https://api.groq.com/openai/v1/chat/completions", {
      method: "POST",
      headers: { Authorization: "Bearer " + GROQ_API_KEY, "content-type": "application/json" },
      body: JSON.stringify({ model: MODEL, temperature: 0.2, max_tokens: 8000, response_format: { type: "json_object" },
        messages: [{ role: "system", content: "Reply with a single valid JSON object only." }, { role: "user", content: prompt }] }),
    });
    if (!r.ok) { console.error("Groq API status", r.status); return res.status(502).json({ error: "upstream " + r.status }); }
    const d = await r.json();
    res.json({ text: (d.choices && d.choices[0] && d.choices[0].message && d.choices[0].message.content) || "" });
  } catch (e) { console.error("AI call failed:", e.message); res.status(502).json({ error: "upstream failure" }); }
}); // request bodies are never logged

app.listen(process.env.PORT || 3000, () => console.log("Running"));
