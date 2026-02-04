'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

interface ContactFormData {
  first_name: string
  last_name: string
  email: string
  phone?: string
  company?: string
  title?: string
  status: 'lead' | 'customer'
  custom_fields?: Array<{ key: string; value: string }>
}

interface ActionResult {
  data?: any
  error?: string
}

export async function checkEmailExists(email: string): Promise<boolean> {
  try {
    const supabase = await createClient()

    const { data, error } = await supabase
      .from('contacts')
      .select('id')
      .eq('email', email)
      .is('deleted_at', null)
      .single()

    if (error && error.code !== 'PGRST116') {
      // PGRST116 is "no rows returned", which is fine
      console.error('Error checking email:', error)
      return false
    }

    return !!data
  } catch (error) {
    console.error('Error in checkEmailExists:', error)
    return false
  }
}

export async function createContact(formData: ContactFormData): Promise<ActionResult> {
  try {
    const supabase = await createClient()

    // Get current user
    const { data: { user }, error: userError } = await supabase.auth.getUser()

    if (userError || !user) {
      return { error: 'You must be logged in to create a contact' }
    }

    // Process custom fields to convert array to object
    const customFieldsObj: Record<string, string> = {}
    if (formData.custom_fields) {
      formData.custom_fields.forEach(field => {
        if (field.key.trim() && field.value.trim()) {
          customFieldsObj[field.key.trim()] = field.value.trim()
        }
      })
    }

    // Prepare contact data
    const contactData = {
      first_name: formData.first_name.trim(),
      last_name: formData.last_name.trim(),
      email: formData.email.trim().toLowerCase(),
      phone: formData.phone?.trim() || null,
      company: formData.company?.trim() || null,
      title: formData.title?.trim() || null,
      status: formData.status,
      owner_id: user.id,
      custom_fields: customFieldsObj
    }

    // Insert contact
    const { data, error } = await supabase
      .from('contacts')
      .insert(contactData)
      .select()
      .single()

    if (error) {
      console.error('Error creating contact:', error)

      // Handle specific errors
      if (error.code === '23505') {
        // Unique constraint violation (duplicate email)
        return { error: 'A contact with this email already exists' }
      }

      return { error: 'Failed to create contact. Please try again.' }
    }

    // Revalidate contacts page
    revalidatePath('/contacts')

    return { data }
  } catch (error) {
    console.error('Unexpected error in createContact:', error)
    return { error: 'An unexpected error occurred. Please try again.' }
  }
}

export async function getContact(id: string): Promise<ActionResult> {
  try {
    const supabase = await createClient()

    const { data, error } = await supabase
      .from('contacts')
      .select('*')
      .eq('id', id)
      .is('deleted_at', null)
      .single()

    if (error) {
      console.error('Error fetching contact:', error)
      return { error: 'Contact not found' }
    }

    return { data }
  } catch (error) {
    console.error('Unexpected error in getContact:', error)
    return { error: 'Failed to fetch contact' }
  }
}

export async function updateContact(id: string, formData: ContactFormData): Promise<ActionResult> {
  try {
    const supabase = await createClient()

    // Get current user
    const { data: { user }, error: userError } = await supabase.auth.getUser()

    if (userError || !user) {
      return { error: 'You must be logged in to update a contact' }
    }

    // Check if contact exists and user has permission
    const { data: existingContact, error: fetchError } = await supabase
      .from('contacts')
      .select('id, owner_id')
      .eq('id', id)
      .is('deleted_at', null)
      .single()

    if (fetchError || !existingContact) {
      return { error: 'Contact not found' }
    }

    // Process custom fields to convert array to object
    const customFieldsObj: Record<string, string> = {}
    if (formData.custom_fields) {
      formData.custom_fields.forEach(field => {
        if (field.key.trim() && field.value.trim()) {
          customFieldsObj[field.key.trim()] = field.value.trim()
        }
      })
    }

    // Prepare contact data
    const contactData = {
      first_name: formData.first_name.trim(),
      last_name: formData.last_name.trim(),
      email: formData.email.trim().toLowerCase(),
      phone: formData.phone?.trim() || null,
      company: formData.company?.trim() || null,
      title: formData.title?.trim() || null,
      status: formData.status,
      custom_fields: customFieldsObj,
      updated_at: new Date().toISOString()
    }

    // Update contact
    const { data, error } = await supabase
      .from('contacts')
      .update(contactData)
      .eq('id', id)
      .select()
      .single()

    if (error) {
      console.error('Error updating contact:', error)

      // Handle specific errors
      if (error.code === '23505') {
        return { error: 'A contact with this email already exists' }
      }

      return { error: 'Failed to update contact. Please try again.' }
    }

    // Revalidate related pages
    revalidatePath('/contacts')
    revalidatePath(`/contacts/${id}`)

    return { data }
  } catch (error) {
    console.error('Unexpected error in updateContact:', error)
    return { error: 'An unexpected error occurred. Please try again.' }
  }
}

export async function deleteContact(id: string): Promise<ActionResult> {
  try {
    const supabase = await createClient()

    // Get current user
    const { data: { user }, error: userError } = await supabase.auth.getUser()

    if (userError || !user) {
      return { error: 'You must be logged in to delete a contact' }
    }

    // Soft delete the contact
    const { error } = await supabase
      .from('contacts')
      .update({ deleted_at: new Date().toISOString() })
      .eq('id', id)
      .is('deleted_at', null)

    if (error) {
      console.error('Error deleting contact:', error)
      return { error: 'Failed to delete contact. Please try again.' }
    }

    // Revalidate contacts page
    revalidatePath('/contacts')

    return { data: { success: true } }
  } catch (error) {
    console.error('Unexpected error in deleteContact:', error)
    return { error: 'An unexpected error occurred. Please try again.' }
  }
}

interface ImportContactData {
  first_name: string
  last_name: string
  email: string
  phone?: string
  company?: string
  title?: string
  status?: 'lead' | 'customer'
}

interface ImportResult {
  success: number
  failed: number
  duplicates: number
  errors: Array<{ row: number; error: string }>
}

export async function importContactsFromCSV(contacts: ImportContactData[]): Promise<ActionResult> {
  try {
    const supabase = await createClient()

    // Get current user
    const { data: { user }, error: userError } = await supabase.auth.getUser()

    if (userError || !user) {
      return { error: 'You must be logged in to import contacts' }
    }

    const result: ImportResult = {
      success: 0,
      failed: 0,
      duplicates: 0,
      errors: []
    }

    // Get existing emails to check for duplicates
    const { data: existingContacts } = await supabase
      .from('contacts')
      .select('email')
      .is('deleted_at', null)

    const existingEmails = new Set(
      existingContacts?.map(c => c.email.toLowerCase()) || []
    )

    // Process each contact
    for (let i = 0; i < contacts.length; i++) {
      const contact = contacts[i]
      const rowNumber = i + 2 // +2 because row 1 is headers and array is 0-indexed

      try {
        // Validate required fields
        if (!contact.first_name?.trim()) {
          result.failed++
          result.errors.push({ row: rowNumber, error: 'First name is required' })
          continue
        }

        if (!contact.last_name?.trim()) {
          result.failed++
          result.errors.push({ row: rowNumber, error: 'Last name is required' })
          continue
        }

        if (!contact.email?.trim()) {
          result.failed++
          result.errors.push({ row: rowNumber, error: 'Email is required' })
          continue
        }

        // Validate email format
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
        if (!emailRegex.test(contact.email)) {
          result.failed++
          result.errors.push({ row: rowNumber, error: 'Invalid email format' })
          continue
        }

        // Check for duplicate email
        const emailLower = contact.email.trim().toLowerCase()
        if (existingEmails.has(emailLower)) {
          result.duplicates++
          continue
        }

        // Validate status if provided
        if (contact.status && !['lead', 'customer'].includes(contact.status)) {
          result.failed++
          result.errors.push({ row: rowNumber, error: 'Status must be "lead" or "customer"' })
          continue
        }

        // Prepare contact data
        const contactData = {
          first_name: contact.first_name.trim(),
          last_name: contact.last_name.trim(),
          email: emailLower,
          phone: contact.phone?.trim() || null,
          company: contact.company?.trim() || null,
          title: contact.title?.trim() || null,
          status: contact.status || 'lead',
          owner_id: user.id
        }

        // Insert contact
        const { error: insertError } = await supabase
          .from('contacts')
          .insert(contactData)

        if (insertError) {
          result.failed++
          result.errors.push({
            row: rowNumber,
            error: insertError.message || 'Failed to insert contact'
          })
        } else {
          result.success++
          // Add to existing emails set to prevent duplicates within the same import
          existingEmails.add(emailLower)
        }
      } catch (err) {
        result.failed++
        result.errors.push({
          row: rowNumber,
          error: err instanceof Error ? err.message : 'Unknown error'
        })
      }
    }

    // Revalidate contacts page
    revalidatePath('/contacts')

    return { data: result }
  } catch (error) {
    console.error('Unexpected error in importContactsFromCSV:', error)
    return { error: 'An unexpected error occurred during import. Please try again.' }
  }
}

interface ExportFilters {
  search?: string
  status?: string
  owner?: string
}

export async function exportContactsToCSV(filters: ExportFilters = {}): Promise<ActionResult> {
  try {
    const supabase = await createClient()

    // Get current user
    const { data: { user }, error: userError } = await supabase.auth.getUser()

    if (userError || !user) {
      return { error: 'You must be logged in to export contacts' }
    }

    // Build query
    let query = supabase
      .from('contacts')
      .select('first_name, last_name, email, phone, company, title, status, custom_fields, created_at')
      .is('deleted_at', null)
      .order('created_at', { ascending: false })

    // Apply search filter
    if (filters.search) {
      query = query.or(
        `first_name.ilike.%${filters.search}%,last_name.ilike.%${filters.search}%,email.ilike.%${filters.search}%,company.ilike.%${filters.search}%`
      )
    }

    // Apply status filter
    if (filters.status && filters.status !== 'all') {
      query = query.eq('status', filters.status)
    }

    // Apply owner filter
    if (filters.owner && filters.owner !== 'all') {
      query = query.eq('owner_id', filters.owner)
    }

    // Execute query
    const { data: contacts, error } = await query

    if (error) {
      console.error('Error fetching contacts for export:', error)
      return { error: 'Failed to fetch contacts for export' }
    }

    if (!contacts || contacts.length === 0) {
      return { error: 'No contacts found to export' }
    }

    // Collect all unique custom field keys
    const customFieldKeys = new Set<string>()
    contacts.forEach(contact => {
      if (contact.custom_fields) {
        Object.keys(contact.custom_fields).forEach(key => customFieldKeys.add(key))
      }
    })

    // Generate CSV
    const baseHeaders = ['First Name', 'Last Name', 'Email', 'Phone', 'Company', 'Title', 'Status', 'Created Date']
    const customHeaders = Array.from(customFieldKeys).sort()
    const headers = [...baseHeaders, ...customHeaders]
    const csvRows = [headers.join(',')]

    contacts.forEach(contact => {
      const baseRow = [
        `"${contact.first_name}"`,
        `"${contact.last_name}"`,
        `"${contact.email}"`,
        `"${contact.phone || ''}"`,
        `"${contact.company || ''}"`,
        `"${contact.title || ''}"`,
        `"${contact.status}"`,
        `"${new Date(contact.created_at).toLocaleDateString()}"`
      ]

      // Add custom field values in the same order as headers
      const customValues = customHeaders.map(key => {
        const value = contact.custom_fields?.[key]
        return `"${value ? String(value) : ''}"`
      })

      csvRows.push([...baseRow, ...customValues].join(','))
    })

    const csv = csvRows.join('\n')

    return { data: { csv, count: contacts.length } }
  } catch (error) {
    console.error('Unexpected error in exportContactsToCSV:', error)
    return { error: 'An unexpected error occurred during export. Please try again.' }
  }
}
