import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'

export type UserRole = 'admin' | 'user'

export interface UserWithRole {
  id: string
  email: string
  full_name: string | null
  role: UserRole
}

/**
 * Get current user with role information
 * Returns null if not authenticated
 */
export async function getCurrentUser(): Promise<UserWithRole | null> {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return null
  }

  const { data: profile } = await supabase
    .from('users')
    .select('id, email, full_name, role')
    .eq('id', user.id)
    .single()

  if (!profile) {
    return null
  }

  return profile as UserWithRole
}

/**
 * Require user to be authenticated
 * Redirects to login if not authenticated
 */
export async function requireAuth(): Promise<UserWithRole> {
  const user = await getCurrentUser()

  if (!user) {
    redirect('/login')
  }

  return user
}

/**
 * Require user to have admin role
 * Redirects to home with error if not admin
 */
export async function requireAdmin(): Promise<UserWithRole> {
  const user = await requireAuth()

  if (user.role !== 'admin') {
    redirect('/?error=' + encodeURIComponent('Admin access required'))
  }

  return user
}

/**
 * Check if current user is admin
 * Returns false if not authenticated
 */
export async function isAdmin(): Promise<boolean> {
  const user = await getCurrentUser()
  return user?.role === 'admin'
}

/**
 * Check if current user has specific role
 */
export async function hasRole(role: UserRole): Promise<boolean> {
  const user = await getCurrentUser()
  return user?.role === role
}
