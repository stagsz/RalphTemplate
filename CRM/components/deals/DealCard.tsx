'use client'

import { useSortable } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import Link from 'next/link'

export interface Deal {
  id: string
  title: string
  amount: number
  stage: 'lead' | 'proposal' | 'negotiation' | 'closed-won' | 'closed-lost'
  probability: number
  contact: {
    id: string
    first_name: string
    last_name: string
    company?: string
  } | null
  created_at: string
}

interface DealCardProps {
  deal: Deal
  stageColor: string
  isDragging?: boolean
}

export function DealCard({ deal, stageColor, isDragging }: DealCardProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
  } = useSortable({ id: deal.id })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  }

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      className={`block p-3 rounded border-l-4 ${stageColor} dark:bg-gray-700 border-current hover:shadow-md transition cursor-grab active:cursor-grabbing ${
        isDragging ? 'opacity-50 shadow-lg' : ''
      }`}
    >
      <Link href={`/deals/${deal.id}`} onClick={(e) => e.stopPropagation()}>
        <p className="text-sm font-medium text-gray-900 dark:text-gray-100 truncate hover:text-blue-600 dark:hover:text-blue-400">
          {deal.title}
        </p>
      </Link>
      <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">
        {deal.contact?.first_name} {deal.contact?.last_name}
      </p>
      <div className="flex justify-between items-end mt-2">
        <p className="text-sm font-semibold text-gray-900 dark:text-gray-100">
          ${deal.amount.toLocaleString('en-US', { maximumFractionDigits: 0 })}
        </p>
        <span className="text-xs text-gray-500 dark:text-gray-400">{deal.probability}%</span>
      </div>
    </div>
  )
}
