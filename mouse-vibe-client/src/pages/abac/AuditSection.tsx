import { useEffect, useState } from 'react'
import { fetchAuditLogs, type AuditQueryResult } from '../../abacApi'

export default function AuditSection() {
  const [data, setData] = useState<AuditQueryResult | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [filters, setFilters] = useState({
    userId: '', resourceType: '', result: '', page: 1, pageSize: 50,
  })

  const load = async (page = filters.page, signal?: AbortSignal) => {
    try {
      setLoading(true)
      setError(null)
      const res = await fetchAuditLogs({ ...filters, page, signal })
      setData(res)
      setFilters(f => ({ ...f, page }))
    } catch (e) {
      if (e instanceof DOMException && e.name === 'AbortError') return
      setError(e instanceof Error ? e.message : '無法載入稽核日誌')
    } finally {
      if (!signal?.aborted) setLoading(false)
    }
  }

  useEffect(() => {
    const controller = new AbortController()
    void load(1, controller.signal)
    return () => controller.abort()
  }, [])

  const handleFilter = (e: React.FormEvent) => {
    e.preventDefault()
    void load(1)
  }

  const totalPages = data ? Math.ceil(data.total / data.pageSize) : 0

  return (
    <div className="space-y-4">
      <p className="text-sm text-slate-500 dark:text-slate-400">
        查看授權決策的歷史紀錄。
      </p>

      {error && <div className="rounded-md bg-red-50 p-3 text-sm text-red-600 dark:bg-red-900/30 dark:text-red-400">{error}</div>}

      <form onSubmit={handleFilter} className="flex flex-wrap items-end gap-4 rounded-lg border border-slate-200 bg-white p-4 dark:border-slate-700 dark:bg-slate-900">
        <label className="block">
          <span className="text-xs text-slate-500">使用者 ID</span>
          <input
            className="mt-1 block w-40 rounded-md border border-slate-300 px-2 py-1 text-sm dark:border-slate-600 dark:bg-slate-800"
            value={filters.userId}
            onChange={e => setFilters(f => ({ ...f, userId: e.target.value }))}
          />
        </label>
        <label className="block">
          <span className="text-xs text-slate-500">資源類型</span>
          <input
            className="mt-1 block w-40 rounded-md border border-slate-300 px-2 py-1 text-sm dark:border-slate-600 dark:bg-slate-800"
            value={filters.resourceType}
            onChange={e => setFilters(f => ({ ...f, resourceType: e.target.value }))}
          />
        </label>
        <label className="block">
          <span className="text-xs text-slate-500">結果</span>
          <select
            className="mt-1 block w-28 rounded-md border border-slate-300 px-2 py-1 text-sm dark:border-slate-600 dark:bg-slate-800"
            value={filters.result}
            onChange={e => setFilters(f => ({ ...f, result: e.target.value }))}
          >
            <option value="">全部</option>
            <option value="Allow">允許</option>
            <option value="Deny">拒絕</option>
          </select>
        </label>
        <button type="submit" className="rounded-md bg-blue-600 px-4 py-1.5 text-sm font-medium text-white hover:bg-blue-700">
          搜尋
        </button>
      </form>

      {loading ? (
        <p className="text-slate-500">載入中...</p>
      ) : (
        <>
          <div className="overflow-x-auto rounded-lg border border-slate-200 dark:border-slate-700">
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-50 dark:bg-slate-800">
                <tr>
                  <th className="px-3 py-2">時間</th>
                  <th className="px-3 py-2">使用者</th>
                  <th className="px-3 py-2">操作</th>
                  <th className="px-3 py-2">資源</th>
                  <th className="px-3 py-2">結果</th>
                  <th className="px-3 py-2">原因</th>
                  <th className="px-3 py-2">IP 位址</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 dark:divide-slate-700">
                {data?.items.map(a => (
                  <tr key={a.id}>
                    <td className="whitespace-nowrap px-3 py-2 text-xs">{new Date(a.createdAt).toLocaleString('zh-TW')}</td>
                    <td className="px-3 py-2 font-mono text-xs">{a.userId}</td>
                    <td className="px-3 py-2">{a.action}</td>
                    <td className="px-3 py-2">{a.resourceType}{a.resourceId ? `/${a.resourceId}` : ''}</td>
                    <td className="px-3 py-2">
                      <span className={`inline-block rounded px-2 py-0.5 text-xs font-semibold ${a.result === 'Allow' ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400' : 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400'}`}>
                        {a.result === 'Allow' ? '允許' : '拒絕'}
                      </span>
                    </td>
                    <td className="max-w-xs truncate px-3 py-2 text-xs text-slate-500">{a.reason || '—'}</td>
                    <td className="px-3 py-2 text-xs">{a.ipAddress || '—'}</td>
                  </tr>
                ))}
                {(!data || data.items.length === 0) && (
                  <tr><td colSpan={7} className="px-4 py-6 text-center text-slate-400">尚無稽核紀錄</td></tr>
                )}
              </tbody>
            </table>
          </div>

          {totalPages > 1 && (
            <div className="flex items-center justify-between text-sm">
              <span className="text-slate-500">
                第 {data?.page} 頁，共 {totalPages} 頁（共 {data?.total} 筆）
              </span>
              <div className="flex gap-2">
                <button
                  disabled={filters.page <= 1}
                  onClick={() => void load(filters.page - 1)}
                  className="rounded border border-slate-300 px-3 py-1 disabled:opacity-40 dark:border-slate-600"
                >
                  上一頁
                </button>
                <button
                  disabled={filters.page >= totalPages}
                  onClick={() => void load(filters.page + 1)}
                  className="rounded border border-slate-300 px-3 py-1 disabled:opacity-40 dark:border-slate-600"
                >
                  下一頁
                </button>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  )
}
