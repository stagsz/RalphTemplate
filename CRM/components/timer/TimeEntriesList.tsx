'use client'

import { useState } from 'react'
import TimeEntryForm from './TimeEntryForm'

interface TimeEntry {
  id: string
  user_id: string
  contact_id?: string
  deal_id?: string
  activity_id?: string
  duration_minutes: number
  entry_date: string
  notes?: string
  is_billable: boolean
  status: 'draft' | 'submitted' | 'approved' | 'rejected'
  created_at: string
  user?: { id: string; email: string }
  activity?: { id: string; subject: string; type: string }
}

interface TimeEntriesListProps {
  entries: TimeEntry[]
  showActivity?: boolean
}

const STATUS_COLORS = {
  draft: 'bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-200',
  submitted: 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-800 dark:text-yellow-200',
  approved: 'bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-200',
  rejected: 'bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-200'
}

const ACTIVITY_TYPE_LABELS = {
  call: 'Call',
  meeting: 'Meeting',
  email: 'Email',
  note: 'Note',
  task: 'Task'
}

function formatDuration(minutes: number): string {
  const hours = Math.floor(minutes / 60)
  const mins = minutes % 60
  if (hours === 0) return `${mins}m`
  if (mins === 0) return `${hours}h`
  return `${hours}h ${mins}m`
}

export default function TimeEntriesList({ entries, showActivity = true }: TimeEntriesListProps) {
  const [editingEntry, setEditingEntry] = useState<TimeEntry | null>(null)

  const handleEditSuccess = () => {
    setEditingEntry(null)
  }

  if (entries.length === 0) {
    return (
      <div className="text-center py-6 text-gray-500 dark:text-gray-400">
        <p className="text-sm">No time entries yet</p>
        <p className="text-xs mt-1">Time entries will appear here as they are logged</p>
      </div>
    )
  }

  // Calculate totals
  const totalMinutes = entries.reduce((sum, e) => sum + e.duration_minutes, 0)
  const billableMinutes = entries.reduce((sum, e) => e.is_billable ? sum + e.duration_minutes : sum, 0)

  return (
    <>
      {/* Summary */}
      <div className="flex gap-4 text-sm text-gray-600 dark:text-gray-400 mb-4 pb-3 border-b border-gray-200 dark:border-gray-700">
        <span>
          Total: <strong className="text-gray-900 dark:text-gray-100">{formatDuration(totalMinutes)}</strong>
        </span>
        <span>
          Billable: <strong className="text-green-600 dark:text-green-400">{formatDuration(billableMinutes)}</strong>
        </span>
      </div>

      {/* Entries List */}
      <div className="space-y-3">
        {entries.map((entry) => {
          const canEdit = entry.status === 'draft' || entry.status === 'rejected'

          return (
            <div
              key={entry.id}
              className={`
                flex items-start justify-between p-3 rounded-lg border
                ${canEdit
                  ? 'border-gray-200 dark:border-gray-700 hover:border-blue-300 dark:hover:border-blue-600 hover:bg-gray-50 dark:hover:bg-gray-700/50 cursor-pointer'
                  : 'border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-700/30'
                }
              `}
              onClick={() => canEdit && setEditingEntry(entry)}
              role={canEdit ? 'button' : undefined}
              tabIndex={canEdit ? 0 : undefined}
              onKeyDown={(e) => canEdit && e.key === 'Enter' && setEditingEntry(entry)}
            >
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="font-medium text-gray-900 dark:text-gray-100">
                    {formatDuration(entry.duration_minutes)}
                  </span>

                  {entry.is_billable && (
                    <span className="text-xs text-green-600 dark:text-green-400 font-medium">
                      $
                    </span>
                  )}

                  <span className={`
                    inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium
                    ${STATUS_COLORS[entry.status]}
                  `}>
                    {entry.status}
                  </span>
                </div>

                <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                  {new Date(entry.entry_date).toLocaleDateString()}
                  {showActivity && entry.activity && (
                    <span className="ml-2">
                      • {ACTIVITY_TYPE_LABELS[entry.activity.type as keyof typeof ACTIVITY_TYPE_LABELS] || entry.activity.type}: {entry.activity.subject}
                    </span>
                  )}
                </p>

                {entry.notes && (
                  <p className="text-sm text-gray-600 dark:text-gray-300 mt-1 truncate">
                    {entry.notes}
                  </p>
                )}
              </div>

              {canEdit && (
                <div className="ml-3 flex-shrink-0 text-gray-400 dark:text-gray-500">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                  </svg>
                </div>
              )}
            </div>
          )
        })}
      </div>

      {/* Edit Modal */}
      {editingEntry && (
        <div className="fixed inset-0 bg-gray-500 bg-opacity-75 dark:bg-gray-900 dark:bg-opacity-75 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 max-w-md w-full mx-4">
            <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-4">
              Edit Time Entry
            </h3>
            <TimeEntryForm
              mode="edit"
              timeEntry={{
                id: editingEntry.id,
                duration_minutes: editingEntry.duration_minutes,
                entry_date: editingEntry.entry_date,
                notes: editingEntry.notes,
                is_billable: editingEntry.is_billable
              }}
              contactId={editingEntry.contact_id}
              dealId={editingEntry.deal_id}
              activityId={editingEntry.activity_id}
              onSuccess={handleEditSuccess}
              onCancel={() => setEditingEntry(null)}
            />
          </div>
        </div>
      )}
    </>
  )
}
