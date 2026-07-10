"use client";

interface Props {
  completedBatches: number;
  totalBatches: number;
  importedSoFar: number;
  skippedSoFar: number;
}

export default function ProgressBar({ completedBatches, totalBatches, importedSoFar, skippedSoFar }: Props) {
  const pct = totalBatches > 0 ? Math.round((completedBatches / totalBatches) * 100) : 0;

  return (
    <div className="progress-panel">
      <div className="progress-head">
        <span className="progress-label">Mapping batch {Math.min(completedBatches + 1, totalBatches)} of {totalBatches}</span>
        <span className="progress-pct">{pct}%</span>
      </div>
      <div className="progress-track">
        <div className="progress-fill" style={{ width: `${pct}%` }} />
      </div>
      <div className="progress-stats">
        <span>
          <strong className="mint">{importedSoFar}</strong> imported so far
        </span>
        <span>
          <strong className="red">{skippedSoFar}</strong> skipped so far
        </span>
      </div>

      <style jsx>{`
        .progress-panel {
          background: var(--panel);
          border: 1px solid var(--border);
          border-radius: var(--radius);
          padding: 24px;
        }
        .progress-head {
          display: flex;
          justify-content: space-between;
          font-family: var(--font-mono);
          font-size: 13px;
          color: var(--text-muted);
          margin-bottom: 10px;
        }
        .progress-pct {
          color: var(--amber);
          font-weight: 600;
        }
        .progress-track {
          height: 8px;
          background: var(--panel-alt);
          border-radius: 100px;
          overflow: hidden;
          border: 1px solid var(--border-soft);
        }
        .progress-fill {
          height: 100%;
          background: linear-gradient(90deg, var(--amber), var(--cyan));
          transition: width 0.4s ease;
        }
        .progress-stats {
          display: flex;
          gap: 20px;
          margin-top: 14px;
          font-size: 13px;
          color: var(--text-muted);
        }
        .mint {
          color: var(--mint);
        }
        .red {
          color: var(--red);
        }
      `}</style>
    </div>
  );
}
