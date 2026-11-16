import { describe, expect, it } from 'vitest'
import { ApiError } from '../api/stock'
import { toErrorMessage } from './useDailySummaries'

const summary = { day: '2026-11-13', lowAverage: 400, highAverage: 410, volume: 1000 }

describe('toErrorMessage', () => {
  it('returns invalid symbol on 404', () => {
    expect(toErrorMessage(new ApiError(404, 'Request failed (404)'), undefined)).toBe('Invalid symbol')
  })

  it('returns failed request on other api errors', () => {
    expect(toErrorMessage(new ApiError(502, 'Request failed (502)'), undefined)).toBe(
      'Failed request. Please try again.',
    )
  })

  it('returns failed request on network errors', () => {
    expect(toErrorMessage(new TypeError('Failed to fetch'), undefined)).toBe('Failed request. Please try again.')
  })

  it('returns no data on an empty array', () => {
    expect(toErrorMessage(null, [])).toBe('No data available for this symbol')
  })

  it('returns null when there is data', () => {
    expect(toErrorMessage(null, [summary])).toBeNull()
  })

  it('returns null before a search', () => {
    expect(toErrorMessage(null, undefined)).toBeNull()
  })
})
