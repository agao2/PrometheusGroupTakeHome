import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { useDailySummaries } from '../hooks/useDailySummaries'
import { SymbolForm } from './SymbolForm'

vi.mock('../hooks/useDailySummaries')

const search = vi.fn()

beforeEach(() => {
  search.mockReset()
  vi.mocked(useDailySummaries).mockReturnValue({ isFetching: false, search } as unknown as ReturnType<
    typeof useDailySummaries
  >)
})

describe('SymbolForm', () => {
  it('disables search when the input is empty', async () => {
    render(<SymbolForm />)
    const button = screen.getByRole('button', { name: 'Search' })

    expect(button).toBeDisabled()

    await userEvent.type(screen.getByLabelText('Stock symbol'), '   ')
    expect(button).toBeDisabled()
  })

  it('searches when enter is pressed', async () => {
    render(<SymbolForm />)

    await userEvent.type(screen.getByLabelText('Stock symbol'), 'TSLA{Enter}')

    expect(search).toHaveBeenCalledWith('TSLA')
  })

  it('trims and uppercases the symbol on submit', async () => {
    render(<SymbolForm />)

    await userEvent.type(screen.getByLabelText('Stock symbol'), '  tsla  ')
    await userEvent.click(screen.getByRole('button', { name: 'Search' }))

    expect(search).toHaveBeenCalledWith('TSLA')
  })
})
