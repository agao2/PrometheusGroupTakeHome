import { render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import { ApiError, type DailySummary } from '../api/stock'
import { toErrorMessage, useDailySummaries } from '../hooks/useDailySummaries'
import { SummaryChart } from './SummaryChart'

// Mock only the hook; keep the real toErrorMessage
vi.mock('../hooks/useDailySummaries', async (importOriginal) => ({
  ...(await importOriginal<typeof import('../hooks/useDailySummaries')>()),
  useDailySummaries: vi.fn(),
}))

function mockHook(data: DailySummary[] | undefined, error: Error | null = null) {
  vi.mocked(useDailySummaries).mockReturnValue({
    data,
    errorMessage: toErrorMessage(error, data),
  } as unknown as ReturnType<typeof useDailySummaries>)
}

describe('SummaryChart', () => {
  it('renders the chart with data', () => {
    mockHook([
      { day: '2026-11-12', lowAverage: 400, highAverage: 410, volume: 1000 },
      { day: '2026-11-13', lowAverage: 405, highAverage: 415, volume: 2000 },
    ])
    render(<SummaryChart />)

    expect(screen.getByRole('group', { name: 'Metric' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'High average' })).toHaveAttribute('aria-pressed', 'true')
    expect(screen.queryByRole('alert')).not.toBeInTheDocument()
  })

  it('shows no data on an empty array', () => {
    mockHook([])
    render(<SummaryChart />)

    expect(screen.getByRole('alert')).toHaveTextContent('No data available for this symbol')
    expect(screen.queryByRole('group', { name: 'Metric' })).not.toBeInTheDocument()
  })

  it('shows invalid symbol on a 404', () => {
    mockHook(undefined, new ApiError(404, 'Request failed (404)'))
    render(<SummaryChart />)

    expect(screen.getByRole('alert')).toHaveTextContent('Invalid symbol')
    expect(screen.queryByRole('group', { name: 'Metric' })).not.toBeInTheDocument()
  })
})
