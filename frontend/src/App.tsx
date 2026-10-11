import { useCallback, useEffect, useState } from 'react'
import { describeError, getStats, isAbortError, listTickets, updateTicket } from './api'
import { StatusTabs } from './components/StatusTabs'
import { TicketForm } from './components/TicketForm'
import { TicketList } from './components/TicketList'
import type { Stats, Status, TicketPage } from './types'

const PAGE_SIZE = 10

export default function App() {
  const [statusFilter, setStatusFilter] = useState<Status | ''>('')
  const [page, setPage] = useState(1)
  const [result, setResult] = useState<TicketPage | null>(null)
  const [stats, setStats] = useState<Stats | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [reloadKey, setReloadKey] = useState(0)
  const [updatingId, setUpdatingId] = useState<number | null>(null)
  const [actionError, setActionError] = useState<string | null>(null)

  const reload = useCallback(() => setReloadKey((k) => k + 1), [])

  useEffect(() => {
    // Abort the previous request when filters change, so a slow, stale
    // response can never overwrite a newer one.
    const controller = new AbortController()
    setLoading(true)
    setError(null)

    Promise.all([
      listTickets({ status: statusFilter || undefined, page, limit: PAGE_SIZE, signal: controller.signal }),
      getStats(controller.signal),
    ])
      .then(([list, counts]) => {
        // The last ticket on this page moved/disappeared: step back one page.
        if (list.data.length === 0 && list.page > 1) {
          setPage(list.page - 1)
          return
        }
        setResult(list)
        setStats(counts)
      })
      .catch((err) => {
        if (!isAbortError(err)) setError(describeError(err))
      })
      .finally(() => {
        if (!controller.signal.aborted) setLoading(false)
      })

    return () => controller.abort()
  }, [statusFilter, page, reloadKey])

  function handleFilterChange(status: Status | '') {
    setStatusFilter(status)
    setPage(1)
  }

  // A new ticket is always the newest, so jump to page 1 to show it.
  function handleCreated() {
    setPage(1)
    reload()
  }

  async function handleStatusChange(id: number, status: Status) {
    setUpdatingId(id)
    setActionError(null)
    try {
      const updated = await updateTicket(id, { status })
      // Show the new status immediately, then reload so the list, counts and
      // active filter all reflect the change.
      setResult((prev) =>
        prev ? { ...prev, data: prev.data.map((t) => (t.id === updated.id ? updated : t)) } : prev,
      )
      reload()
    } catch (err) {
      setActionError(describeError(err))
    } finally {
      setUpdatingId(null)
    }
  }

  return (
    <main className="mx-auto max-w-6xl px-5 py-10 sm:px-8 sm:py-14">
      <h1
        className="text-4xl font-extrabold tracking-tight sm:text-5xl"
        style={{ fontStretch: '85%' }}
      >
        Mini Ticket Tracker
      </h1>

      <div className="mt-10 grid gap-12 lg:grid-cols-[19rem_minmax(0,1fr)] lg:gap-14">
        <TicketForm onCreated={handleCreated} />

        <div className="space-y-5">
          <StatusTabs stats={stats} value={statusFilter} onChange={handleFilterChange} />

          {error && (
            <div role="alert" className="flex items-center justify-between gap-4 border-l-4 border-high bg-surface px-4 py-3 text-sm">
              <span>{error}</span>
              <button type="button" onClick={reload} className="cursor-pointer font-semibold text-accent underline underline-offset-2">
                Retry
              </button>
            </div>
          )}

          {actionError && (
            <div role="alert" className="border-l-4 border-high bg-surface px-4 py-3 text-sm">
              Could not update ticket: {actionError}
            </div>
          )}

          <TicketList
            result={result}
            loading={loading}
            statusFilter={statusFilter}
            onPageChange={setPage}
            onStatusChange={handleStatusChange}
            updatingId={updatingId}
          />
        </div>
      </div>
    </main>
  )
}
