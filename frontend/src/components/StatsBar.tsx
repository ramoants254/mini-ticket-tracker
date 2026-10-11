import type { Stats } from '../types'
import { STATUSES, STATUS_LABELS } from '../types'

export function StatsBar({ stats }: { stats: Stats | null }) {
  return (
    <dl className="grid grid-cols-3 gap-3">
      {STATUSES.map((status) => (
        <div key={status} className="rounded-lg border border-gray-200 bg-white p-4 text-center shadow-sm">
          <dt className="text-sm text-gray-600">{STATUS_LABELS[status]}</dt>
          <dd className="text-2xl font-semibold">{stats ? stats[status] : '–'}</dd>
        </div>
      ))}
    </dl>
  )
}
