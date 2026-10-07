import test from "node:test";
import assert from "node:assert/strict";
import { safeRedirectPath } from "../src/lib/safe-redirect.ts";
test("OAuth redirect stays on the original site", () => {
  for (const bad of ["//example.org", "/\\\\example.org", "https://example.org", "/\t/example.org", null]) {
    assert.equal(safeRedirectPath(bad, "https://projectpeak.fit", "/safe"), "/safe");
  }
  assert.equal(safeRedirectPath("/mm/app?day=2", "https://projectpeak.fit", "/safe"), "/mm/app?day=2");
});
