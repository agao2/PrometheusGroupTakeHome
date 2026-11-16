export class SymbolNotFoundError extends Error {
  constructor(readonly symbol: string) {
    super(`Symbol not found: ${symbol}`);
    this.name = "SymbolNotFoundError";
  }
}

export class UpstreamError extends Error {
  constructor(
    readonly status: number,
    message: string,
  ) {
    super(message);
    this.name = "UpstreamError";
  }
}
