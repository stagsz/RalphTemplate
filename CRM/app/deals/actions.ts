'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

interface DealFormData {
  title: string
  description?: string
  contact_id: string
  amount: number
  expected_close_date?: string
  stage?: 'lead' | 'proposal' | 'negotiation' | 'closed-won' | 'closed-lost'
  probability?: number
}

interface ActionResult {
  data?: any
  error?: string
}

export async function createDeal(formData: DealFormData): Promise<ActionResult> {
  try {
    const supabase = await createClient()
    const { data: { user }, error: userError } = await supabase.auth.getUser()

    if (userError || !user) {
      return { error: 'You must be logged in to create a deal' }
    }

    const dealData = {
      title: formData.title.trim(),
      description: formData.description?.trim() || null,
      contact_id: formData.contact_id,
      amount: formData.amount,
      expected_close_date: formData.expected_close_date || null,
      stage: formData.stage || 'lead',
      probability: formData.probability || 0,
      owner_id: user.id
    }

    const { data, error } = await supabase
      .from('deals')
      .insert(dealData)
      .select()
      .single()

    if (error) {
      console.error('Error creating deal:', error)
      return { error: 'Failed to create deal. Please try again.' }
    }

    revalidatePath('/deals')
    return { data }
  } catch (error) {
    console.error('Unexpected error in createDeal:', error)
    return { error: 'An unexpected error occurred. Please try again.' }
  }
}

export async function updateDeal(id: string, formData: Partial<DealFormData>): Promise<ActionResult> {
  try {
    const supabase = await createClient()
    const { data: { user }, error: userError } = await supabase.auth.getUser()

    if (userError || !user) {
      return { error: 'You must be logged in to update a deal' }
    }

    const dealData: any = { updated_at: new Date().toISOString() }

    if (formData.title) dealData.title = formData.title.trim()
    if (formData.description !== undefined) dealData.description = formData.description?.trim() || null
    if (formData.amount) dealData.amount = formData.amount
    if (formData.expected_close_date) dealData.expected_close_date = formData.expected_close_date
    if (formData.stage) dealData.stage = formData.stage
    if (formData.probability !== undefined) dealData.probability = formData.probability

    const { data, error } = await supabase
      .from('deals')
      .update(dealData)
      .eq('id', id)
      .select()
      .single()

    if (error) {
      console.error('Error updating deal:', error)
      return { error: 'Failed to update deal. Please try again.' }
    }

    revalidatePath('/deals')
    revalidatePath(`/deals/${id}`)
    return { data }
  } catch (error) {
    console.error('Unexpected error in updateDeal:', error)
    return { error: 'An unexpected error occurred. Please try again.' }
  }
}

export async function deleteDeal(id: string): Promise<ActionResult> {
  try {
    const supabase = await createClient()
    const { data: { user }, error: userError } = await supabase.auth.getUser()

    if (userError || !user) {
      return { error: 'You must be logged in to delete a deal' }
    }

    const { error } = await supabase
      .from('deals')
      .update({ deleted_at: new Date().toISOString() })
      .eq('id', id)
      .is('deleted_at', null)

    if (error) {
      console.error('Error deleting deal:', error)
      return { error: 'Failed to delete deal. Please try again.' }
    }

    revalidatePath('/deals')
    return { data: { success: true } }
  } catch (error) {
    console.error('Unexpected error in deleteDeal:', error)
    return { error: 'An unexpected error occurred. Please try again.' }
  }
}

export async function updateDealStage(
  id: string,
  stage: 'lead' | 'proposal' | 'negotiation' | 'closed-won' | 'closed-lost'
): Promise<ActionResult> {
  try {
    const supabase = await createClient()
    const { data: { user }, error: userError } = await supabase.auth.getUser()

    if (userError || !user) {
      return { error: 'You must be logged in to update a deal' }
    }

    const { data, error } = await supabase
      .from('deals')
      .update({
        stage,
        updated_at: new Date().toISOString(),
      })
      .eq('id', id)
      .select()
      .single()

    if (error) {
      console.error('Error updating deal stage:', error)
      return { error: 'Failed to update deal stage. Please try again.' }
    }

    revalidatePath('/deals')
    revalidatePath(`/deals/${id}`)
    return { data }
  } catch (error) {
    console.error('Unexpected error in updateDealStage:', error)
    return { error: 'An unexpected error occurred. Please try again.' }
  }
}

export async function getDealById(id: string): Promise<ActionResult> {
  try {
    const supabase = await createClient()
    const { data, error } = await supabase
      .from('deals')
      .select(`
        *,
        contact:contacts(id, first_name, last_name, email, company),
        owner:users(id, full_name, email)
      `)
      .eq('id', id)
      .is('deleted_at', null)
      .single()

    if (error) {
      console.error('Error fetching deal:', error)
      return { error: 'Deal not found' }
    }

    return { data }
  } catch (error) {
    console.error('Unexpected error in getDealById:', error)
    return { error: 'Failed to fetch deal' }
  }
}
