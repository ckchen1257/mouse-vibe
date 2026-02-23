import { useCallback, useEffect, useState } from 'react'
import type { WebhookSubscriptionDto, WebhookEventDto } from '../../webhookApi'
import {
  fetchWebhooks,
  createWebhook,
  updateWebhook,
  deleteWebhook,
  fetchWebhookEvents,
  retryWebhookEvent,
} from '../../webhookApi'

const EVENT_TYPES = ['row.created', 'row.updated', 'row.deleted'] as const

function statusBadge(status: string) {
  const colors: Record<string, string> = {
    Pending: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/40 dark:text-yellow-300',
    Delivered: 'bg-green-100 text-green-800 dark:bg-green-900/40 dark:text-green-300',
    Failed: 'bg-red-100 text-red-800 dark:bg-red-900/40 dark:text-red-300',
    Exhausted: 'bg-slate-200 text-slate-700 dark:bg-slate-700 dark:text-slate-300',
  }
  return (
    <span className={`inline-block rounded-full px-2 py-0.5 text-xs font-medium ${colors[status] ?? ''}`}>
      {status}
    </span>
  )
}

export default function ManageWebhooksPage() {
  const [webhooks, setWebhooks] = useState<WebhookSubscriptionDto[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [editId, setEditId] = useState<string | null>(null)
  const [url, setUrl] = useState('')
  const [secret, setSecret] = useState('')
  const [description, setDescription] = useState('')
  const [selectedEvents, setSelectedEvents] = useState<Set<string>>(new Set(EVENT_TYPES))
  const [isActive, setIsActive] = useState(true)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Event log expand
  const [expandedId, setExpandedId] = useState<string | null>(null)
  const [events, setEvents] = useState<WebhookEventDto[]>([])
  const [eventsTotal, setEventsTotal] = useState(0)
  const [eventsPage, setEventsPage] = useState(1)
  const [eventsLoading, setEventsLoading] = useState(false)

  const loadWebhooks = useCallback(async (signal?: AbortSignal) => {
    try {
      setLoading(true)
      const data = await fetchWebhooks(signal)
      setWebhooks(data)
    } catch (e) {
      if (e instanceof DOMException && e.name === 'AbortError') return
      setError(e instanceof Error ? e.message : 'Failed to load webhooks')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    const controller = new AbortController()
    void loadWebhooks(controller.signal)
    return () => controller.abort()
  }, [loadWebhooks])

  const loadEvents = useCallback(async (subscriptionId: string, page: number, signal?: AbortSignal) => {
    try {
      setEventsLoading(true)
      const data = await fetchWebhookEvents(subscriptionId, page, 10, signal)
      setEvents(data.items)
      setEventsTotal(data.totalCount)
    } catch (e) {
      if (e instanceof DOMException && e.name === 'AbortError') return
    } finally {
      setEventsLoading(false)
    }
  }, [])

  const toggleExpand = (id: string) => {
    if (expandedId === id) {
      setExpandedId(null)
      setEvents([])
      return
    }
    setExpandedId(id)
    setEventsPage(1)
    void loadEvents(id, 1)
  }

  const handleEventsPage = (page: number) => {
    if (!expandedId) return
    setEventsPage(page)
    void loadEvents(expandedId, page)
  }

  const resetForm = () => {
    setUrl('')
    setSecret('')
    setDescription('')
    setSelectedEvents(new Set(EVENT_TYPES))
    setIsActive(true)
    setEditId(null)
    setShowForm(false)
    setError(null)
  }

  const handleEdit = (w: WebhookSubscriptionDto) => {
    setEditId(w.id)
    setUrl(w.url)
    setSecret('')
    setDescription(w.description ?? '')
    setSelectedEvents(new Set(w.events.split(',').map(e => e.trim()).filter(Boolean)))
    setIsActive(w.isActive)
    setShowForm(true)
    setError(null)
  }

  const handleSubmit = async () => {
    if (!url.trim() || selectedEvents.size === 0) return
    setBusy(true)
    setError(null)
    const eventsStr = [...selectedEvents].join(',')
    try {
      if (editId) {
        await updateWebhook(editId, {
          url,
          secret: secret || null,
          description: description || null,
          events: eventsStr,
          isActive,
        })
      } else {
        await createWebhook({
          url,
          secret: secret || null,
          description: description || null,
          events: eventsStr,
        })
      }
      resetForm()
      void loadWebhooks()
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed')
    } finally {
      setBusy(false)
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm('確定要刪除此 Webhook？')) return
    try {
      await deleteWebhook(id)
      if (expandedId === id) setExpandedId(null)
      void loadWebhooks()
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Delete failed')
    }
  }

  const handleRetry = async (subscriptionId: string, eventId: string) => {
    try {
      await retryWebhookEvent(subscriptionId, eventId)
      void loadEvents(subscriptionId, eventsPage)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Retry failed')
    }
  }

  const toggleEvent = (eventType: string) => {
    setSelectedEvents(prev => {
      const next = new Set(prev)
      if (next.has(eventType)) next.delete(eventType)
      else next.add(eventType)
      return next
    })
  }

  return (
    <>
      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-lg font-semibold">Webhook Subscriptions</h2>
        <button
          onClick={() => { resetForm(); setShowForm(v => !v) }}
          className="rounded bg-amber-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-amber-700"
        >
          {showForm ? 'Cancel' : '+ Add Webhook'}
        </button>
      </div>

      {error && (
        <div className="mb-4 rounded border border-red-300 bg-red-50 px-3 py-2 text-sm text-red-700 dark:border-red-700 dark:bg-red-950/30 dark:text-red-300">
          {error}
          <button onClick={() => setError(null)} className="ml-2 underline">Dismiss</button>
        </div>
      )}

      {showForm && (
        <div className="mb-4 rounded-lg border border-slate-200 bg-slate-50/60 p-4 dark:border-slate-700 dark:bg-slate-800/40">
          <div className="flex flex-wrap gap-3">
            <div className="flex min-w-[200px] flex-1 flex-col gap-1">
              <label className="text-xs font-medium text-slate-500 dark:text-slate-400">URL</label>
              <input
                className="rounded border border-slate-300 px-3 py-1.5 text-sm dark:border-slate-600 dark:bg-slate-800"
                placeholder="https://example.com/webhook"
                value={url}
                onChange={e => setUrl(e.target.value)}
              />
            </div>
            <div className="flex min-w-[200px] flex-1 flex-col gap-1">
              <label className="text-xs font-medium text-slate-500 dark:text-slate-400">
                Secret {editId ? '(leave blank to keep current)' : '(auto-generated if empty)'}
              </label>
              <input
                className="rounded border border-slate-300 px-3 py-1.5 text-sm dark:border-slate-600 dark:bg-slate-800"
                placeholder="HMAC signing secret"
                value={secret}
                onChange={e => setSecret(e.target.value)}
              />
            </div>
            <div className="flex min-w-[200px] flex-1 flex-col gap-1">
              <label className="text-xs font-medium text-slate-500 dark:text-slate-400">Description (optional)</label>
              <input
                className="rounded border border-slate-300 px-3 py-1.5 text-sm dark:border-slate-600 dark:bg-slate-800"
                placeholder="A short description"
                value={description}
                onChange={e => setDescription(e.target.value)}
              />
            </div>
          </div>

          <div className="mt-3">
            <label className="text-xs font-medium text-slate-500 dark:text-slate-400">Events</label>
            <div className="mt-1 flex gap-3">
              {EVENT_TYPES.map(et => (
                <label key={et} className="flex items-center gap-1.5 text-sm">
                  <input
                    type="checkbox"
                    checked={selectedEvents.has(et)}
                    onChange={() => toggleEvent(et)}
                    className="rounded"
                  />
                  {et}
                </label>
              ))}
            </div>
          </div>

          {editId && (
            <div className="mt-3">
              <label className="flex items-center gap-1.5 text-sm">
                <input
                  type="checkbox"
                  checked={isActive}
                  onChange={e => setIsActive(e.target.checked)}
                  className="rounded"
                />
                Active
              </label>
            </div>
          )}

          <div className="mt-3 flex justify-end">
            <button
              onClick={handleSubmit}
              disabled={busy}
              className="rounded bg-emerald-600 px-4 py-1.5 text-sm font-medium text-white hover:bg-emerald-700 disabled:opacity-50"
            >
              {busy ? 'Saving...' : editId ? 'Update' : 'Create'}
            </button>
          </div>
        </div>
      )}

      {loading && <p className="text-slate-500">Loading...</p>}

      {!loading && webhooks.length === 0 && (
        <p className="text-slate-500">No webhook subscriptions yet.</p>
      )}

      {!loading && webhooks.length > 0 && (
        <div className="space-y-2">
          {webhooks.map(w => (
            <div key={w.id} className="rounded-lg border border-slate-200 dark:border-slate-700">
              {/* Subscription row */}
              <div className="flex items-center gap-3 px-4 py-3">
                <button
                  onClick={() => toggleExpand(w.id)}
                  className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                  title="Toggle delivery log"
                >
                  {expandedId === w.id ? '▼' : '▶'}
                </button>

                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <span className="truncate font-mono text-sm">{w.url}</span>
                    {!w.isActive && (
                      <span className="rounded bg-slate-200 px-1.5 py-0.5 text-xs text-slate-600 dark:bg-slate-700 dark:text-slate-400">
                        Disabled
                      </span>
                    )}
                  </div>
                  <div className="mt-0.5 flex gap-2 text-xs text-slate-500">
                    <span>{w.events}</span>
                    <span>·</span>
                    <span>{w.description ?? '—'}</span>
                    <span>·</span>
                    <span>{new Date(w.createdAt).toLocaleDateString()}</span>
                  </div>
                </div>

                <div className="flex gap-1">
                  <button
                    onClick={() => handleEdit(w)}
                    className="rounded bg-slate-200 px-2 py-0.5 text-xs hover:bg-slate-300 dark:bg-slate-700 dark:hover:bg-slate-600"
                    title="Edit"
                  >
                    ✏️
                  </button>
                  <button
                    onClick={() => handleDelete(w.id)}
                    className="rounded bg-red-100 px-2 py-0.5 text-xs hover:bg-red-200 dark:bg-red-900/40 dark:hover:bg-red-800/50"
                    title="Delete"
                  >
                    🗑️
                  </button>
                </div>
              </div>

              {/* Expanded: delivery log */}
              {expandedId === w.id && (
                <div className="border-t border-slate-200 bg-slate-50/50 px-4 py-3 dark:border-slate-700 dark:bg-slate-800/30">
                  <h3 className="mb-2 text-sm font-medium text-slate-600 dark:text-slate-300">
                    Delivery Log ({eventsTotal} events)
                  </h3>

                  {eventsLoading && <p className="text-xs text-slate-500">Loading...</p>}

                  {!eventsLoading && events.length === 0 && (
                    <p className="text-xs text-slate-500">No events yet.</p>
                  )}

                  {!eventsLoading && events.length > 0 && (
                    <>
                      <div className="overflow-x-auto rounded border border-slate-200 dark:border-slate-700">
                        <table className="w-full text-left text-xs">
                          <thead>
                            <tr className="border-b border-slate-200 bg-slate-100 dark:border-slate-700 dark:bg-slate-800/60">
                              <th className="px-2 py-1.5 font-semibold text-slate-600 dark:text-slate-300">Event</th>
                              <th className="px-2 py-1.5 font-semibold text-slate-600 dark:text-slate-300">Status</th>
                              <th className="px-2 py-1.5 font-semibold text-slate-600 dark:text-slate-300">HTTP</th>
                              <th className="px-2 py-1.5 font-semibold text-slate-600 dark:text-slate-300">Retries</th>
                              <th className="px-2 py-1.5 font-semibold text-slate-600 dark:text-slate-300">Created</th>
                              <th className="px-2 py-1.5 font-semibold text-slate-500 dark:text-slate-400">Actions</th>
                            </tr>
                          </thead>
                          <tbody>
                            {events.map(ev => (
                              <tr key={ev.id} className="border-b border-slate-100 dark:border-slate-800">
                                <td className="px-2 py-1.5 font-mono">{ev.eventType}</td>
                                <td className="px-2 py-1.5">{statusBadge(ev.status)}</td>
                                <td className="px-2 py-1.5 text-slate-500">{ev.httpStatusCode ?? '—'}</td>
                                <td className="px-2 py-1.5 text-slate-500">{ev.retryCount}/{ev.maxRetries}</td>
                                <td className="px-2 py-1.5 text-slate-500">{new Date(ev.createdAt).toLocaleString()}</td>
                                <td className="px-2 py-1.5">
                                  {(ev.status === 'Failed' || ev.status === 'Exhausted') && (
                                    <button
                                      onClick={() => handleRetry(w.id, ev.id)}
                                      className="rounded bg-blue-100 px-2 py-0.5 text-xs text-blue-700 hover:bg-blue-200 dark:bg-blue-900/40 dark:text-blue-300 dark:hover:bg-blue-800/50"
                                    >
                                      Retry
                                    </button>
                                  )}
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>

                      {/* Pagination */}
                      {eventsTotal > 10 && (
                        <div className="mt-2 flex items-center gap-2 text-xs">
                          <button
                            disabled={eventsPage <= 1}
                            onClick={() => handleEventsPage(eventsPage - 1)}
                            className="rounded bg-slate-200 px-2 py-0.5 hover:bg-slate-300 disabled:opacity-50 dark:bg-slate-700 dark:hover:bg-slate-600"
                          >
                            ← Prev
                          </button>
                          <span className="text-slate-500">
                            Page {eventsPage} of {Math.ceil(eventsTotal / 10)}
                          </span>
                          <button
                            disabled={eventsPage >= Math.ceil(eventsTotal / 10)}
                            onClick={() => handleEventsPage(eventsPage + 1)}
                            className="rounded bg-slate-200 px-2 py-0.5 hover:bg-slate-300 disabled:opacity-50 dark:bg-slate-700 dark:hover:bg-slate-600"
                          >
                            Next →
                          </button>
                        </div>
                      )}
                    </>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </>
  )
}
