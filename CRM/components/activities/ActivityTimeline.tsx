'use client'

import { Activity } from '@/app/activities/actions'
import { formatDistanceToNow } from '@/lib/utils'

interface ActivityTimelineProps {
  activities: Activity[]
  showContact?: boolean
  showDeal?: boolean
}

const ACTIVITY_ICONS = {
  call: 'C',
  meeting: 'M',
  email: 'E',
  note: 'N',
  task: 'T'
}

const ACTIVITY_COLORS = {
  call: 'bg-blue-500 text-white',
  meeting: 'bg-purple-500 text-white',
  email: 'bg-green-500 text-white',
  note: 'bg-yellow-500 text-white',
  task: 'bg-indigo-500 text-white'
}

const STATUS_COLORS = {
  todo: 'bg-gray-100 text-gray-800',
  in_progress: 'bg-blue-100 text-blue-800',
  completed: 'bg-green-100 text-green-800',
  cancelled: 'bg-red-100 text-red-800'
}

export default function ActivityTimeline({ activities, showContact, showDeal }: ActivityTimelineProps) {
  if (activities.length === 0) {
    return (
      <div className="text-center py-8 text-gray-500">
        <p className="text-sm">No activities yet</p>
        <p className="text-xs mt-1">Activities will appear here as they are logged</p>
      </div>
    )
  }

  return (
    <div className="flow-root">
      <ul className="-mb-8">
        {activities.map((activity, idx) => (
          <li key={activity.id}>
            <div className="relative pb-8">
              {idx !== activities.length - 1 && (
                <span
                  className="absolute left-5 top-5 -ml-px h-full w-0.5 bg-gray-200"
                  aria-hidden="true"
                />
              )}
              <div className="relative flex items-start space-x-3">
                <div>
                  <div className={`
                    relative flex h-10 w-10 items-center justify-center rounded-lg
                    ${ACTIVITY_COLORS[activity.type]}
                  `}>
                    <span className="text-sm font-bold">{ACTIVITY_ICONS[activity.type]}</span>
                  </div>
                </div>
                <div className="min-w-0 flex-1">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-medium text-gray-900">{activity.subject}</span>
                      {activity.type === 'task' && activity.status && (
                        <span className={`
                          inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium
                          ${STATUS_COLORS[activity.status]}
                        `}>
                          {activity.status.replace('_', ' ')}
                        </span>
                      )}
                    </div>
                    <p className="text-sm text-gray-500">
                      {formatDistanceToNow(new Date(activity.created_at))} ago
                      {activity.duration_minutes && (
                        <span className="ml-2">• {activity.duration_minutes} min</span>
                      )}
                      {activity.due_date && activity.type === 'task' && (
                        <span className="ml-2">
                          • Due: {new Date(activity.due_date).toLocaleDateString()}
                        </span>
                      )}
                    </p>
                  </div>
                  {activity.description && (
                    <div className="mt-2 text-sm text-gray-700 bg-gray-50 rounded p-2">
                      {activity.description}
                    </div>
                  )}
                  {showContact && activity.contact && (
                    <div className="mt-1 text-xs text-gray-500">
                      Contact: {activity.contact.first_name} {activity.contact.last_name}
                      {activity.contact.company && ` • ${activity.contact.company}`}
                    </div>
                  )}
                  {showDeal && activity.deal && (
                    <div className="mt-1 text-xs text-gray-500">
                      Deal: {activity.deal.title} (${activity.deal.amount.toLocaleString()})
                    </div>
                  )}
                </div>
              </div>
            </div>
          </li>
        ))}
      </ul>
    </div>
  )
}
