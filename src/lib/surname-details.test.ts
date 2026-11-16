import { describe, expect, test } from "bun:test";
import { parseForebears, supportsForebears, surnameDetailsKey } from "./surname-details";

describe("Forebears surname enrichment", () => {
  test("preserves accents and matches case-insensitively", () => {
    expect(supportsForebears("Müller")).toBe(true);
    expect(surnameDetailsKey(" Müller ")).toBe("müller");
    expect(surnameDetailsKey("Muller")).not.toBe(surnameDetailsKey("Müller"));
  });
  test("supports Latin names, spaces, hyphens and apostrophes only", () => {
    expect(supportsForebears("O'Brien-Smith")).toBe(true);
    expect(supportsForebears("王")).toBe(false);
    expect(supportsForebears("Smith123")).toBe(false);
  });
  test("sums reported incidence and keeps country ranks", () => {
    const result = parseForebears("Smith", { jurisdictions: [
      { jurisdiction: "England", iso: "gb-eng", incidence: "120", rank: "1" },
      { jurisdiction: "United States", iso: "us", incidence: "300", rank: "2" },
    ] });
    expect(result.reportedCount).toBe(420);
    expect(result.jurisdictions[0]).toEqual({ country: "United States", iso: "us", incidence: 300, rank: 2 });
  });
  test("provider denial is unavailable, never a zero count or missing surname", () => {
    const result = parseForebears("Pedapati", { status: [{ type: "error", code: "0021" }] });
    expect(result.status).toBe("unavailable");
    expect(result.reportedCount).toBeNull();
  });
  test("empty results do not fabricate a count", () => {
    expect(parseForebears("Unknown", { jurisdictions: [] }).status).toBe("not_found");
    expect(parseForebears("Unknown", { jurisdictions: [] }).reportedCount).toBeNull();
  });
});