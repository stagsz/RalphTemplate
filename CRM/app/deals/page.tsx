import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'
import { DealsKanban } from '@/components/deals/DealsKanban'
import { Deal } from '@/components/deals/DealCard'

export default async function DealsPage() {
  const supabase = await createClient()

  const { data: deals } = await supabase
    .from('deals')
    .select(`
      *,
      contact:contacts(id, first_name, last_name, company)
    `)
    .is('deleted_at', null)
    .order('created_at', { ascending: false })

  const typedDeals: Deal[] = (deals || []).map((deal) => ({
    id: deal.id,
    title: deal.title,
    amount: deal.amount,
    stage: deal.stage as Deal['stage'],
    probability: deal.probability,
    contact: deal.contact,
    created_at: deal.created_at,
  }))

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">Deals</h1>
            <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
              Manage your sales pipeline
            </p>
          </div>
          <Link
            href="/deals/new"
            className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 dark:bg-blue-500 dark:hover:bg-blue-600"
          >
            New Deal
          </Link>
        </div>

        <DealsKanban initialDeals={typedDeals} />
      </div>
    </div>
  )
}
