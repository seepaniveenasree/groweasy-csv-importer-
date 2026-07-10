"use client";

import type { Stage } from "@/lib/types";

const STAGES: { key: Stage; label: string; eyebrow: string }[] = [
  { key: "upload", label: "Upload", eyebrow: "01 · SOURCE" },
  { key: "preview", label: "Preview", eyebrow: "02 · REVIEW" },
  { key: "processing", label: "AI Mapping", eyebrow: "03 · MAP" },
  { key: "results", label: "CRM Ready", eyebrow: "04 · OUTPUT" },
];

export default function Stepper({ current }: { current: Stage }) {
  const currentIndex = STAGES.findIndex((s) => s.key === current);

  return (
    <div className="stepper" role="list" aria-label="Import pipeline progress">
      {STAGES.map((stage, i) => {
        const state = i < currentIndex ? "done" : i === currentIndex ? "active" : "upcoming";
        return (
          <div className="stepper-node" role="listitem" key={stage.key} data-state={state}>
            <div className="stepper-rail">
              <div className="stepper-dot" />
              {i < STAGES.length - 1 && <div className="stepper-line" />}
            </div>
            <div className="stepper-label">
              <span className="stepper-eyebrow">{stage.eyebrow}</span>
              <span className="stepper-text">{stage.label}</span>
            </div>
          </div>
        );
      })}

      <style jsx>{`
        .stepper {
          display: flex;
          align-items: flex-start;
          gap: 4px;
        }
        .stepper-node {
          display: flex;
          align-items: center;
          flex: 1;
        }
        .stepper-node:last-child {
          flex: 0 0 auto;
        }
        .stepper-rail {
          display: flex;
          align-items: center;
          width: 100%;
        }
        .stepper-dot {
          width: 12px;
          height: 12px;
          border-radius: 50%;
          border: 2px solid var(--border);
          background: var(--panel);
          flex-shrink: 0;
          transition: all 0.25s ease;
        }
        .stepper-line {
          height: 2px;
          flex: 1;
          background: var(--border);
          margin: 0 6px;
          transition: background 0.3s ease;
        }
        [data-state="active"] .stepper-dot {
          border-color: var(--amber);
          background: var(--amber);
          box-shadow: 0 0 0 4px var(--amber-dim);
        }
        [data-state="done"] .stepper-dot {
          border-color: var(--mint);
          background: var(--mint);
        }
        [data-state="done"] .stepper-line {
          background: var(--mint);
          opacity: 0.5;
        }
        .stepper-label {
          position: absolute;
          margin-top: 22px;
          display: flex;
          flex-direction: column;
          gap: 2px;
        }
        .stepper-node {
          position: relative;
        }
        .stepper-eyebrow {
          font-family: var(--font-mono);
          font-size: 10px;
          letter-spacing: 0.06em;
          color: var(--text-faint);
        }
        [data-state="active"] .stepper-eyebrow {
          color: var(--amber);
        }
        [data-state="done"] .stepper-eyebrow {
          color: var(--mint);
        }
        .stepper-text {
          font-family: var(--font-display);
          font-size: 13px;
          font-weight: 600;
          color: var(--text-muted);
        }
        [data-state="active"] .stepper-text,
        [data-state="done"] .stepper-text {
          color: var(--text);
        }
      `}</style>
    </div>
  );
}
