import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest'
import { createActivity, updateActivity, deleteActivity, getActivityById } from '@/app/activities/actions'

// Mock Supabase
const mockSupabase = {
  auth: {
    getUser: vi.fn()
  },
  from: vi.fn().mockReturnThis(),
  insert: vi.fn().mockReturnThis(),
  update: vi.fn().mockReturnThis(),
  select: vi.fn().mockReturnThis(),
  eq: vi.fn().mockReturnThis(),
  is: vi.fn().mockReturnThis(),
  single: vi.fn().mockReturnThis(),
  order: vi.fn().mockReturnThis()
}

vi.mock('@/lib/supabase/server', () => ({
  createClient: () => mockSupabase
}))

vi.mock('next/cache', () => ({
  revalidatePath: vi.fn()
}))

describe('Activity Actions', () => {
  const mockUser = {
    id: 'user-123',
    email: 'test@example.com'
  }

  beforeEach(() => {
    vi.clearAllMocks()
    mockSupabase.auth.getUser.mockResolvedValue({
      data: { user: mockUser }
    })
  })

  describe('createActivity', () => {
    it('should create a new activity with required fields', async () => {
      const mockActivity = {
        id: 'activity-123',
        type: 'call',
        subject: 'Test Call',
        owner_id: mockUser.id
      }

      mockSupabase.insert.mockReturnValue({
        select: () => ({
          single: () => Promise.resolve({
            data: mockActivity,
            error: null
          })
        })
      })

      const formData = new FormData()
      formData.append('type', 'call')
      formData.append('subject', 'Test Call')
      formData.append('contact_id', 'contact-123')

      const result = await createActivity(formData)

      expect(result.error).toBeNull()
      expect(result.data).toEqual(mockActivity)
      expect(mockSupabase.from).toHaveBeenCalledWith('activities')
      expect(mockSupabase.insert).toHaveBeenCalledWith(
        expect.objectContaining({
          type: 'call',
          subject: 'Test Call',
          contact_id: 'contact-123',
          owner_id: mockUser.id
        })
      )
    })

    it('should return error when type is missing', async () => {
      const formData = new FormData()
      formData.append('subject', 'Test Activity')
      formData.append('contact_id', 'contact-123')

      const result = await createActivity(formData)

      expect(result.error).toBe('Type and subject are required')
    })

    it('should return error when subject is missing', async () => {
      const formData = new FormData()
      formData.append('type', 'call')
      formData.append('contact_id', 'contact-123')

      const result = await createActivity(formData)

      expect(result.error).toBe('Type and subject are required')
    })

    it('should return error when neither contact_id nor deal_id is provided', async () => {
      const formData = new FormData()
      formData.append('type', 'call')
      formData.append('subject', 'Test Call')

      const result = await createActivity(formData)

      expect(result.error).toBe('Either contact_id or deal_id is required')
    })

    it('should handle duration_minutes correctly', async () => {
      const mockActivity = {
        id: 'activity-123',
        type: 'meeting',
        subject: 'Test Meeting',
        duration_minutes: 30,
        owner_id: mockUser.id
      }

      mockSupabase.insert.mockReturnValue({
        select: () => ({
          single: () => Promise.resolve({
            data: mockActivity,
            error: null
          })
        })
      })

      const formData = new FormData()
      formData.append('type', 'meeting')
      formData.append('subject', 'Test Meeting')
      formData.append('contact_id', 'contact-123')
      formData.append('duration_minutes', '30')

      const result = await createActivity(formData)

      expect(result.error).toBeNull()
      expect(mockSupabase.insert).toHaveBeenCalledWith(
        expect.objectContaining({
          duration_minutes: 30
        })
      )
    })
  })

  describe('updateActivity', () => {
    it('should update an existing activity', async () => {
      const mockActivity = {
        id: 'activity-123',
        subject: 'Updated Subject',
        contact_id: 'contact-123'
      }

      mockSupabase.update.mockReturnValue({
        eq: () => ({
          select: () => ({
            single: () => Promise.resolve({
              data: mockActivity,
              error: null
            })
          })
        })
      })

      const formData = new FormData()
      formData.append('subject', 'Updated Subject')

      const result = await updateActivity('activity-123', formData)

      expect(result.error).toBeNull()
      expect(result.data).toEqual(mockActivity)
      expect(mockSupabase.update).toHaveBeenCalledWith(
        expect.objectContaining({
          subject: 'Updated Subject',
          updated_at: expect.any(String)
        })
      )
    })

    it('should auto-set completed_at when status changes to completed', async () => {
      const mockActivity = {
        id: 'activity-123',
        status: 'completed',
        completed_at: expect.any(String)
      }

      mockSupabase.update.mockReturnValue({
        eq: () => ({
          select: () => ({
            single: () => Promise.resolve({
              data: mockActivity,
              error: null
            })
          })
        })
      })

      const formData = new FormData()
      formData.append('status', 'completed')

      const result = await updateActivity('activity-123', formData)

      expect(result.error).toBeNull()
      expect(mockSupabase.update).toHaveBeenCalledWith(
        expect.objectContaining({
          status: 'completed',
          completed_at: expect.any(String)
        })
      )
    })
  })

  describe('deleteActivity', () => {
    it('should soft delete an activity', async () => {
      const mockActivity = {
        contact_id: 'contact-123',
        deal_id: null
      }

      mockSupabase.select.mockReturnValue({
        eq: () => ({
          single: () => Promise.resolve({
            data: mockActivity,
            error: null
          })
        })
      })

      mockSupabase.update.mockReturnValue({
        eq: () => Promise.resolve({
          error: null
        })
      })

      const result = await deleteActivity('activity-123')

      expect(result.error).toBeNull()
      expect(mockSupabase.update).toHaveBeenCalledWith({
        deleted_at: expect.any(String)
      })
    })

    it('should return error when user is not authenticated', async () => {
      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: null }
      })

      const result = await deleteActivity('activity-123')

      expect(result.error).toBe('Unauthorized')
    })
  })

  describe('getActivityById', () => {
    it('should fetch activity with related data', async () => {
      const mockActivity = {
        id: 'activity-123',
        type: 'call',
        subject: 'Test Call',
        contact: {
          id: 'contact-123',
          first_name: 'John',
          last_name: 'Doe',
          company: 'Acme Inc'
        },
        deal: {
          id: 'deal-123',
          title: 'Test Deal',
          amount: 1000
        },
        owner: {
          id: 'user-123',
          email: 'test@example.com'
        }
      }

      mockSupabase.select.mockReturnValue({
        eq: () => ({
          is: () => ({
            single: () => Promise.resolve({
              data: mockActivity,
              error: null
            })
          })
        })
      })

      const result = await getActivityById('activity-123')

      expect(result).toEqual(mockActivity)
      expect(mockSupabase.select).toHaveBeenCalledWith(
        expect.stringContaining('contact:contacts(id, first_name, last_name, company)')
      )
    })

    it('should return null when activity is not found', async () => {
      mockSupabase.select.mockReturnValue({
        eq: () => ({
          is: () => ({
            single: () => Promise.resolve({
              data: null,
              error: { message: 'Not found' }
            })
          })
        })
      })

      const result = await getActivityById('nonexistent-id')

      expect(result).toBeNull()
    })
  })
})