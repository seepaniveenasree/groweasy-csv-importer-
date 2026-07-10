export const CRM_FIELDS = [
  "created_at",
  "name",
  "email",
  "country_code",
  "mobile_without_country_code",
  "company",
  "city",
  "state",
  "country",
  "lead_owner",
  "crm_status",
  "crm_note",
  "data_source",
  "possession_time",
  "description",
] as const;

export type CrmField = (typeof CRM_FIELDS)[number];

export type CrmRecord = Record<CrmField, string>;

export interface SkippedRecord {
  originalIndex: number;
  reason: string;
}

export interface RawCsvRow {
  [column: string]: string;
}

export type StreamEvent =
  | { type: "start"; totalRows: number; totalBatches: number }
  | {
      type: "progress";
      completedBatches: number;
      totalBatches: number;
      importedSoFar: number;
      skippedSoFar: number;
    }
  | {
      type: "done";
      imported: CrmRecord[];
      skipped: SkippedRecord[];
      totalImported: number;
      totalSkipped: number;
      totalRows: number;
    };

export type Stage = "upload" | "preview" | "processing" | "results";
