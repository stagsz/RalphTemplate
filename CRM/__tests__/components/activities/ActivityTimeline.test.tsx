import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import ActivityTimeline from '@/components/activities/ActivityTimeline'
import type { Activity } from '@/app/activities/actions'

// Mock the utils
vi.mock('@/lib/utils', () => ({
  formatDistanceToNow: vi.fn((date) => '2 hours')
}))

describe('ActivityTimeline', () => {
  const mockActivities: Activity[] = [
    {
      id: 'activity-1',
      type: 'call',
      subject: 'Client call',
      description: 'Discussed project requirements',
      contact_id: 'contact-1',
      deal_id: null,
      owner_id: 'user-1',
      assigned_to: 'user-1',
      status: 'completed',
      priority: 'high',
      due_date: null,
      completed_at: null,
      duration_minutes: 30,
      created_at: '2023-12-01T10:00:00Z',
      updated_at: '2023-12-01T10:00:00Z'
    },
    {
      id: 'activity-2',
      type: 'task',
      subject: 'Follow up email',
      description: null,
      contact_id: null,
      deal_id: 'deal-1',
      owner_id: 'user-1',
      assigned_to: 'user-1',
      status: 'todo',
      priority: 'medium',
      due_date: '2023-12-05T09:00:00Z',
      completed_at: null,
      duration_minutes: null,
      created_at: '2023-12-01T11:00:00Z',
      updated_at: '2023-12-01T11:00:00Z'
    },
    {
      id: 'activity-3',
      type: 'meeting',
      subject: 'Team standup',
      description: 'Daily standup meeting',
      contact_id: null,
      deal_id: null,
      owner_id: 'user-1',
      assigned_to: 'user-1',
      status: null,
      priority: 'low',
      due_date: null,
      completed_at: null,
      duration_minutes: 15,
      created_at: '2023-12-01T09:00:00Z',
      updated_at: '2023-12-01T09:00:00Z'
    }
  ]

  describe('Empty state', () => {
    it('should show empty message when no activities', () => {
      render(<ActivityTimeline activities={[]} />)

      expect(screen.getByText('No activities yet')).toBeInTheDocument()
      expect(screen.getByText('Activities will appear here as they are logged')).toBeInTheDocument()
    })
  })

  describe('Activity rendering', () => {
    it('should render all activities in timeline', () => {
      render(<ActivityTimeline activities={mockActivities} />)

      expect(screen.getByText('Client call')).toBeInTheDocument()
      expect(screen.getByText('Follow up email')).toBeInTheDocument()
      expect(screen.getByText('Team standup')).toBeInTheDocument()
    })

    it('should display correct icons for each activity type', () => {
      render(<ActivityTimeline activities={mockActivities} />)

      // Check for activity type icons (emojis)
      expect(screen.getByText('📞')).toBeInTheDocument() // call
      expect(screen.getByText('✅')).toBeInTheDocument() // task
      expect(screen.getByText('🤝')).toBeInTheDocument() // meeting
    })

    it('should show duration for activities that have it', () => {
      render(<ActivityTimeline activities={mockActivities} />)

      expect(screen.getByText('• 30 min')).toBeInTheDocument()
      expect(screen.getByText('• 15 min')).toBeInTheDocument()
    })

    it('should show status badges for tasks', () => {
      render(<ActivityTimeline activities={mockActivities} />)

      // Only tasks should show status badges, and we only have one task with "todo" status
      // The first activity (call) with "completed" status shouldn't show a status badge since it's not a task
      expect(screen.getByText('todo')).toBeInTheDocument()
      
      // Verify that non-task activities don't show status badges
      const callActivity = screen.getByText('Client call')
      expect(callActivity.closest('li')).not.toHaveTextContent('completed')
    })

    it('should show due dates for tasks', () => {
      render(<ActivityTimeline activities={mockActivities} />)

      // Due date is shown in toLocaleDateString format which may vary
      expect(screen.getByText((content) => content.includes('Due:') && content.includes('2023'))).toBeInTheDocument()
    })

    it('should show descriptions when present', () => {
      render(<ActivityTimeline activities={mockActivities} />)

      expect(screen.getByText('Discussed project requirements')).toBeInTheDocument()
      expect(screen.getByText('Daily standup meeting')).toBeInTheDocument()
    })

    it('should show relative time for all activities', () => {
      render(<ActivityTimeline activities={mockActivities} />)

      const timeElements = screen.getAllByText(/2 hours ago/)
      expect(timeElements).toHaveLength(3) // One for each activity
    })
  })

  describe('Contact and Deal display', () => {
    const activitiesWithRelations = [
      {
        ...mockActivities[0],
        contact: {
          id: 'contact-1',
          first_name: 'John',
          last_name: 'Doe',
          company: 'Acme Inc'
        }
      },
      {
        ...mockActivities[1],
        deal: {
          id: 'deal-1',
          title: 'Big Deal',
          amount: 50000
        }
      }
    ]

    it('should show contact info when showContact is true', () => {
      render(
        <ActivityTimeline 
          activities={activitiesWithRelations} 
          showContact={true} 
        />
      )

      expect(screen.getByText('Contact: John Doe • Acme Inc')).toBeInTheDocument()
    })

    it('should show deal info when showDeal is true', () => {
      render(
        <ActivityTimeline 
          activities={activitiesWithRelations} 
          showDeal={true} 
        />
      )

      // Deal amount is formatted with toLocaleString which adds commas differently
      expect(screen.getByText((content) => 
        content.includes('Deal:') && 
        content.includes('Big Deal') && 
        content.includes('50') && 
        content.includes('000')
      )).toBeInTheDocument()
    })

    it('should not show contact/deal info by default', () => {
      render(<ActivityTimeline activities={activitiesWithRelations} />)

      expect(screen.queryByText(/Contact:/)).not.toBeInTheDocument()
      expect(screen.queryByText(/Deal:/)).not.toBeInTheDocument()
    })
  })

  describe('Activity type styling', () => {
    it('should apply correct CSS classes based on activity type', () => {
      const { container } = render(<ActivityTimeline activities={mockActivities} />)

      // Check for activity type specific styling
      const callActivity = container.querySelector('.bg-blue-100')
      const taskActivity = container.querySelector('.bg-indigo-100')
      const meetingActivity = container.querySelector('.bg-purple-100')

      expect(callActivity).toBeInTheDocument()
      expect(taskActivity).toBeInTheDocument()
      expect(meetingActivity).toBeInTheDocument()
    })
  })
})