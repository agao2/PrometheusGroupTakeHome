export interface DailySummary {
  day: string
  lowAverage: number
  highAverage: number
  volume: number
}

export class ApiError extends Error {
  readonly status: number

  constructor(status: number, message: string) {
    super(message)
    this.name = 'ApiError'
    this.status = status
  }
}

export async function fetchDailySummaries(symbol: string, signal?: AbortSignal): Promise<DailySummary[]> {
  const res = await fetch(`/api/stocks/${encodeURIComponent(symbol)}/daily`, { signal })

  if (!res.ok) {
    throw new ApiError(res.status, `Request failed (${res.status})`)
  }

  return res.json()
}
