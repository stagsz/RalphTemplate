import ContactForm from '@/components/contacts/ContactForm'

export default async function NewContactPage() {
  // No need to check auth here - middleware already handles it
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-8">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">Create Contact</h1>
          <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
            Add a new contact to your CRM
          </p>
        </div>

        <div className="bg-white dark:bg-gray-800 shadow rounded-lg p-6">
          <ContactForm />
        </div>
      </div>
    </div>
  )
}
