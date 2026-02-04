'use client'

import dynamic from 'next/dynamic'
import { useTheme } from '@/components/providers/ThemeProvider'

const PipelineChart = dynamic(() => import('./PipelineChart'), {
  ssr: false,
  loading: () => (
    <div className="flex items-center justify-center h-[300px]">
      <div className="text-gray-500 dark:text-gray-400">Loading chart...</div>
    </div>
  )
})

interface PipelineChartWrapperProps {
  data: {
    stage: string
    count: number
    value: number
    color: string
  }[]
}

export default function PipelineChartWrapper({ data }: PipelineChartWrapperProps) {
  const { theme } = useTheme()
  return <PipelineChart data={data} theme={theme} />
}
