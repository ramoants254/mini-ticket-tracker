import type { Priority, Status, TicketPage } from '../types'
import { PRIORITY_LABELS } from '../types'
import { StatusSelect } from './StatusSelect'

interface Props {
  result: TicketPage | null
  loading: boolean
  statusFilter: Status | ''
  onPageChange: (page: number) => void
  onStatusChange: (id: number, status: Status) => void
  updatingId: number | null
}

// Full class names (not built dynamically) so Tailwind can detect them.
const PRIORITY_BAR: Record<Priority, string> = {
  high: 'bg-high',
  medium: 'bg-medium',
  low: 'bg-low',
}
const PRIORITY_TEXT: Record<Priority, string> = {
  high: 'text-high',
  medium: 'text-medium',
  low: 'text-low',
}

const EMPTY_FILTERED: Record<Status, string> = {
  open: 'Nothing is open right now.',
  in_progress: 'Nothing is in progress right now.',
  closed: 'No tickets have been closed yet.',
}

const pageButton =
  'cursor-pointer rounded-sm border border-rule bg-surface px-3 py-1.5 font-medium hover:border-ink disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:border-rule'

export function TicketList({ result, loading, statusFilter, onPageChange, onStatusChange, updatingId }: Props) {
  const totalPages = result ? Math.max(1, Math.ceil(result.total / result.limit)) : 1

  return (
    <section aria-labelledby="tickets-heading">
      <h2 id="tickets-heading" className="sr-only">
        Tickets
      </h2>

      {!result ? (
        <p className="py-10 text-muted">{loading ? 'Loading tickets…' : 'No data.'}</p>
      ) : result.data.length === 0 ? (
        <p className="py-10 text-muted">
          {statusFilter ? EMPTY_FILTERED[statusFilter] : 'No tickets yet. Create the first one with the form.'}
        </p>
      ) : (
        <ul className={loading ? 'opacity-60' : ''} aria-busy={loading}>
          {result.data.map((ticket) => {
            const closed = ticket.status === 'closed'
            return (
              <li
                key={ticket.id}
                className="relative flex flex-wrap items-start justify-between gap-x-6 gap-y-3 border-b border-rule bg-surface py-4 pr-4 pl-6"
              >
                <span
                  aria-hidden="true"
                  className={`absolute inset-y-0 left-0 w-1.5 ${closed ? 'bg-rule' : PRIORITY_BAR[ticket.priority]}`}
                />
                <div className="min-w-0 flex-1 basis-64">
                  <p className={`text-lg leading-snug font-semibold break-words ${closed ? 'text-muted' : ''}`}>
                    {ticket.title}
                  </p>
                  {ticket.description && (
                    <p className="mt-1 max-w-prose break-words text-muted">{ticket.description}</p>
                  )}
                  <p className="mt-2 flex flex-wrap gap-x-4 text-sm text-muted">
                    <span className="tabular-nums">#{ticket.id}</span>
                    <span>
                      {new Date(ticket.createdAt).toLocaleString(undefined, {
                        day: 'numeric',
                        month: 'short',
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </span>
                    <span className={`font-semibold ${closed ? 'text-muted' : PRIORITY_TEXT[ticket.priority]}`}>
                      {PRIORITY_LABELS[ticket.priority]} priority
                    </span>
                  </p>
                </div>
                <StatusSelect
                  ticketTitle={ticket.title}
                  value={ticket.status}
                  disabled={updatingId === ticket.id}
                  onChange={(status) => onStatusChange(ticket.id, status)}
                />
              </li>
            )
          })}
        </ul>
      )}

      {result && result.total > result.limit && (
        <nav aria-label="Pagination" className="mt-5 flex items-center justify-between gap-4 text-sm">
          <button
            type="button"
            onClick={() => onPageChange(result.page - 1)}
            disabled={result.page <= 1 || loading}
            className={pageButton}
          >
            Previous
          </button>
          <span className="text-muted tabular-nums">
            Page {result.page} of {totalPages}
          </span>
          <button
            type="button"
            onClick={() => onPageChange(result.page + 1)}
            disabled={result.page >= totalPages || loading}
            className={pageButton}
          >
            Next
          </button>
        </nav>
      )}
    </section>
  )
}
