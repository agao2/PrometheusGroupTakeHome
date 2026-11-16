import { SummaryChart } from './components/SummaryChart'
import { SymbolForm } from './components/SymbolForm'
import './App.css'

function App() {
  return (
    <main className="app">
      <h1>Daily Stock Summary</h1>
      <SymbolForm />
      <SummaryChart />
    </main>
  )
}

export default App
