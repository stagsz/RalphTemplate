'use client'

import { useTimer } from '@/components/providers/TimerContext'

/**
 * Format seconds into HH:MM:SS display format
 */
function formatElapsedTime(totalSeconds: number): string {
  const hours = Math.floor(totalSeconds / 3600)
  const minutes = Math.floor((totalSeconds % 3600) / 60)
  const seconds = totalSeconds % 60
  return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`
}

interface TimerProps {
  /** Optional label to display above the timer */
  label?: string
  /** Contact ID to associate with this timer session */
  contactId?: string
  /** Deal ID to associate with this timer session */
  dealId?: string
  /** Activity ID to associate with this timer session */
  activityId?: string
  /** Callback when timer is stopped, receives elapsed seconds */
  onStop?: (elapsedSeconds: number) => void
  /** Show compact version (smaller, no label) */
  compact?: boolean
}

export default function Timer({
  label,
  contactId,
  dealId,
  activityId,
  onStop,
  compact = false,
}: TimerProps) {
  const { isRunning, elapsedSeconds, startTimer, stopTimer, resetTimer } = useTimer()

  const handleStart = () => {
    startTimer({ contactId, dealId, activityId })
  }

  const handleStop = () => {
    const result = stopTimer()
    onStop?.(result.elapsedSeconds)
  }

  const handleReset = () => {
    resetTimer()
  }

  if (compact) {
    return (
      <div className="inline-flex items-center gap-2">
        <span
          className={`font-mono text-sm ${
            isRunning
              ? 'text-green-600 dark:text-green-400'
              : 'text-gray-600 dark:text-gray-400'
          }`}
        >
          {formatElapsedTime(elapsedSeconds)}
        </span>
        {isRunning ? (
          <button
            onClick={handleStop}
            className="p-1.5 rounded-md bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400 hover:bg-red-200 dark:hover:bg-red-900/50 transition"
            aria-label="Stop timer"
          >
            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
              <rect x="6" y="6" width="12" height="12" rx="1" />
            </svg>
          </button>
        ) : (
          <button
            onClick={handleStart}
            className="p-1.5 rounded-md bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400 hover:bg-green-200 dark:hover:bg-green-900/50 transition"
            aria-label="Start timer"
          >
            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
              <path d="M8 5v14l11-7z" />
            </svg>
          </button>
        )}
      </div>
    )
  }

  return (
    <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-4">
      {label && (
        <div className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
          {label}
        </div>
      )}

      <div className="flex items-center justify-between">
        {/* Timer Display */}
        <div
          className={`font-mono text-2xl font-semibold ${
            isRunning
              ? 'text-green-600 dark:text-green-400'
              : 'text-gray-900 dark:text-gray-100'
          }`}
        >
          {formatElapsedTime(elapsedSeconds)}
        </div>

        {/* Timer Controls */}
        <div className="flex items-center gap-2">
          {isRunning ? (
            <button
              onClick={handleStop}
              className="px-4 py-2 text-sm font-medium text-white bg-red-600 dark:bg-red-500 rounded-md hover:bg-red-700 dark:hover:bg-red-600 transition flex items-center gap-2"
              aria-label="Stop timer"
            >
              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                <rect x="6" y="6" width="12" height="12" rx="1" />
              </svg>
              Stop
            </button>
          ) : (
            <>
              <button
                onClick={handleStart}
                className="px-4 py-2 text-sm font-medium text-white bg-green-600 dark:bg-green-500 rounded-md hover:bg-green-700 dark:hover:bg-green-600 transition flex items-center gap-2"
                aria-label="Start timer"
              >
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M8 5v14l11-7z" />
                </svg>
                Start
              </button>
              {elapsedSeconds > 0 && (
                <button
                  onClick={handleReset}
                  className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md hover:bg-gray-50 dark:hover:bg-gray-600 transition"
                  aria-label="Reset timer"
                >
                  Reset
                </button>
              )}
            </>
          )}
        </div>
      </div>

      {/* Running indicator */}
      {isRunning && (
        <div className="mt-3 flex items-center gap-2 text-sm text-green-600 dark:text-green-400">
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500"></span>
          </span>
          Timer running...
        </div>
      )}
    </div>
  )
}
