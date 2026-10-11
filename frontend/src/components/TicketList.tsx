import type { Status, TicketPage } from '../types'
import { STATUSES, STATUS_LABELS } from '../types'
import { PriorityBadge } from './Badge'
import { StatusSelect } from './StatusSelect'

interface Props {
  result: TicketPage | null
  loading: boolean
  statusFilter: Status | ''
  onFilterChange: (status: Status | '') => void
  onPageChange: (page: number) => void
  onStatusChange: (id: number, status: Status) => void
  updatingId: number | null
}

export function TicketList({ result, loading, statusFilter, onFilterChange, onPageChange, onStatusChange, updatingId }: Props) {
  const totalPages = result ? Math.max(1, Math.ceil(result.total / result.limit)) : 1

  return (
    <section aria-labelledby="tickets-heading" className="rounded-lg border border-gray-200 bg-white shadow-sm">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-gray-200 p-4">
        <h2 id="tickets-heading" className="text-lg font-semibold">
          Tickets
        </h2>
        <label className="flex items-center gap-2 text-sm text-gray-700">
          Filter by status
          <select
            value={statusFilter}
            onChange={(e) => onFilterChange(e.target.value as Status | '')}
            className="rounded-md border border-gray-300 bg-white px-2 py-1"
          >
            <option value="">All</option>
            {STATUSES.map((s) => (
              <option key={s} value={s}>
                {STATUS_LABELS[s]}
              </option>
            ))}
          </select>
        </label>
      </div>

      {!result ? (
        <p className="p-6 text-center text-gray-500">{loading ? 'Loading tickets…' : 'No data.'}</p>
      ) : result.data.length === 0 ? (
        <p className="p-6 text-center text-gray-500">
          {statusFilter ? 'No tickets with this status.' : 'No tickets yet. Create the first one!'}
        </p>
      ) : (
        <ul className={`divide-y divide-gray-100 ${loading ? 'opacity-60' : ''}`} aria-busy={loading}>
          {result.data.map((ticket) => (
            <li key={ticket.id} className="flex flex-wrap items-start justify-between gap-3 p-4">
              <div className="min-w-0 flex-1">
                <p className="font-medium break-words">{ticket.title}</p>
                {ticket.description && (
                  <p className="mt-0.5 text-sm break-words text-gray-600">{ticket.description}</p>
                )}
                <p className="mt-1 text-xs text-gray-500">
                  #{ticket.id} · {new Date(ticket.createdAt).toLocaleString()}
                </p>
              </div>
              <div className="flex flex-wrap items-center gap-2">
                <PriorityBadge priority={ticket.priority} />
                <StatusSelect
                  ticketTitle={ticket.title}
                  value={ticket.status}
                  disabled={updatingId === ticket.id}
                  onChange={(status) => onStatusChange(ticket.id, status)}
                />
              </div>
            </li>
          ))}
        </ul>
      )}

      {result && result.total > 0 && (
        <nav
          aria-label="Pagination"
          className="flex items-center justify-between border-t border-gray-200 p-4 text-sm text-gray-700"
        >
          <button
            type="button"
            onClick={() => onPageChange(result.page - 1)}
            disabled={result.page <= 1 || loading}
            className="rounded-md border border-gray-300 px-3 py-1 disabled:cursor-not-allowed disabled:opacity-40"
          >
            Previous
          </button>
          <span>
            Page {result.page} of {totalPages} · {result.total} ticket{result.total === 1 ? '' : 's'}
          </span>
          <button
            type="button"
            onClick={() => onPageChange(result.page + 1)}
            disabled={result.page >= totalPages || loading}
            className="rounded-md border border-gray-300 px-3 py-1 disabled:cursor-not-allowed disabled:opacity-40"
          >
            Next
          </button>
        </nav>
      )}
    </section>
  )
}
