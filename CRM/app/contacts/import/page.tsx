import Link from 'next/link'
import CSVImportWizard from '@/components/contacts/CSVImportWizard'

export default function ImportContactsPage() {
  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-8">
          <Link
            href="/contacts"
            className="text-sm text-blue-600 hover:text-blue-800 mb-4 inline-block"
          >
            ← Back to Contacts
          </Link>
          <h1 className="text-3xl font-bold text-gray-900">Import Contacts from CSV</h1>
          <p className="mt-2 text-sm text-gray-600">
            Upload a CSV file to bulk import contacts into your CRM
          </p>
        </div>

        <CSVImportWizard />
      </div>
    </div>
  )
}
