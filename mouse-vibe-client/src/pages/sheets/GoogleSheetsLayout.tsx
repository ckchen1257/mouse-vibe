import { NavLink, Navigate, Outlet, useMatch } from 'react-router-dom'
import { useAdmin } from '../../contexts/AdminContext'

export default function GoogleSheetsLayout() {
  const { isAdmin } = useAdmin()
  const isRoot = useMatch('/sheets')

  if (isRoot) return <Navigate to="/sheets/edit" replace />

  const tabClass = ({ isActive }: { isActive: boolean }) =>
    `px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
      isActive
        ? 'border-blue-600 text-blue-600 dark:border-blue-400 dark:text-blue-400'
        : 'border-transparent text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200'
    }`

  return (
    <div className="mx-auto max-w-[1200px]">
      <h1 className="mb-4 text-3xl font-bold leading-tight">Google Sheets</h1>

      {/* Tab navigation */}
      <div className="mb-6 flex gap-0 border-b border-slate-200 dark:border-slate-700">
        <NavLink to="/sheets/edit" className={tabClass}>
          Edit Google Sheet
        </NavLink>
        {isAdmin && (
          <NavLink to="/sheets/manage" className={tabClass}>
            Manage Registered Spreadsheets
          </NavLink>
        )}
      </div>

      <Outlet />
    </div>
  )
}
