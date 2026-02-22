import { apiFetch, apiBaseUrl } from './api'

// ── Types ───────────────────────────────────────────────────────────

export interface PolicyDto {
  id: string
  name: string
  description: string | null
  effect: string
  status: string
  priority: number
  subjectRoles: string | null
  subjectTeams: string | null
  resourceType: string | null
  resourceId: string | null
  action: string | null
  createdAt: string
  updatedAt: string
  createdBy: string | null
}

export interface CreatePolicyRequest {
  name: string
  description?: string | null
  effect: string
  priority: number
  subjectRoles?: string | null
  subjectTeams?: string | null
  resourceType?: string | null
  resourceId?: string | null
  action?: string | null
}

export interface UpdatePolicyRequest extends CreatePolicyRequest {
  status: string
}

export interface UserAttributeDto {
  id: string
  userId: string
  displayName: string | null
  roles: string | null
  isAdmin: boolean
  createdAt: string
  updatedAt: string
}

export interface UpsertUserAttributeRequest {
  userId: string
  displayName?: string | null
  roles?: string | null
  isAdmin: boolean
}

export interface TeamDto {
  id: string
  name: string
  members: TeamMemberDto[]
  createdAt: string
  updatedAt: string
}

export interface TeamMemberDto {
  id: string
  memberType: 'User' | 'Team'
  memberUserId: string | null
  memberTeamId: string | null
  displayName: string | null
  createdAt: string
}

export interface CreateTeamRequest {
  name: string
}

export interface UpdateTeamRequest {
  name: string
}

export interface AddTeamMemberRequest {
  memberType: 'User' | 'Team'
  memberUserId?: string | null
  memberTeamId?: string | null
}

export interface ResourceTypeDto {
  id: string
  name: string
  description: string | null
  createdAt: string
}

export interface CreateResourceTypeRequest {
  name: string
  description?: string | null
}

export interface AuditLogDto {
  id: string
  userId: string
  action: string
  resourceType: string
  resourceId: string | null
  result: string
  matchedPolicyId: string | null
  reason: string | null
  subjectAttributesSnapshot: string | null
  ipAddress: string | null
  createdAt: string
}

export interface AuditQueryResult {
  items: AuditLogDto[]
  total: number
  page: number
  pageSize: number
}

export interface SimulateRequest {
  userId: string
  action: string
  resourceType: string
  resourceId?: string | null
  utcNow?: string | null
}

export interface PolicyEvaluationDetail {
  policyId: string
  policyName: string
  effect: string
  matched: boolean
  skipReason: string | null
}

export interface SimulateResponse {
  result: string
  matchedPolicyId: string | null
  matchedPolicyName: string | null
  reason: string
  evaluatedPolicies: PolicyEvaluationDetail[]
}

export interface MeResponse {
  userId: string
  displayName: string | null
  isAdmin: boolean
}

// ── API Functions ───────────────────────────────────────────────────

const abacBase = `${apiBaseUrl}/abac`

// Profile / Me
export async function fetchMe(signal?: AbortSignal): Promise<MeResponse> {
  const res = await apiFetch(`${apiBaseUrl}/me`, { signal })
  if (!res.ok) throw new Error(`fetchMe failed: ${res.status}`)
  return res.json()
}

export async function syncMe(signal?: AbortSignal): Promise<MeResponse> {
  const res = await apiFetch(`${apiBaseUrl}/me/sync`, { method: 'POST', signal })
  if (!res.ok) throw new Error(`syncMe failed: ${res.status}`)
  return res.json()
}

// Policies
export async function fetchPolicies(signal?: AbortSignal): Promise<PolicyDto[]> {
  const res = await apiFetch(`${abacBase}/policies`, { signal })
  if (!res.ok) throw new Error(`fetchPolicies failed: ${res.status}`)
  return res.json()
}

export async function fetchPolicy(id: string): Promise<PolicyDto> {
  const res = await apiFetch(`${abacBase}/policies/${id}`)
  if (!res.ok) throw new Error(`fetchPolicy failed: ${res.status}`)
  return res.json()
}

export async function createPolicy(req: CreatePolicyRequest): Promise<PolicyDto> {
  const res = await apiFetch(`${abacBase}/policies`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(req),
  })
  if (!res.ok) throw new Error(`createPolicy failed: ${res.status}`)
  return res.json()
}

export async function updatePolicy(id: string, req: UpdatePolicyRequest): Promise<PolicyDto> {
  const res = await apiFetch(`${abacBase}/policies/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(req),
  })
  if (!res.ok) throw new Error(`updatePolicy failed: ${res.status}`)
  return res.json()
}

export async function deletePolicy(id: string): Promise<void> {
  const res = await apiFetch(`${abacBase}/policies/${id}`, { method: 'DELETE' })
  if (!res.ok) throw new Error(`deletePolicy failed: ${res.status}`)
}

// User Attributes
export async function fetchUserAttributes(signal?: AbortSignal): Promise<UserAttributeDto[]> {
  const res = await apiFetch(`${abacBase}/users`, { signal })
  if (!res.ok) throw new Error(`fetchUserAttributes failed: ${res.status}`)
  return res.json()
}

export async function fetchUserAttribute(userId: string): Promise<UserAttributeDto> {
  const res = await apiFetch(`${abacBase}/users/${userId}`)
  if (!res.ok) throw new Error(`fetchUserAttribute failed: ${res.status}`)
  return res.json()
}

export async function upsertUserAttribute(req: UpsertUserAttributeRequest): Promise<UserAttributeDto> {
  const res = await apiFetch(`${abacBase}/users`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(req),
  })
  if (!res.ok) throw new Error(`upsertUserAttribute failed: ${res.status}`)
  return res.json()
}

export async function deleteUserAttribute(userId: string): Promise<void> {
  const res = await apiFetch(`${abacBase}/users/${userId}`, { method: 'DELETE' })
  if (!res.ok) throw new Error(`deleteUserAttribute failed: ${res.status}`)
}

// Teams
export async function fetchTeams(signal?: AbortSignal): Promise<TeamDto[]> {
  const res = await apiFetch(`${abacBase}/teams`, { signal })
  if (!res.ok) throw new Error(`fetchTeams failed: ${res.status}`)
  return res.json()
}

export async function createTeam(req: CreateTeamRequest): Promise<TeamDto> {
  const res = await apiFetch(`${abacBase}/teams`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(req),
  })
  if (!res.ok) throw new Error(`createTeam failed: ${res.status}`)
  return res.json()
}

export async function updateTeam(id: string, req: UpdateTeamRequest): Promise<TeamDto> {
  const res = await apiFetch(`${abacBase}/teams/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(req),
  })
  if (!res.ok) throw new Error(`updateTeam failed: ${res.status}`)
  return res.json()
}

export async function deleteTeam(id: string): Promise<void> {
  const res = await apiFetch(`${abacBase}/teams/${id}`, { method: 'DELETE' })
  if (!res.ok) throw new Error(`deleteTeam failed: ${res.status}`)
}

export async function addTeamMember(teamId: string, req: AddTeamMemberRequest): Promise<TeamMemberDto> {
  const res = await apiFetch(`${abacBase}/teams/${teamId}/members`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(req),
  })
  if (!res.ok) {
    const body = await res.json().catch(() => null)
    throw new Error(body?.error ?? `addTeamMember failed: ${res.status}`)
  }
  return res.json()
}

export async function removeTeamMember(teamId: string, memberId: string): Promise<void> {
  const res = await apiFetch(`${abacBase}/teams/${teamId}/members/${memberId}`, { method: 'DELETE' })
  if (!res.ok) throw new Error(`removeTeamMember failed: ${res.status}`)
}

// Resource Types
export async function fetchResourceTypes(signal?: AbortSignal): Promise<ResourceTypeDto[]> {
  const res = await apiFetch(`${abacBase}/resource-types`, { signal })
  if (!res.ok) throw new Error(`fetchResourceTypes failed: ${res.status}`)
  return res.json()
}

export async function createResourceType(req: CreateResourceTypeRequest): Promise<ResourceTypeDto> {
  const res = await apiFetch(`${abacBase}/resource-types`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(req),
  })
  if (!res.ok) throw new Error(`createResourceType failed: ${res.status}`)
  return res.json()
}

export async function deleteResourceType(id: string): Promise<void> {
  const res = await apiFetch(`${abacBase}/resource-types/${id}`, { method: 'DELETE' })
  if (!res.ok) throw new Error(`deleteResourceType failed: ${res.status}`)
}

// Audit
export async function fetchAuditLogs(params?: {
  userId?: string
  resourceType?: string
  result?: string
  page?: number
  pageSize?: number
  signal?: AbortSignal
}): Promise<AuditQueryResult> {
  const qs = new URLSearchParams()
  if (params?.userId) qs.set('userId', params.userId)
  if (params?.resourceType) qs.set('resourceType', params.resourceType)
  if (params?.result) qs.set('result', params.result)
  if (params?.page) qs.set('page', String(params.page))
  if (params?.pageSize) qs.set('pageSize', String(params.pageSize))
  const res = await apiFetch(`${abacBase}/audit?${qs.toString()}`, { signal: params?.signal })
  if (!res.ok) throw new Error(`fetchAuditLogs failed: ${res.status}`)
  return res.json()
}

// Simulator
export async function simulatePolicy(req: SimulateRequest): Promise<SimulateResponse> {
  const res = await apiFetch(`${abacBase}/simulate`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(req),
  })
  if (!res.ok) throw new Error(`simulatePolicy failed: ${res.status}`)
  return res.json()
}
