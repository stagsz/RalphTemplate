import { getUserTasks } from '@/app/activities/actions'
import Link from 'next/link'
import { formatDate, isPast } from '@/lib/utils'

const STATUS_COLORS = {
  todo: 'bg-gray-100 text-gray-800',
  in_progress: 'bg-blue-100 text-blue-800',
  completed: 'bg-green-100 text-green-800',
  cancelled: 'bg-red-100 text-red-800'
}

const PRIORITY_COLORS = {
  low: 'bg-gray-100 text-gray-600',
  medium: 'bg-yellow-100 text-yellow-800',
  high: 'bg-red-100 text-red-800'
}

export default async function TasksPage({
  searchParams
}: {
  searchParams: Promise<{ status?: string; view?: string }>
}) {
  const params = await searchParams
  const statusFilter = params.status as any
  const view = params.view || 'all'

  // Fetch tasks based on view
  const tasks = view === 'overdue'
    ? await getUserTasks({ overdue: true })
    : statusFilter
    ? await getUserTasks({ status: statusFilter })
    : await getUserTasks()

  // Group tasks by status for Kanban view
  const tasksByStatus = {
    todo: tasks.filter(t => t.status === 'todo'),
    in_progress: tasks.filter(t => t.status === 'in_progress'),
    completed: tasks.filter(t => t.status === 'completed'),
    cancelled: tasks.filter(t => t.status === 'cancelled')
  }

  const overdueCount = tasks.filter(t =>
    t.due_date && isPast(t.due_date) && t.status !== 'completed'
  ).length

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">My Tasks</h1>
            <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
              Manage your tasks and to-dos ({tasks.length} total)
              {overdueCount > 0 && (
                <span className="ml-2 text-red-600 dark:text-red-400 font-medium">
                  • {overdueCount} overdue
                </span>
              )}
            </p>
          </div>
        </div>

        {/* View Toggle */}
        <div className="mb-6 flex gap-2">
          <Link
            href="/tasks?view=all"
            className={`px-4 py-2 text-sm font-medium rounded-md ${
              view === 'all'
                ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300'
                : 'bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700'
            }`}
          >
            All Tasks
          </Link>
          <Link
            href="/tasks?view=overdue"
            className={`px-4 py-2 text-sm font-medium rounded-md ${
              view === 'overdue'
                ? 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300'
                : 'bg-white text-gray-700 hover:bg-gray-50'
            }`}
          >
            Overdue ({overdueCount})
          </Link>
        </div>

        {/* Kanban Board */}
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
          {/* To Do Column */}
          <div className="bg-white dark:bg-gray-800 rounded-lg p-4 shadow">
            <div className="mb-4">
              <h3 className="font-medium text-gray-900 dark:text-gray-100">To Do</h3>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                {tasksByStatus.todo.length} tasks
              </p>
            </div>
            <div className="space-y-3">
              {tasksByStatus.todo.map(task => (
                <TaskCard key={task.id} task={task} />
              ))}
              {tasksByStatus.todo.length === 0 && (
                <p className="text-sm text-gray-400 dark:text-gray-500 text-center py-4">
                  No tasks
                </p>
              )}
            </div>
          </div>

          {/* In Progress Column */}
          <div className="bg-white dark:bg-gray-800 rounded-lg p-4 shadow">
            <div className="mb-4">
              <h3 className="font-medium text-blue-900 dark:text-blue-400">In Progress</h3>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                {tasksByStatus.in_progress.length} tasks
              </p>
            </div>
            <div className="space-y-3">
              {tasksByStatus.in_progress.map(task => (
                <TaskCard key={task.id} task={task} />
              ))}
              {tasksByStatus.in_progress.length === 0 && (
                <p className="text-sm text-gray-400 dark:text-gray-500 text-center py-4">
                  No tasks
                </p>
              )}
            </div>
          </div>

          {/* Completed Column */}
          <div className="bg-white dark:bg-gray-800 rounded-lg p-4 shadow">
            <div className="mb-4">
              <h3 className="font-medium text-green-900 dark:text-green-400">Completed</h3>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                {tasksByStatus.completed.length} tasks
              </p>
            </div>
            <div className="space-y-3">
              {tasksByStatus.completed.map(task => (
                <TaskCard key={task.id} task={task} />
              ))}
              {tasksByStatus.completed.length === 0 && (
                <p className="text-sm text-gray-400 text-center py-4">
                  No tasks
                </p>
              )}
            </div>
          </div>

          {/* Cancelled Column */}
          <div className="bg-white dark:bg-gray-800 rounded-lg p-4 shadow">
            <div className="mb-4">
              <h3 className="font-medium text-red-900 dark:text-red-400">Cancelled</h3>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                {tasksByStatus.cancelled.length} tasks
              </p>
            </div>
            <div className="space-y-3">
              {tasksByStatus.cancelled.map(task => (
                <TaskCard key={task.id} task={task} />
              ))}
              {tasksByStatus.cancelled.length === 0 && (
                <p className="text-sm text-gray-400 dark:text-gray-500 text-center py-4">
                  No tasks
                </p>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

function TaskCard({ task }: { task: any }) {
  const isOverdue = task.due_date && isPast(task.due_date) && task.status !== 'completed'

  return (
    <div className="border border-gray-200 rounded-lg p-3 hover:shadow-md transition-shadow">
      <div className="flex items-start justify-between gap-2 mb-2">
        <h4 className="text-sm font-medium text-gray-900 flex-1">
          {task.subject}
        </h4>
        <span className={`
          inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium
          ${PRIORITY_COLORS[task.priority as keyof typeof PRIORITY_COLORS]}
        `}>
          {task.priority}
        </span>
      </div>

      {task.description && (
        <p className="text-xs text-gray-600 mb-2 line-clamp-2">
          {task.description}
        </p>
      )}

      {task.due_date && (
        <div className={`text-xs mb-2 ${isOverdue ? 'text-red-600 font-medium' : 'text-gray-500'}`}>
          📅 Due: {formatDate(task.due_date)}
          {isOverdue && ' (Overdue)'}
        </div>
      )}

      {task.contact && (
        <Link
          href={`/contacts/${task.contact.id}`}
          className="text-xs text-blue-600 hover:text-blue-800 block mb-1"
        >
          Contact: {task.contact.first_name} {task.contact.last_name}
        </Link>
      )}

      {task.deal && (
        <Link
          href={`/deals/${task.deal.id}`}
          className="text-xs text-blue-600 hover:text-blue-800 block"
        >
          Deal: {task.deal.title}
        </Link>
      )}
    </div>
  )
}