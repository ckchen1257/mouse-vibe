import { apiFetch, apiBaseUrl } from './api'

// ── Types ───────────────────────────────────────────────────────────

export interface WebhookSubscriptionDto {
  id: string
  url: string
  description: string | null
  events: string
  isActive: boolean
  createdBy: string | null
  createdAt: string
}

export interface CreateWebhookRequest {
  url: string
  secret?: string | null
  description?: string | null
  events: string
}

export interface UpdateWebhookRequest {
  url: string
  secret?: string | null
  description?: string | null
  events: string
  isActive: boolean
}

export interface WebhookEventDto {
  id: string
  webhookSubscriptionId: string
  eventType: string
  payload: string
  status: string
  httpStatusCode: number | null
  responseBody: string | null
  retryCount: number
  maxRetries: number
  createdAt: string
  deliveredAt: string | null
  lastAttemptAt: string | null
}

export interface WebhookEventListResponse {
  items: WebhookEventDto[]
  totalCount: number
}

// ── API Functions ───────────────────────────────────────────────────

const webhooksBase = `${apiBaseUrl}/webhooks`

export async function fetchWebhooks(signal?: AbortSignal): Promise<WebhookSubscriptionDto[]> {
  const res = await apiFetch(webhooksBase, { signal })
  if (!res.ok) throw new Error(`fetchWebhooks failed: ${res.status}`)
  return res.json()
}

export async function fetchWebhook(id: string, signal?: AbortSignal): Promise<WebhookSubscriptionDto> {
  const res = await apiFetch(`${webhooksBase}/${id}`, { signal })
  if (!res.ok) throw new Error(`fetchWebhook failed: ${res.status}`)
  return res.json()
}

export async function createWebhook(req: CreateWebhookRequest): Promise<WebhookSubscriptionDto> {
  const res = await apiFetch(webhooksBase, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(req),
  })
  if (!res.ok) throw new Error(`createWebhook failed: ${res.status}`)
  return res.json()
}

export async function updateWebhook(id: string, req: UpdateWebhookRequest): Promise<WebhookSubscriptionDto> {
  const res = await apiFetch(`${webhooksBase}/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(req),
  })
  if (!res.ok) throw new Error(`updateWebhook failed: ${res.status}`)
  return res.json()
}

export async function deleteWebhook(id: string): Promise<void> {
  const res = await apiFetch(`${webhooksBase}/${id}`, { method: 'DELETE' })
  if (!res.ok) throw new Error(`deleteWebhook failed: ${res.status}`)
}

export async function fetchWebhookEvents(
  id: string,
  page = 1,
  pageSize = 20,
  signal?: AbortSignal
): Promise<WebhookEventListResponse> {
  const res = await apiFetch(
    `${webhooksBase}/${id}/events?page=${page}&pageSize=${pageSize}`,
    { signal }
  )
  if (!res.ok) throw new Error(`fetchWebhookEvents failed: ${res.status}`)
  return res.json()
}

export async function retryWebhookEvent(subscriptionId: string, eventId: string): Promise<void> {
  const res = await apiFetch(`${webhooksBase}/${subscriptionId}/events/${eventId}/retry`, {
    method: 'POST',
  })
  if (!res.ok) throw new Error(`retryWebhookEvent failed: ${res.status}`)
}
