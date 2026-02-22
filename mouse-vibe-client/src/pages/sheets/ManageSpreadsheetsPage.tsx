import { useCallback, useEffect, useState } from 'react'
import type { RegisteredSpreadsheetDto } from '../../googleSheetsApi'
import {
  fetchRegisteredSpreadsheets,
  createRegisteredSpreadsheet,
  updateRegisteredSpreadsheet,
  deleteRegisteredSpreadsheet,
} from '../../googleSheetsApi'

export default function ManageSpreadsheetsPage() {
  const [spreadsheets, setSpreadsheets] = useState<RegisteredSpreadsheetDto[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [editId, setEditId] = useState<string | null>(null)
  const [name, setName] = useState('')
  const [googleSpreadsheetId, setGoogleSpreadsheetId] = useState('')
  const [description, setDescription] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const loadSpreadsheets = useCallback(async (signal?: AbortSignal) => {
    try {
      setLoading(true)
      const data = await fetchRegisteredSpreadsheets(signal)
      setSpreadsheets(data)
    } catch (e) {
      if (e instanceof DOMException && e.name === 'AbortError') return
      setError(e instanceof Error ? e.message : 'Failed to load spreadsheets')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    const controller = new AbortController()
    void loadSpreadsheets(controller.signal)
    return () => controller.abort()
  }, [loadSpreadsheets])

  const resetForm = () => {
    setName('')
    setGoogleSpreadsheetId('')
    setDescription('')
    setEditId(null)
    setShowForm(false)
    setError(null)
  }

  const handleEdit = (s: RegisteredSpreadsheetDto) => {
    setEditId(s.id)
    setName(s.name)
    setGoogleSpreadsheetId(s.googleSpreadsheetId)
    setDescription(s.description ?? '')
    setShowForm(true)
    setError(null)
  }

  const handleSubmit = async () => {
    if (!name.trim() || (!editId && !googleSpreadsheetId.trim())) return
    setBusy(true)
    setError(null)
    try {
      if (editId) {
        await updateRegisteredSpreadsheet(editId, { name, description: description || null })
      } else {
        await createRegisteredSpreadsheet({ name, googleSpreadsheetId, description: description || null })
      }
      resetForm()
      void loadSpreadsheets()
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed')
    } finally {
      setBusy(false)
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm('確定要刪除此 Spreadsheet 註冊？')) return
    try {
      await deleteRegisteredSpreadsheet(id)
      void loadSpreadsheets()
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Delete failed')
    }
  }

  return (
    <>
      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-lg font-semibold">Registered Spreadsheets</h2>
        <button
          onClick={() => { resetForm(); setShowForm((v) => !v) }}
          className="rounded bg-amber-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-amber-700"
        >
          {showForm ? 'Cancel' : '+ Register'}
        </button>
      </div>

      {error && (
        <div className="mb-4 rounded border border-red-300 bg-red-50 px-3 py-2 text-sm text-red-700 dark:border-red-700 dark:bg-red-950/30 dark:text-red-300">
          {error}
          <button onClick={() => setError(null)} className="ml-2 underline">Dismiss</button>
        </div>
      )}

      {showForm && (
        <div className="mb-4 rounded-lg border border-slate-200 bg-slate-50/60 p-4 dark:border-slate-700 dark:bg-slate-800/40">
          <div className="flex flex-wrap gap-3">
            <div className="flex min-w-[200px] flex-1 flex-col gap-1">
              <label className="text-xs font-medium text-slate-500 dark:text-slate-400">Name</label>
              <input
                className="rounded border border-slate-300 px-3 py-1.5 text-sm dark:border-slate-600 dark:bg-slate-800"
                placeholder="My Spreadsheet"
                value={name}
                onChange={(e) => setName(e.target.value)}
              />
            </div>
            <div className="flex min-w-[200px] flex-1 flex-col gap-1">
              <label className="text-xs font-medium text-slate-500 dark:text-slate-400">Google Spreadsheet ID</label>
              <input
                className="rounded border border-slate-300 px-3 py-1.5 text-sm dark:border-slate-600 dark:bg-slate-800"
                placeholder="1BxiMVs0XRA5nFMdKvBdBZjgmUUqptlbs74OgVE2upms"
                value={googleSpreadsheetId}
                disabled={!!editId}
                onChange={(e) => setGoogleSpreadsheetId(e.target.value)}
              />
            </div>
            <div className="flex min-w-[200px] flex-1 flex-col gap-1">
              <label className="text-xs font-medium text-slate-500 dark:text-slate-400">Description (optional)</label>
              <input
                className="rounded border border-slate-300 px-3 py-1.5 text-sm dark:border-slate-600 dark:bg-slate-800"
                placeholder="A short description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
              />
            </div>
          </div>
          <div className="mt-3 flex justify-end">
            <button
              onClick={handleSubmit}
              disabled={busy}
              className="rounded bg-emerald-600 px-4 py-1.5 text-sm font-medium text-white hover:bg-emerald-700 disabled:opacity-50"
            >
              {busy ? 'Saving...' : editId ? 'Update' : 'Create'}
            </button>
          </div>
        </div>
      )}

      {loading && <p className="text-slate-500">Loading...</p>}

      {!loading && spreadsheets.length === 0 && (
        <p className="text-slate-500">No spreadsheets registered yet.</p>
      )}

      {!loading && spreadsheets.length > 0 && (
        <div className="overflow-x-auto rounded-lg border border-slate-200 dark:border-slate-700">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50 dark:border-slate-700 dark:bg-slate-800/60">
                <th className="px-3 py-2 text-xs font-semibold text-slate-600 dark:text-slate-300">Name</th>
                <th className="px-3 py-2 text-xs font-semibold text-slate-600 dark:text-slate-300">Google Sheet ID</th>
                <th className="px-3 py-2 text-xs font-semibold text-slate-600 dark:text-slate-300">Description</th>
                <th className="px-3 py-2 text-xs font-semibold text-slate-600 dark:text-slate-300">Created By</th>
                <th className="px-3 py-2 text-xs font-semibold text-slate-600 dark:text-slate-300">Created At</th>
                <th className="px-3 py-2 text-xs font-semibold text-slate-500 dark:text-slate-400">Actions</th>
              </tr>
            </thead>
            <tbody>
              {spreadsheets.map((s) => (
                <tr key={s.id} className="border-b border-slate-100 hover:bg-slate-50 dark:border-slate-800 dark:hover:bg-slate-800/40">
                  <td className="px-3 py-2 font-medium">{s.name}</td>
                  <td className="px-3 py-2 font-mono text-xs text-slate-500">{s.googleSpreadsheetId}</td>
                  <td className="px-3 py-2 text-slate-500">{s.description ?? '—'}</td>
                  <td className="px-3 py-2 text-slate-500">{s.createdBy ?? '—'}</td>
                  <td className="px-3 py-2 text-slate-500">{new Date(s.createdAt).toLocaleDateString()}</td>
                  <td className="whitespace-nowrap px-2 py-1">
                    <div className="flex gap-1">
                      <button
                        onClick={() => handleEdit(s)}
                        className="rounded bg-slate-200 px-2 py-0.5 text-xs hover:bg-slate-300 dark:bg-slate-700 dark:hover:bg-slate-600"
                        title="Edit"
                      >
                        ✏️
                      </button>
                      <button
                        onClick={() => handleDelete(s.id)}
                        className="rounded bg-red-100 px-2 py-0.5 text-xs hover:bg-red-200 dark:bg-red-900/40 dark:hover:bg-red-800/50"
                        title="Delete"
                      >
                        🗑️
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </>
  )
}
