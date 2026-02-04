'use client'

import { useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { importContactsFromCSV } from '@/app/contacts/actions'

interface CSVRow {
  [key: string]: string
}

interface FieldMapping {
  [csvColumn: string]: string // Maps CSV column to contact field
}

interface ImportResult {
  success: number
  failed: number
  duplicates: number
  errors: Array<{ row: number; error: string }>
}

const CONTACT_FIELDS = [
  { value: '', label: '-- Skip this column --' },
  { value: 'first_name', label: 'First Name *' },
  { value: 'last_name', label: 'Last Name *' },
  { value: 'email', label: 'Email *' },
  { value: 'phone', label: 'Phone' },
  { value: 'company', label: 'Company' },
  { value: 'title', label: 'Title' },
  { value: 'status', label: 'Status (lead/customer)' },
]

export default function CSVImportWizard() {
  const router = useRouter()
  const [step, setStep] = useState<'upload' | 'map' | 'review' | 'complete'>('upload')
  const [file, setFile] = useState<File | null>(null)
  const [csvData, setCSVData] = useState<CSVRow[]>([])
  const [csvHeaders, setCSVHeaders] = useState<string[]>([])
  const [fieldMapping, setFieldMapping] = useState<FieldMapping>({})
  const [isImporting, setIsImporting] = useState(false)
  const [importResult, setImportResult] = useState<ImportResult | null>(null)
  const [error, setError] = useState<string>('')
  const [isDragging, setIsDragging] = useState(false)

  const parseCSV = useCallback((text: string): { headers: string[]; rows: CSVRow[] } => {
    const lines = text.split('\n').filter(line => line.trim())
    if (lines.length === 0) {
      throw new Error('CSV file is empty')
    }

    const headers = lines[0].split(',').map(h => h.trim().replace(/^"|"$/g, ''))
    const rows: CSVRow[] = []

    for (let i = 1; i < lines.length; i++) {
      const values = lines[i].split(',').map(v => v.trim().replace(/^"|"$/g, ''))
      const row: CSVRow = {}
      headers.forEach((header, index) => {
        row[header] = values[index] || ''
      })
      rows.push(row)
    }

    return { headers, rows }
  }, [])

  const handleFileSelect = useCallback((selectedFile: File) => {
    if (!selectedFile.name.endsWith('.csv')) {
      setError('Please select a CSV file')
      return
    }

    setFile(selectedFile)
    setError('')

    const reader = new FileReader()
    reader.onload = (e) => {
      try {
        const text = e.target?.result as string
        const { headers, rows } = parseCSV(text)

        if (rows.length === 0) {
          setError('CSV file has no data rows')
          return
        }

        setCSVHeaders(headers)
        setCSVData(rows)

        // Auto-map common column names
        const autoMapping: FieldMapping = {}
        headers.forEach(header => {
          const lowerHeader = header.toLowerCase()
          if (lowerHeader.includes('first') && lowerHeader.includes('name')) {
            autoMapping[header] = 'first_name'
          } else if (lowerHeader.includes('last') && lowerHeader.includes('name')) {
            autoMapping[header] = 'last_name'
          } else if (lowerHeader === 'email' || lowerHeader === 'e-mail') {
            autoMapping[header] = 'email'
          } else if (lowerHeader === 'phone' || lowerHeader === 'telephone') {
            autoMapping[header] = 'phone'
          } else if (lowerHeader === 'company' || lowerHeader === 'organization') {
            autoMapping[header] = 'company'
          } else if (lowerHeader === 'title' || lowerHeader === 'position') {
            autoMapping[header] = 'title'
          } else if (lowerHeader === 'status') {
            autoMapping[header] = 'status'
          }
        })
        setFieldMapping(autoMapping)
        setStep('map')
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to parse CSV file')
      }
    }
    reader.readAsText(selectedFile)
  }, [parseCSV])

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(true)
  }

  const handleDragLeave = () => {
    setIsDragging(false)
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)
    const droppedFile = e.dataTransfer.files[0]
    if (droppedFile) {
      handleFileSelect(droppedFile)
    }
  }

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0]
    if (selectedFile) {
      handleFileSelect(selectedFile)
    }
  }

  const handleMappingChange = (csvColumn: string, contactField: string) => {
    setFieldMapping(prev => ({
      ...prev,
      [csvColumn]: contactField
    }))
  }

  const validateMapping = (): boolean => {
    const mappedFields = Object.values(fieldMapping).filter(f => f !== '')
    const requiredFields = ['first_name', 'last_name', 'email']

    for (const required of requiredFields) {
      if (!mappedFields.includes(required)) {
        setError(`Required field missing: ${required.replace('_', ' ')}`)
        return false
      }
    }

    setError('')
    return true
  }

  const handleImport = async () => {
    if (!validateMapping()) {
      return
    }

    setIsImporting(true)
    setError('')

    try {
      // Transform CSV data to contact format
      const contacts = csvData.map(row => {
        const contact: any = {}
        Object.entries(fieldMapping).forEach(([csvColumn, contactField]) => {
          if (contactField && contactField !== '') {
            contact[contactField] = row[csvColumn]
          }
        })
        return contact
      })

      const result = await importContactsFromCSV(contacts)

      if (result.error) {
        setError(result.error)
      } else if (result.data) {
        setImportResult(result.data)
        setStep('complete')
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Import failed')
    } finally {
      setIsImporting(false)
    }
  }

  const getMappedPreview = () => {
    return csvData.slice(0, 5).map((row, idx) => {
      const mapped: any = {}
      Object.entries(fieldMapping).forEach(([csvColumn, contactField]) => {
        if (contactField && contactField !== '') {
          mapped[contactField] = row[csvColumn]
        }
      })
      return { original: row, mapped, index: idx }
    })
  }

  return (
    <div className="space-y-6">
      {/* Progress Steps */}
      <div className="flex items-center justify-center space-x-4">
        <div className={`flex items-center ${step === 'upload' ? 'text-blue-600' : 'text-gray-400'}`}>
          <div className={`w-8 h-8 rounded-full flex items-center justify-center border-2 ${
            step === 'upload' ? 'border-blue-600 bg-blue-50' : 'border-gray-300 bg-gray-50'
          }`}>
            1
          </div>
          <span className="ml-2 font-medium">Upload</span>
        </div>
        <div className="w-16 h-0.5 bg-gray-300"></div>
        <div className={`flex items-center ${step === 'map' || step === 'review' || step === 'complete' ? 'text-blue-600' : 'text-gray-400'}`}>
          <div className={`w-8 h-8 rounded-full flex items-center justify-center border-2 ${
            step === 'map' || step === 'review' || step === 'complete' ? 'border-blue-600 bg-blue-50' : 'border-gray-300 bg-gray-50'
          }`}>
            2
          </div>
          <span className="ml-2 font-medium">Map Fields</span>
        </div>
        <div className="w-16 h-0.5 bg-gray-300"></div>
        <div className={`flex items-center ${step === 'review' || step === 'complete' ? 'text-blue-600' : 'text-gray-400'}`}>
          <div className={`w-8 h-8 rounded-full flex items-center justify-center border-2 ${
            step === 'review' || step === 'complete' ? 'border-blue-600 bg-blue-50' : 'border-gray-300 bg-gray-50'
          }`}>
            3
          </div>
          <span className="ml-2 font-medium">Review</span>
        </div>
        <div className="w-16 h-0.5 bg-gray-300"></div>
        <div className={`flex items-center ${step === 'complete' ? 'text-blue-600' : 'text-gray-400'}`}>
          <div className={`w-8 h-8 rounded-full flex items-center justify-center border-2 ${
            step === 'complete' ? 'border-blue-600 bg-blue-50' : 'border-gray-300 bg-gray-50'
          }`}>
            4
          </div>
          <span className="ml-2 font-medium">Complete</span>
        </div>
      </div>

      {error && (
        <div className="rounded-md bg-red-50 p-4">
          <div className="text-sm text-red-800">{error}</div>
        </div>
      )}

      {/* Step 1: Upload */}
      {step === 'upload' && (
        <div className="bg-white shadow rounded-lg p-6">
          <h2 className="text-lg font-medium text-gray-900 mb-4">Upload CSV File</h2>
          <div
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            className={`border-2 border-dashed rounded-lg p-12 text-center ${
              isDragging ? 'border-blue-500 bg-blue-50' : 'border-gray-300'
            }`}
          >
            <div className="space-y-4">
              <div className="text-gray-600">
                <svg className="mx-auto h-12 w-12 text-gray-400" stroke="currentColor" fill="none" viewBox="0 0 48 48">
                  <path d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28m0 0l4 4m4-24h8m-4-4v8m-12 4h.02" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </div>
              <div>
                <label htmlFor="file-upload" className="cursor-pointer">
                  <span className="text-blue-600 hover:text-blue-700 font-medium">Upload a file</span>
                  <input
                    id="file-upload"
                    type="file"
                    accept=".csv"
                    onChange={handleFileInput}
                    className="sr-only"
                  />
                </label>
                <span className="text-gray-600"> or drag and drop</span>
              </div>
              <p className="text-sm text-gray-500">CSV file up to 10MB</p>
              {file && (
                <p className="text-sm text-green-600 font-medium">
                  Selected: {file.name}
                </p>
              )}
            </div>
          </div>
          <div className="mt-6 text-sm text-gray-500">
            <p className="font-medium mb-2">CSV Format Requirements:</p>
            <ul className="list-disc list-inside space-y-1">
              <li>First row must contain column headers</li>
              <li>Required fields: First Name, Last Name, Email</li>
              <li>Optional fields: Phone, Company, Title, Status</li>
              <li>Status should be either "lead" or "customer"</li>
            </ul>
          </div>
        </div>
      )}

      {/* Step 2: Map Fields */}
      {step === 'map' && (
        <div className="bg-white shadow rounded-lg p-6">
          <h2 className="text-lg font-medium text-gray-900 mb-4">Map CSV Columns to Contact Fields</h2>
          <p className="text-sm text-gray-600 mb-6">
            Match your CSV columns to contact fields. Fields marked with * are required.
          </p>

          <div className="space-y-4">
            {csvHeaders.map(header => (
              <div key={header} className="grid grid-cols-2 gap-4 items-center">
                <div className="text-sm font-medium text-gray-700">
                  {header}
                  <div className="text-xs text-gray-500 mt-1">
                    Example: {csvData[0]?.[header] || 'N/A'}
                  </div>
                </div>
                <select
                  value={fieldMapping[header] || ''}
                  onChange={(e) => handleMappingChange(header, e.target.value)}
                  className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm py-2.5 px-3"
                >
                  {CONTACT_FIELDS.map(field => (
                    <option key={field.value} value={field.value}>
                      {field.label}
                    </option>
                  ))}
                </select>
              </div>
            ))}
          </div>

          <div className="mt-6 flex justify-between">
            <button
              onClick={() => setStep('upload')}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md shadow-sm hover:bg-gray-50"
            >
              Back
            </button>
            <button
              onClick={() => {
                if (validateMapping()) {
                  setStep('review')
                }
              }}
              className="px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md shadow-sm hover:bg-blue-700"
            >
              Continue to Review
            </button>
          </div>
        </div>
      )}

      {/* Step 3: Review */}
      {step === 'review' && (
        <div className="bg-white shadow rounded-lg p-6">
          <h2 className="text-lg font-medium text-gray-900 mb-4">Review Import Preview</h2>
          <p className="text-sm text-gray-600 mb-6">
            Preview of first 5 contacts to be imported ({csvData.length} total)
          </p>

          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">First Name</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Last Name</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Email</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Phone</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Company</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {getMappedPreview().map((item, idx) => (
                  <tr key={idx}>
                    <td className="px-4 py-3 text-sm text-gray-900">{item.mapped.first_name || '—'}</td>
                    <td className="px-4 py-3 text-sm text-gray-900">{item.mapped.last_name || '—'}</td>
                    <td className="px-4 py-3 text-sm text-gray-900">{item.mapped.email || '—'}</td>
                    <td className="px-4 py-3 text-sm text-gray-900">{item.mapped.phone || '—'}</td>
                    <td className="px-4 py-3 text-sm text-gray-900">{item.mapped.company || '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="mt-6 flex justify-between">
            <button
              onClick={() => setStep('map')}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md shadow-sm hover:bg-gray-50"
            >
              Back to Mapping
            </button>
            <button
              onClick={handleImport}
              disabled={isImporting}
              className="px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md shadow-sm hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isImporting ? 'Importing...' : `Import ${csvData.length} Contacts`}
            </button>
          </div>
        </div>
      )}

      {/* Step 4: Complete */}
      {step === 'complete' && importResult && (
        <div className="bg-white shadow rounded-lg p-6">
          <div className="text-center mb-6">
            <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-green-100 mb-4">
              <svg className="h-6 w-6 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <h2 className="text-2xl font-bold text-gray-900">Import Complete!</h2>
          </div>

          <div className="space-y-4">
            <div className="grid grid-cols-3 gap-4">
              <div className="bg-green-50 rounded-lg p-4 text-center">
                <div className="text-3xl font-bold text-green-600">{importResult.success}</div>
                <div className="text-sm text-gray-600 mt-1">Successfully Imported</div>
              </div>
              <div className="bg-yellow-50 rounded-lg p-4 text-center">
                <div className="text-3xl font-bold text-yellow-600">{importResult.duplicates}</div>
                <div className="text-sm text-gray-600 mt-1">Duplicates Skipped</div>
              </div>
              <div className="bg-red-50 rounded-lg p-4 text-center">
                <div className="text-3xl font-bold text-red-600">{importResult.failed}</div>
                <div className="text-sm text-gray-600 mt-1">Failed</div>
              </div>
            </div>

            {importResult.errors.length > 0 && (
              <div className="mt-6">
                <h3 className="text-sm font-medium text-gray-900 mb-2">Errors:</h3>
                <div className="bg-red-50 rounded-lg p-4 max-h-48 overflow-y-auto">
                  {importResult.errors.map((err, idx) => (
                    <div key={idx} className="text-sm text-red-800 mb-1">
                      Row {err.row}: {err.error}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          <div className="mt-6 flex justify-center gap-3">
            <button
              onClick={() => {
                setStep('upload')
                setFile(null)
                setCSVData([])
                setCSVHeaders([])
                setFieldMapping({})
                setImportResult(null)
              }}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md shadow-sm hover:bg-gray-50"
            >
              Import Another File
            </button>
            <button
              onClick={() => router.push('/contacts')}
              className="px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md shadow-sm hover:bg-blue-700"
            >
              View All Contacts
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
