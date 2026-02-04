import { createClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import DealForm from '@/components/deals/DealForm'

export default async function EditDealPage({ params }: { params: Promise<{ id: string }> }) {
  const supabase = await createClient()
  const { id } = await params

  const { data: deal, error } = await supabase
    .from('deals')
    .select('*')
    .eq('id', id)
    .is('deleted_at', null)
    .single()

  if (error || !deal) {
    notFound()
  }

  const { data: contacts } = await supabase
    .from('contacts')
    .select('id, first_name, last_name, email, company')
    .is('deleted_at', null)
    .order('first_name')

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-8">
          <Link href={`/deals/${id}`} className="text-sm text-blue-600 hover:text-blue-800 mb-4 inline-block">
            ← Back to Deal
          </Link>
          <h1 className="text-3xl font-bold text-gray-900">Edit Deal</h1>
          <p className="mt-2 text-sm text-gray-600">Update deal information for {deal.title}</p>
        </div>

        <div className="bg-white shadow rounded-lg p-6">
          <DealForm
            mode="edit"
            dealId={id}
            initialData={{
              title: deal.title,
              description: deal.description,
              contact_id: deal.contact_id,
              amount: deal.amount,
              expected_close_date: deal.expected_close_date,
              stage: deal.stage,
              probability: deal.probability
            }}
            contacts={contacts || []}
          />
        </div>
      </div>
    </div>
  )
}
