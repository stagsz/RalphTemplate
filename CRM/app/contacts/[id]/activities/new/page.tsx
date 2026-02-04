import { createClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import ActivityFormWrapper from '@/components/activities/ActivityFormWrapper'

export default async function NewContactActivityPage({ params }: { params: Promise<{ id: string }> }) {
  const supabase = await createClient()
  const { id } = await params

  // Verify contact exists
  const { data: contact, error } = await supabase
    .from('contacts')
    .select('id, first_name, last_name, company')
    .eq('id', id)
    .is('deleted_at', null)
    .single()

  if (error || !contact) {
    notFound()
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-8">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-8">
          <Link
            href={`/contacts/${id}`}
            className="text-sm text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 mb-4 inline-block"
          >
            ← Back to {contact.first_name} {contact.last_name}
          </Link>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">Log Activity</h1>
          <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
            Record an activity for {contact.first_name} {contact.last_name}
            {contact.company && ` at ${contact.company}`}
          </p>
        </div>

        <div className="bg-white dark:bg-gray-800 shadow rounded-lg p-6">
          <ActivityFormWrapper
            mode="create"
            contactId={id}
            redirectPath={`/contacts/${id}`}
          />
        </div>
      </div>
    </div>
  )
}
