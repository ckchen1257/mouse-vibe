import { useState } from 'react'
import type { ReactNode } from 'react'
import { NavLink, Navigate, Route, Routes } from 'react-router-dom'
import Navbar from './components/Navbar'
import WeatherForecastPage from './pages/WeatherForecastPage'
import AccessControlPage from './pages/abac/AccessControlPage'
import { useAdmin } from './contexts/AdminContext'

function AdminGuard({ children }: { children: ReactNode }) {
  const { isAdmin, loading } = useAdmin()
  if (loading) return <p className="p-8 text-slate-500">Loading...</p>
  if (!isAdmin) return <Navigate to="/weatherforecast" replace />
  return <>{children}</>
}

function App() {
  const [isSidebarOpen, setIsSidebarOpen] = useState(true)
  const { isAdmin, loading: adminLoading } = useAdmin()

  const navLinkClass = ({ isActive }: { isActive: boolean }) =>
    `block rounded-md px-3 py-2 text-sm font-medium ${
      isActive
        ? 'bg-slate-200 text-slate-800 dark:bg-slate-700 dark:text-slate-100'
        : 'text-slate-700 hover:bg-slate-100 dark:text-slate-200 dark:hover:bg-slate-800'
    }`

  return (
    <div className="flex h-screen flex-col overflow-hidden text-slate-900 dark:text-slate-100">
      <Navbar
        isSidebarOpen={isSidebarOpen}
        onToggleSidebar={() => setIsSidebarOpen((prev) => !prev)}
      />

      <div className="flex flex-1 overflow-hidden">
        <aside
          className={`overflow-hidden border-r border-slate-200 bg-white/70 transition-all duration-200 dark:border-slate-700 dark:bg-slate-900/40 ${isSidebarOpen ? 'w-64' : 'w-0 border-r-0'}`}
        >
          <nav
            className={`p-4 transition-opacity duration-150 ${isSidebarOpen ? 'opacity-100' : 'pointer-events-none opacity-0'}`}
            aria-hidden={!isSidebarOpen}
          >
            <NavLink to="/weatherforecast" className={navLinkClass}>
              Forecast
            </NavLink>

            <div className={`transition-opacity duration-150 ${adminLoading || !isAdmin ? 'pointer-events-none opacity-0' : 'opacity-100'}`} aria-hidden={adminLoading || !isAdmin}>
              <div className="my-3 border-t border-slate-200 dark:border-slate-700" />
              <NavLink to="/abac" className={navLinkClass} tabIndex={adminLoading || !isAdmin ? -1 : undefined}>
                Access Control
              </NavLink>
            </div>
          </nav>
        </aside>

        <main className="flex-1 overflow-y-auto px-6 py-8">
          <Routes>
            <Route path="/weatherforecast" element={<WeatherForecastPage />} />
            <Route path="/abac" element={<AdminGuard><AccessControlPage /></AdminGuard>} />
            <Route path="*" element={<Navigate to="/weatherforecast" replace />} />
          </Routes>
        </main>
      </div>
    </div>
  )
}

export default App
