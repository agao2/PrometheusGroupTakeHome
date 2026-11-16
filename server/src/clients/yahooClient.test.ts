import assert from "node:assert/strict";
import { afterEach, describe, it, mock } from "node:test";
import { SymbolNotFoundError, UpstreamError } from "../errors.js";
import { YahooClient } from "./yahooClient.js";

const silentLogger = { error: () => {} };

function mockFetch(status: number, body: unknown) {
  mock.method(globalThis, "fetch", async () => new Response(JSON.stringify(body), { status }));
}

const chartBody = {
  chart: {
    result: [
      {
        timestamp: [1794580200, 1794581100],
        indicators: {
          quote: [
            {
              open: [401.9, 393.0],
              high: [404.4, 395.1],
              low: [388.0, 391.2],
              close: [392.9, 394.5],
              volume: [6762730, 3120000],
            },
          ],
        },
      },
    ],
    error: null,
  },
};

describe("YahooClient.getPriceBars", () => {
  afterEach(() => {
    mock.restoreAll();
  });

  it("returns an array of price bars on 200", async () => {
    mockFetch(200, chartBody);

    const bars = await new YahooClient(silentLogger).getPriceBars("TSLA");

    assert.ok(Array.isArray(bars));
    assert.equal(bars.length, 2);
    assert.deepEqual(bars[0], {
      time: new Date(1794580200 * 1000),
      open: 401.9,
      high: 404.4,
      low: 388.0,
      close: 392.9,
      volume: 6762730,
    });
  });

  it("throws SymbolNotFoundError on 404", async () => {
    mockFetch(404, { chart: { result: null, error: { code: "Not Found", description: "No data found" } } });

    await assert.rejects(new YahooClient(silentLogger).getPriceBars("NOPE"), (err) => {
      assert.ok(err instanceof SymbolNotFoundError);
      assert.equal(err.symbol, "NOPE");
      return true;
    });
  });

  for (const status of [400, 429, 500, 503]) {
    it(`throws UpstreamError on ${status}`, async () => {
      mockFetch(status, { chart: { result: null, error: { code: "Error", description: "failed" } } });

      await assert.rejects(new YahooClient(silentLogger).getPriceBars("TSLA"), (err) => {
        assert.ok(err instanceof UpstreamError);
        assert.equal(err.status, status);
        return true;
      });
    });
  }
});
