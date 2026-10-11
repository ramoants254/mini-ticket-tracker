export const STATUSES = ['open', 'in_progress', 'closed'] as const
export const PRIORITIES = ['low', 'medium', 'high'] as const

export type Status = (typeof STATUSES)[number]
export type Priority = (typeof PRIORITIES)[number]

export const STATUS_LABELS: Record<Status, string> = {
  open: 'Open',
  in_progress: 'In progress',
  closed: 'Closed',
}

export const PRIORITY_LABELS: Record<Priority, string> = {
  low: 'Low',
  medium: 'Medium',
  high: 'High',
}

export interface Ticket {
  id: number
  title: string
  description: string | null
  status: Status
  priority: Priority
  createdAt: string
}

export interface TicketPage {
  data: Ticket[]
  page: number
  limit: number
  total: number
}

export type Stats = Record<Status, number>
