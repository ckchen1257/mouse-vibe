import { useState } from 'react'
import {
  createTeam, updateTeam, deleteTeam,
  addTeamMember, removeTeamMember,
  type TeamDto, type UserAttributeDto,
  type CreateTeamRequest, type UpdateTeamRequest,
} from '../../abacApi'
import SearchableSelect from '../../components/SearchableSelect'
import { PencilIcon, TrashIcon, XMarkIcon } from './shared'

// ── Sub-components ──────────────────────────────────────────────────

function TeamMemberField({ label, options, ids, getLabel, onAdd, onRemove, placeholder }: {
  label: string
  options: Array<{ value: string; label: string }>
  ids: string[]
  getLabel: (id: string) => string
  onAdd: (id: string) => void
  onRemove: (id: string) => void
  placeholder: string
}) {
  return (
    <div>
      <SearchableSelect label={label} options={options} value={null} onChange={v => { if (v) onAdd(v) }} placeholder={placeholder} />
      {ids.length > 0 && (
        <div className="mt-2 flex flex-wrap gap-1.5">
          {ids.map(id => (
            <span key={id} className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-2.5 py-1 text-xs font-medium text-slate-700 dark:bg-slate-700 dark:text-slate-300">
              {getLabel(id)}
              <button type="button" onClick={() => onRemove(id)} className="inline-flex rounded-full p-0.5 text-slate-400 hover:text-red-500 dark:hover:text-red-400" title="移除">
                <XMarkIcon className="h-3 w-3" />
              </button>
            </span>
          ))}
        </div>
      )}
    </div>
  )
}

function TeamEditorForm({
  isEditing, formName, onNameChange, onSubmit, onCancel,
  userMemberIds, teamMemberIds, getUserLabel, getTeamLabel,
  userOptions, teamOptions, onAddMember, onRemoveMember,
}: {
  isEditing: boolean
  formName: string
  onNameChange: (v: string) => void
  onSubmit: (e: React.FormEvent) => void
  onCancel: () => void
  userMemberIds: string[]
  teamMemberIds: string[]
  getUserLabel: (id: string) => string
  getTeamLabel: (id: string) => string
  userOptions: Array<{ value: string; label: string }>
  teamOptions: Array<{ value: string; label: string }>
  onAddMember: (type: 'User' | 'Team', id: string) => void
  onRemoveMember: (type: 'User' | 'Team', id: string) => void
}) {
  const [editingName, setEditingName] = useState(!isEditing)
  const [draftName, setDraftName] = useState(formName)

  const commitName = () => {
    if (draftName.trim()) onNameChange(draftName.trim())
    else setDraftName(formName)
    setEditingName(false)
  }

  const handleNameKey = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') { e.preventDefault(); commitName() }
    if (e.key === 'Escape') { setDraftName(formName); setEditingName(false) }
  }

  return (
    <form onSubmit={e => void onSubmit(e)} className="space-y-4 rounded-lg border border-slate-200 bg-white p-5 dark:border-slate-700 dark:bg-slate-900">
      {!isEditing ? (
        <div>
          <h2 className="mb-2 text-lg font-semibold">新增團隊</h2>
          <label className="block max-w-md">
            <span className="text-sm font-medium text-slate-600 dark:text-slate-300">名稱</span>
            <input
              className="mt-1 block w-full rounded-md border border-slate-300 bg-white px-3 py-1.5 text-sm dark:border-slate-600 dark:bg-slate-800"
              value={formName}
              onChange={e => onNameChange(e.target.value)}
              required
            />
          </label>
        </div>
      ) : editingName ? (
        <input
          className="w-full border-b border-blue-400 bg-transparent pb-0.5 text-lg font-semibold outline-none dark:border-blue-500"
          value={draftName}
          onChange={e => setDraftName(e.target.value)}
          onBlur={commitName}
          onKeyDown={handleNameKey}
          autoFocus
        />
      ) : (
        <button type="button" onClick={() => { setDraftName(formName); setEditingName(true) }} className="group flex items-center gap-1.5 text-left">
          <h2 className="text-lg font-semibold group-hover:text-blue-600 dark:group-hover:text-blue-400">{formName}</h2>
          <span className="text-slate-400"><PencilIcon /></span>
        </button>
      )}

      <div className="grid gap-4 md:grid-cols-2">
        <TeamMemberField label="使用者成員" options={userOptions} ids={userMemberIds} getLabel={getUserLabel} onAdd={v => onAddMember('User', v)} onRemove={id => onRemoveMember('User', id)} placeholder="搜尋使用者..." />
        <TeamMemberField label="團隊成員" options={teamOptions} ids={teamMemberIds} getLabel={getTeamLabel} onAdd={v => onAddMember('Team', v)} onRemove={id => onRemoveMember('Team', id)} placeholder="搜尋團隊..." />
      </div>

      <div className="flex gap-3">
        <button type="submit" className="rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700">
          {isEditing ? '更新' : '建立'}
        </button>
        <button type="button" onClick={onCancel} className="rounded-md border border-slate-300 px-4 py-2 text-sm dark:border-slate-600">取消</button>
      </div>
    </form>
  )
}

// ── Main Section ────────────────────────────────────────────────────

interface TeamFormState { name: string }
const emptyTeamForm: TeamFormState = { name: '' }

export default function TeamsSection({
  teams, users, onReload, error, setError,
}: {
  teams: TeamDto[]
  users: UserAttributeDto[]
  onReload: () => Promise<void>
  error: string | null
  setError: (e: string | null) => void
}) {
  const [editing, setEditing] = useState<TeamDto | null>(null)
  const [form, setForm] = useState<TeamFormState>(emptyTeamForm)
  const [showForm, setShowForm] = useState(false)
  const [pendingUserMembers, setPendingUserMembers] = useState<string[]>([])
  const [pendingTeamMembers, setPendingTeamMembers] = useState<string[]>([])

  const resetForm = () => { setForm(emptyTeamForm); setEditing(null); setShowForm(false); setPendingUserMembers([]); setPendingTeamMembers([]) }

  const handleEdit = (t: TeamDto) => { setEditing(t); setForm({ name: t.name }); setPendingUserMembers([]); setPendingTeamMembers([]); setShowForm(true) }

  const liveTeam = editing ? teams.find(t => t.id === editing.id) ?? editing : null

  const memberIdsOf = (type: 'User' | 'Team') => {
    if (liveTeam) return liveTeam.members.filter(m => m.memberType === type && (type === 'User' ? !!m.memberUserId : !!m.memberTeamId)).map(m => (type === 'User' ? m.memberUserId : m.memberTeamId) as string)
    return type === 'User' ? pendingUserMembers : pendingTeamMembers
  }

  const getUserLabel = (userId: string) => users.find(u => u.userId === userId)?.displayName ?? userId
  const getTeamLabel = (teamId: string) => teams.find(t => t.id === teamId)?.name ?? teamId

  const buildUserOptions = (excludeIds: Set<string>) =>
    users.filter(u => !excludeIds.has(u.userId)).map(u => ({ value: u.userId, label: u.displayName ? `${u.displayName} (${u.userId})` : u.userId }))
  const buildTeamOptions = (excludeIds: Set<string>, selfId?: string) =>
    teams.filter(t => t.id !== selfId && !excludeIds.has(t.id)).map(t => ({ value: t.id, label: t.name }))

  const handleAddMember = async (type: 'User' | 'Team', id: string) => {
    try {
      setError(null)
      if (editing) {
        await addTeamMember(editing.id, type === 'User' ? { memberType: 'User', memberUserId: id } : { memberType: 'Team', memberTeamId: id })
        await onReload()
      } else {
        if (type === 'User') setPendingUserMembers(prev => prev.includes(id) ? prev : [...prev, id])
        else setPendingTeamMembers(prev => prev.includes(id) ? prev : [...prev, id])
      }
    } catch (err) { setError(err instanceof Error ? err.message : '新增成員失敗') }
  }

  const handleRemoveMember = async (type: 'User' | 'Team', id: string) => {
    try {
      setError(null)
      if (editing && liveTeam) {
        const m = liveTeam.members.find(m => m.memberType === type && (type === 'User' ? m.memberUserId === id : m.memberTeamId === id))
        if (m) { await removeTeamMember(editing.id, m.id); await onReload() }
      } else {
        if (type === 'User') setPendingUserMembers(prev => prev.filter(x => x !== id))
        else setPendingTeamMembers(prev => prev.filter(x => x !== id))
      }
    } catch (err) { setError(err instanceof Error ? err.message : '移除成員失敗') }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      setError(null)
      if (editing) {
        await updateTeam(editing.id, { name: form.name } as UpdateTeamRequest)
      } else {
        const created = await createTeam({ name: form.name } as CreateTeamRequest)
        const allAdds = [
          ...pendingUserMembers.map(uid => addTeamMember(created.id, { memberType: 'User', memberUserId: uid })),
          ...pendingTeamMembers.map(tid => addTeamMember(created.id, { memberType: 'Team', memberTeamId: tid })),
        ]
        if (allAdds.length) await Promise.all(allAdds)
      }
      resetForm()
      await onReload()
    } catch (err) { setError(err instanceof Error ? err.message : '儲存失敗') }
  }

  const handleDelete = async (id: string) => {
    if (!confirm('確定要刪除此團隊？所有成員關聯也將一併刪除。')) return
    try { await deleteTeam(id); await onReload() }
    catch (err) { setError(err instanceof Error ? err.message : '刪除失敗') }
  }

  const userMemberIds = memberIdsOf('User')
  const teamMemberIds = memberIdsOf('Team')

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-sm text-slate-500 dark:text-slate-400">
          管理團隊與成員。
        </p>
        <button onClick={() => { resetForm(); setShowForm(true) }} className="shrink-0 rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700">
          + 新增團隊
        </button>
      </div>

      {error && <div className="rounded-md bg-red-50 p-3 text-sm text-red-600 dark:bg-red-900/30 dark:text-red-400">{error}</div>}

      {showForm && !editing && (
        <TeamEditorForm
          isEditing={!!editing}
          formName={form.name}
          onNameChange={v => setForm(f => ({ ...f, name: v }))}
          onSubmit={handleSubmit}
          onCancel={resetForm}
          userMemberIds={userMemberIds}
          teamMemberIds={teamMemberIds}
          getUserLabel={getUserLabel}
          getTeamLabel={getTeamLabel}
          userOptions={buildUserOptions(new Set(userMemberIds))}
          teamOptions={buildTeamOptions(new Set(teamMemberIds), liveTeam?.id)}
          onAddMember={handleAddMember}
          onRemoveMember={handleRemoveMember}
        />
      )}

      <div className="space-y-2">
        {teams.length === 0 && (
          <div className="rounded-lg border border-slate-200 p-6 text-center text-slate-400 dark:border-slate-700">尚無團隊</div>
        )}
        {teams.map(team => {
          if (showForm && editing?.id === team.id) {
            return (
              <TeamEditorForm
                key={team.id}
                isEditing
                formName={form.name}
                onNameChange={v => setForm(f => ({ ...f, name: v }))}
                onSubmit={handleSubmit}
                onCancel={resetForm}
                userMemberIds={userMemberIds}
                teamMemberIds={teamMemberIds}
                getUserLabel={getUserLabel}
                getTeamLabel={getTeamLabel}
                userOptions={buildUserOptions(new Set(userMemberIds))}
                teamOptions={buildTeamOptions(new Set(teamMemberIds), liveTeam?.id)}
                onAddMember={handleAddMember}
                onRemoveMember={handleRemoveMember}
              />
            )
          }
          const uCount = team.members.filter(m => m.memberType === 'User').length
          const tCount = team.members.filter(m => m.memberType === 'Team').length
          return (
            <div key={team.id} onClick={() => handleEdit(team)} className="flex cursor-pointer items-center justify-between rounded-lg border border-slate-200 px-4 py-3 transition-colors hover:bg-slate-50 dark:border-slate-700 dark:hover:bg-slate-800">
              <div className="flex items-center gap-2">
                <span className="font-semibold">{team.name}</span>
                <span className="text-xs text-slate-400">({uCount} 人, {tCount} 團隊)</span>
              </div>
              <button onClick={e => { e.stopPropagation(); void handleDelete(team.id) }} className="inline-flex items-center rounded p-1 text-slate-500 hover:bg-slate-100 hover:text-red-600 dark:text-slate-400 dark:hover:bg-slate-700 dark:hover:text-red-400" title="刪除"><TrashIcon /></button>
            </div>
          )
        })}
      </div>
    </div>
  )
}
