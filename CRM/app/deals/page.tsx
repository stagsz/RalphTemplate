import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'

interface Deal {
  id: string
  title: string
  amount: number
  stage: 'lead' | 'proposal' | 'negotiation' | 'closed-won' | 'closed-lost'
  probability: number
  contact: any
  created_at: string
}

const STAGES = [
  { key: 'lead', label: 'Lead', color: 'bg-blue-100', textColor: 'text-blue-800' },
  { key: 'proposal', label: 'Proposal', color: 'bg-purple-100', textColor: 'text-purple-800' },
  { key: 'negotiation', label: 'Negotiation', color: 'bg-yellow-100', textColor: 'text-yellow-800' },
  { key: 'closed-won', label: 'Closed Won', color: 'bg-green-100', textColor: 'text-green-800' },
  { key: 'closed-lost', label: 'Closed Lost', color: 'bg-red-100', textColor: 'text-red-800' }
]

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

  const dealsByStage: Record<string, Deal[]> = {
    lead: [],
    proposal: [],
    negotiation: [],
    'closed-won': [],
    'closed-lost': []
  }

  deals?.forEach(deal => {
    dealsByStage[deal.stage].push(deal)
  })

  const totalAmount = deals?.reduce((sum, d) => sum + d.amount, 0) || 0

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">Deals</h1>
            <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
              Manage your sales pipeline
              {deals?.length ? ` (${deals.length} total, $${totalAmount.toLocaleString('en-US', { maximumFractionDigits: 0 })})` : ''}
            </p>
          </div>
          <Link
            href="/deals/new"
            className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 dark:bg-blue-500 dark:hover:bg-blue-600"
          >
            New Deal
          </Link>
        </div>

        {/* Pipeline View */}
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-4">
          {STAGES.map(stage => {
            const stageDeal = dealsByStage[stage.key as keyof typeof dealsByStage] || []
            const stageAmount = stageDeal.reduce((sum, d) => sum + d.amount, 0)

            return (
              <div key={stage.key} className="bg-white dark:bg-gray-800 rounded-lg p-4 shadow">
                <div className="mb-4">
                  <h3 className={`font-medium ${stage.textColor}`}>{stage.label}</h3>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">{stageDeal.length} deals</p>
                  <p className="text-sm font-semibold text-gray-900 dark:text-gray-100 mt-2">
                    ${stageAmount.toLocaleString('en-US', { maximumFractionDigits: 0 })}
                  </p>
                </div>

                <div className="space-y-3">
                  {stageDeal.map(deal => (
                    <Link
                      key={deal.id}
                      href={`/deals/${deal.id}`}
                      className={`block p-3 rounded border-l-4 ${stage.color} dark:bg-gray-700 border-current hover:shadow-md transition`}
                    >
                      <p className="text-sm font-medium text-gray-900 dark:text-gray-100 truncate">{deal.title}</p>
                      <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">
                        {deal.contact?.first_name} {deal.contact?.last_name}
                      </p>
                      <div className="flex justify-between items-end mt-2">
                        <p className="text-sm font-semibold text-gray-900 dark:text-gray-100">
                          ${deal.amount.toLocaleString('en-US', { maximumFractionDigits: 0 })}
                        </p>
                        <span className="text-xs text-gray-500 dark:text-gray-400">{deal.probability}%</span>
                      </div>
                    </Link>
                  ))}
                  {stageDeal.length === 0 && (
                    <p className="text-center text-sm text-gray-400 dark:text-gray-500 py-4">No deals</p>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}
