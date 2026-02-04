'use client'

import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { useState, useTransition } from 'react'

interface Contact {
  id: string
  first_name: string
  last_name: string
  email: string
  company: string | null
  status: 'lead' | 'customer'
  owner_id: string
  created_at: string
}

interface User {
  id: string
  full_name: string | null
  email: string
}

interface ContactsTableProps {
  contacts: Contact[]
  users: User[]
  currentPage: number
  totalPages: number
  totalCount: number
  searchParams: {
    search?: string
    status?: string
    owner?: string
    sort?: string
    order?: 'asc' | 'desc'
  }
}

export default function ContactsTable({
  contacts,
  users,
  currentPage,
  totalPages,
  totalCount,
  searchParams,
}: ContactsTableProps) {
  const router = useRouter()
  const params = useSearchParams()
  const [isPending, startTransition] = useTransition()

  const [search, setSearch] = useState(searchParams.search || '')
  const [statusFilter, setStatusFilter] = useState(searchParams.status || 'all')
  const [ownerFilter, setOwnerFilter] = useState(searchParams.owner || 'all')

  const updateURL = (updates: Record<string, string>) => {
    const newParams = new URLSearchParams(params.toString())

    Object.entries(updates).forEach(([key, value]) => {
      if (value && value !== 'all') {
        newParams.set(key, value)
      } else {
        newParams.delete(key)
      }
    })

    // Reset to page 1 when filters change
    if (updates.search !== undefined || updates.status !== undefined || updates.owner !== undefined) {
      newParams.delete('page')
    }

    startTransition(() => {
      router.push(`/contacts?${newParams.toString()}`)
    })
  }

  const handleSearch = (value: string) => {
    setSearch(value)
    updateURL({ search: value })
  }

  const handleStatusFilter = (value: string) => {
    setStatusFilter(value)
    updateURL({ status: value })
  }

  const handleOwnerFilter = (value: string) => {
    setOwnerFilter(value)
    updateURL({ owner: value })
  }

  const handleSort = (column: string) => {
    const currentSort = searchParams.sort
    const currentOrder = searchParams.order || 'desc'

    let newOrder: 'asc' | 'desc' = 'asc'

    if (currentSort === column) {
      newOrder = currentOrder === 'asc' ? 'desc' : 'asc'
    }

    updateURL({ sort: column, order: newOrder })
  }

  const handlePageChange = (page: number) => {
    updateURL({ page: page.toString() })
  }

  const SortIcon = ({ column }: { column: string }) => {
    const isActive = searchParams.sort === column
    const order = searchParams.order || 'desc'

    if (!isActive) {
      return <span className="ml-1 text-gray-400">⇅</span>
    }

    return (
      <span className="ml-1 text-blue-600">
        {order === 'asc' ? '↑' : '↓'}
      </span>
    )
  }

  return (
    <div className="bg-white dark:bg-gray-800 shadow rounded-lg">
      {/* Filters and Search */}
      <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Search */}
          <div className="md:col-span-1">
            <label htmlFor="search" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Search
            </label>
            <input
              type="text"
              id="search"
              value={search}
              onChange={(e) => handleSearch(e.target.value)}
              placeholder="Name, email, or company..."
              className="block w-full rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm px-3 py-2"
            />
          </div>

          {/* Status Filter */}
          <div>
            <label htmlFor="status" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Status
            </label>
            <select
              id="status"
              value={statusFilter}
              onChange={(e) => handleStatusFilter(e.target.value)}
              className="block w-full rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm px-3 py-2"
            >
              <option value="all">All Statuses</option>
              <option value="lead">Lead</option>
              <option value="customer">Customer</option>
            </select>
          </div>

          {/* Owner Filter */}
          <div>
            <label htmlFor="owner" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Owner
            </label>
            <select
              id="owner"
              value={ownerFilter}
              onChange={(e) => handleOwnerFilter(e.target.value)}
              className="block w-full rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm px-3 py-2"
            >
              <option value="all">All Owners</option>
              {users.map((user) => (
                <option key={user.id} value={user.id}>
                  {user.full_name || user.email}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
          <thead className="bg-gray-50 dark:bg-gray-700">
            <tr>
              <th
                onClick={() => handleSort('first_name')}
                className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-600"
              >
                Name <SortIcon column="first_name" />
              </th>
              <th
                onClick={() => handleSort('company')}
                className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-600"
              >
                Company <SortIcon column="company" />
              </th>
              <th
                onClick={() => handleSort('email')}
                className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-600"
              >
                Email <SortIcon column="email" />
              </th>
              <th
                onClick={() => handleSort('status')}
                className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-600"
              >
                Status <SortIcon column="status" />
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                Owner
              </th>
              <th
                onClick={() => handleSort('created_at')}
                className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-600"
              >
                Created <SortIcon column="created_at" />
              </th>
            </tr>
          </thead>
          <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
            {isPending && (
              <tr>
                <td colSpan={6} className="px-6 py-4 text-center text-sm text-gray-500 dark:text-gray-400">
                  Loading...
                </td>
              </tr>
            )}
            {!isPending && contacts.length === 0 && (
              <tr>
                <td colSpan={6} className="px-6 py-4 text-center text-sm text-gray-500 dark:text-gray-400">
                  No contacts found. Try adjusting your filters or{' '}
                  <Link href="/contacts/new" className="text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300">
                    create a new contact
                  </Link>
                  .
                </td>
              </tr>
            )}
            {!isPending && contacts.map((contact) => {
              const owner = users.find((u) => u.id === contact.owner_id)
              return (
                <tr key={contact.id} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <Link
                      href={`/contacts/${contact.id}`}
                      className="text-sm font-medium text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300"
                    >
                      {contact.first_name} {contact.last_name}
                    </Link>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-gray-100">
                    {contact.company || '—'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                    {contact.email}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span
                      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        contact.status === 'customer'
                          ? 'bg-green-100 text-green-800'
                          : 'bg-yellow-100 text-yellow-800'
                      }`}
                    >
                      {contact.status.charAt(0).toUpperCase() + contact.status.slice(1)}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {owner?.full_name || owner?.email || '—'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {new Date(contact.created_at).toLocaleDateString()}
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="px-6 py-4 border-t border-gray-200">
          <div className="flex items-center justify-between">
            <div className="text-sm text-gray-700">
              Showing {(currentPage - 1) * 100 + 1} to{' '}
              {Math.min(currentPage * 100, totalCount)} of {totalCount} contacts
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => handlePageChange(currentPage - 1)}
                disabled={currentPage === 1}
                className="px-3 py-1 text-sm border border-gray-300 rounded-md disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
              >
                Previous
              </button>
              <div className="flex gap-1">
                {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                  let pageNum
                  if (totalPages <= 5) {
                    pageNum = i + 1
                  } else if (currentPage <= 3) {
                    pageNum = i + 1
                  } else if (currentPage >= totalPages - 2) {
                    pageNum = totalPages - 4 + i
                  } else {
                    pageNum = currentPage - 2 + i
                  }

                  return (
                    <button
                      key={pageNum}
                      onClick={() => handlePageChange(pageNum)}
                      className={`px-3 py-1 text-sm border rounded-md ${
                        currentPage === pageNum
                          ? 'bg-blue-600 text-white border-blue-600'
                          : 'border-gray-300 hover:bg-gray-50'
                      }`}
                    >
                      {pageNum}
                    </button>
                  )
                })}
              </div>
              <button
                onClick={() => handlePageChange(currentPage + 1)}
                disabled={currentPage === totalPages}
                className="px-3 py-1 text-sm border border-gray-300 rounded-md disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
              >
                Next
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
