import { useQuery, useQueryClient } from '@tanstack/react-query'
import { useSyncExternalStore } from 'react'
import { ApiError, fetchDailySummaries, type DailySummary } from '../api/stock'

// The searched symbol lives outside React so every component using this hook shares it.
let currentSymbol = ''
const listeners = new Set<() => void>()

function subscribe(listener: () => void) {
  listeners.add(listener)
  return () => {
    listeners.delete(listener)
  }
}

export function useDailySummaries() {
  const symbol = useSyncExternalStore(subscribe, () => currentSymbol)
  const queryClient = useQueryClient()

  const query = useQuery({
    queryKey: ['dailySummaries', symbol],
    queryFn: ({ signal }) => fetchDailySummaries(symbol, signal),
    enabled: symbol.length > 0,
    gcTime: 0,
    retry: (failureCount, error) => {
      if (error instanceof ApiError && error.status < 500) {
        return false
      }
      return failureCount < 1
    },
  })

  function search(next: string) {
    if (next === currentSymbol) {
      queryClient.resetQueries({ queryKey: ['dailySummaries', next] })
      return
    }
    currentSymbol = next
    listeners.forEach((listener) => listener())
  }

  return { ...query, symbol, search, errorMessage: toErrorMessage(query.error, query.data) }
}

export function toErrorMessage(error: Error | null, data: DailySummary[] | undefined): string | null {
  if (error instanceof ApiError && error.status === 404) {
    return 'Invalid symbol'
  }
  if (error) {
    return 'Failed request. Please try again.'
  }
  if (data?.length === 0) {
    return 'No data available for this symbol'
  }
  return null
}
