import { useEffect, useState } from 'react'
import { weatherForecastUrl } from './api'

type WeatherForecast = {
  date: string
  temperatureC: number
  temperatureF: number
  summary: string | null
}

function App() {
  const [forecasts, setForecasts] = useState<WeatherForecast[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchForecasts = async () => {
      try {
        setIsLoading(true)
        setError(null)

        const response = await fetch(weatherForecastUrl)

        if (!response.ok) {
          throw new Error(`Request failed with status ${response.status}`)
        }

        const data: WeatherForecast[] = await response.json()
        setForecasts(data)
      } catch (fetchError) {
        const message = fetchError instanceof Error ? fetchError.message : 'Unknown error'
        setError(`Unable to load forecast: ${message}`)
      } finally {
        setIsLoading(false)
      }
    }

    void fetchForecasts()
  }, [])

  return (
    <main className="mx-auto min-h-screen max-w-[760px] px-6 py-8 text-slate-900 dark:text-slate-100">
      <h1 className="text-4xl font-bold leading-tight">Mouse Vibe Forecast</h1>
      <p className="-mt-2 opacity-80">API: {weatherForecastUrl}</p>

      {isLoading && <p className="text-slate-600 dark:text-slate-300">Loading forecast...</p>}

      {error && <p className="font-semibold text-red-600">{error}</p>}

      {!isLoading && !error && (
        <ul className="mt-5 grid list-none gap-2 p-0">
          {forecasts.map((forecast) => (
            <li
              key={forecast.date}
              className="grid grid-cols-1 gap-1 rounded-lg border border-slate-300 bg-white/70 px-4 py-3 sm:flex sm:items-center sm:justify-between sm:gap-4 dark:border-slate-700 dark:bg-slate-900/60"
            >
              <span className="font-medium">{forecast.date}</span>
              <span className="text-slate-700 dark:text-slate-300">{forecast.summary ?? 'N/A'}</span>
              <span className="sm:text-right">{forecast.temperatureC}°C / {forecast.temperatureF}°F</span>
            </li>
          ))}
        </ul>
      )}
    </main>
  )
}

export default App
