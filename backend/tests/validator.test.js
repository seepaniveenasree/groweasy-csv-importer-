const { sanitizeRecord } = require("../src/services/validator");

describe("sanitizeRecord", () => {
  test("keeps a record with a valid email", () => {
    const { record, skipped } = sanitizeRecord({
      name: "John Doe",
      email: "john@example.com",
      crm_status: "GOOD_LEAD_FOLLOW_UP",
    });
    expect(skipped).toBeUndefined();
    expect(record.email).toBe("john@example.com");
    expect(record.name).toBe("John Doe");
  });

  test("keeps a record with only a mobile number", () => {
    const { record } = sanitizeRecord({
      name: "Jane",
      mobile_without_country_code: "9876543210",
    });
    expect(record).toBeDefined();
    expect(record.mobile_without_country_code).toBe("9876543210");
  });

  test("skips a record with neither email nor mobile", () => {
    const { record, skipped } = sanitizeRecord({ name: "No Contact" });
    expect(record).toBeUndefined();
    expect(skipped.reason).toMatch(/email or mobile/i);
  });

  test("blanks an invalid crm_status instead of accepting arbitrary values", () => {
    const { record } = sanitizeRecord({
      email: "a@b.com",
      crm_status: "TOTALLY_MADE_UP",
    });
    expect(record.crm_status).toBe("");
  });

  test("blanks an invalid data_source", () => {
    const { record } = sanitizeRecord({
      email: "a@b.com",
      data_source: "random_project",
    });
    expect(record.data_source).toBe("");
  });

  test("blanks an unparsable created_at date", () => {
    const { record } = sanitizeRecord({
      email: "a@b.com",
      created_at: "not-a-date",
    });
    expect(record.created_at).toBe("");
  });

  test("keeps a valid created_at date", () => {
    const { record } = sanitizeRecord({
      email: "a@b.com",
      created_at: "2026-05-13 14:20:48",
    });
    expect(record.created_at).toBe("2026-05-13 14:20:48");
  });

  test("collapses newlines in any field to a single line", () => {
    const { record } = sanitizeRecord({
      email: "a@b.com",
      crm_note: "line one\nline two\r\nline three",
    });
    expect(record.crm_note).toBe("line one | line two | line three");
  });
});
