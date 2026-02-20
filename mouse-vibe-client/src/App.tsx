import { useEffect, useState } from 'react'
import './App.css'
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
    <main className="app-shell">
      <h1>Mouse Vibe Forecast</h1>
      <p className="api-target">API: {weatherForecastUrl}</p>

      {isLoading && <p>Loading forecast...</p>}

      {error && <p className="error-text">{error}</p>}

      {!isLoading && !error && (
        <ul className="forecast-list">
          {forecasts.map((forecast) => (
            <li key={forecast.date} className="forecast-item">
              <span>{forecast.date}</span>
              <span>{forecast.summary ?? 'N/A'}</span>
              <span>{forecast.temperatureC}°C / {forecast.temperatureF}°F</span>
            </li>
          ))}
        </ul>
      )}
    </main>
  )
}

export default App
