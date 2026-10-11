import type { Stats, Status } from '../types'
import { STATUSES, STATUS_LABELS } from '../types'

interface Props {
  stats: Stats | null
  value: Status | ''
  onChange: (status: Status | '') => void
}

// The status counts double as the list filter, so there is one control instead of
// a stats row plus a separate dropdown.
export function StatusTabs({ stats, value, onChange }: Props) {
  const total = stats ? STATUSES.reduce((sum, s) => sum + stats[s], 0) : null
  const tabs: { value: Status | ''; label: string; count: number | null }[] = [
    { value: '', label: 'All', count: total },
    ...STATUSES.map((s) => ({ value: s, label: STATUS_LABELS[s], count: stats ? stats[s] : null })),
  ]

  return (
    <div role="group" aria-label="Filter by status" className="flex flex-wrap gap-x-4 border-b sm:gap-x-7 border-rule">
      {tabs.map((tab) => {
        const active = tab.value === value
        return (
          <button
            key={tab.label}
            type="button"
            aria-pressed={active}
            onClick={() => onChange(tab.value)}
            className={`-mb-px cursor-pointer border-b-[3px] pt-1 pb-3 text-base font-semibold sm:text-lg ${
              active ? 'border-accent text-ink' : 'border-transparent text-muted hover:text-ink'
            }`}
          >
            {tab.label}
            <span className="ml-1.5 font-normal sm:ml-2 text-muted tabular-nums">{tab.count ?? '–'}</span>
          </button>
        )
      })}
    </div>
  )
}
