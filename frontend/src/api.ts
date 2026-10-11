import type { Priority, Stats, Status, Ticket, TicketPage } from './types'

// Dev: '/api' is proxied to the Express API by Vite (see vite.config.ts).
// Production/other hosts: set VITE_API_URL to the API's base URL.
const BASE = import.meta.env.VITE_API_URL ?? '/api'

export interface ErrorDetail {
  path: string
  message: string
}

export class ApiError extends Error {
  details: ErrorDetail[]

  constructor(message: string, details: ErrorDetail[] = []) {
    super(message)
    this.name = 'ApiError'
    this.details = details
  }
}

export function isAbortError(err: unknown): boolean {
  return err instanceof DOMException && err.name === 'AbortError'
}

/** Turns any thrown value into a single human-readable message. */
export function describeError(err: unknown): string {
  if (err instanceof ApiError) {
    if (err.details.length === 0) return err.message
    return err.details.map((d) => (d.path ? `${d.path}: ${d.message}` : d.message)).join('; ')
  }
  return 'Something went wrong. Please try again.'
}

async function request<T>(path: string, init: RequestInit = {}): Promise<T> {
  let res: Response
  try {
    res = await fetch(`${BASE}${path}`, {
      ...init,
      headers: { 'Content-Type': 'application/json', ...init.headers },
    })
  } catch (err) {
    if (isAbortError(err)) throw err
    throw new ApiError('Cannot reach the server. Is the API running?')
  }

  if (!res.ok) {
    let body: { error?: { message?: string; details?: ErrorDetail[] } } | null = null
    try {
      body = await res.json()
    } catch {
      // Non-JSON error body; fall through to the generic message.
    }
    throw new ApiError(body?.error?.message ?? `Request failed (${res.status})`, body?.error?.details ?? [])
  }

  return res.json() as Promise<T>
}

export interface ListParams {
  status?: Status
  page: number
  limit: number
  signal?: AbortSignal
}

export function listTickets({ status, page, limit, signal }: ListParams): Promise<TicketPage> {
  const params = new URLSearchParams({ page: String(page), limit: String(limit) })
  if (status) params.set('status', status)
  return request<TicketPage>(`/tickets?${params}`, { signal })
}

export function getStats(signal?: AbortSignal): Promise<Stats> {
  return request<Stats>('/tickets/stats', { signal })
}

export interface CreateTicketInput {
  title: string
  description?: string
  priority: Priority
}

export function createTicket(input: CreateTicketInput): Promise<Ticket> {
  return request<Ticket>('/tickets', { method: 'POST', body: JSON.stringify(input) })
}

export function updateTicket(id: number, patch: { status?: Status; priority?: Priority }): Promise<Ticket> {
  return request<Ticket>(`/tickets/${id}`, { method: 'PATCH', body: JSON.stringify(patch) })
}
