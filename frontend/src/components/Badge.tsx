import type { Priority } from '../types'
import { PRIORITY_LABELS } from '../types'

// Full class names (not built dynamically) so Tailwind can detect them.
const PRIORITY_STYLES: Record<Priority, string> = {
  low: 'bg-gray-100 text-gray-700',
  medium: 'bg-orange-100 text-orange-800',
  high: 'bg-red-100 text-red-800',
}

const BASE = 'inline-block rounded-full px-2.5 py-0.5 text-xs font-medium'

export function PriorityBadge({ priority }: { priority: Priority }) {
  return <span className={`${BASE} ${PRIORITY_STYLES[priority]}`}>{PRIORITY_LABELS[priority]} priority</span>
}
