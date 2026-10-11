import type { Status } from '../types'
import { STATUSES, STATUS_LABELS } from '../types'

interface Props {
  ticketTitle: string
  value: Status
  disabled: boolean
  onChange: (status: Status) => void
}

export function StatusSelect({ ticketTitle, value, disabled, onChange }: Props) {
  return (
    <select
      aria-label={`Status of ${ticketTitle}`}
      value={value}
      disabled={disabled}
      onChange={(e) => onChange(e.target.value as Status)}
      className="rounded-md border border-gray-300 bg-white px-2 py-1 text-sm disabled:opacity-50"
    >
      {STATUSES.map((s) => (
        <option key={s} value={s}>
          {STATUS_LABELS[s]}
        </option>
      ))}
    </select>
  )
}
