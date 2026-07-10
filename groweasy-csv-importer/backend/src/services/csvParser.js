const { parse } = require("csv-parse/sync");

/**
 * Parses a raw CSV buffer/string into an array of plain row objects,
 * keyed by whatever headers the file actually has. We deliberately do NOT
 * assume fixed column names here - that's the whole point of the assignment.
 *
 * Throws a descriptive error on malformed CSV so the route can return a 400.
 */
function parseCsv(csvContent) {
  let rows;
  try {
    rows = parse(csvContent, {
      columns: true, // use first row as headers, produces array of objects
      skip_empty_lines: true,
      trim: true,
      relax_column_count: true, // tolerate ragged rows instead of throwing
      bom: true, // strip UTF-8 BOM often added by Excel exports
    });
  } catch (err) {
    throw new Error(`Could not parse CSV: ${err.message}`);
  }

  if (!rows.length) {
    throw new Error("CSV file has no data rows.");
  }

  // Drop rows that are entirely empty (blank line with just commas)
  const cleaned = rows.filter((row) =>
    Object.values(row).some((v) => String(v ?? "").trim() !== "")
  );

  if (!cleaned.length) {
    throw new Error("CSV file has a header row but no usable data.");
  }

  return cleaned;
}

/**
 * Splits an array of rows into fixed-size batches, preserving each row's
 * original index so results can be traced back for error reporting.
 */
function toBatches(rows, batchSize) {
  const batches = [];
  for (let i = 0; i < rows.length; i += batchSize) {
    const slice = rows.slice(i, i + batchSize).map((data, j) => ({
      originalIndex: i + j,
      data,
    }));
    batches.push(slice);
  }
  return batches;
}

module.exports = { parseCsv, toBatches };
