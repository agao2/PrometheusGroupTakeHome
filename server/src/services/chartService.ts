import type { Interval, PriceBar, Range, YahooClient } from "../clients/yahooClient.js";

export interface DailySummary {
  day: string;
  lowAverage: number;
  highAverage: number;
  volume: number;
}

const dayFormatter = new Intl.DateTimeFormat("en-CA", {
  timeZone: "America/New_York",
  year: "numeric",
  month: "2-digit",
  day: "2-digit",
});

export class ChartService {
  constructor(private readonly yahooClient: YahooClient) {}

  async getDailySummaries(
    symbol: string,
    interval: Interval = "15m",
    range: Range = "1mo",
  ): Promise<DailySummary[]> {
    const bars = await this.yahooClient.getPriceBars(symbol, interval, range);
    // Remove the last bar as it is just closing price, no trading volume
    const tradedBars = bars.filter((bar) => bar.volume > 0);
    return groupByDay(tradedBars)
      .map(summarizeDay)
      .sort((a, b) => a.day.localeCompare(b.day));
  }
}

function groupByDay(bars: PriceBar[]): PriceBar[][] {
  const days = new Map<string, PriceBar[]>();
  for (const bar of bars) {
    const day = dayFormatter.format(bar.time);
    const group = days.get(day);
    if (group) {
      group.push(bar);
    } else {
      days.set(day, [bar]);
    }
  }
  return [...days.values()];
}

function summarizeDay(bars: PriceBar[]): DailySummary {
  let lowSum = 0;
  let highSum = 0;
  let volume = 0;
  for (const bar of bars) {
    lowSum += bar.low;
    highSum += bar.high;
    volume += bar.volume;
  }
  return {
    day: dayFormatter.format(bars[0].time),
    lowAverage: roundTo4(lowSum / bars.length),
    highAverage: roundTo4(highSum / bars.length),
    volume,
  };
}

function roundTo4(value: number): number {
  return Math.round(value * 10_000) / 10_000;
}
