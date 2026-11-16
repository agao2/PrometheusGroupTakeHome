import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { buildApp } from "./app.js";

// Hits the real Yahoo API, so assertions check shape and invariants rather than exact values.
const NETWORK_TIMEOUT_MS = 15_000;

function testApp() {
  const app = buildApp();
  app.log.level = "silent";
  return app;
}

describe("GET /api/stocks/:symbol/daily (live Yahoo)", { timeout: NETWORK_TIMEOUT_MS }, () => {
  it("returns 200 with daily summaries for a real symbol", async () => {
    const res = await testApp().inject({ method: "GET", url: "/api/stocks/TSLA/daily" });

    assert.equal(res.statusCode, 200);
    const summaries = res.json();
    assert.ok(Array.isArray(summaries));
    assert.ok(summaries.length > 0, "expected at least one trading day");

    for (const summary of summaries) {
      assert.deepEqual(Object.keys(summary).sort(), ["day", "highAverage", "lowAverage", "volume"]);
      assert.match(summary.day, /^\d{4}-\d{2}-\d{2}$/);
      assert.ok(summary.lowAverage > 0);
      assert.ok(summary.lowAverage <= summary.highAverage);
      assert.ok(Number.isInteger(summary.volume) && summary.volume >= 0);
    }

    const days = summaries.map((s: { day: string }) => s.day);
    assert.deepEqual(days, [...days].sort(), "expected days in ascending order");
    assert.equal(new Set(days).size, days.length, "expected one summary per day");
  });

  it("returns 404 for a symbol Yahoo does not know", async () => {
    const res = await testApp().inject({ method: "GET", url: "/api/stocks/ZZZZZZZZZZ/daily" });

    assert.equal(res.statusCode, 404);
    assert.equal(res.json().message, "Symbol not found: ZZZZZZZZZZ");
  });
});
