"use client";

import { useCallback, useRef, useState } from "react";

interface Props {
  onFileSelected: (file: File) => void;
  error?: string | null;
}

export default function Dropzone({ onFileSelected, error }: Props) {
  const [isDragging, setIsDragging] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleFiles = useCallback(
    (files: FileList | null) => {
      const file = files?.[0];
      if (!file) return;
      if (!file.name.toLowerCase().endsWith(".csv")) {
        onFileSelected(file); // let parent decide how to surface the error
        return;
      }
      onFileSelected(file);
    },
    [onFileSelected]
  );

  return (
    <div>
      <div
        className="dropzone"
        data-dragging={isDragging}
        onDragOver={(e) => {
          e.preventDefault();
          setIsDragging(true);
        }}
        onDragLeave={() => setIsDragging(false)}
        onDrop={(e) => {
          e.preventDefault();
          setIsDragging(false);
          handleFiles(e.dataTransfer.files);
        }}
        onClick={() => inputRef.current?.click()}
        role="button"
        tabIndex={0}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") inputRef.current?.click();
        }}
        aria-label="Upload CSV file"
      >
        <input
          ref={inputRef}
          type="file"
          accept=".csv,text/csv"
          hidden
          onChange={(e) => handleFiles(e.target.files)}
        />
        <div className="dropzone-icon" aria-hidden>
          <svg width="34" height="34" viewBox="0 0 24 24" fill="none">
            <path
              d="M12 15V4M12 4L7 9M12 4l5 5"
              stroke="currentColor"
              strokeWidth="1.6"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
            <path
              d="M4 15v3a2 2 0 002 2h12a2 2 0 002-2v-3"
              stroke="currentColor"
              strokeWidth="1.6"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </div>
        <p className="dropzone-title">Drop a CSV here, or click to browse</p>
        <p className="dropzone-sub">
          Facebook / Google Ads exports, Excel sheets, real-estate CRM exports, sales reports — any layout.
        </p>
      </div>
      {error && <p className="dropzone-error">{error}</p>}

      <style jsx>{`
        .dropzone {
          border: 1.5px dashed var(--border);
          border-radius: var(--radius);
          background: var(--panel);
          padding: 56px 24px;
          text-align: center;
          cursor: pointer;
          transition: border-color 0.2s ease, background 0.2s ease;
        }
        .dropzone:hover {
          border-color: var(--text-faint);
        }
        .dropzone[data-dragging="true"] {
          border-color: var(--amber);
          background: var(--amber-dim);
        }
        .dropzone-icon {
          color: var(--amber);
          margin-bottom: 14px;
        }
        .dropzone-title {
          font-family: var(--font-display);
          font-size: 16px;
          font-weight: 600;
          margin: 0 0 6px;
          color: var(--text);
        }
        .dropzone-sub {
          font-size: 13px;
          color: var(--text-muted);
          margin: 0;
          max-width: 420px;
          margin-inline: auto;
        }
        .dropzone-error {
          margin-top: 12px;
          color: var(--red);
          font-size: 13px;
          font-family: var(--font-mono);
        }
      `}</style>
    </div>
  );
}
