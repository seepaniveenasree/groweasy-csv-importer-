"use client";

interface Column {
  key: string;
  label: string;
}

interface Props {
  columns: Column[];
  rows: Record<string, string>[];
  maxHeight?: string;
  emptyMessage?: string;
  rowBadge?: (row: Record<string, string>) => { text: string; tone: "mint" | "red" | "amber" } | null;
}

export default function DataTable({ columns, rows, maxHeight = "420px", emptyMessage, rowBadge }: Props) {
  if (!rows.length) {
    return <p className="empty">{emptyMessage || "No rows to show."}</p>;
  }

  return (
    <div className="table-wrap" style={{ maxHeight }}>
      <table>
        <thead>
          <tr>
            {rowBadge && <th className="badge-col">Status</th>}
            <th className="idx-col">#</th>
            {columns.map((col) => (
              <th key={col.key}>{col.label}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, i) => {
            const badge = rowBadge?.(row) ?? null;
            return (
              <tr key={i}>
                {rowBadge && (
                  <td className="badge-col">
                    {badge && <span className={`pill pill-${badge.tone}`}>{badge.text}</span>}
                  </td>
                )}
                <td className="idx-col">{i + 1}</td>
                {columns.map((col) => (
                  <td key={col.key} title={row[col.key] ?? ""}>
                    {row[col.key] || <span className="blank">—</span>}
                  </td>
                ))}
              </tr>
            );
          })}
        </tbody>
      </table>

      <style jsx>{`
        .table-wrap {
          overflow: auto;
          border: 1px solid var(--border);
          border-radius: var(--radius);
          background: var(--panel);
        }
        table {
          border-collapse: collapse;
          width: 100%;
          font-family: var(--font-mono);
          font-size: 12.5px;
          white-space: nowrap;
        }
        thead th {
          position: sticky;
          top: 0;
          background: var(--panel-alt);
          color: var(--text-muted);
          text-align: left;
          padding: 10px 14px;
          font-weight: 600;
          border-bottom: 1px solid var(--border);
          text-transform: uppercase;
          font-size: 10.5px;
          letter-spacing: 0.05em;
          z-index: 1;
        }
        td {
          padding: 9px 14px;
          border-bottom: 1px solid var(--border-soft);
          color: var(--text);
          max-width: 220px;
          overflow: hidden;
          text-overflow: ellipsis;
        }
        tbody tr:hover {
          background: var(--panel-alt);
        }
        .idx-col {
          color: var(--text-faint);
          width: 40px;
        }
        .badge-col {
          width: 110px;
        }
        .blank {
          color: var(--text-faint);
        }
        .pill {
          font-family: var(--font-mono);
          font-size: 10px;
          padding: 3px 8px;
          border-radius: 100px;
          letter-spacing: 0.03em;
          font-weight: 600;
        }
        .pill-mint {
          background: var(--mint-dim);
          color: var(--mint);
        }
        .pill-red {
          background: var(--red-dim);
          color: var(--red);
        }
        .pill-amber {
          background: var(--amber-dim);
          color: var(--amber);
        }
        .empty {
          color: var(--text-muted);
          font-size: 13px;
          padding: 24px;
          text-align: center;
        }
      `}</style>
    </div>
  );
}
