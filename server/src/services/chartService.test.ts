import assert from "node:assert/strict";
import { afterEach, describe, it, mock } from "node:test";
import { YahooClient, type PriceBar } from "../clients/yahooClient.js";
import { SymbolNotFoundError } from "../errors.js";
import { ChartService } from "./chartService.js";

function bar(iso: string, low: number, high: number, volume: number): PriceBar {
  return { time: new Date(iso), open: low, high, low, close: high, volume };
}

function serviceReturning(bars: PriceBar[]) {
  const client = new YahooClient({ error: () => {} });
  const getPriceBars = mock.method(client, "getPriceBars", async () => bars);
  return { service: new ChartService(client), getPriceBars };
}

describe("ChartService.getDailySummaries", () => {
  afterEach(() => {
    mock.restoreAll();
  });

  it("groups out-of-order 15m bars by day and computes averages and volume", async () => {
    // Nov 12 and 13, 2026: 14:30 UTC is 09:30 in New York.
    const { service } = serviceReturning([
      bar("2026-11-13T14:45:00Z", 2.22222, 4, 70),
      bar("2026-11-12T14:30:00Z", 10, 15, 100),
      bar("2026-11-12T15:00:00Z", 30, 35, 300),
      bar("2026-11-13T14:30:00Z", 1.11111, 3, 50),
      bar("2026-11-12T14:45:00Z", 20, 25, 200),
    ]);

    const summaries = await service.getDailySummaries("TSLA", "15m");

    assert.deepEqual(summaries, [
      { day: "2026-11-12", lowAverage: 20, highAverage: 25, volume: 600 },
      { day: "2026-11-13", lowAverage: 1.6667, highAverage: 3.5, volume: 120 },
    ]);
  });

  it("excludes the zero-volume 16:00 closing bar from the averages", async () => {
    // 20:30 and 20:45 UTC are 15:30 and 15:45 in New York; 21:00 UTC is the 16:00 closing snapshot.
    const { service } = serviceReturning([
      bar("2026-11-13T20:30:00Z", 10, 20, 100),
      bar("2026-11-13T20:45:00Z", 30, 40, 300),
      bar("2026-11-13T21:00:00Z", 35, 35, 0),
    ]);

    const summaries = await service.getDailySummaries("TSLA");

    // Including the snapshot would give lowAverage 25 and highAverage 31.6667.
    assert.deepEqual(summaries, [{ day: "2026-11-13", lowAverage: 20, highAverage: 30, volume: 400 }]);
  });

  it("passes errors from getPriceBars through", async () => {
    const client = new YahooClient({ error: () => {} });
    const error = new SymbolNotFoundError("NOPE");
    mock.method(client, "getPriceBars", async () => {
      throw error;
    });

    await assert.rejects(new ChartService(client).getDailySummaries("NOPE"), (err) => {
      assert.equal(err, error);
      return true;
    });
  });

  it("returns [] when the client returns no bars", async () => {
    const { service, getPriceBars } = serviceReturning([]);

    assert.deepEqual(await service.getDailySummaries("TSLA"), []);
    assert.equal(getPriceBars.mock.callCount(), 1);
  });
});
