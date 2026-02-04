'use client'

import dynamic from 'next/dynamic'
import { useTheme } from '@/components/providers/ThemeProvider'

const DealsDonutChart = dynamic(() => import('./DealsDonutChart'), {
  ssr: false,
  loading: () => (
    <div className="flex items-center justify-center h-[300px]">
      <div className="text-gray-500 dark:text-gray-400">Loading chart...</div>
    </div>
  )
})

interface DealsDonutChartWrapperProps {
  data: {
    name: string
    value: number
    color: string
  }[]
}

export default function DealsDonutChartWrapper({ data }: DealsDonutChartWrapperProps) {
  const { theme } = useTheme()
  return <DealsDonutChart data={data} theme={theme} />
}
