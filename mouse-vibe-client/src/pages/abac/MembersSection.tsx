import { useState } from 'react'
import {
  upsertUserAttribute, deleteUserAttribute,
  type UserAttributeDto, type UpsertUserAttributeRequest,
} from '../../abacApi'
import MultiSelectDropdown from '../../components/MultiSelectDropdown'
import { ROLE_OPTIONS, csvToArr, arrToCsv, PencilIcon, TrashIcon } from './shared'

interface UserFormState {
  userId: string
  displayName: string
  roles: string[]
  isAdmin: boolean
}
const emptyUserForm: UserFormState = { userId: '', displayName: '', roles: [], isAdmin: false }

export default function MembersSection({
  users, onReload, error, setError,
}: {
  users: UserAttributeDto[]
  onReload: () => Promise<void>
  error: string | null
  setError: (e: string | null) => void
}) {
  const [editing, setEditing] = useState<UserAttributeDto | null>(null)
  const [form, setForm] = useState<UserFormState>(emptyUserForm)
  const [showForm, setShowForm] = useState(false)

  const resetForm = () => { setForm(emptyUserForm); setEditing(null); setShowForm(false) }

  const handleEdit = (u: UserAttributeDto) => {
    setEditing(u)
    setForm({
      userId: u.userId,
      displayName: u.displayName ?? '',
      roles: csvToArr(u.roles),
      isAdmin: u.isAdmin,
    })
    setShowForm(true)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      setError(null)
      const req: UpsertUserAttributeRequest = {
        userId: form.userId,
        displayName: form.displayName || null,
        roles: arrToCsv(form.roles),
        isAdmin: form.isAdmin,
      }
      await upsertUserAttribute(req)
      resetForm()
      await onReload()
    } catch (err) {
      setError(err instanceof Error ? err.message : '儲存失敗')
    }
  }

  const handleDelete = async (userId: string) => {
    if (!confirm('確定要刪除此使用者屬性紀錄？')) return
    try {
      await deleteUserAttribute(userId)
      await onReload()
    } catch (err) {
      setError(err instanceof Error ? err.message : '刪除失敗')
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-sm text-slate-500 dark:text-slate-400">
          管理使用者的角色、團隊與管理員權限。
        </p>
        <button
          onClick={() => { resetForm(); setShowForm(true) }}
          className="shrink-0 rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
        >
          + 新增使用者
        </button>
      </div>

      {error && <div className="rounded-md bg-red-50 p-3 text-sm text-red-600 dark:bg-red-900/30 dark:text-red-400">{error}</div>}

      {showForm && (
        <form onSubmit={e => void handleSubmit(e)} className="space-y-4 rounded-lg border border-slate-200 bg-white p-5 dark:border-slate-700 dark:bg-slate-900">
          <h2 className="text-lg font-semibold">{editing ? '編輯使用者屬性' : '新增使用者屬性'}</h2>
          <div className="grid grid-cols-2 gap-4">
            <label className="block">
              <span className="text-sm font-medium text-slate-600 dark:text-slate-300">電子郵件（建立後無法修改）</span>
              <input
                className="mt-1 block w-full rounded-md border border-slate-300 bg-white px-3 py-1.5 text-sm dark:border-slate-600 dark:bg-slate-800"
                value={form.userId}
                onChange={e => setForm(f => ({ ...f, userId: e.target.value }))}
                disabled={!!editing}
              />
            </label>
            <label className="block">
              <span className="text-sm font-medium text-slate-600 dark:text-slate-300">顯示名稱</span>
              <input
                className="mt-1 block w-full rounded-md border border-slate-300 bg-white px-3 py-1.5 text-sm dark:border-slate-600 dark:bg-slate-800"
                value={form.displayName}
                onChange={e => setForm(f => ({ ...f, displayName: e.target.value }))}
              />
            </label>
            <MultiSelectDropdown
              label="角色"
              options={ROLE_OPTIONS}
              selected={form.roles}
              onChange={v => setForm(f => ({ ...f, roles: v }))}
              placeholder="選擇角色..."
            />
            <label className="flex items-center gap-2 pt-6">
              <input
                type="checkbox"
                checked={form.isAdmin}
                onChange={e => setForm(f => ({ ...f, isAdmin: e.target.checked }))}
                className="h-4 w-4 rounded border-slate-300"
              />
              <span className="text-sm font-medium text-slate-600 dark:text-slate-300">管理員</span>
            </label>
          </div>
          <div className="flex gap-3">
            <button type="submit" className="rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700">
              {editing ? '更新' : '建立'}
            </button>
            <button type="button" onClick={resetForm} className="rounded-md border border-slate-300 px-4 py-2 text-sm dark:border-slate-600">取消</button>
          </div>
        </form>
      )}

      <div className="overflow-x-auto rounded-lg border border-slate-200 dark:border-slate-700">
        <table className="w-full text-left text-sm">
          <thead className="bg-slate-50 dark:bg-slate-800">
            <tr>
              <th className="px-4 py-2">電子郵件</th>
              <th className="px-4 py-2">名稱</th>
              <th className="px-4 py-2">角色</th>
              <th className="px-4 py-2">管理員</th>
              <th className="px-4 py-2 text-right">管理</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200 dark:divide-slate-700">
            {users.map(u => (
              <tr key={u.id}>
                <td className="px-4 py-2 font-mono text-xs">{u.userId}</td>
                <td className="px-4 py-2">{u.displayName || '—'}</td>
                <td className="px-4 py-2">{u.roles || '—'}</td>
                <td className="px-4 py-2">{u.isAdmin ? '✓' : '—'}</td>
                <td className="px-4 py-2 text-right">
                  <button onClick={() => handleEdit(u)} className="mr-1 inline-flex items-center rounded p-1 text-slate-500 hover:bg-slate-100 hover:text-blue-600 dark:text-slate-400 dark:hover:bg-slate-700 dark:hover:text-blue-400" title="編輯"><PencilIcon /></button>
                  <button onClick={() => void handleDelete(u.userId)} className="inline-flex items-center rounded p-1 text-slate-500 hover:bg-slate-100 hover:text-red-600 dark:text-slate-400 dark:hover:bg-slate-700 dark:hover:text-red-400" title="刪除"><TrashIcon /></button>
                </td>
              </tr>
            ))}
            {users.length === 0 && (
              <tr><td colSpan={5} className="px-4 py-6 text-center text-slate-400">尚無使用者屬性</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}
