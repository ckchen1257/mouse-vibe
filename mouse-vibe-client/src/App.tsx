import { useEffect, useState } from 'react'
import { weatherForecastUrl } from './api'
import Navbar from './components/Navbar'

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
  const [isSidebarOpen, setIsSidebarOpen] = useState(true)

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
    <div className="min-h-screen text-slate-900 dark:text-slate-100">
      <Navbar
        isSidebarOpen={isSidebarOpen}
        onToggleSidebar={() => setIsSidebarOpen((prev) => !prev)}
      />

      <div className="flex min-h-[calc(100vh-3.5rem)]">
        <aside
          className={`overflow-hidden border-r border-slate-200 bg-white/70 transition-all duration-200 dark:border-slate-700 dark:bg-slate-900/40 ${isSidebarOpen ? 'w-64' : 'w-0 border-r-0'}`}
        >
          <nav
            className={`p-4 transition-opacity duration-150 ${isSidebarOpen ? 'opacity-100' : 'pointer-events-none opacity-0'}`}
            aria-hidden={!isSidebarOpen}
          >
            <a
              href="#"
              className="block rounded-md bg-slate-200 px-3 py-2 text-sm font-medium text-slate-800 dark:bg-slate-700 dark:text-slate-100"
            >
              Forecast
            </a>
          </nav>
        </aside>

        <main className="flex-1 px-6 py-8">
          <div className="mx-auto max-w-[760px]">
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
          </div>
        </main>
      </div>
    </div>
  )
}

export default App
