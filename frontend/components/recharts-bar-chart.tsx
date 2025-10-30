"use client"

import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts"

interface RechartsBarChartProps {
  data: Array<{
    date: string
    [key: string]: string | number
  }>
  dataKey: string
  color: string
  title?: string
}

export function RechartsBarChart({ data, dataKey, color, title }: RechartsBarChartProps) {
  const processedData = data.map((item) => ({
    ...item,
    [dataKey]:
      typeof item[dataKey] === "string"
        ? Number.parseFloat((item[dataKey] as string).replace(/,/g, ""))
        : item[dataKey],
  }))

  return (
    <ResponsiveContainer width="100%" height={300}>
      <BarChart data={processedData} margin={{ top: 5, right: 30, left: 0, bottom: 5 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
        <XAxis
          dataKey="date"
          tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 12 }}
          angle={-45}
          textAnchor="end"
          height={80}
        />
        <YAxis
          tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 12 }}
          label={{ value: title || dataKey, angle: -90, position: "insideLeft" }}
        />
        <Tooltip
          contentStyle={{
            backgroundColor: "hsl(var(--card))",
            border: "1px solid hsl(var(--border))",
            borderRadius: "8px",
            color: "hsl(var(--foreground))",
          }}
          formatter={(value: any) => {
            if (typeof value === "number") {
              return value.toLocaleString("en-US", { maximumFractionDigits: 0 })
            }
            return value
          }}
        />
        <Legend />
        <Bar dataKey={dataKey} fill={color} name={dataKey.replace(/_/g, " ")} />
      </BarChart>
    </ResponsiveContainer>
  )
}
