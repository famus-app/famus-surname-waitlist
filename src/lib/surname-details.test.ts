import { describe, test } from "node:test";
import assert from "node:assert/strict";
import { parseForebears, supportsForebears, surnameDetailsKey } from "./surname-details";

describe("Forebears surname enrichment", () => {
  test("preserves accents and matches case-insensitively", () => {
    assert.equal(supportsForebears("Müller"), true);
    assert.equal(surnameDetailsKey(" Müller "), "müller");
    assert.notEqual(surnameDetailsKey("Muller"), surnameDetailsKey("Müller"));
  });
  test("supports Latin names, spaces, hyphens and apostrophes only", () => {
    assert.equal(supportsForebears("O'Brien-Smith"), true);
    assert.equal(supportsForebears("王"), false);
    assert.equal(supportsForebears("Smith123"), false);
  });
  test("sums reported incidence and keeps country ranks", () => {
    const result = parseForebears("Smith", { jurisdictions: [
      { jurisdiction: "England", iso: "gb-eng", incidence: "120", rank: "1" },
      { jurisdiction: "United States", iso: "us", incidence: "300", rank: "2" },
    ] });
    assert.equal(result.reportedCount, 420);
    assert.deepEqual(result.jurisdictions[0], { country: "United States", iso: "us", incidence: 300, rank: 2 });
  });
  test("provider denial is unavailable, never a zero count or missing surname", () => {
    const result = parseForebears("Pedapati", { status: [{ type: "error", code: "0021" }] });
    assert.equal(result.status, "unavailable");
    assert.equal(result.reportedCount, null);
  });
  test("empty results do not fabricate a count", () => {
    assert.equal(parseForebears("Unknown", { jurisdictions: [] }).status, "not_found");
    assert.equal(parseForebears("Unknown", { jurisdictions: [] }).reportedCount, null);
  });
});