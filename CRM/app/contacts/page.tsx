import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'
import ContactsTable from '@/components/contacts/ContactsTable'
import ExportContactsButton from '@/components/contacts/ExportContactsButton'

interface SearchParams {
  search?: string
  status?: string
  owner?: string
  sort?: string
  order?: 'asc' | 'desc'
  page?: string
}

export default async function ContactsPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>
}) {
  const supabase = await createClient()
  const params = await searchParams

  // Parse pagination
  const page = parseInt(params.page || '1')
  const perPage = 100
  const from = (page - 1) * perPage
  const to = from + perPage - 1

  // Build query
  let query = supabase
    .from('contacts')
    .select('id, first_name, last_name, email, company, status, owner_id, created_at', { count: 'exact' })
    .is('deleted_at', null)

  // Apply search filter
  if (params.search) {
    query = query.or(
      `first_name.ilike.%${params.search}%,last_name.ilike.%${params.search}%,email.ilike.%${params.search}%,company.ilike.%${params.search}%`
    )
  }

  // Apply status filter
  if (params.status && params.status !== 'all') {
    query = query.eq('status', params.status)
  }

  // Apply owner filter
  if (params.owner && params.owner !== 'all') {
    query = query.eq('owner_id', params.owner)
  }

  // Apply sorting
  const sortColumn = params.sort || 'created_at'
  const sortOrder = params.order || 'desc'
  query = query.order(sortColumn, { ascending: sortOrder === 'asc' })

  // Apply pagination
  query = query.range(from, to)

  // Execute query
  const { data: contacts, error, count } = await query

  if (error) {
    console.error('Error fetching contacts:', error)
  }

  // Fetch all users for filter dropdown
  const { data: users } = await supabase
    .from('users')
    .select('id, full_name, email')
    .order('full_name')

  const totalPages = count ? Math.ceil(count / perPage) : 0

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">Contacts</h1>
            <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
              Manage your contacts and leads
              {count !== null && ` (${count} total)`}
            </p>
          </div>
          <div className="flex gap-3">
            <ExportContactsButton searchParams={params} />
            <Link
              href="/contacts/import"
              className="inline-flex items-center px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              <svg className="h-5 w-5 mr-2 text-gray-500 dark:text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
              </svg>
              Import CSV
            </Link>
            <Link
              href="/contacts/new"
              className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 dark:bg-blue-500 dark:hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              Add Contact
            </Link>
          </div>
        </div>

        <ContactsTable
          contacts={contacts || []}
          users={users || []}
          currentPage={page}
          totalPages={totalPages}
          totalCount={count || 0}
          searchParams={params}
        />
      </div>
    </div>
  )
}
