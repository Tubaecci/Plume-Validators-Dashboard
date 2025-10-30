"use client"

import type React from "react"

import { useEffect, useRef, useState } from "react"

interface DataPoint {
  date: string
  [key: string]: string | number
}

interface BarChartProps {
  data: DataPoint[]
  color: string
  dataKey?: string
}

export function BarChart({ data, color, dataKey = "stakers" }: BarChartProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [tooltip, setTooltip] = useState<{ x: number; y: number; date: string; value: string } | null>(null)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas || data.length === 0) return

    const ctx = canvas.getContext("2d")
    if (!ctx) return

    const width = canvas.width
    const height = canvas.height
    const padding = 60

    // Clear canvas
    ctx.clearRect(0, 0, width, height)

    // Parse data - now uses the dataKey prop to extract values
    const values = data.map((d) => {
      const val = d[dataKey]
      if (typeof val === "string") {
        return Number.parseFloat(val.replace(/,/g, ""))
      }
      return Number(val)
    })

    if (values.length === 0) return

    const maxValue = Math.max(...values)
    const minValue = Math.min(...values, 0)
    const range = maxValue - minValue

    ctx.fillStyle = "rgba(128, 128, 128, 0.7)"
    ctx.font = "12px sans-serif"
    ctx.textAlign = "right"
    ctx.textBaseline = "middle"

    for (let i = 0; i <= 5; i++) {
      const value = minValue + (range / 5) * i
      const y = height - padding - (i / 5) * (height - 2 * padding)
      ctx.fillText(value.toLocaleString("en-US", { maximumFractionDigits: 2 }), padding - 10, y)

      // Draw grid line
      ctx.strokeStyle = "rgba(128, 128, 128, 0.1)"
      ctx.lineWidth = 1
      ctx.beginPath()
      ctx.moveTo(padding, y)
      ctx.lineTo(width - 20, y)
      ctx.stroke()
    }

    // Calculate bar width
    const barWidth = (width - 2 * padding) / data.length - 2

    ctx.textAlign = "center"
    ctx.textBaseline = "top"
    const step = Math.ceil(data.length / 6)
    for (let i = 0; i < data.length; i += step) {
      const x = padding + (i / data.length) * (width - 2 * padding) + barWidth / 2
      ctx.fillText(data[i].date, x, height - padding + 10)
    }

    data.forEach((point, index) => {
      const x = padding + (index / data.length) * (width - 2 * padding)
      const rawVal = point[dataKey]
      const value = typeof rawVal === "string" ? Number.parseFloat(rawVal.replace(/,/g, "")) : Number(rawVal)

      // Calculate bar position and height
      const normalizedValue = (value - minValue) / range
      const barY = height - padding - normalizedValue * (height - 2 * padding)
      const zeroLineY = height - padding - ((0 - minValue) / range) * (height - 2 * padding)
      const barHeight = Math.abs(barY - zeroLineY)

      ctx.fillStyle = color
      ctx.fillRect(x, Math.min(barY, zeroLineY), barWidth, barHeight)
    })

    // Draw axes
    ctx.strokeStyle = "rgba(128, 128, 128, 0.3)"
    ctx.lineWidth = 1
    ctx.beginPath()
    ctx.moveTo(padding, padding)
    ctx.lineTo(padding, height - padding)
    ctx.lineTo(width - 20, height - padding)
    ctx.stroke()
  }, [data, color, dataKey])

  const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current
    if (!canvas || data.length === 0) return

    const rect = canvas.getBoundingClientRect()
    const x = e.clientX - rect.left
    const y = e.clientY - rect.top

    const width = canvas.width
    const height = canvas.height
    const padding = 60

    // Parse data - uses dataKey for tooltip values
    const values = data.map((d) => {
      const val = d[dataKey]
      if (typeof val === "string") {
        return Number.parseFloat(val.replace(/,/g, ""))
      }
      return Number(val)
    })

    if (values.length === 0) return

    const maxValue = Math.max(...values)
    const minValue = Math.min(...values, 0)
    const range = maxValue - minValue

    // Calculate bar width
    const barWidth = (width - 2 * padding) / data.length - 2

    let hoveredIndex = -1
    data.forEach((point, index) => {
      const barX = padding + (index / data.length) * (width - 2 * padding)
      const rawVal = point[dataKey]
      const value = typeof rawVal === "string" ? Number.parseFloat(rawVal.replace(/,/g, "")) : Number(rawVal)

      // Calculate bar position and height
      const normalizedValue = (value - minValue) / range
      const barY = height - padding - normalizedValue * (height - 2 * padding)
      const zeroLineY = height - padding - ((0 - minValue) / range) * (height - 2 * padding)
      const barHeight = Math.abs(barY - zeroLineY)
      const barTopY = Math.min(barY, zeroLineY)

      if (x >= barX && x <= barX + barWidth && y >= barTopY && y <= barTopY + barHeight) {
        hoveredIndex = index
      }
    })

    if (hoveredIndex !== -1) {
      const barX = padding + (hoveredIndex / data.length) * (width - 2 * padding)
      const rawVal = data[hoveredIndex][dataKey]
      const displayValue = typeof rawVal === "string" ? rawVal : rawVal.toFixed(2)
      setTooltip({
        x: barX + barWidth / 2,
        y: y,
        date: data[hoveredIndex].date,
        value: displayValue,
      })
    } else {
      setTooltip(null)
    }
  }

  const handleMouseLeave = () => {
    setTooltip(null)
  }

  return (
    <div className="relative">
      <canvas
        ref={canvasRef}
        width={800}
        height={300}
        className="w-full cursor-pointer"
        onMouseMove={handleMouseMove}
        onMouseLeave={handleMouseLeave}
      />
      {tooltip && (
        <div
          className="absolute bg-gray-900 text-white px-3 py-2 rounded text-sm pointer-events-none"
          style={{
            left: `${tooltip.x + 10}px`,
            top: `${tooltip.y + 10}px`,
          }}
        >
          <div className="font-semibold">{tooltip.date}</div>
          <div>
            {dataKey.replace(/_/g, " ")}: {tooltip.value}
          </div>
        </div>
      )}
    </div>
  )
}
