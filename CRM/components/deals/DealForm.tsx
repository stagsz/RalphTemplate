'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createDeal, updateDeal } from '@/app/deals/actions'

interface Contact {
  id: string
  first_name: string
  last_name: string
  email: string
  company?: string
}

interface DealFormData {
  title: string
  description?: string
  contact_id: string
  amount: number
  expected_close_date?: string
  stage?: 'lead' | 'proposal' | 'negotiation' | 'closed-won' | 'closed-lost'
  probability?: number
}

interface DealFormProps {
  mode?: 'create' | 'edit'
  dealId?: string
  initialData?: DealFormData
  contacts: Contact[]
}

export default function DealForm({ mode = 'create', dealId, initialData, contacts }: DealFormProps) {
  const router = useRouter()
  const [formData, setFormData] = useState<DealFormData>(initialData || {
    title: '',
    description: '',
    contact_id: '',
    amount: 0,
    expected_close_date: '',
    stage: 'lead',
    probability: 0
  })
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [isSubmitting, setIsSubmitting] = useState(false)

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: name === 'amount' || name === 'probability' ? (value ? parseFloat(value) : 0) : value
    }))
    if (errors[name]) {
      setErrors(prev => {
        const newErrors = { ...prev }
        delete newErrors[name]
        return newErrors
      })
    }
  }

  const validate = (): boolean => {
    const newErrors: Record<string, string> = {}
    if (!formData.title.trim()) newErrors.title = 'Title is required'
    if (!formData.contact_id) newErrors.contact_id = 'Contact is required'
    if (!formData.amount || formData.amount < 0) newErrors.amount = 'Amount must be greater than 0'
    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!validate()) return

    setIsSubmitting(true)
    try {
      const result = mode === 'edit' && dealId
        ? await updateDeal(dealId, formData)
        : await createDeal(formData)

      if (result.error) {
        setErrors({ general: result.error })
      } else if (result.data) {
        router.push(`/deals/${result.data.id}`)
      }
    } catch (error) {
      console.error(`Error ${mode}ing deal:`, error)
      setErrors({ general: 'An unexpected error occurred. Please try again.' })
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {errors.general && (
        <div className="rounded-md bg-red-50 dark:bg-red-900/20 p-4">
          <div className="text-sm text-red-800 dark:text-red-300">{errors.general}</div>
        </div>
      )}

      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
        <div className="sm:col-span-2">
          <label htmlFor="title" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
            Deal Title <span className="text-red-500 dark:text-red-400">*</span>
          </label>
          <input
            type="text"
            name="title"
            id="title"
            value={formData.title}
            onChange={handleChange}
            className={`mt-1 block w-full rounded-md border shadow-sm sm:text-sm py-2.5 px-3 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 ${
              errors.title ? 'border-red-300 dark:border-red-500 focus:border-red-500 focus:ring-red-500' : 'border-gray-300 dark:border-gray-600 focus:border-blue-500 focus:ring-blue-500'
            }`}
            placeholder="e.g., Enterprise software license"
          />
          {errors.title && <p className="mt-1 text-sm text-red-600 dark:text-red-400">{errors.title}</p>}
        </div>

        <div className="sm:col-span-2">
          <label htmlFor="description" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
            Description
          </label>
          <textarea
            name="description"
            id="description"
            value={formData.description || ''}
            onChange={handleChange}
            rows={3}
            className="mt-1 block w-full rounded-md border border-gray-300 dark:border-gray-600 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm py-2.5 px-3 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
            placeholder="Add details about this deal..."
          />
        </div>

        <div>
          <label htmlFor="contact_id" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
            Contact <span className="text-red-500 dark:text-red-400">*</span>
          </label>
          <select
            name="contact_id"
            id="contact_id"
            value={formData.contact_id}
            onChange={handleChange}
            className={`mt-1 block w-full rounded-md border shadow-sm sm:text-sm py-2.5 px-3 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 ${
              errors.contact_id ? 'border-red-300 dark:border-red-500 focus:border-red-500 focus:ring-red-500' : 'border-gray-300 dark:border-gray-600 focus:border-blue-500 focus:ring-blue-500'
            }`}
          >
            <option value="">-- Select Contact --</option>
            {contacts.map(contact => (
              <option key={contact.id} value={contact.id}>
                {contact.first_name} {contact.last_name} {contact.company ? `(${contact.company})` : ''}
              </option>
            ))}
          </select>
          {errors.contact_id && <p className="mt-1 text-sm text-red-600 dark:text-red-400">{errors.contact_id}</p>}
        </div>

        <div>
          <label htmlFor="amount" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
            Amount <span className="text-red-500 dark:text-red-400">*</span>
          </label>
          <input
            type="number"
            name="amount"
            id="amount"
            value={formData.amount}
            onChange={handleChange}
            step="0.01"
            className={`mt-1 block w-full rounded-md border shadow-sm sm:text-sm py-2.5 px-3 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 ${
              errors.amount ? 'border-red-300 dark:border-red-500 focus:border-red-500 focus:ring-red-500' : 'border-gray-300 dark:border-gray-600 focus:border-blue-500 focus:ring-blue-500'
            }`}
            placeholder="0.00"
          />
          {errors.amount && <p className="mt-1 text-sm text-red-600 dark:text-red-400">{errors.amount}</p>}
        </div>

        <div>
          <label htmlFor="expected_close_date" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
            Expected Close Date
          </label>
          <input
            type="date"
            name="expected_close_date"
            id="expected_close_date"
            value={formData.expected_close_date || ''}
            onChange={handleChange}
            className="mt-1 block w-full rounded-md border border-gray-300 dark:border-gray-600 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm py-2.5 px-3 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
          />
        </div>

        <div>
          <label htmlFor="stage" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
            Stage
          </label>
          <select
            name="stage"
            id="stage"
            value={formData.stage || 'lead'}
            onChange={handleChange}
            className="mt-1 block w-full rounded-md border border-gray-300 dark:border-gray-600 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm py-2.5 px-3 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
          >
            <option value="lead">Lead</option>
            <option value="proposal">Proposal</option>
            <option value="negotiation">Negotiation</option>
            <option value="closed-won">Closed Won</option>
            <option value="closed-lost">Closed Lost</option>
          </select>
        </div>

        <div>
          <label htmlFor="probability" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
            Win Probability (%)
          </label>
          <input
            type="number"
            name="probability"
            id="probability"
            min="0"
            max="100"
            value={formData.probability || 0}
            onChange={handleChange}
            className="mt-1 block w-full rounded-md border border-gray-300 dark:border-gray-600 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm py-2.5 px-3 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
          />
        </div>
      </div>

      <div className="flex justify-end gap-3">
        <button
          type="button"
          onClick={() => router.back()}
          className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm hover:bg-gray-50 dark:hover:bg-gray-600"
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={isSubmitting}
          className="px-4 py-2 text-sm font-medium text-white bg-blue-600 dark:bg-blue-500 border border-transparent rounded-md shadow-sm hover:bg-blue-700 dark:hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isSubmitting ? (mode === 'edit' ? 'Updating...' : 'Creating...') : (mode === 'edit' ? 'Update Deal' : 'Create Deal')}
        </button>
      </div>
    </form>
  )
}
