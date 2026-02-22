import { apiFetch, apiBaseUrl } from './api'

// ── Types ───────────────────────────────────────────────────────────

export interface RegisteredSpreadsheetDto {
  id: string
  name: string
  googleSpreadsheetId: string
  description: string | null
  createdBy: string | null
  createdAt: string
}

export interface CreateRegisteredSpreadsheetRequest {
  name: string
  googleSpreadsheetId: string
  description?: string | null
}

export interface UpdateRegisteredSpreadsheetRequest {
  name: string
  description?: string | null
}

export interface WorksheetListResponse {
  worksheets: string[]
}

export interface SheetDataResponse {
  headers: string[]
  rows: string[][]
}

export interface CreateRowRequest {
  values: string[]
}

export interface UpdateRowRequest {
  values: string[]
}

export interface MoveRowRequest {
  direction: 'up' | 'down'
}

// ── Admin API Functions ─────────────────────────────────────────────

const adminBase = `${apiBaseUrl}/spreadsheets/admin`
const sheetsBase = `${apiBaseUrl}/spreadsheets`

export async function fetchRegisteredSpreadsheets(signal?: AbortSignal): Promise<RegisteredSpreadsheetDto[]> {
  const res = await apiFetch(`${adminBase}`, { signal })
  if (!res.ok) throw new Error(`fetchRegisteredSpreadsheets failed: ${res.status}`)
  return res.json()
}

export async function createRegisteredSpreadsheet(req: CreateRegisteredSpreadsheetRequest): Promise<RegisteredSpreadsheetDto> {
  const res = await apiFetch(`${adminBase}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(req),
  })
  if (!res.ok) throw new Error(`createRegisteredSpreadsheet failed: ${res.status}`)
  return res.json()
}

export async function updateRegisteredSpreadsheet(id: string, req: UpdateRegisteredSpreadsheetRequest): Promise<RegisteredSpreadsheetDto> {
  const res = await apiFetch(`${adminBase}/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(req),
  })
  if (!res.ok) throw new Error(`updateRegisteredSpreadsheet failed: ${res.status}`)
  return res.json()
}

export async function deleteRegisteredSpreadsheet(id: string): Promise<void> {
  const res = await apiFetch(`${adminBase}/${id}`, { method: 'DELETE' })
  if (!res.ok) throw new Error(`deleteRegisteredSpreadsheet failed: ${res.status}`)
}

// ── User API Functions ──────────────────────────────────────────────

export async function fetchSpreadsheets(signal?: AbortSignal): Promise<RegisteredSpreadsheetDto[]> {
  const res = await apiFetch(`${sheetsBase}`, { signal })
  if (!res.ok) throw new Error(`fetchSpreadsheets failed: ${res.status}`)
  return res.json()
}

export async function fetchWorksheets(id: string, signal?: AbortSignal): Promise<WorksheetListResponse> {
  const res = await apiFetch(`${sheetsBase}/${id}/worksheets`, { signal })
  if (!res.ok) throw new Error(`fetchWorksheets failed: ${res.status}`)
  return res.json()
}

export async function fetchSheetData(id: string, sheetName: string, signal?: AbortSignal): Promise<SheetDataResponse> {
  const res = await apiFetch(`${sheetsBase}/${id}/worksheets/${encodeURIComponent(sheetName)}/rows`, { signal })
  if (!res.ok) throw new Error(`fetchSheetData failed: ${res.status}`)
  return res.json()
}

export async function addRow(id: string, sheetName: string, values: string[]): Promise<void> {
  const res = await apiFetch(`${sheetsBase}/${id}/worksheets/${encodeURIComponent(sheetName)}/rows`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ values } satisfies CreateRowRequest),
  })
  if (!res.ok) throw new Error(`addRow failed: ${res.status}`)
}

export async function updateRow(id: string, sheetName: string, rowIndex: number, values: string[]): Promise<void> {
  const res = await apiFetch(`${sheetsBase}/${id}/worksheets/${encodeURIComponent(sheetName)}/rows/${rowIndex}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ values } satisfies UpdateRowRequest),
  })
  if (!res.ok) throw new Error(`updateRow failed: ${res.status}`)
}

export async function deleteRow(id: string, sheetName: string, rowIndex: number): Promise<void> {
  const res = await apiFetch(`${sheetsBase}/${id}/worksheets/${encodeURIComponent(sheetName)}/rows/${rowIndex}`, {
    method: 'DELETE',
  })
  if (!res.ok) throw new Error(`deleteRow failed: ${res.status}`)
}

export async function moveRow(id: string, sheetName: string, rowIndex: number, direction: 'up' | 'down'): Promise<void> {
  const res = await apiFetch(`${sheetsBase}/${id}/worksheets/${encodeURIComponent(sheetName)}/rows/${rowIndex}/move`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ direction } satisfies MoveRowRequest),
  })
  if (!res.ok) throw new Error(`moveRow failed: ${res.status}`)
}
