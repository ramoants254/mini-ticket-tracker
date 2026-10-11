import { useState } from 'react'
import type { FormEvent } from 'react'
import { createTicket, describeError } from '../api'
import type { Priority } from '../types'
import { PRIORITIES, PRIORITY_LABELS } from '../types'

const FIELD =
  'mt-1.5 block w-full rounded-sm border border-rule bg-surface px-3 py-2 placeholder:text-muted/70'

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
    <section aria-labelledby="new-ticket-heading" className="lg:sticky lg:top-8">
      <h2 id="new-ticket-heading" className="border-b-2 border-ink pb-2 text-2xl font-bold">
        New ticket
      </h2>
      <form onSubmit={handleSubmit} className="mt-5 space-y-5">
        <label className="block font-semibold">
          Title
          <input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            required
            maxLength={255}
            placeholder="What needs fixing?"
            className={`${FIELD} font-normal`}
          />
        </label>
        <label className="block font-semibold">
          Description <span className="font-normal text-muted">(optional)</span>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={4}
            maxLength={5000}
            className={`${FIELD} font-normal`}
          />
        </label>

        <fieldset>
          <legend className="font-semibold">Priority</legend>
          <div className="mt-1.5 flex overflow-hidden rounded-sm border border-rule bg-surface">
            {PRIORITIES.map((p) => (
              <label key={p} className="flex-1 border-r border-rule last:border-r-0">
                <input
                  type="radio"
                  name="priority"
                  value={p}
                  checked={priority === p}
                  onChange={() => setPriority(p)}
                  className="peer sr-only"
                />
                <span className="block cursor-pointer px-3 py-2 text-center text-sm font-medium peer-checked:bg-ink peer-checked:text-surface peer-focus-visible:outline-2 peer-focus-visible:-outline-offset-4 peer-focus-visible:outline-accent">
                  {PRIORITY_LABELS[p]}
                </span>
              </label>
            ))}
          </div>
        </fieldset>

        {error && (
          <p role="alert" className="border-l-4 border-high bg-surface px-3 py-2 text-sm">
            {error}
          </p>
        )}

        <button
          type="submit"
          disabled={submitting}
          className="w-full cursor-pointer rounded-sm bg-accent px-4 py-2.5 font-semibold text-white hover:bg-accent-deep disabled:cursor-wait disabled:opacity-60"
        >
          {submitting ? 'Creating…' : 'Create ticket'}
        </button>
      </form>
    </section>
  )
}
