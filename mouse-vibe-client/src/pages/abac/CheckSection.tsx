import { useState, useMemo } from 'react'
import {
  simulatePolicy,
  type PolicyDto, type UserAttributeDto, type ResourceTypeDto,
  type SimulateRequest, type SimulateResponse,
} from '../../abacApi'
import SearchableSelect from '../../components/SearchableSelect'
import { ACTION_OPTIONS } from './shared'

export default function CheckSection({
  policies, users, resourceTypes,
}: {
  policies: PolicyDto[]
  users: UserAttributeDto[]
  resourceTypes: ResourceTypeDto[]
}) {
  const [simForm, setSimForm] = useState<SimulateRequest>({
    userId: '', action: '', resourceType: '', resourceId: '', utcNow: null,
  })
  const [simResult, setSimResult] = useState<SimulateResponse | null>(null)
  const [simLoading, setSimLoading] = useState(false)
  const [simError, setSimError] = useState<string | null>(null)

  const [userSearch, setUserSearch] = useState('')
  const [userDropOpen, setUserDropOpen] = useState(false)

  const rtOptions = resourceTypes.map(r => ({ value: r.name, label: r.name }))

  const filteredUsers = useMemo(() => {
    if (!userSearch) return users.slice(0, 8)
    const q = userSearch.toLowerCase()
    return users.filter(u =>
      u.userId.toLowerCase().includes(q) ||
      (u.displayName && u.displayName.toLowerCase().includes(q)),
    ).slice(0, 8)
  }, [users, userSearch])

  const handleSimSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      setSimLoading(true)
      setSimError(null)
      setSimResult(await simulatePolicy(simForm))
    } catch (err) {
      setSimError(err instanceof Error ? err.message : '模擬失敗')
    } finally {
      setSimLoading(false)
    }
  }

  const handlePickUser = (userId: string) => {
    setSimForm(f => ({ ...f, userId }))
    setUserSearch(userId)
    setUserDropOpen(false)
  }

  return (
    <div className="space-y-5">
      <p className="text-sm text-slate-500 dark:text-slate-400">
        模擬驗證存取權限，不會產生稽核紀錄。
      </p>

      {simError && <div className="rounded-md bg-red-50 p-3 text-sm text-red-600 dark:bg-red-900/30 dark:text-red-400">{simError}</div>}

      <form onSubmit={e => void handleSimSubmit(e)} className="space-y-4">
        <div className="grid grid-cols-1 items-end gap-4 sm:grid-cols-2">
          <div className="relative">
            <label className="block text-sm font-medium text-slate-600 dark:text-slate-300">
              使用者 Email
            </label>
            <input
              className="mt-1 block w-full rounded-md border border-slate-300 bg-white px-3 py-1.5 text-sm dark:border-slate-600 dark:bg-slate-800"
              placeholder="輸入或選擇使用者..."
              value={simForm.userId}
              onChange={e => {
                const v = e.target.value
                setSimForm(f => ({ ...f, userId: v }))
                setUserSearch(v)
                setUserDropOpen(true)
              }}
              onFocus={() => setUserDropOpen(true)}
              onBlur={() => setTimeout(() => setUserDropOpen(false), 200)}
              required
            />
            {userDropOpen && filteredUsers.length > 0 && (
              <ul className="absolute z-30 mt-1 max-h-48 w-full overflow-auto rounded-md border border-slate-200 bg-white py-1 shadow-lg dark:border-slate-600 dark:bg-slate-800">
                {filteredUsers.map(u => (
                  <li key={u.id}>
                    <button
                      type="button"
                      onMouseDown={() => handlePickUser(u.userId)}
                      className="flex w-full items-center gap-2 px-3 py-1.5 text-left text-sm hover:bg-slate-100 dark:hover:bg-slate-700"
                    >
                      <span className="font-medium">{u.userId}</span>
                      {u.displayName && <span className="text-xs text-slate-400">({u.displayName})</span>}
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>

          <SearchableSelect
            label="操作"
            options={ACTION_OPTIONS}
            value={simForm.action || null}
            onChange={v => setSimForm(f => ({ ...f, action: v ?? '' }))}
            placeholder="選擇操作..."
            clearable={false}
          />

          <SearchableSelect
            label="資源類型"
            options={rtOptions}
            value={simForm.resourceType || null}
            onChange={v => setSimForm(f => ({ ...f, resourceType: v ?? '' }))}
            placeholder="搜尋資源類型..."
            clearable={false}
          />

          <label className="block">
            <span className="text-sm font-medium text-slate-600 dark:text-slate-300">資源 ID（選填）</span>
            <input
              className="mt-1 block w-full rounded-md border border-slate-300 bg-white px-3 py-1.5 text-sm dark:border-slate-600 dark:bg-slate-800"
              value={simForm.resourceId ?? ''}
              onChange={e => setSimForm(f => ({ ...f, resourceId: e.target.value || null }))}
            />
          </label>
        </div>

        <button
          type="submit"
          disabled={simLoading}
          className="rounded-md bg-blue-600 px-5 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50"
        >
          {simLoading ? '驗證中...' : '🔍 驗證權限'}
        </button>
      </form>

      {simResult && (
        <div className="space-y-4 pt-2">
          <div className={`flex items-start gap-4 rounded-lg border p-4 ${
            simResult.result === 'Allow'
              ? 'border-green-300 bg-green-50 dark:border-green-700 dark:bg-green-900/20'
              : 'border-red-300 bg-red-50 dark:border-red-700 dark:bg-red-900/20'
          }`}>
            <span className={`mt-0.5 flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-lg font-bold ${
              simResult.result === 'Allow'
                ? 'bg-green-200 text-green-800 dark:bg-green-800 dark:text-green-200'
                : 'bg-red-200 text-red-800 dark:bg-red-800 dark:text-red-200'
            }`}>
              {simResult.result === 'Allow' ? '✓' : '✗'}
            </span>
            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-2">
                <span className={`text-xl font-bold ${
                  simResult.result === 'Allow'
                    ? 'text-green-700 dark:text-green-400'
                    : 'text-red-700 dark:text-red-400'
                }`}>
                  {simResult.result === 'Allow' ? '允許' : '拒絕'}
                </span>
                {simResult.matchedPolicyName && (
                  <span className="rounded-full bg-white/80 px-2.5 py-0.5 text-xs font-medium text-slate-600 ring-1 ring-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:ring-slate-600">
                    匹配政策：{simResult.matchedPolicyName}
                  </span>
                )}
              </div>
              <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">{simResult.reason}</p>
            </div>
          </div>

          <details className="group rounded-lg border border-slate-200 dark:border-slate-700" open>
            <summary className="flex cursor-pointer items-center gap-2 bg-slate-50 px-4 py-2.5 text-sm font-medium text-slate-700 dark:bg-slate-800 dark:text-slate-300">
              <svg className="h-4 w-4 transition-transform group-open:rotate-90" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
              評估明細（{simResult.evaluatedPolicies.length} 條）
            </summary>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="border-t border-slate-200 bg-slate-50 dark:border-slate-700 dark:bg-slate-800">
                  <tr>
                    <th className="px-4 py-2">優先順序</th>
                    <th className="px-4 py-2">政策名稱</th>
                    <th className="px-4 py-2">效果</th>
                    <th className="px-4 py-2">匹配</th>
                    <th className="px-4 py-2">原因</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200 dark:divide-slate-700">
                  {simResult.evaluatedPolicies.map((ep, idx) => {
                    const pol = policies.find(p => p.id === ep.policyId)
                    return (
                      <tr
                        key={ep.policyId}
                        className={ep.matched
                          ? 'bg-yellow-50 font-medium dark:bg-yellow-900/10'
                          : 'text-slate-500 dark:text-slate-400'}
                      >
                        <td className="px-4 py-2 text-xs tabular-nums">{pol?.priority ?? idx + 1}</td>
                        <td className="px-4 py-2">{ep.policyName}</td>
                        <td className="px-4 py-2">
                          <span className={`inline-block rounded px-2 py-0.5 text-xs font-semibold ${
                            ep.effect === 'Allow'
                              ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400'
                              : 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400'
                          }`}>
                            {ep.effect === 'Allow' ? '允許' : '拒絕'}
                          </span>
                        </td>
                        <td className="px-4 py-2">
                          {ep.matched
                            ? <span className="font-bold text-yellow-600 dark:text-yellow-400">● 命中</span>
                            : <span className="text-slate-400">—</span>}
                        </td>
                        <td className="max-w-xs truncate px-4 py-2 text-xs">{ep.skipReason || '—'}</td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          </details>
        </div>
      )}
    </div>
  )
}
