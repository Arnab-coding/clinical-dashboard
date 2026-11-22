# Clinical Dashboard – deploy on Render

## Deploy
1. Create a GitHub repo and push this folder (do NOT commit a real `.env`).
2. render.com → New → Blueprint (or Web Service) → connect the repo. `render.yaml` is picked up automatically.
3. When prompted, set the environment variables:
   - `GROQ_API_KEY` – from console.groq.com (API Keys)
   - `APP_USER` / `APP_PASSWORD` – the login the doctor will use (long password)
4. Open the Render URL, log in, upload a case. First load after idle may take ~30 s on small plans.

## Run locally
npm install; copy `.env.example` values into your shell; `node server.js`; open http://localhost:3000

## Notes
- The API key stays on the server; the browser only calls `/api/ai`. Everything is behind HTTP Basic login over HTTPS (Render provides HTTPS).
- Case text is sent to Groq's API for extraction, handouts, Bengali translation and diet plans. Review Groq's data terms and your legal obligations (e.g. India DPDP Act) and get patient consent; consider removing patient names before upload.
- The server does not store files or log request bodies. Rate limit: 12 AI calls/min per IP.
- Default model is `llama-3.3-70b-versatile`; set `GROQ_MODEL` to change it (see console.groq.com/docs/models for current models). Groq's free tier has token-per-minute limits that can cause errors on long cases; upgrade if needed. Check Bengali output extra carefully, as quality varies by model.
- Free Render plans sleep when idle; use a paid plan for reliable access.
- AI output (especially Bengali and diet) must be reviewed by a clinician before approval.
