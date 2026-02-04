'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createContact, updateContact, checkEmailExists } from '@/app/contacts/actions'

interface CustomField {
  key: string
  value: string
}

interface FormData {
  first_name: string
  last_name: string
  email: string
  phone: string
  company: string
  title: string
  status: 'lead' | 'customer'
  custom_fields?: CustomField[]
}

interface FormErrors {
  first_name?: string
  last_name?: string
  email?: string
  phone?: string
  company?: string
  title?: string
  status?: string
  general?: string
}

interface ContactFormProps {
  mode?: 'create' | 'edit'
  contactId?: string
  initialData?: FormData
}

export default function ContactForm({ mode = 'create', contactId, initialData }: ContactFormProps) {
  const router = useRouter()
  const [formData, setFormData] = useState<FormData>(initialData || {
    first_name: '',
    last_name: '',
    email: '',
    phone: '',
    company: '',
    title: '',
    status: 'lead',
    custom_fields: []
  })
  const [errors, setErrors] = useState<FormErrors>({})
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [emailWarning, setEmailWarning] = useState<string>('')
  const initialEmail = initialData?.email || ''

  const validateEmail = (email: string): boolean => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    return emailRegex.test(email)
  }

  const handleEmailBlur = async () => {
    if (formData.email) {
      // Validate email format
      if (!validateEmail(formData.email)) {
        setErrors(prev => ({ ...prev, email: 'Please enter a valid email address' }))
        return
      } else {
        setErrors(prev => {
          const { email, ...rest } = prev
          return rest
        })
      }

      // Check for duplicate email (skip if email hasn't changed in edit mode)
      if (mode === 'edit' && formData.email.toLowerCase() === initialEmail.toLowerCase()) {
        setEmailWarning('')
        return
      }

      try {
        const exists = await checkEmailExists(formData.email)
        if (exists) {
          setEmailWarning('A contact with this email already exists')
        } else {
          setEmailWarning('')
        }
      } catch (error) {
        console.error('Error checking email:', error)
      }
    }
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target
    setFormData(prev => ({ ...prev, [name]: value }))

    // Clear error for this field
    if (errors[name as keyof FormErrors]) {
      setErrors(prev => {
        const newErrors = { ...prev }
        delete newErrors[name as keyof FormErrors]
        return newErrors
      })
    }

    // Clear email warning when email changes
    if (name === 'email' && emailWarning) {
      setEmailWarning('')
    }
  }

  const handleAddCustomField = () => {
    const customFields = formData.custom_fields || []
    if (customFields.length < 5) {
      setFormData(prev => ({
        ...prev,
        custom_fields: [...customFields, { key: '', value: '' }]
      }))
    }
  }

  const handleRemoveCustomField = (index: number) => {
    setFormData(prev => ({
      ...prev,
      custom_fields: (prev.custom_fields || []).filter((_, i) => i !== index)
    }))
  }

  const handleCustomFieldChange = (index: number, field: 'key' | 'value', value: string) => {
    setFormData(prev => ({
      ...prev,
      custom_fields: (prev.custom_fields || []).map((cf, i) =>
        i === index ? { ...cf, [field]: value } : cf
      )
    }))
  }

  const validate = (): boolean => {
    const newErrors: FormErrors = {}

    // Required fields
    if (!formData.first_name.trim()) {
      newErrors.first_name = 'First name is required'
    }
    if (!formData.last_name.trim()) {
      newErrors.last_name = 'Last name is required'
    }
    if (!formData.email.trim()) {
      newErrors.email = 'Email is required'
    } else if (!validateEmail(formData.email)) {
      newErrors.email = 'Please enter a valid email address'
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!validate()) {
      return
    }

    setIsSubmitting(true)
    setErrors({})

    try {
      let result
      if (mode === 'edit' && contactId) {
        result = await updateContact(contactId, formData)
      } else {
        result = await createContact(formData)
      }

      if (result.error) {
        setErrors({ general: result.error })
      } else if (result.data) {
        // Redirect to contact detail page
        router.push(`/contacts/${result.data.id}`)
      }
    } catch (error) {
      console.error(`Error ${mode === 'edit' ? 'updating' : 'creating'} contact:`, error)
      setErrors({ general: 'An unexpected error occurred. Please try again.' })
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleCancel = () => {
    if (mode === 'edit' && contactId) {
      router.push(`/contacts/${contactId}`)
    } else {
      router.push('/contacts')
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
        {/* First Name */}
        <div>
          <label htmlFor="first_name" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
            First Name <span className="text-red-500 dark:text-red-400">*</span>
          </label>
          <input
            type="text"
            name="first_name"
            id="first_name"
            value={formData.first_name}
            onChange={handleChange}
            className={`mt-1 block w-full rounded-md border shadow-sm sm:text-sm py-2.5 px-3 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 ${
              errors.first_name
                ? 'border-red-300 dark:border-red-600 focus:border-red-500 focus:ring-red-500'
                : 'border-gray-300 dark:border-gray-600 focus:border-blue-500 focus:ring-blue-500'
            }`}
          />
          {errors.first_name && (
            <p className="mt-1 text-sm text-red-600 dark:text-red-400">{errors.first_name}</p>
          )}
        </div>

        {/* Last Name */}
        <div>
          <label htmlFor="last_name" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
            Last Name <span className="text-red-500 dark:text-red-400">*</span>
          </label>
          <input
            type="text"
            name="last_name"
            id="last_name"
            value={formData.last_name}
            onChange={handleChange}
            className={`mt-1 block w-full rounded-md border shadow-sm sm:text-sm py-2.5 px-3 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 ${
              errors.last_name
                ? 'border-red-300 dark:border-red-600 focus:border-red-500 focus:ring-red-500'
                : 'border-gray-300 dark:border-gray-600 focus:border-blue-500 focus:ring-blue-500'
            }`}
          />
          {errors.last_name && (
            <p className="mt-1 text-sm text-red-600 dark:text-red-400">{errors.last_name}</p>
          )}
        </div>

        {/* Email */}
        <div>
          <label htmlFor="email" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
            Email <span className="text-red-500 dark:text-red-400">*</span>
          </label>
          <input
            type="email"
            name="email"
            id="email"
            value={formData.email}
            onChange={handleChange}
            onBlur={handleEmailBlur}
            className={`mt-1 block w-full rounded-md border shadow-sm sm:text-sm py-2.5 px-3 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 ${
              errors.email
                ? 'border-red-300 dark:border-red-600 focus:border-red-500 focus:ring-red-500'
                : 'border-gray-300 dark:border-gray-600 focus:border-blue-500 focus:ring-blue-500'
            }`}
          />
          {errors.email && (
            <p className="mt-1 text-sm text-red-600 dark:text-red-400">{errors.email}</p>
          )}
          {emailWarning && !errors.email && (
            <p className="mt-1 text-sm text-yellow-600 dark:text-yellow-400">{emailWarning}</p>
          )}
        </div>

        {/* Phone */}
        <div>
          <label htmlFor="phone" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
            Phone
          </label>
          <input
            type="tel"
            name="phone"
            id="phone"
            value={formData.phone}
            onChange={handleChange}
            className="mt-1 block w-full rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm py-2.5 px-3"
          />
        </div>

        {/* Company */}
        <div>
          <label htmlFor="company" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
            Company
          </label>
          <input
            type="text"
            name="company"
            id="company"
            value={formData.company}
            onChange={handleChange}
            className="mt-1 block w-full rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm py-2.5 px-3"
          />
        </div>

        {/* Title */}
        <div>
          <label htmlFor="title" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
            Title
          </label>
          <input
            type="text"
            name="title"
            id="title"
            value={formData.title}
            onChange={handleChange}
            className="mt-1 block w-full rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm py-2.5 px-3"
          />
        </div>

        {/* Status */}
        <div>
          <label htmlFor="status" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
            Status
          </label>
          <select
            name="status"
            id="status"
            value={formData.status}
            onChange={handleChange}
            className="mt-1 block w-full rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm py-2.5 px-3"
          >
            <option value="lead">Lead</option>
            <option value="customer">Customer</option>
          </select>
        </div>
      </div>

      {/* Custom Fields Section */}
      <div className="border-t border-gray-200 dark:border-gray-700 pt-6">
        <div className="flex justify-between items-center mb-4">
          <div>
            <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100">Custom Fields</h3>
            <p className="text-sm text-gray-500 dark:text-gray-400">Add up to 5 custom fields (optional)</p>
          </div>
          {(!formData.custom_fields || formData.custom_fields.length < 5) && (
            <button
              type="button"
              onClick={handleAddCustomField}
              className="inline-flex items-center px-3 py-2 border border-gray-300 dark:border-gray-600 shadow-sm text-sm font-medium rounded-md text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              <svg className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              Add Field
            </button>
          )}
        </div>

        {formData.custom_fields && formData.custom_fields.length > 0 && (
          <div className="space-y-3">
            {formData.custom_fields.map((field, index) => (
              <div key={index} className="flex gap-3 items-start">
                <div className="flex-1">
                  <input
                    type="text"
                    placeholder="Field name (e.g., Birthday)"
                    value={field.key}
                    onChange={(e) => handleCustomFieldChange(index, 'key', e.target.value)}
                    className="block w-full rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm py-2.5 px-3"
                  />
                </div>
                <div className="flex-1">
                  <input
                    type="text"
                    placeholder="Value (e.g., 1990-01-15)"
                    value={field.value}
                    onChange={(e) => handleCustomFieldChange(index, 'value', e.target.value)}
                    className="block w-full rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm py-2.5 px-3"
                  />
                </div>
                <button
                  type="button"
                  onClick={() => handleRemoveCustomField(index)}
                  className="px-3 py-2.5 text-red-600 dark:text-red-400 hover:text-red-800 dark:hover:text-red-300 focus:outline-none"
                >
                  <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                  </svg>
                </button>
              </div>
            ))}
          </div>
        )}

        {(!formData.custom_fields || formData.custom_fields.length === 0) && (
          <div className="text-center py-6 bg-gray-50 dark:bg-gray-700 rounded-lg border-2 border-dashed border-gray-300 dark:border-gray-600">
            <p className="text-sm text-gray-500 dark:text-gray-400">No custom fields added yet</p>
          </div>
        )}
      </div>

      <div className="flex justify-end gap-3">
        <button
          type="button"
          onClick={handleCancel}
          className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm hover:bg-gray-50 dark:hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={isSubmitting}
          className="px-4 py-2 text-sm font-medium text-white bg-blue-600 dark:bg-blue-500 border border-transparent rounded-md shadow-sm hover:bg-blue-700 dark:hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isSubmitting
            ? (mode === 'edit' ? 'Updating...' : 'Creating...')
            : (mode === 'edit' ? 'Update Contact' : 'Create Contact')
          }
        </button>
      </div>
    </form>
  )
}
