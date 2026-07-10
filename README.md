# GrowEasy AI CSV Importer

Uploads any lead CSV (Facebook Ads, Google Ads, Excel, real-estate CRM exports, sales reports, manual sheets — any column layout) and uses an AI model to map it into GrowEasy's fixed CRM schema.

**Live app:** _add your deployed frontend URL here_
**Backend API:** _add your deployed backend URL here_

## How it works

1. **Upload** — drag & drop or pick a `.csv` file.
2. **Preview** — parsed client-side (no AI yet) into a scrollable table with sticky headers, so you can sanity-check the file before spending API calls on it.
3. **Confirm & run AI import** — the file is uploaded to the backend, which:
   - parses it (headers can be anything),
   - splits rows into batches (`BATCH_SIZE`, default 25),
   - sends each batch to the configured AI provider with a prompt that encodes the CRM schema + all business rules,
   - validates every AI-returned record server-side (enum whitelisting, date parsing, single-line fields, email/mobile requirement) before trusting it,
   - streams progress back to the browser as NDJSON so the UI can show a live progress bar.
4. **Results** — imported vs skipped records, each with counts and a reason for skips.

## Project structure

```
groweasy-csv-importer/
  backend/     Express API (CSV parsing, AI extraction, validation)
  frontend/    Next.js app (upload / preview / progress / results UI)
```

## Backend setup

```bash
cd backend
npm install
cp .env.example .env
```

Edit `.env`:
- `AI_PROVIDER` — `gemini` (default), `openai`, or `claude`
- Set the matching API key: `GEMINI_API_KEY`, `OPENAI_API_KEY`, or `ANTHROPIC_API_KEY`
- `CORS_ORIGIN` — your frontend's URL (comma-separated if more than one)

```bash
npm run dev      # http://localhost:4000
npm test         # runs the Jest unit tests (validator + CSV parsing)
```

## Frontend setup

```bash
cd frontend
npm install
cp .env.local.example .env.local
```

Set `NEXT_PUBLIC_API_BASE_URL` in `.env.local` to your backend URL.

```bash
npm run dev       # http://localhost:3000
npm run build     # production build
```

## API

### `POST /api/import`
`multipart/form-data`, field name `file` (the CSV). Response is **newline-delimited JSON** (`application/x-ndjson`), one JSON object per line:

```json
{"type":"start","totalRows":120,"totalBatches":5}
{"type":"progress","completedBatches":1,"totalBatches":5,"importedSoFar":24,"skippedSoFar":1}
...
{"type":"done","imported":[...],"skipped":[...],"totalImported":118,"totalSkipped":2,"totalRows":120}
```

### `GET /api/health`
Basic liveness check, also reports which AI provider is active.

## CRM field mapping rules implemented

- `crm_status` and `data_source` are strictly whitelisted — anything the AI returns outside the allowed enum is blanked out server-side rather than trusted.
- `created_at` is validated with `new Date(...)`; unparsable dates are blanked rather than passed through.
- Extra emails/phone numbers beyond the first are appended into `crm_note`.
- A row is skipped if it has neither a usable email nor a usable mobile number — this is enforced both in the AI prompt and again in a server-side validator as a safety net, so a hallucinating model can't sneak an invalid record through.
- All fields are collapsed to a single line so records remain valid single CSV rows if exported later.

## Design notes

The UI follows a "pipeline" concept — a 4-stage rail (Upload → Preview → AI Mapping → CRM Ready) since that's literally what the app does: move a raw file through stages until it's clean CRM data. Dark control-room palette, monospace for data-dense areas, sans-serif for UI chrome.

## Tech stack

- **Frontend:** Next.js 14 (App Router), TypeScript, PapaParse for client-side preview parsing
- **Backend:** Node.js, Express, Multer, csv-parse
- **AI:** pluggable adapter — Gemini / OpenAI / Claude, selected via `AI_PROVIDER`
- **Tests:** Jest (backend validator + CSV parsing)

## Deployment

- **Backend** → Railway / Render (needs a persistent Node process for streaming responses)
- **Frontend** → Vercel

Remember to set `CORS_ORIGIN` on the backend to your deployed frontend's URL, and `NEXT_PUBLIC_API_BASE_URL` on the frontend to your deployed backend's URL.

## Possible next steps

- Persist import history in a database
- Server-Sent Events instead of NDJSON streaming for broader proxy compatibility
- Virtualized rendering for very large result tables (10k+ rows)
- Docker Compose for one-command local spin-up
