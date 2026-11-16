import { useState, type SubmitEvent } from 'react'
import { useDailySummaries } from '../hooks/useDailySummaries'

export function SymbolForm() {
  const [input, setInput] = useState('')
  const { isFetching, search } = useDailySummaries()

  function handleSubmit(event: SubmitEvent<HTMLFormElement>) {
    event.preventDefault()
    const symbol = input.trim().toUpperCase()
    if (symbol) {
      search(symbol)
    }
  }

  return (
    <form className="symbol-form" onSubmit={handleSubmit}>
      <label>
        Stock symbol
        <input
          value={input}
          onChange={(event) => setInput(event.target.value)}
          placeholder="e.g. TSLA"
          maxLength={15}
          autoComplete="off"
        />
      </label>
      <button type="submit" disabled={isFetching || !input.trim()}>
        {isFetching ? 'Searching…' : 'Search'}
      </button>
    </form>
  )
}
