import { useCallback, useEffect, useState } from 'react'
import { describeError, getStats, isAbortError, listTickets, updateTicket } from './api'
import { StatsBar } from './components/StatsBar'
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
    <div className="min-h-screen bg-gray-50 text-gray-900">
      <main className="mx-auto max-w-3xl space-y-6 px-4 py-8">
        <h1 className="text-2xl font-bold">Mini Ticket Tracker</h1>

        <StatsBar stats={stats} />

        {error && (
          <div role="alert" className="flex items-center justify-between gap-3 rounded-md bg-red-50 p-3 text-sm text-red-800">
            <span>{error}</span>
            <button type="button" onClick={reload} className="rounded-md border border-red-300 px-3 py-1 font-medium">
              Retry
            </button>
          </div>
        )}

        <TicketForm onCreated={handleCreated} />

        {actionError && (
          <div role="alert" className="rounded-md bg-red-50 p-3 text-sm text-red-800">
            Could not update ticket: {actionError}
          </div>
        )}

        <TicketList
          result={result}
          loading={loading}
          statusFilter={statusFilter}
          onFilterChange={handleFilterChange}
          onPageChange={setPage}
          onStatusChange={handleStatusChange}
          updatingId={updatingId}
        />
      </main>
    </div>
  )
}
