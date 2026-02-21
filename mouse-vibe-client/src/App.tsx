import { useState } from 'react'
import { NavLink, Navigate, Route, Routes } from 'react-router-dom'
import Navbar from './components/Navbar'
import WeatherForecastPage from './pages/WeatherForecastPage'

function App() {
  const [isSidebarOpen, setIsSidebarOpen] = useState(true)

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
            <NavLink
              to="/weatherforecast"
              className={({ isActive }) =>
                `block rounded-md px-3 py-2 text-sm font-medium ${
                  isActive
                    ? 'bg-slate-200 text-slate-800 dark:bg-slate-700 dark:text-slate-100'
                    : 'text-slate-700 hover:bg-slate-100 dark:text-slate-200 dark:hover:bg-slate-800'
                }`
              }
            >
              Forecast
            </NavLink>
          </nav>
        </aside>

        <main className="flex-1 px-6 py-8">
          <Routes>
            <Route path="/weatherforecast" element={<WeatherForecastPage />} />
            <Route path="*" element={<Navigate to="/weatherforecast" replace />} />
          </Routes>
        </main>
      </div>
    </div>
  )
}

export default App
