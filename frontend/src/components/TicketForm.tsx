import { useState } from 'react'
import type { FormEvent } from 'react'
import { createTicket, describeError } from '../api'
import type { Priority } from '../types'
import { PRIORITIES, PRIORITY_LABELS } from '../types'

const FIELD = 'mt-1 w-full rounded-md border border-gray-300 bg-white px-3 py-2'

export function TicketForm({ onCreated }: { onCreated: () => void }) {
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [priority, setPriority] = useState<Priority>('medium')
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    setSubmitting(true)
    setError(null)
    try {
      await createTicket({
        title,
        description: description.trim() || undefined,
        priority,
      })
      setTitle('')
      setDescription('')
      setPriority('medium')
      onCreated()
    } catch (err) {
      // Keep what the user typed so nothing is lost on failure.
      setError(describeError(err))
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <section aria-labelledby="new-ticket-heading" className="rounded-lg border border-gray-200 bg-white p-4 shadow-sm">
      <h2 id="new-ticket-heading" className="mb-3 text-lg font-semibold">
        New ticket
      </h2>
      <form onSubmit={handleSubmit} className="space-y-3">
        <label className="block text-sm font-medium">
          Title
          <input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            required
            maxLength={255}
            className={FIELD}
          />
        </label>
        <label className="block text-sm font-medium">
          Description <span className="font-normal text-gray-500">(optional)</span>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={3}
            maxLength={5000}
            className={FIELD}
          />
        </label>
        <label className="block text-sm font-medium sm:max-w-xs">
          Priority
          <select value={priority} onChange={(e) => setPriority(e.target.value as Priority)} className={FIELD}>
            {PRIORITIES.map((p) => (
              <option key={p} value={p}>
                {PRIORITY_LABELS[p]}
              </option>
            ))}
          </select>
        </label>

        {error && (
          <p role="alert" className="rounded-md bg-red-50 p-2 text-sm text-red-800">
            {error}
          </p>
        )}

        <button
          type="submit"
          disabled={submitting}
          className="rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {submitting ? 'Creating…' : 'Create ticket'}
        </button>
      </form>
    </section>
  )
}
