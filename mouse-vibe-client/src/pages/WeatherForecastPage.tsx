import { useEffect, useState } from 'react'
import { apiFetch, weatherForecastUrl } from '../api'
import { useAuth } from '../contexts/AuthContext'

type WeatherForecast = {
  date: string
  temperatureC: number
  temperatureF: number
  summary: string | null
}

export default function WeatherForecastPage() {
  const { user, authReady } = useAuth()
  const [forecasts, setForecasts] = useState<WeatherForecast[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!authReady) return

    const controller = new AbortController()

    const fetchForecasts = async () => {
      try {
        setIsLoading(true)
        setError(null)

        const response = await apiFetch(weatherForecastUrl, { signal: controller.signal })

        if (!response.ok) {
          throw new Error(`Request failed with status ${response.status}`)
        }

        const data: WeatherForecast[] = await response.json()
        setForecasts(data)
      } catch (e) {
        if (e instanceof DOMException && e.name === 'AbortError') return
        setError('Unable to load forecast. Please try again later.')
      } finally {
        if (!controller.signal.aborted) setIsLoading(false)
      }
    }

    void fetchForecasts()
    return () => controller.abort()
  }, [authReady, user?.uid])

  return (
    <div className="mx-auto max-w-[760px]">
      <h1 className="text-4xl font-bold leading-tight">Mouse Vibe Forecast</h1>

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
    </div>
  )
}