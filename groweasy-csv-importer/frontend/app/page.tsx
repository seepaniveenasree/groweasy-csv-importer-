"use client";

import { useCallback, useState } from "react";
import Papa from "papaparse";
import Dropzone from "@/components/Dropzone";
import Stepper from "@/components/Stepper";
import DataTable from "@/components/DataTable";
import ProgressBar from "@/components/ProgressBar";
import { importCsv } from "@/lib/api";
import { CRM_FIELDS, type CrmRecord, type RawCsvRow, type SkippedRecord, type Stage } from "@/lib/types";

const CRM_COLUMNS = CRM_FIELDS.map((f) => ({ key: f, label: f.replace(/_/g, " ") }));

export default function Home() {
  const [stage, setStage] = useState<Stage>("upload");
  const [file, setFile] = useState<File | null>(null);
  const [uploadError, setUploadError] = useState<string | null>(null);

  const [previewRows, setPreviewRows] = useState<RawCsvRow[]>([]);
  const [previewColumns, setPreviewColumns] = useState<{ key: string; label: string }[]>([]);

  const [progress, setProgress] = useState({ completedBatches: 0, totalBatches: 0, importedSoFar: 0, skippedSoFar: 0 });
  const [processingError, setProcessingError] = useState<string | null>(null);

  const [imported, setImported] = useState<CrmRecord[]>([]);
  const [skipped, setSkipped] = useState<SkippedRecord[]>([]);
  const [resultsTab, setResultsTab] = useState<"imported" | "skipped">("imported");

  const handleFileSelected = useCallback((selected: File) => {
    setUploadError(null);

    if (!selected.name.toLowerCase().endsWith(".csv")) {
      setUploadError("That doesn't look like a .csv file. Please choose a valid CSV export.");
      return;
    }

    Papa.parse<RawCsvRow>(selected, {
      header: true,
      skipEmptyLines: true,
      complete: (results) => {
        if (!results.data.length) {
          setUploadError("This CSV has headers but no data rows.");
          return;
        }
        const fields = results.meta.fields || Object.keys(results.data[0]);
        setPreviewColumns(fields.map((f) => ({ key: f, label: f })));
        setPreviewRows(results.data);
        setFile(selected);
        setStage("preview");
      },
      error: (err) => {
        setUploadError(`Could not read this CSV: ${err.message}`);
      },
    });
  }, []);

  const handleConfirmImport = useCallback(async () => {
    if (!file) return;
    setStage("processing");
    setProcessingError(null);
    setProgress({ completedBatches: 0, totalBatches: 0, importedSoFar: 0, skippedSoFar: 0 });

    try {
      await importCsv(file, (event) => {
        if (event.type === "start") {
          setProgress((p) => ({ ...p, totalBatches: event.totalBatches }));
        } else if (event.type === "progress") {
          setProgress({
            completedBatches: event.completedBatches,
            totalBatches: event.totalBatches,
            importedSoFar: event.importedSoFar,
            skippedSoFar: event.skippedSoFar,
          });
        } else if (event.type === "done") {
          setImported(event.imported);
          setSkipped(event.skipped);
          setStage("results");
        }
      });
    } catch (err) {
      setProcessingError(err instanceof Error ? err.message : "Something went wrong during import.");
    }
  }, [file]);

  const reset = useCallback(() => {
    setStage("upload");
    setFile(null);
    setUploadError(null);
    setPreviewRows([]);
    setPreviewColumns([]);
    setImported([]);
    setSkipped([]);
    setProcessingError(null);
    setProgress({ completedBatches: 0, totalBatches: 0, importedSoFar: 0, skippedSoFar: 0 });
  }, []);

  return (
    <main className="page">
      <header className="hero">
        <span className="hero-eyebrow">GROWEASY · LEAD PIPELINE</span>
        <h1>CSV → CRM Importer</h1>
        <p>Drop in any lead export — Facebook, Google Ads, Excel, a real-estate CRM, a sales report — and AI maps it into GrowEasy CRM format automatically.</p>
      </header>

      <div className="stepper-wrap">
        <Stepper current={stage} />
      </div>

      <section className="stage-panel">
        {stage === "upload" && <Dropzone onFileSelected={handleFileSelected} error={uploadError} />}

        {stage === "preview" && (
          <div className="stack">
            <div className="panel-header">
              <div>
                <h2>Preview</h2>
                <p className="muted">
                  {file?.name} · {previewRows.length} row{previewRows.length === 1 ? "" : "s"} detected · no AI has run yet
                </p>
              </div>
              <div className="actions">
                <button className="btn btn-ghost" onClick={reset}>
                  Choose a different file
                </button>
                <button className="btn btn-primary" onClick={handleConfirmImport}>
                  Confirm &amp; run AI import
                </button>
              </div>
            </div>
            <DataTable columns={previewColumns} rows={previewRows} />
          </div>
        )}

        {stage === "processing" && (
          <div className="stack">
            <div className="panel-header">
              <div>
                <h2>Mapping fields with AI</h2>
                <p className="muted">Rows are sent in batches so large files stay fast and fault-tolerant.</p>
              </div>
            </div>
            <ProgressBar {...progress} />
            {processingError && (
              <div className="error-box">
                <strong>Import failed:</strong> {processingError}
                <div style={{ marginTop: 12 }}>
                  <button className="btn btn-ghost" onClick={reset}>
                    Start over
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

        {stage === "results" && (
          <div className="stack">
            <div className="panel-header">
              <div>
                <h2>Import complete</h2>
                <p className="muted">Mapped {imported.length + skipped.length} row(s) from {file?.name}.</p>
              </div>
              <div className="actions">
                <button className="btn btn-ghost" onClick={reset}>
                  Import another CSV
                </button>
              </div>
            </div>

            <div className="summary-cards">
              <div className="summary-card">
                <span className="summary-value mint">{imported.length}</span>
                <span className="summary-label">Total imported</span>
              </div>
              <div className="summary-card">
                <span className="summary-value red">{skipped.length}</span>
                <span className="summary-label">Total skipped</span>
              </div>
            </div>

            <div className="tabs">
              <button
                className={`tab ${resultsTab === "imported" ? "active" : ""}`}
                onClick={() => setResultsTab("imported")}
              >
                Imported ({imported.length})
              </button>
              <button
                className={`tab ${resultsTab === "skipped" ? "active" : ""}`}
                onClick={() => setResultsTab("skipped")}
              >
                Skipped ({skipped.length})
              </button>
            </div>

            {resultsTab === "imported" ? (
              <DataTable
                columns={CRM_COLUMNS}
                rows={imported}
                emptyMessage="No records were successfully mapped."
                rowBadge={(row) =>
                  row.crm_status ? { text: row.crm_status.replace(/_/g, " "), tone: "mint" } : null
                }
              />
            ) : (
              <DataTable
                columns={[{ key: "reason", label: "reason" }]}
                rows={skipped.map((s) => ({ originalIndex: String(s.originalIndex + 1), reason: s.reason }))}
                emptyMessage="Nothing was skipped — every row had an email or mobile number."
                rowBadge={() => ({ text: "skipped", tone: "red" })}
              />
            )}
          </div>
        )}
      </section>

      <style jsx>{`
        .page {
          max-width: 1080px;
          margin: 0 auto;
          padding: 56px 24px 100px;
        }
        .hero {
          margin-bottom: 40px;
        }
        .hero-eyebrow {
          font-family: var(--font-mono);
          font-size: 11px;
          letter-spacing: 0.1em;
          color: var(--amber);
        }
        .hero h1 {
          font-family: var(--font-display);
          font-size: 34px;
          margin: 10px 0 10px;
          font-weight: 700;
        }
        .hero p {
          color: var(--text-muted);
          max-width: 620px;
          line-height: 1.55;
          margin: 0;
        }
        .stepper-wrap {
          margin-bottom: 56px;
          padding-bottom: 8px;
        }
        .stage-panel {
          background: transparent;
        }
        .stack {
          display: flex;
          flex-direction: column;
          gap: 18px;
        }
        .panel-header {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          flex-wrap: wrap;
          gap: 12px;
        }
        .panel-header h2 {
          font-family: var(--font-display);
          font-size: 20px;
          margin: 0 0 4px;
        }
        .muted {
          color: var(--text-muted);
          font-size: 13px;
          margin: 0;
        }
        .actions {
          display: flex;
          gap: 10px;
        }
        .btn {
          font-family: var(--font-display);
          font-size: 13px;
          font-weight: 600;
          padding: 10px 18px;
          border-radius: var(--radius);
          border: 1px solid var(--border);
          cursor: pointer;
          transition: all 0.15s ease;
        }
        .btn-primary {
          background: var(--amber);
          color: #14100a;
          border-color: var(--amber);
        }
        .btn-primary:hover {
          filter: brightness(1.08);
        }
        .btn-ghost {
          background: transparent;
          color: var(--text-muted);
        }
        .btn-ghost:hover {
          color: var(--text);
          border-color: var(--text-faint);
        }
        .summary-cards {
          display: flex;
          gap: 14px;
        }
        .summary-card {
          background: var(--panel);
          border: 1px solid var(--border);
          border-radius: var(--radius);
          padding: 18px 22px;
          display: flex;
          flex-direction: column;
          gap: 4px;
          min-width: 140px;
        }
        .summary-value {
          font-family: var(--font-mono);
          font-size: 26px;
          font-weight: 600;
        }
        .summary-value.mint {
          color: var(--mint);
        }
        .summary-value.red {
          color: var(--red);
        }
        .summary-label {
          font-size: 12px;
          color: var(--text-muted);
        }
        .tabs {
          display: flex;
          gap: 6px;
          border-bottom: 1px solid var(--border);
        }
        .tab {
          background: transparent;
          border: none;
          border-bottom: 2px solid transparent;
          color: var(--text-muted);
          font-family: var(--font-display);
          font-size: 13px;
          font-weight: 600;
          padding: 10px 4px;
          cursor: pointer;
        }
        .tab.active {
          color: var(--text);
          border-bottom-color: var(--amber);
        }
        .error-box {
          background: var(--red-dim);
          border: 1px solid var(--red);
          color: var(--text);
          border-radius: var(--radius);
          padding: 16px 18px;
          font-size: 13px;
        }
        @media (max-width: 640px) {
          .hero h1 {
            font-size: 26px;
          }
          .panel-header {
            flex-direction: column;
          }
        }
      `}</style>
    </main>
  );
}
