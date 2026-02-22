import { useCallback, useEffect, useState } from 'react'
import { useAuth } from '../../contexts/AuthContext'
import type { RegisteredSpreadsheetDto, SheetDataResponse } from '../../googleSheetsApi'
import {
  fetchSpreadsheets,
  fetchWorksheets,
  fetchSheetData,
  addRow,
  updateRow,
  deleteRow,
  moveRow,
} from '../../googleSheetsApi'
import {
  DndContext,
  closestCenter,
  PointerSensor,
  TouchSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from '@dnd-kit/core'
import { SortableContext, arrayMove, useSortable, verticalListSortingStrategy } from '@dnd-kit/sortable'
import { restrictToVerticalAxis } from '@dnd-kit/modifiers'
import { CSS } from '@dnd-kit/utilities'
import { Dialog, DialogBackdrop, DialogPanel, DialogTitle } from '@headlessui/react'

// ── Sortable table row ────────────────────────────────────────────
function SortableRow({
  id,
  rowIdx,
  row,
  busy,
  onEdit,
  onDelete,
}: {
  id: string
  rowIdx: number
  row: string[]
  busy: boolean
  onEdit: (rowIndex: number) => void
  onDelete: (rowIndex: number) => void
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id })
  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  }

  return (
    <tr
      ref={setNodeRef}
      style={style}
      className="border-b border-slate-100 hover:bg-slate-50 dark:border-slate-800 dark:hover:bg-slate-800/40"
    >
      {/* Drag handle */}
      <td className="w-8 cursor-grab px-2 py-2 text-center text-slate-400 active:cursor-grabbing" {...attributes} {...listeners}>
        ⠿
      </td>
      <td className="px-3 py-2 text-xs text-slate-400">{rowIdx + 1}</td>
      {row.map((cell, colIdx) => (
        <td key={colIdx} className="px-3 py-2 max-w-50 truncate" title={cell}>
          {cell || <span className="text-slate-300 dark:text-slate-600">—</span>}
        </td>
      ))}
      <td className="whitespace-nowrap px-2 py-1">
        <div className="flex gap-1">
          <button
            onClick={() => onEdit(rowIdx)}
            disabled={busy}
            className="rounded bg-slate-200 px-2 py-0.5 text-xs hover:bg-slate-300 dark:bg-slate-700 dark:hover:bg-slate-600 disabled:opacity-50"
            title="Edit row"
          >
            ✏️
          </button>
          <button
            onClick={() => onDelete(rowIdx)}
            disabled={busy}
            className="rounded bg-red-100 px-2 py-0.5 text-xs hover:bg-red-200 dark:bg-red-900/40 dark:hover:bg-red-800/50 disabled:opacity-50"
            title="Delete row"
          >
            🗑️
          </button>
        </div>
      </td>
    </tr>
  )
}

// ── Row modal (add / edit) ────────────────────────────────────────
function RowModal({
  open,
  onClose,
  title,
  headers,
  values,
  onChange,
  onSubmit,
  busy,
  submitLabel,
}: {
  open: boolean
  onClose: () => void
  title: string
  headers: string[]
  values: string[]
  onChange: (values: string[]) => void
  onSubmit: () => void
  busy: boolean
  submitLabel: string
}) {
  return (
    <Dialog open={open} onClose={onClose} className="relative z-50">
      <DialogBackdrop className="fixed inset-0 bg-black/40 backdrop-blur-sm" />
      <div className="fixed inset-0 flex items-center justify-center p-4">
        <DialogPanel className="w-full max-w-lg rounded-xl border border-slate-200 bg-white p-6 shadow-xl dark:border-slate-700 dark:bg-slate-900">
          <DialogTitle className="mb-4 text-lg font-semibold">{title}</DialogTitle>
          <div className="flex flex-col gap-3 max-h-[60vh] overflow-y-auto pr-1">
            {headers.map((h, i) => (
              <div key={i} className="flex flex-col gap-1">
                <label className="text-xs font-medium text-slate-500 dark:text-slate-400">{h}</label>
                <input
                  className="rounded border border-slate-300 px-3 py-2 text-sm dark:border-slate-600 dark:bg-slate-800"
                  placeholder={h}
                  value={values[i] ?? ''}
                  onChange={(e) => {
                    const updated = [...values]
                    updated[i] = e.target.value
                    onChange(updated)
                  }}
                  autoFocus={i === 0}
                />
              </div>
            ))}
          </div>
          <div className="mt-5 flex justify-end gap-2">
            <button
              onClick={onClose}
              className="rounded border border-slate-300 px-4 py-2 text-sm hover:bg-slate-100 dark:border-slate-600 dark:hover:bg-slate-800"
            >
              Cancel
            </button>
            <button
              onClick={onSubmit}
              disabled={busy}
              className="rounded bg-emerald-600 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-700 disabled:opacity-50"
            >
              {busy ? 'Saving...' : submitLabel}
            </button>
          </div>
        </DialogPanel>
      </div>
    </Dialog>
  )
}

// ── Main page ─────────────────────────────────────────────────────
export default function EditGoogleSheetPage() {
  const { user, authReady } = useAuth()

  // Spreadsheet selection
  const [spreadsheets, setSpreadsheets] = useState<RegisteredSpreadsheetDto[]>([])
  const [selectedId, setSelectedId] = useState<string | null>(null)

  // Worksheet selection
  const [worksheetNames, setWorksheetNames] = useState<string[]>([])
  const [selectedSheet, setSelectedSheet] = useState<string | null>(null)

  // Data
  const [sheetData, setSheetData] = useState<SheetDataResponse | null>(null)

  // UI states
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)

  // Modal state
  const [modalMode, setModalMode] = useState<'add' | 'edit' | null>(null)
  const [modalValues, setModalValues] = useState<string[]>([])
  const [editingRow, setEditingRow] = useState<number | null>(null)

  // Drag-and-drop sensors (activate after 8px movement to avoid accidental drags)
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
    useSensor(TouchSensor, { activationConstraint: { delay: 200, tolerance: 6 } }),
  )

  // Stable row IDs for dnd-kit (index-based since rows don't have natural IDs)
  const rowIds = sheetData?.rows.map((_, i) => `row-${i}`) ?? []

  // — Load spreadsheets —
  const loadSpreadsheets = useCallback(async (signal?: AbortSignal) => {
    try {
      const data = await fetchSpreadsheets(signal)
      setSpreadsheets(data)
    } catch {
      // ignore abort
    }
  }, [])

  useEffect(() => {
    if (!authReady) return
    const controller = new AbortController()
    void loadSpreadsheets(controller.signal)
    return () => controller.abort()
  }, [authReady, user?.uid, loadSpreadsheets])

  // — Load worksheets when spreadsheet changes —
  useEffect(() => {
    if (!selectedId) {
      setWorksheetNames([])
      setSelectedSheet(null)
      return
    }
    const controller = new AbortController()
    setLoading(true)
    setError(null)
    fetchWorksheets(selectedId, controller.signal)
      .then((res) => {
        setWorksheetNames(res.worksheets)
        setSelectedSheet(res.worksheets[0] ?? null)
      })
      .catch((e) => {
        if (e instanceof DOMException && e.name === 'AbortError') return
        setError('Failed to load worksheets')
      })
      .finally(() => { if (!controller.signal.aborted) setLoading(false) })
    return () => controller.abort()
  }, [selectedId])

  // — Load sheet data when worksheet changes —
  const loadSheetData = useCallback(async (signal?: AbortSignal) => {
    if (!selectedId || !selectedSheet) {
      setSheetData(null)
      return
    }
    setLoading(true)
    setError(null)
    try {
      const data = await fetchSheetData(selectedId, selectedSheet, signal)
      setSheetData(data)
    } catch (e) {
      if (e instanceof DOMException && e.name === 'AbortError') return
      setError('Failed to load sheet data')
    } finally {
      setLoading(false)
    }
  }, [selectedId, selectedSheet])

  useEffect(() => {
    const controller = new AbortController()
    void loadSheetData(controller.signal)
    return () => controller.abort()
  }, [loadSheetData])

  // — Modal actions —
  const openAddModal = () => {
    setModalMode('add')
    setModalValues(sheetData ? sheetData.headers.map(() => '') : [])
    setEditingRow(null)
  }

  const openEditModal = (rowIndex: number) => {
    if (!sheetData) return
    setModalMode('edit')
    setEditingRow(rowIndex)
    setModalValues([...sheetData.rows[rowIndex]])
  }

  const closeModal = () => {
    setModalMode(null)
    setModalValues([])
    setEditingRow(null)
  }

  const handleModalSubmit = async () => {
    if (!selectedId || !selectedSheet) return
    setBusy(true)
    try {
      if (modalMode === 'add') {
        await addRow(selectedId, selectedSheet, modalValues)
      } else if (modalMode === 'edit' && editingRow !== null) {
        await updateRow(selectedId, selectedSheet, editingRow, modalValues)
      }
      closeModal()
      await loadSheetData()
    } catch (e) {
      setError(e instanceof Error ? e.message : `${modalMode === 'add' ? 'Add' : 'Update'} failed`)
    } finally {
      setBusy(false)
    }
  }

  const handleDelete = async (rowIndex: number) => {
    if (!selectedId || !selectedSheet) return
    if (!confirm(`確定要刪除第 ${rowIndex + 1} 列資料？`)) return
    setBusy(true)
    try {
      await deleteRow(selectedId, selectedSheet, rowIndex)
      await loadSheetData()
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Delete failed')
    } finally {
      setBusy(false)
    }
  }

  // — Drag-and-drop reorder —
  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event
    if (!over || active.id === over.id || !selectedId || !selectedSheet || !sheetData) return

    const oldIndex = rowIds.indexOf(active.id as string)
    const newIndex = rowIds.indexOf(over.id as string)
    if (oldIndex === -1 || newIndex === -1) return

    // Optimistic update: immediately reorder local state
    const previousData = sheetData
    setSheetData({
      ...sheetData,
      rows: arrayMove(sheetData.rows, oldIndex, newIndex),
    })

    // Sync with server in the background
    setBusy(true)
    try {
      if (oldIndex < newIndex) {
        for (let i = oldIndex; i < newIndex; i++) {
          await moveRow(selectedId, selectedSheet, i, 'down')
        }
      } else {
        for (let i = oldIndex; i > newIndex; i--) {
          await moveRow(selectedId, selectedSheet, i, 'up')
        }
      }
    } catch (e) {
      // Revert to previous state on failure
      setSheetData(previousData)
      setError(e instanceof Error ? e.message : 'Move failed')
    } finally {
      setBusy(false)
    }
  }

  return (
    <>
      {/* Selectors */}
      <div className="mb-4 flex flex-wrap items-end gap-4">
        {/* Spreadsheet selector */}
        <div className="flex flex-col gap-1">
          <label className="text-xs font-medium text-slate-500 dark:text-slate-400">Spreadsheet</label>
          <select
            className="rounded border border-slate-300 bg-white px-3 py-1.5 text-sm dark:border-slate-600 dark:bg-slate-800"
            value={selectedId ?? ''}
            onChange={(e) => setSelectedId(e.target.value || null)}
          >
            <option value="">— Select —</option>
            {spreadsheets.map((s) => (
              <option key={s.id} value={s.id}>{s.name}</option>
            ))}
          </select>
        </div>

        {/* Worksheet selector */}
        {worksheetNames.length > 0 && (
          <div className="flex flex-col gap-1">
            <label className="text-xs font-medium text-slate-500 dark:text-slate-400">Worksheet</label>
            <select
              className="rounded border border-slate-300 bg-white px-3 py-1.5 text-sm dark:border-slate-600 dark:bg-slate-800"
              value={selectedSheet ?? ''}
              onChange={(e) => setSelectedSheet(e.target.value || null)}
            >
              {worksheetNames.map((n) => (
                <option key={n} value={n}>{n}</option>
              ))}
            </select>
          </div>
        )}

        {/* Toolbar: Refresh + Add */}
        {selectedId && selectedSheet && (
          <div className="flex gap-2">
            <button
              onClick={() => loadSheetData()}
              disabled={loading}
              className="rounded border border-slate-300 px-3 py-1.5 text-sm hover:bg-slate-100 dark:border-slate-600 dark:hover:bg-slate-800"
            >
              ↻ Refresh
            </button>
            {sheetData && (
              <button
                onClick={openAddModal}
                disabled={busy}
                className="rounded bg-emerald-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-emerald-700 disabled:opacity-50"
              >
                + Add Row
              </button>
            )}
          </div>
        )}
      </div>

      {/* Error */}
      {error && (
        <div className="mb-4 rounded border border-red-300 bg-red-50 px-3 py-2 text-sm text-red-700 dark:border-red-700 dark:bg-red-950/30 dark:text-red-300">
          {error}
          <button onClick={() => setError(null)} className="ml-2 underline">Dismiss</button>
        </div>
      )}

      {/* Loading */}
      {loading && <p className="text-slate-500">Loading...</p>}

      {/* Empty state */}
      {!loading && !sheetData && selectedId && selectedSheet && (
        <p className="text-slate-500">No data in this worksheet.</p>
      )}

      {/* Data Table with drag-and-drop */}
      {!loading && sheetData && sheetData.headers.length > 0 && (
        <DndContext
          sensors={sensors}
          collisionDetection={closestCenter}
          modifiers={[restrictToVerticalAxis]}
          onDragEnd={handleDragEnd}
        >
          <div className="overflow-x-auto rounded-lg border border-slate-200 dark:border-slate-700">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50 dark:border-slate-700 dark:bg-slate-800/60">
                  <th className="w-8 px-2 py-2" />
                  <th className="px-3 py-2 text-xs font-semibold text-slate-500 dark:text-slate-400">#</th>
                  {sheetData.headers.map((h, i) => (
                    <th key={i} className="px-3 py-2 text-xs font-semibold text-slate-600 dark:text-slate-300">
                      {h}
                    </th>
                  ))}
                  <th className="px-3 py-2 text-xs font-semibold text-slate-500 dark:text-slate-400">Actions</th>
                </tr>
              </thead>
              <tbody>
                <SortableContext items={rowIds} strategy={verticalListSortingStrategy}>
                  {sheetData.rows.map((row, rowIdx) => (
                    <SortableRow
                      key={rowIds[rowIdx]}
                      id={rowIds[rowIdx]}
                      rowIdx={rowIdx}
                      row={row}
                      busy={busy}
                      onEdit={openEditModal}
                      onDelete={handleDelete}
                    />
                  ))}
                </SortableContext>
              </tbody>
            </table>
          </div>

          {sheetData.rows.length === 0 && (
            <p className="mt-3 text-center text-sm text-slate-400">No rows yet. Click "+ Add Row" to get started.</p>
          )}
        </DndContext>
      )}

      {/* Add / Edit Modal */}
      {sheetData && (
        <RowModal
          open={modalMode !== null}
          onClose={closeModal}
          title={modalMode === 'add' ? 'Add New Row' : `Edit Row ${editingRow !== null ? editingRow + 1 : ''}`}
          headers={sheetData.headers}
          values={modalValues}
          onChange={setModalValues}
          onSubmit={handleModalSubmit}
          busy={busy}
          submitLabel={modalMode === 'add' ? 'Add' : 'Save'}
        />
      )}
    </>
  )
}
