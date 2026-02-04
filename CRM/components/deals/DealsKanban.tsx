'use client'

import { useState } from 'react'
import {
  DndContext,
  DragEndEvent,
  DragOverEvent,
  DragOverlay,
  DragStartEvent,
  PointerSensor,
  useSensor,
  useSensors,
  closestCenter,
} from '@dnd-kit/core'
import {
  SortableContext,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable'
import { useDroppable } from '@dnd-kit/core'
import { DealCard, Deal } from './DealCard'
import { updateDealStage } from '@/app/deals/actions'

const STAGES = [
  { key: 'lead', label: 'Lead', color: 'bg-blue-100', textColor: 'text-blue-800' },
  { key: 'proposal', label: 'Proposal', color: 'bg-purple-100', textColor: 'text-purple-800' },
  { key: 'negotiation', label: 'Negotiation', color: 'bg-yellow-100', textColor: 'text-yellow-800' },
  { key: 'closed-won', label: 'Closed Won', color: 'bg-green-100', textColor: 'text-green-800' },
  { key: 'closed-lost', label: 'Closed Lost', color: 'bg-red-100', textColor: 'text-red-800' },
] as const

type StageKey = typeof STAGES[number]['key']

interface DroppableColumnProps {
  stage: typeof STAGES[number]
  deals: Deal[]
  children: React.ReactNode
}

function DroppableColumn({ stage, deals, children }: DroppableColumnProps) {
  const { setNodeRef, isOver } = useDroppable({
    id: stage.key,
  })

  const stageAmount = deals.reduce((sum, d) => sum + d.amount, 0)

  return (
    <div
      ref={setNodeRef}
      className={`bg-white dark:bg-gray-800 rounded-lg p-4 shadow min-h-[200px] transition-colors ${
        isOver ? 'ring-2 ring-blue-500 bg-blue-50 dark:bg-gray-700' : ''
      }`}
    >
      <div className="mb-4">
        <h3 className={`font-medium ${stage.textColor}`}>{stage.label}</h3>
        <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">{deals.length} deals</p>
        <p className="text-sm font-semibold text-gray-900 dark:text-gray-100 mt-2">
          ${stageAmount.toLocaleString('en-US', { maximumFractionDigits: 0 })}
        </p>
      </div>
      <div className="space-y-3">
        {children}
        {deals.length === 0 && (
          <p className="text-center text-sm text-gray-400 dark:text-gray-500 py-4">
            Drop deals here
          </p>
        )}
      </div>
    </div>
  )
}

interface DealsKanbanProps {
  initialDeals: Deal[]
}

export function DealsKanban({ initialDeals }: DealsKanbanProps) {
  const [deals, setDeals] = useState<Deal[]>(initialDeals)
  const [activeId, setActiveId] = useState<string | null>(null)
  const [isUpdating, setIsUpdating] = useState(false)

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    })
  )

  const dealsByStage: Record<StageKey, Deal[]> = {
    lead: [],
    proposal: [],
    negotiation: [],
    'closed-won': [],
    'closed-lost': [],
  }

  deals.forEach((deal) => {
    dealsByStage[deal.stage].push(deal)
  })

  const activeDeal = activeId ? deals.find((d) => d.id === activeId) : null

  function handleDragStart(event: DragStartEvent) {
    setActiveId(event.active.id as string)
  }

  function handleDragOver(event: DragOverEvent) {
    const { active, over } = event
    if (!over) return

    const activeId = active.id as string
    const overId = over.id as string

    const activeDeal = deals.find((d) => d.id === activeId)
    if (!activeDeal) return

    // Check if dropping over a column
    const isOverColumn = STAGES.some((s) => s.key === overId)
    if (isOverColumn) {
      const newStage = overId as StageKey
      if (activeDeal.stage !== newStage) {
        setDeals((prev) =>
          prev.map((d) => (d.id === activeId ? { ...d, stage: newStage } : d))
        )
      }
    } else {
      // Dropping over another deal - find which column that deal is in
      const overDeal = deals.find((d) => d.id === overId)
      if (overDeal && activeDeal.stage !== overDeal.stage) {
        setDeals((prev) =>
          prev.map((d) =>
            d.id === activeId ? { ...d, stage: overDeal.stage } : d
          )
        )
      }
    }
  }

  async function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event
    setActiveId(null)

    if (!over) return

    const activeId = active.id as string
    const activeDeal = deals.find((d) => d.id === activeId)

    if (!activeDeal) return

    // Determine target stage
    let targetStage: StageKey = activeDeal.stage
    const overId = over.id as string

    const isOverColumn = STAGES.some((s) => s.key === overId)
    if (isOverColumn) {
      targetStage = overId as StageKey
    } else {
      const overDeal = deals.find((d) => d.id === overId)
      if (overDeal) {
        targetStage = overDeal.stage
      }
    }

    // Only update if stage changed from original
    const originalDeal = initialDeals.find((d) => d.id === activeId)
    if (!originalDeal || originalDeal.stage === targetStage) {
      // Reset to initial state if no real change
      setDeals(initialDeals)
      return
    }

    // Persist change to server
    setIsUpdating(true)
    const result = await updateDealStage(activeId, targetStage)
    setIsUpdating(false)

    if (result.error) {
      // Revert on error
      console.error('Failed to update deal stage:', result.error)
      setDeals(initialDeals)
    }
  }

  function handleDragCancel() {
    setActiveId(null)
    setDeals(initialDeals)
  }

  const totalAmount = deals.reduce((sum, d) => sum + d.amount, 0)

  return (
    <div>
      {isUpdating && (
        <div className="fixed top-4 right-4 bg-blue-600 text-white px-4 py-2 rounded-lg shadow-lg z-50">
          Updating...
        </div>
      )}
      <p className="text-sm text-gray-600 dark:text-gray-400 mb-6">
        Drag deals between stages to update their status.
        {deals.length > 0 && (
          <span>
            {' '}
            ({deals.length} total, ${totalAmount.toLocaleString('en-US', { maximumFractionDigits: 0 })})
          </span>
        )}
      </p>
      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragStart={handleDragStart}
        onDragOver={handleDragOver}
        onDragEnd={handleDragEnd}
        onDragCancel={handleDragCancel}
      >
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-4">
          {STAGES.map((stage) => {
            const stageDeals = dealsByStage[stage.key]
            return (
              <SortableContext
                key={stage.key}
                items={stageDeals.map((d) => d.id)}
                strategy={verticalListSortingStrategy}
              >
                <DroppableColumn stage={stage} deals={stageDeals}>
                  {stageDeals.map((deal) => (
                    <DealCard
                      key={deal.id}
                      deal={deal}
                      stageColor={stage.color}
                      isDragging={deal.id === activeId}
                    />
                  ))}
                </DroppableColumn>
              </SortableContext>
            )
          })}
        </div>
        <DragOverlay>
          {activeDeal ? (
            <div className="opacity-90 shadow-xl">
              <DealCard
                deal={activeDeal}
                stageColor={STAGES.find((s) => s.key === activeDeal.stage)?.color || 'bg-gray-100'}
              />
            </div>
          ) : null}
        </DragOverlay>
      </DndContext>
    </div>
  )
}
