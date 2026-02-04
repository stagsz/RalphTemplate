import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import ActivityForm from '@/components/activities/ActivityForm'

// Mock the actions with factory function
vi.mock('@/app/activities/actions', () => ({
  createActivity: vi.fn(),
  updateActivity: vi.fn()
}))

// Get the mocked functions
import { createActivity, updateActivity } from '@/app/activities/actions'
const mockCreateActivity = vi.mocked(createActivity)
const mockUpdateActivity = vi.mocked(updateActivity)

describe('ActivityForm', () => {
  const mockOnSuccess = vi.fn()
  const mockOnCancel = vi.fn()

  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('Create Mode', () => {
    it('should render form with default values', () => {
      render(<ActivityForm onSuccess={mockOnSuccess} onCancel={mockOnCancel} />)

      expect(screen.getByLabelText(/type/i)).toBeInTheDocument()
      expect(screen.getByLabelText(/subject/i)).toBeInTheDocument()
      expect(screen.getByLabelText(/description/i)).toBeInTheDocument()
      expect(screen.getByText('Create Activity')).toBeInTheDocument()
    })

    it('should show all activity type options', () => {
      render(<ActivityForm />)

      const typeSelect = screen.getByLabelText(/type/i)
      expect(typeSelect).toHaveValue('note') // default value

      fireEvent.click(typeSelect)
      expect(screen.getByText('📞 Call')).toBeInTheDocument()
      expect(screen.getByText('🤝 Meeting')).toBeInTheDocument()
      expect(screen.getByText('📧 Email')).toBeInTheDocument()
      expect(screen.getByText('📝 Note')).toBeInTheDocument()
      expect(screen.getByText('✅ Task')).toBeInTheDocument()
    })

    it('should submit form with correct data', async () => {
      const user = userEvent.setup()
      mockCreateActivity.mockResolvedValue({ error: null, data: { id: '123' } })

      render(
        <ActivityForm 
          contactId="contact-123" 
          onSuccess={mockOnSuccess} 
        />
      )

      await user.selectOptions(screen.getByLabelText(/type/i), 'call')
      await user.type(screen.getByLabelText(/subject/i), 'Test call with client')
      await user.type(screen.getByLabelText(/description/i), 'Discussed project requirements')
      await user.type(screen.getByLabelText(/duration/i), '30')

      await user.click(screen.getByText('Create Activity'))

      await waitFor(() => {
        expect(mockCreateActivity).toHaveBeenCalledWith(
          expect.any(FormData)
        )
        expect(mockOnSuccess).toHaveBeenCalled()
      })
    })

    it('should display error when submission fails', async () => {
      const user = userEvent.setup()
      mockCreateActivity.mockResolvedValue({ error: 'Something went wrong' })

      render(<ActivityForm />)

      await user.type(screen.getByLabelText(/subject/i), 'Test')
      await user.click(screen.getByText('Create Activity'))

      await waitFor(() => {
        expect(screen.getByText('Something went wrong')).toBeInTheDocument()
      })
    })

    it('should show loading state during submission', async () => {
      const user = userEvent.setup()
      mockCreateActivity.mockImplementation(() => 
        new Promise(resolve => setTimeout(() => resolve({ error: null }), 100))
      )

      render(<ActivityForm />)

      await user.type(screen.getByLabelText(/subject/i), 'Test')
      await user.click(screen.getByText('Create Activity'))

      expect(screen.getByText('Saving...')).toBeInTheDocument()
    })
  })

  describe('Edit Mode', () => {
    const mockActivity = {
      id: 'activity-123',
      type: 'meeting',
      subject: 'Existing Meeting',
      description: 'Meeting description',
      status: 'completed',
      priority: 'high',
      due_date: '2023-12-01T10:00',
      duration_minutes: 60
    }

    it('should pre-populate form with activity data', () => {
      render(
        <ActivityForm 
          mode="edit" 
          activity={mockActivity} 
          onSuccess={mockOnSuccess} 
        />
      )

      // Check that the correct option is selected by value
      expect(screen.getByRole('combobox', { name: /type/i })).toHaveValue('meeting')
      expect(screen.getByDisplayValue('Existing Meeting')).toBeInTheDocument()
      expect(screen.getByDisplayValue('Meeting description')).toBeInTheDocument()
      expect(screen.getByRole('combobox', { name: /status/i })).toHaveValue('completed')
      expect(screen.getByRole('combobox', { name: /priority/i })).toHaveValue('high')
      expect(screen.getByDisplayValue('60')).toBeInTheDocument()
      expect(screen.getByText('Update Activity')).toBeInTheDocument()
    })

    it('should call updateActivity when form is submitted', async () => {
      const user = userEvent.setup()
      mockUpdateActivity.mockResolvedValue({ error: null, data: mockActivity })

      render(
        <ActivityForm 
          mode="edit" 
          activity={mockActivity} 
          onSuccess={mockOnSuccess} 
        />
      )

      await user.clear(screen.getByDisplayValue('Existing Meeting'))
      await user.type(screen.getByLabelText(/subject/i), 'Updated Meeting')
      await user.click(screen.getByText('Update Activity'))

      await waitFor(() => {
        expect(mockUpdateActivity).toHaveBeenCalledWith(
          'activity-123',
          expect.any(FormData)
        )
        expect(mockOnSuccess).toHaveBeenCalled()
      })
    })
  })

  describe('Task-specific fields', () => {
    it('should show status, priority, and due date fields', () => {
      render(<ActivityForm />)

      expect(screen.getByLabelText(/status/i)).toBeInTheDocument()
      expect(screen.getByLabelText(/priority/i)).toBeInTheDocument()
      expect(screen.getByLabelText(/due date/i)).toBeInTheDocument()
    })

    it('should have correct default values for task fields', () => {
      render(<ActivityForm />)

      expect(screen.getByRole('combobox', { name: /status/i })).toHaveValue('todo') // status
      expect(screen.getByRole('combobox', { name: /priority/i })).toHaveValue('medium') // priority
    })
  })

  describe('Cancel functionality', () => {
    it('should call onCancel when cancel button is clicked', async () => {
      const user = userEvent.setup()
      render(<ActivityForm onCancel={mockOnCancel} />)

      await user.click(screen.getByText('Cancel'))

      expect(mockOnCancel).toHaveBeenCalled()
    })

    it('should not show cancel button when onCancel is not provided', () => {
      render(<ActivityForm />)

      expect(screen.queryByText('Cancel')).not.toBeInTheDocument()
    })
  })
})