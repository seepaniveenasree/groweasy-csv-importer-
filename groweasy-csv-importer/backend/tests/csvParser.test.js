const { parseCsv, toBatches } = require("../src/services/csvParser");

describe("parseCsv", () => {
  test("parses a well-formed CSV into row objects", () => {
    const csv = "name,email\nJohn,john@example.com\nJane,jane@example.com";
    const rows = parseCsv(csv);
    expect(rows).toHaveLength(2);
    expect(rows[0]).toEqual({ name: "John", email: "john@example.com" });
  });

  test("works with arbitrary / unexpected column names", () => {
    const csv = "Full Name,Contact Email,Lead Source\nAmit,amit@x.com,fb_ads";
    const rows = parseCsv(csv);
    expect(rows[0]["Full Name"]).toBe("Amit");
    expect(rows[0]["Lead Source"]).toBe("fb_ads");
  });

  test("throws on a CSV with headers but no data rows", () => {
    expect(() => parseCsv("name,email\n")).toThrow(/no data rows/i);
  });

  test("throws on completely empty input", () => {
    expect(() => parseCsv("")).toThrow();
  });
});

describe("toBatches", () => {
  test("splits rows into fixed-size batches and preserves original index", () => {
    const rows = Array.from({ length: 55 }, (_, i) => ({ name: `Row ${i}` }));
    const batches = toBatches(rows, 25);
    expect(batches).toHaveLength(3);
    expect(batches[0]).toHaveLength(25);
    expect(batches[2]).toHaveLength(5);
    expect(batches[2][0].originalIndex).toBe(50);
  });
});
