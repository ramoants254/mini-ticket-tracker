import type { Status } from '../types'
import { STATUSES, STATUS_LABELS } from '../types'

interface Props {
  ticketTitle: string
  value: Status
  disabled: boolean
  onChange: (status: Status) => void
}

const TEXT: Record<Status, string> = {
  open: 'text-ink',
  in_progress: 'text-accent',
  closed: 'text-muted',
}

export function StatusSelect({ ticketTitle, value, disabled, onChange }: Props) {
  return (
    <select
      aria-label={`Status of ${ticketTitle}`}
      value={value}
      disabled={disabled}
      onChange={(e) => onChange(e.target.value as Status)}
      className={`cursor-pointer rounded-sm border border-rule bg-surface px-2 py-1.5 text-sm font-semibold disabled:cursor-wait disabled:opacity-50 ${TEXT[value]}`}
    >
      {STATUSES.map((s) => (
        <option key={s} value={s}>
          {STATUS_LABELS[s]}
        </option>
      ))}
    </select>
  )
}
