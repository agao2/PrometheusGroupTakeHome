import { useState } from 'react'
import { CartesianGrid, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import { useDailySummaries } from '../hooks/useDailySummaries'

const priceFormat = new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' })
const volumeFormat = new Intl.NumberFormat('en-US', { notation: 'compact' })

const METRICS = {
  lowAverage: { label: 'Low average', format: (value: number) => priceFormat.format(value) },
  highAverage: { label: 'High average', format: (value: number) => priceFormat.format(value) },
  volume: { label: 'Volume', format: (value: number) => volumeFormat.format(value) },
}

type Metric = keyof typeof METRICS

export function SummaryChart() {
  const [metric, setMetric] = useState<Metric>('highAverage')
  const { data, errorMessage } = useDailySummaries()

  if (errorMessage) {
    return (
      <p className="error" role="alert">
        {errorMessage}
      </p>
    )
  }

  if (!data) {
    return null
  }

  const { label, format } = METRICS[metric]

  return (
    <section className="summary-chart">
      <div className="metric-toggle" role="group" aria-label="Metric">
        {(Object.keys(METRICS) as Metric[]).map((key) => (
          <button key={key} type="button" aria-pressed={metric === key} onClick={() => setMetric(key)}>
            {METRICS[key].label}
          </button>
        ))}
      </div>

      <ResponsiveContainer width="100%" height={360}>
        <LineChart data={data} margin={{ top: 8, right: 16, bottom: 8, left: 16 }}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="day" />
          <YAxis domain={['auto', 'auto']} tickFormatter={format} width={80} />
          <Tooltip formatter={(value) => [format(Number(value)), label]} />
          <Line type="monotone" dataKey={metric} stroke="#8b5cf6" strokeWidth={2} dot={false} />
        </LineChart>
      </ResponsiveContainer>
    </section>
  )
}
