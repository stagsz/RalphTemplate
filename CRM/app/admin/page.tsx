import { requireAdmin } from '@/lib/auth/permissions'
import { createClient } from '@/lib/supabase/server'
import UsersTable from '@/components/admin/UsersTable'

interface AdminDashboardProps {
  searchParams: Promise<{
    search?: string
    role?: string
    sort?: string
    order?: 'asc' | 'desc'
  }>
}

export default async function AdminDashboard({ searchParams }: AdminDashboardProps) {
  // Require admin role - will redirect if not admin
  const currentUser = await requireAdmin()

  const params = await searchParams
  const supabase = await createClient()

  // Build query with filters
  let query = supabase.from('users').select('*', { count: 'exact' })

  // Apply search filter
  if (params.search) {
    query = query.or(`full_name.ilike.%${params.search}%,email.ilike.%${params.search}%`)
  }

  // Apply role filter
  if (params.role && params.role !== 'all') {
    query = query.eq('role', params.role)
  }

  // Apply sorting
  const sortColumn = params.sort || 'created_at'
  const sortOrder = params.order || 'desc'
  query = query.order(sortColumn, { ascending: sortOrder === 'asc' })

  const { data: users, count } = await query

  // Get total counts (unfiltered) for stats
  const { data: allUsers } = await supabase.from('users').select('role')
  const adminCount = allUsers?.filter(u => u.role === 'admin').length || 0
  const userCount = allUsers?.filter(u => u.role === 'user').length || 0
  const totalCount = allUsers?.length || 0

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Header */}
      <div className="bg-white dark:bg-gray-800 shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">Admin Dashboard</h1>
              <p className="text-gray-500 dark:text-gray-400 mt-1">Manage users and system settings</p>
            </div>
            <a
              href="/"
              className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700"
            >
              Back to Home
            </a>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="flex-1">
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Total Users</p>
                <p className="text-3xl font-bold text-gray-900 dark:text-gray-100">{totalCount}</p>
              </div>
              <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900/30 rounded-full flex items-center justify-center">
                <svg className="w-6 h-6 text-blue-600 dark:text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                </svg>
              </div>
            </div>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="flex-1">
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Admins</p>
                <p className="text-3xl font-bold text-gray-900 dark:text-gray-100">{adminCount}</p>
              </div>
              <div className="w-12 h-12 bg-purple-100 dark:bg-purple-900/30 rounded-full flex items-center justify-center">
                <svg className="w-6 h-6 text-purple-600 dark:text-purple-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                </svg>
              </div>
            </div>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="flex-1">
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Regular Users</p>
                <p className="text-3xl font-bold text-gray-900 dark:text-gray-100">{userCount}</p>
              </div>
              <div className="w-12 h-12 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center">
                <svg className="w-6 h-6 text-green-600 dark:text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
              </div>
            </div>
          </div>
        </div>

        {/* Users Table Section */}
        <div className="mb-4">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100">All Users</h2>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            {count !== totalCount
              ? `Showing ${count} of ${totalCount} users`
              : `${totalCount} total users`
            }
          </p>
        </div>
        <UsersTable
          users={users || []}
          currentUserId={currentUser.id}
          searchParams={params}
        />
      </div>
    </div>
  )
}
