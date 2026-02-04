'use client'

import { useRouter } from 'next/navigation'
import ActivityForm from './ActivityForm'

interface ActivityFormWrapperProps {
  mode?: 'create' | 'edit'
  contactId?: string
  dealId?: string
  activity?: any
  redirectPath: string
}

export default function ActivityFormWrapper({
  mode = 'create',
  contactId,
  dealId,
  activity,
  redirectPath
}: ActivityFormWrapperProps) {
  const router = useRouter()

  const handleSuccess = () => {
    router.push(redirectPath)
    router.refresh()
  }

  const handleCancel = () => {
    router.back()
  }

  return (
    <ActivityForm
      mode={mode}
      contactId={contactId}
      dealId={dealId}
      activity={activity}
      onSuccess={handleSuccess}
      onCancel={handleCancel}
    />
  )
}
