import { useState } from 'react'
import {
  createPolicy, updatePolicy, deletePolicy,
  type PolicyDto, type TeamDto, type ResourceTypeDto,
  type CreatePolicyRequest, type UpdatePolicyRequest,
} from '../../abacApi'
import MultiSelectDropdown from '../../components/MultiSelectDropdown'
import SearchableMultiSelect from '../../components/SearchableMultiSelect'
import SearchableSelect from '../../components/SearchableSelect'
import { ROLE_OPTIONS, ACTION_OPTIONS, csvToArr, arrToCsv } from './shared'

interface PolicyFormState {
  name: string
  description: string
  effect: string
  status: string
  priority: number
  subjectRoles: string[]
  subjectTeams: string[]
  resourceType: string | null
  resourceId: string
  action: string | null
}

const emptyPolicyForm: PolicyFormState = {
  name: '', description: '', effect: 'Allow', status: 'Active', priority: 0,
  subjectRoles: [], subjectTeams: [],
  resourceType: null, resourceId: '', action: null,
}

export default function PoliciesSection({
  policies, teams, resourceTypes, onReload, error, setError,
}: {
  policies: PolicyDto[]
  teams: TeamDto[]
  resourceTypes: ResourceTypeDto[]
  onReload: () => Promise<void>
  error: string | null
  setError: (e: string | null) => void
}) {
  const [editing, setEditing] = useState<PolicyDto | null>(null)
  const [form, setForm] = useState<PolicyFormState>(emptyPolicyForm)
  const [showForm, setShowForm] = useState(false)

  const teamOptions = teams.map(t => ({ value: t.name, label: t.name }))
  const rtOptions = resourceTypes.map(r => ({ value: r.name, label: r.name }))

  const resetForm = () => { setForm(emptyPolicyForm); setEditing(null); setShowForm(false) }

  const handleEdit = (p: PolicyDto) => {
    setEditing(p)
    setForm({
      name: p.name,
      description: p.description ?? '',
      effect: p.effect,
      status: p.status,
      priority: p.priority,
      subjectRoles: csvToArr(p.subjectRoles),
      subjectTeams: csvToArr(p.subjectTeams),
      resourceType: p.resourceType ?? null,
      resourceId: p.resourceId ?? '',
      action: p.action ?? null,
    })
    setShowForm(true)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      setError(null)
      const payload = {
        name: form.name,
        description: form.description || null,
        effect: form.effect,
        priority: form.priority,
        subjectRoles: arrToCsv(form.subjectRoles),
        subjectTeams: arrToCsv(form.subjectTeams),
        resourceType: form.resourceType,
        resourceId: form.resourceId || null,
        action: form.action,
      }
      if (editing) {
        await updatePolicy(editing.id, { ...payload, status: form.status } as UpdatePolicyRequest)
      } else {
        await createPolicy(payload as CreatePolicyRequest)
      }
      resetForm()
      await onReload()
    } catch (err) {
      setError(err instanceof Error ? err.message : '儲存失敗')
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm('確定要刪除此政策？')) return
    try {
      await deletePolicy(id)
      await onReload()
    } catch (err) {
      setError(err instanceof Error ? err.message : '刪除失敗')
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-sm text-slate-500 dark:text-slate-400">
          管理存取政策。
        </p>
        <button
          onClick={() => { resetForm(); setShowForm(true) }}
          className="shrink-0 rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
        >
          + 新增政策
        </button>
      </div>

      {error && <div className="rounded-md bg-red-50 p-3 text-sm text-red-600 dark:bg-red-900/30 dark:text-red-400">{error}</div>}

      {showForm && (
        <form onSubmit={e => void handleSubmit(e)} className="space-y-6 rounded-lg border border-slate-200 bg-white p-5 dark:border-slate-700 dark:bg-slate-900">
          <h3 className="text-base font-semibold">{editing ? '編輯政策' : '新增政策'}</h3>

          <fieldset className="space-y-4 rounded-lg border border-slate-200 p-4 dark:border-slate-700">
            <legend className="px-2 text-sm font-semibold text-slate-500 dark:text-slate-400">基本資訊</legend>
            <div className="grid grid-cols-2 gap-4">
              <label className="block">
                <span className="text-sm font-medium text-slate-600 dark:text-slate-300">名稱</span>
                <input
                  className="mt-1 block w-full rounded-md border border-slate-300 bg-white px-3 py-1.5 text-sm dark:border-slate-600 dark:bg-slate-800"
                  value={form.name}
                  onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                  required
                />
              </label>
              <label className="block">
                <span className="text-sm font-medium text-slate-600 dark:text-slate-300">描述</span>
                <input
                  className="mt-1 block w-full rounded-md border border-slate-300 bg-white px-3 py-1.5 text-sm dark:border-slate-600 dark:bg-slate-800"
                  value={form.description}
                  onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
                />
              </label>
              <label className="block">
                <span className="text-sm font-medium text-slate-600 dark:text-slate-300">效果</span>
                <select
                  className="mt-1 block w-full rounded-md border border-slate-300 bg-white px-3 py-1.5 text-sm dark:border-slate-600 dark:bg-slate-800"
                  value={form.effect}
                  onChange={e => setForm(f => ({ ...f, effect: e.target.value }))}
                >
                  <option value="Allow">允許</option>
                  <option value="Deny">拒絕</option>
                </select>
              </label>
              {editing && (
                <label className="block">
                  <span className="text-sm font-medium text-slate-600 dark:text-slate-300">狀態（停用後不參與判斷）</span>
                  <select
                    className="mt-1 block w-full rounded-md border border-slate-300 bg-white px-3 py-1.5 text-sm dark:border-slate-600 dark:bg-slate-800"
                    value={form.status}
                    onChange={e => setForm(f => ({ ...f, status: e.target.value }))}
                  >
                    <option value="Active">啟用</option>
                    <option value="Inactive">停用</option>
                  </select>
                </label>
              )}
              <label className="block">
                <span className="text-sm font-medium text-slate-600 dark:text-slate-300">優先順序（數值越大越優先）</span>
                <input
                  type="number"
                  className="mt-1 block w-full rounded-md border border-slate-300 bg-white px-3 py-1.5 text-sm dark:border-slate-600 dark:bg-slate-800"
                  value={form.priority}
                  onChange={e => setForm(f => ({ ...f, priority: Number(e.target.value) }))}
                />
              </label>
            </div>
          </fieldset>

          <fieldset className="space-y-4 rounded-lg border border-slate-200 p-4 dark:border-slate-700">
            <legend className="px-2 text-sm font-semibold text-slate-500 dark:text-slate-400">使用者屬性（留空表示所有使用者）</legend>
            <div className="grid grid-cols-2 gap-4">
              <MultiSelectDropdown
                label="角色"
                options={ROLE_OPTIONS}
                selected={form.subjectRoles}
                onChange={v => setForm(f => ({ ...f, subjectRoles: v }))}
                placeholder="任意角色"
              />
              <SearchableMultiSelect
                label="團隊"
                options={teamOptions}
                selected={form.subjectTeams}
                onChange={v => setForm(f => ({ ...f, subjectTeams: v }))}
                placeholder="搜尋團隊..."
              />
            </div>
          </fieldset>

          <fieldset className="space-y-4 rounded-lg border border-slate-200 p-4 dark:border-slate-700">
            <legend className="px-2 text-sm font-semibold text-slate-500 dark:text-slate-400">存取控制</legend>
            <div className="grid grid-cols-3 items-end gap-4">
              <SearchableSelect
                label="資源類型"
                options={rtOptions}
                value={form.resourceType}
                onChange={v => setForm(f => ({ ...f, resourceType: v }))}
                placeholder="搜尋資源類型..."
              />
              <label className="block">
                <span className="text-sm font-medium text-slate-600 dark:text-slate-300">資源 ID（留空表示所有資源）</span>
                <input
                  className="mt-1 block w-full rounded-md border border-slate-300 bg-white px-3 py-1.5 text-sm dark:border-slate-600 dark:bg-slate-800"
                  value={form.resourceId}
                  onChange={e => setForm(f => ({ ...f, resourceId: e.target.value }))}
                  placeholder="任意"
                />
              </label>
              <SearchableSelect
                label="操作"
                options={ACTION_OPTIONS}
                value={form.action}
                onChange={v => setForm(f => ({ ...f, action: v }))}
                placeholder="任意操作"
              />
            </div>
          </fieldset>

          <div className="flex gap-3">
            <button type="submit" className="rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700">
              {editing ? '更新' : '建立'}
            </button>
            <button type="button" onClick={resetForm} className="rounded-md border border-slate-300 px-4 py-2 text-sm dark:border-slate-600">
              取消
            </button>
          </div>
        </form>
      )}

      <div className="overflow-x-auto rounded-lg border border-slate-200 dark:border-slate-700">
        <table className="w-full text-left text-sm">
          <thead className="bg-slate-50 dark:bg-slate-800">
            <tr>
              <th className="px-4 py-2">名稱</th>
              <th className="px-4 py-2">效果</th>
              <th className="px-4 py-2">狀態</th>
              <th className="px-4 py-2">優先順序</th>
              <th className="px-4 py-2">角色</th>
              <th className="px-4 py-2">團隊</th>
              <th className="px-4 py-2">資源</th>
              <th className="px-4 py-2">操作</th>
              <th className="px-4 py-2 text-right">管理</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200 dark:divide-slate-700">
            {policies.map(p => (
              <tr key={p.id}>
                <td className="px-4 py-2 font-medium">{p.name}</td>
                <td className="px-4 py-2">
                  <span className={`inline-block rounded px-2 py-0.5 text-xs font-semibold ${p.effect === 'Allow' ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400' : 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400'}`}>
                    {p.effect}
                  </span>
                </td>
                <td className="px-4 py-2">
                  <span className={`inline-block rounded px-2 py-0.5 text-xs ${p.status === 'Active' ? 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400' : 'bg-slate-100 text-slate-500'}`}>
                    {p.status}
                  </span>
                </td>
                <td className="px-4 py-2">{p.priority}</td>
                <td className="px-4 py-2">{p.subjectRoles || '—'}</td>
                <td className="px-4 py-2">{p.subjectTeams || '—'}</td>
                <td className="px-4 py-2">{p.resourceType || '—'}</td>
                <td className="px-4 py-2">{p.action || '—'}</td>
                <td className="px-4 py-2 text-right">
                  <button onClick={() => handleEdit(p)} className="mr-2 text-blue-600 hover:underline dark:text-blue-400">編輯</button>
                  <button onClick={() => void handleDelete(p.id)} className="text-red-600 hover:underline dark:text-red-400">刪除</button>
                </td>
              </tr>
            ))}
            {policies.length === 0 && (
              <tr><td colSpan={9} className="px-4 py-6 text-center text-slate-400">尚無政策</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}
