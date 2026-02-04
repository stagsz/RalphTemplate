'use client'

import { BarChart, Bar, ResponsiveContainer, XAxis, YAxis, Tooltip, CartesianGrid } from 'recharts'

interface PipelineChartProps {
  data: {
    stage: string
    count: number
    value: number
    color: string
  }[]
  theme: 'light' | 'dark'
}

export default function PipelineChart({ data, theme }: PipelineChartProps) {
  const isDark = theme === 'dark'
  const hasData = data.some(item => item.count > 0)

  if (!hasData) {
    return (
      <div className="flex items-center justify-center h-[300px] text-gray-500 dark:text-gray-400">
        <div className="text-center">
          <p className="text-lg font-medium">No pipeline data yet</p>
          <p className="text-sm mt-1">Add deals to see your pipeline breakdown</p>
        </div>
      </div>
    )
  }

  return (
    <ResponsiveContainer width="100%" height={300}>
      <BarChart data={data}>
        <CartesianGrid strokeDasharray="3 3" stroke={isDark ? '#374151' : '#f0f0f0'} />
        <XAxis
          dataKey="stage"
          tick={{ fontSize: 12, fill: isDark ? '#9ca3af' : '#6b7280' }}
          stroke={isDark ? '#4b5563' : '#6b7280'}
        />
        <YAxis
          tick={{ fontSize: 12, fill: isDark ? '#9ca3af' : '#6b7280' }}
          stroke={isDark ? '#4b5563' : '#6b7280'}
        />
        <Tooltip
          contentStyle={{
            backgroundColor: isDark ? '#1f2937' : 'white',
            border: `1px solid ${isDark ? '#374151' : '#e5e7eb'}`,
            borderRadius: '0.5rem',
            color: isDark ? '#f3f4f6' : '#111827'
          }}
          formatter={(value: number, name: string) => {
            if (name === 'value') {
              return [`$${(value / 1000).toFixed(0)}K`, 'Value']
            }
            return [value, 'Count']
          }}
        />
        <Bar
          dataKey="count"
          fill="#3b82f6"
          radius={[8, 8, 0, 0]}
          name="Deals"
        />
      </BarChart>
    </ResponsiveContainer>
  )
}
