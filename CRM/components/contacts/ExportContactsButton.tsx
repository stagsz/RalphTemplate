'use client'

import { useState } from 'react'
import { exportContactsToCSV } from '@/app/contacts/actions'

interface ExportContactsButtonProps {
  searchParams: {
    search?: string
    status?: string
    owner?: string
  }
}

export default function ExportContactsButton({ searchParams }: ExportContactsButtonProps) {
  const [isExporting, setIsExporting] = useState(false)
  const [error, setError] = useState<string>('')

  const handleExport = async () => {
    setIsExporting(true)
    setError('')

    try {
      const result = await exportContactsToCSV({
        search: searchParams.search,
        status: searchParams.status,
        owner: searchParams.owner
      })

      if (result.error) {
        setError(result.error)
        setTimeout(() => setError(''), 3000)
      } else if (result.data) {
        // Create blob and download
        const blob = new Blob([result.data.csv], { type: 'text/csv;charset=utf-8;' })
        const link = document.createElement('a')
        const url = URL.createObjectURL(blob)

        link.setAttribute('href', url)
        link.setAttribute('download', `contacts-${new Date().toISOString().split('T')[0]}.csv`)
        link.style.visibility = 'hidden'

        document.body.appendChild(link)
        link.click()
        document.body.removeChild(link)

        URL.revokeObjectURL(url)
      }
    } catch (err) {
      setError('Failed to export contacts')
      setTimeout(() => setError(''), 3000)
    } finally {
      setIsExporting(false)
    }
  }

  return (
    <div className="relative">
      <button
        onClick={handleExport}
        disabled={isExporting}
        className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
      >
        <svg className="h-5 w-5 mr-2 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
        </svg>
        {isExporting ? 'Exporting...' : 'Export CSV'}
      </button>

      {error && (
        <div className="absolute top-full mt-2 right-0 w-64 bg-red-50 border border-red-200 rounded-md p-3 shadow-lg z-10">
          <p className="text-sm text-red-800">{error}</p>
        </div>
      )}
    </div>
  )
}
