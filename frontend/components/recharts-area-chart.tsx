"use client"

import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from "recharts"

interface RechartsAreaChartProps {
  data: Array<{
    date: string
    amount_staked: string
    [key: string]: any
  }>
  color: string
}

export function RechartsAreaChart({ data, color }: RechartsAreaChartProps) {
  // Transform data to have numeric values
  const transformedData = data.map((item) => ({
    date: new Date(item.date).toLocaleDateString("en-US", { month: "short", day: "numeric" }),
    amount_staked: Number.parseFloat(item.amount_staked.replace(/,/g, "")),
  }))

  return (
    <ResponsiveContainer width="100%" height={300}>
      <AreaChart data={transformedData} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
        <defs>
          <linearGradient id="colorStaked" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor={color} stopOpacity={0.3} />
            <stop offset="95%" stopColor={color} stopOpacity={0} />
          </linearGradient>
        </defs>
        <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
        <XAxis dataKey="date" tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 12 }} />
        <YAxis tick={{ fill: "hsl(var(--muted-foreground))" }} />
        <Tooltip
          contentStyle={{
            backgroundColor: "hsl(var(--card))",
            border: "1px solid hsl(var(--border))",
            borderRadius: "8px",
            color: "hsl(var(--foreground))",
          }}
          formatter={(value: number) => value.toLocaleString(undefined, { maximumFractionDigits: 2 })}
        />
        <Legend />
        <Area
          type="monotone"
          dataKey="amount_staked"
          stroke={color}
          fillOpacity={1}
          fill="url(#colorStaked)"
          name="PLUME Staked"
          strokeWidth={2}
        />
      </AreaChart>
    </ResponsiveContainer>
  )
}
