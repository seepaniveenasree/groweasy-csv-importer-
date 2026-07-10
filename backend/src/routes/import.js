const express = require("express");
const upload = require("../middleware/upload");
const { parseCsv, toBatches } = require("../services/csvParser");
const { extractBatch } = require("../services/aiExtractor");
const { sanitizeRecord } = require("../services/validator");

const router = express.Router();

const BATCH_SIZE = Number(process.env.BATCH_SIZE || 25);
const CONCURRENCY = 3; // how many batches to send to the AI in parallel

/**
 * Runs `tasks` (an array of functions returning promises) with a max
 * concurrency, invoking onSettle(result, index) as each one finishes.
 * Keeps memory/API usage bounded on large CSVs while still going faster
 * than one-batch-at-a-time.
 */
async function runWithConcurrency(tasks, limit, onSettle) {
  let cursor = 0;
  async function worker() {
    while (cursor < tasks.length) {
      const i = cursor++;
      try {
        const result = await tasks[i]();
        onSettle(null, result, i);
      } catch (err) {
        onSettle(err, null, i);
      }
    }
  }
  const workers = Array.from({ length: Math.min(limit, tasks.length) }, worker);
  await Promise.all(workers);
}

router.post("/import", upload.single("file"), async (req, res) => {
  if (!req.file) {
    return res.status(400).json({ error: "No CSV file uploaded (field name must be 'file')." });
  }

  let rows;
  try {
    rows = parseCsv(req.file.buffer.toString("utf-8"));
  } catch (err) {
    return res.status(400).json({ error: err.message });
  }

  const batches = toBatches(rows, BATCH_SIZE);

  // Stream newline-delimited JSON so the frontend can show live progress.
  res.setHeader("Content-Type", "application/x-ndjson");
  res.setHeader("Cache-Control", "no-cache");
  res.write(
    JSON.stringify({
      type: "start",
      totalRows: rows.length,
      totalBatches: batches.length,
    }) + "\n"
  );

  const imported = [];
  const skipped = [];
  let completedBatches = 0;

  const tasks = batches.map((batch) => () => extractBatch(batch));

  await runWithConcurrency(tasks, CONCURRENCY, (err, aiResult, batchIdx) => {
    completedBatches += 1;
    const batch = batches[batchIdx];

    if (err) {
      // Whole batch failed even after internal retries - skip every row in
      // it rather than losing the request, and tell the client why.
      for (const row of batch) {
        skipped.push({
          originalIndex: row.originalIndex,
          reason: `AI extraction failed for this batch: ${err.message}`,
        });
      }
    } else {
      for (const raw of aiResult.records) {
        const { record, skipped: skipInfo } = sanitizeRecord(raw);
        if (record) {
          imported.push(record);
        } else {
          skipped.push({ originalIndex: raw.originalIndex, reason: skipInfo.reason });
        }
      }
      for (const s of aiResult.skipped || []) {
        skipped.push({ originalIndex: s.originalIndex, reason: s.reason || "Skipped by AI" });
      }
    }

    res.write(
      JSON.stringify({
        type: "progress",
        completedBatches,
        totalBatches: batches.length,
        importedSoFar: imported.length,
        skippedSoFar: skipped.length,
      }) + "\n"
    );
  });

  res.write(
    JSON.stringify({
      type: "done",
      imported,
      skipped,
      totalImported: imported.length,
      totalSkipped: skipped.length,
      totalRows: rows.length,
    }) + "\n"
  );
  res.end();
});

module.exports = router;
