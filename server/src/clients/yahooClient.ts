import { SymbolNotFoundError, UpstreamError } from "../errors.js";

export type Interval = "5m" | "15m" | "30m" | "1h";
export type Range = "1d" | "5d" | "1mo";

export interface PriceBar {
  time: Date;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
}

interface ChartResponse {
  chart: {
    result: Array<{
      timestamp?: number[];
      indicators: {
        quote: Array<{
          open: (number | null)[];
          high: (number | null)[];
          low: (number | null)[];
          close: (number | null)[];
          volume: (number | null)[];
        }>;
      };
    }> | null;
    error: { code: string; description: string } | null;
  };
}

export interface Logger {
  error(details: object, message: string): void;
}

const REQUEST_TIMEOUT_MS = 10_000; // 10 seconds

export class YahooClient {
  constructor(
    private readonly logger: Logger = console,
    private readonly baseUrl = "https://query1.finance.yahoo.com/v8/finance/chart",
  ) {}

  async getPriceBars(symbol: string, interval: Interval = "15m", range: Range = "1mo"): Promise<PriceBar[]> {
    const url = `${this.baseUrl}/${encodeURIComponent(symbol)}?interval=${interval}&range=${range}`;
    const res = await fetch(url, { signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS) });

    if (!res.ok) {
      const body = await res.text();
      this.logger.error({ url, status: res.status, body }, "Yahoo chart request failed");
      if (res.status === 404) {
        throw new SymbolNotFoundError(symbol);
      }
      throw new UpstreamError(res.status, `Yahoo chart request failed (${res.status})`);
    }

    const body = (await res.json()) as ChartResponse;

    const result = body.chart.result?.[0];
    const quote = result?.indicators.quote[0];
    if (!result?.timestamp || !quote) {
      return [];
    }

    const bars: PriceBar[] = [];
    result.timestamp.forEach((ts, i) => {
      const open = quote.open[i];
      const high = quote.high[i];
      const low = quote.low[i];
      const close = quote.close[i];
      if (open == null || high == null || low == null || close == null) {
        return;
      }
      bars.push({ time: new Date(ts * 1000), open, high, low, close, volume: quote.volume[i] ?? 0 });
    });
    return bars;
  }
}
