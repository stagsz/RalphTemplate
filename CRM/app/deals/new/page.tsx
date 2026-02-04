import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'
import DealForm from '@/components/deals/DealForm'

export default async function NewDealPage() {
  const supabase = await createClient()

  const { data: contacts } = await supabase
    .from('contacts')
    .select('id, first_name, last_name, email, company')
    .is('deleted_at', null)
    .order('first_name')

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-8">
      <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-8">
          <Link href="/deals" className="text-sm text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 mb-4 inline-block">
            ← Back to Deals
          </Link>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">Create New Deal</h1>
          <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">Add a new deal to your sales pipeline</p>
        </div>

        <div className="bg-white dark:bg-gray-800 shadow rounded-lg p-6">
          <DealForm contacts={contacts || []} />
        </div>
      </div>
    </div>
  )
}
