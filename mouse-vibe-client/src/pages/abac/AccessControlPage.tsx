import { useEffect, useState } from 'react'
import {
  fetchUserAttributes, fetchTeams, fetchPolicies, fetchResourceTypes,
  type UserAttributeDto, type TeamDto, type PolicyDto, type ResourceTypeDto,
} from '../../abacApi'
import type { Tab } from './shared'
import MembersSection from './MembersSection'
import TeamsSection from './TeamsSection'
import PoliciesSection from './PoliciesSection'
import CheckSection from './CheckSection'
import AuditSection from './AuditSection'


export default function AccessControlPage() {
  const [tab, setTab] = useState<Tab>('members')

  /* shared data */
  const [users, setUsers] = useState<UserAttributeDto[]>([])
  const [teams, setTeams] = useState<TeamDto[]>([])
  const [policies, setPolicies] = useState<PolicyDto[]>([])
  const [resourceTypes, setResourceTypes] = useState<ResourceTypeDto[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const load = async (silent = false, signal?: AbortSignal) => {
    try {
      if (!silent) setLoading(true)
      const [u, t, p, r] = await Promise.all([
        fetchUserAttributes(signal),
        fetchTeams(signal),
        fetchPolicies(signal),
        fetchResourceTypes(signal),
      ])
      setUsers(u)
      setTeams(t)
      setPolicies(p)
      setResourceTypes(r)
    } catch (e) {
      if (e instanceof DOMException && e.name === 'AbortError') return
      setError(e instanceof Error ? e.message : '無法載入資料')
    } finally {
      if (!signal?.aborted && !silent) setLoading(false)
    }
  }

  const reload = () => load(true)

  useEffect(() => {
    const controller = new AbortController()
    void load(false, controller.signal)
    return () => controller.abort()
  }, [])

  const tabClass = (t: Tab) =>
    `px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
      tab === t
        ? 'border-blue-600 text-blue-600 dark:border-blue-400 dark:text-blue-400'
        : 'border-transparent text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200'
    }`

  return (
    <div className="mx-auto max-w-6xl space-y-6">
      <h1 className="text-2xl font-bold">Access Control</h1>

      {/* Tabs */}
      <div className="flex border-b border-slate-200 dark:border-slate-700">
        <button className={tabClass('members')} onClick={() => { setTab('members'); setError(null) }}>
          成員
        </button>
        <button className={tabClass('teams')} onClick={() => { setTab('teams'); setError(null) }}>
          團隊
        </button>
        <button className={tabClass('policies')} onClick={() => { setTab('policies'); setError(null) }}>
          存取規則
        </button>
        <button className={tabClass('check')} onClick={() => { setTab('check'); setError(null) }}>
          存取規則測試
        </button>
        <button className={tabClass('audit')} onClick={() => { setTab('audit'); setError(null) }}>
          稽核紀錄
        </button>
      </div>

      {loading ? (
        <p className="text-slate-500">載入中...</p>
      ) : (
        <>
          {tab === 'members' && (
            <MembersSection users={users} onReload={reload} error={error} setError={setError} />
          )}
          {tab === 'teams' && (
            <TeamsSection teams={teams} users={users} onReload={reload} error={error} setError={setError} />
          )}
          {tab === 'policies' && (
            <PoliciesSection policies={policies} teams={teams} resourceTypes={resourceTypes} onReload={reload} error={error} setError={setError} />
          )}
          {tab === 'check' && (
            <CheckSection policies={policies} users={users} resourceTypes={resourceTypes} />
          )}
          {tab === 'audit' && (
            <AuditSection />
          )}
        </>
      )}
    </div>
  )
}
