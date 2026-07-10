const {
  CRM_FIELDS,
  CRM_STATUS_VALUES,
  DATA_SOURCE_VALUES,
  EMPTY_RECORD,
} = require("../utils/crmSchema");

function isValidDate(value) {
  if (!value) return false;
  const d = new Date(value);
  return !Number.isNaN(d.getTime());
}

function sanitizeSingleLine(value) {
  if (value === null || value === undefined) return "";
  return String(value).replace(/\r?\n/g, " | ").trim();
}

/**
 * Takes one raw record as returned by the AI and:
 * - fills in any missing schema keys with ""
 * - strips fields the AI shouldn't have invented
 * - clamps crm_status / data_source to the allowed enum (else "")
 * - blanks out an unparsable created_at rather than letting bad data through
 * - collapses newlines so the record stays a single CSV row
 * - re-checks the "must have email or mobile" rule as a safety net
 *
 * Returns { record } on success or { skipped: {reason} } if it fails the
 * email/mobile requirement even after cleanup.
 */
function sanitizeRecord(raw) {
  const clean = { ...EMPTY_RECORD };
  for (const field of CRM_FIELDS) {
    clean[field] = sanitizeSingleLine(raw?.[field]);
  }

  if (clean.crm_status && !CRM_STATUS_VALUES.includes(clean.crm_status)) {
    clean.crm_status = "";
  }
  if (clean.data_source && !DATA_SOURCE_VALUES.includes(clean.data_source)) {
    clean.data_source = "";
  }
  if (clean.created_at && !isValidDate(clean.created_at)) {
    // don't invent a date - just drop the unparsable value
    clean.created_at = "";
  }

  const hasEmail = clean.email.includes("@");
  const hasMobile = clean.mobile_without_country_code.replace(/\D/g, "").length >= 5;

  if (!hasEmail && !hasMobile) {
    return { skipped: { reason: "No valid email or mobile number found" } };
  }

  return { record: clean };
}

module.exports = { sanitizeRecord, isValidDate };
