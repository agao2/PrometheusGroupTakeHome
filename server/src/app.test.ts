import assert from "node:assert/strict";
import { afterEach, describe, it, mock } from "node:test";
import { buildApp } from "./app.js";

// Stub only the network boundary so requests run through the real route, service, client and error handler.
function mockYahoo(status: number, body: unknown) {
  return mock.method(globalThis, "fetch", async () => new Response(JSON.stringify(body), { status }));
}

function testApp() {
  const app = buildApp();
  app.log.level = "silent";
  return app;
}

const chartBody = {
  chart: {
    result: [
      {
        // Nov 12 and 13, 2026 at 09:30 and 09:45 New York time
        timestamp: [1794493800, 1794494700, 1794580200, 1794581100],
        indicators: {
          quote: [
            {
              open: [10, 20, 30, 40],
              high: [12, 22, 32, 42],
              low: [9, 19, 29, 39],
              close: [11, 21, 31, 41],
              volume: [100, 200, 300, 400],
            },
          ],
        },
      },
    ],
    error: null,
  },
};

describe("GET /api/stocks/:symbol/daily", () => {
  afterEach(() => {
    mock.restoreAll();
  });

  it("returns 200 with an array of daily summaries", async () => {
    const fetchMock = mockYahoo(200, chartBody);
    const app = testApp();

    const res = await app.inject({ method: "GET", url: "/api/stocks/TSLA/daily" });

    assert.equal(res.statusCode, 200);
    assert.deepEqual(res.json(), [
      { day: "2026-11-12", lowAverage: 14, highAverage: 17, volume: 300 },
      { day: "2026-11-13", lowAverage: 34, highAverage: 37, volume: 700 },
    ]);
    assert.equal(fetchMock.mock.callCount(), 1);
    assert.match(String(fetchMock.mock.calls[0].arguments[0]), /\/chart\/TSLA\?/);
  });

  it("returns 404 when the symbol does not exist", async () => {
    mockYahoo(404, { chart: { result: null, error: { code: "Not Found", description: "No data found" } } });
    const app = testApp();

    const res = await app.inject({ method: "GET", url: "/api/stocks/NOPE/daily" });

    assert.equal(res.statusCode, 404);
    assert.equal(res.json().message, "Symbol not found: NOPE");
  });

  for (const [label, url] of [
    ["no symbol", "/api/stocks//daily"],
    ["a symbol over 15 characters", "/api/stocks/ABCDEFGHIJKLMNOP/daily"],
  ]) {
    it(`returns 400 for ${label} without calling Yahoo`, async () => {
      const fetchMock = mockYahoo(200, chartBody);
      const app = testApp();

      const res = await app.inject({ method: "GET", url });

      assert.equal(res.statusCode, 400);
      assert.equal(res.json().code, "FST_ERR_VALIDATION");
      assert.equal(fetchMock.mock.callCount(), 0);
    });
  }

  it("returns 502 when Yahoo fails", async () => {
    mockYahoo(500, { chart: { result: null, error: { code: "Internal", description: "failed" } } });
    const app = testApp();

    const res = await app.inject({ method: "GET", url: "/api/stocks/TSLA/daily" });

    assert.equal(res.statusCode, 502);
    assert.equal(res.json().error, "Bad Gateway");
  });
});
