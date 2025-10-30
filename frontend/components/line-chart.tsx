"use client"

import type React from "react"

import { useEffect, useRef, useState } from "react"

interface DataPoint {
  date: string
  [key: string]: string | number
}

interface LineChartProps {
  data: DataPoint[]
  dataKey: string
  color: string
}

export function LineChart({ data, dataKey, color }: LineChartProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [tooltip, setTooltip] = useState<{ x: number; y: number; date: string; value: string } | null>(null)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas || data.length === 0) return

    const ctx = canvas.getContext("2d")
    if (!ctx) return

    const width = canvas.width
    const height = canvas.height
    const padding = 50

    // Clear canvas
    ctx.clearRect(0, 0, width, height)

    // Parse data
    const values = data.map((d) => Number(d[dataKey]))
    const maxValue = Math.max(...values, 0)
    const minValue = Math.min(...values, 0)
    const range = maxValue - minValue || 1

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

    ctx.textAlign = "center"
    ctx.textBaseline = "top"
    const step = Math.ceil(data.length / 4)
    for (let i = 0; i < data.length; i += step) {
      const x = padding + (i / (data.length - 1)) * (width - padding - 20)
      ctx.fillText(String(data[i].date), x, height - padding + 10)
    }

    // Draw line
    ctx.beginPath()
    data.forEach((point, index) => {
      const x = padding + (index / (data.length - 1)) * (width - padding - 20)
      const value = Number(point[dataKey])
      const y = height - padding - ((value - minValue) / range) * (height - 2 * padding)

      if (index === 0) {
        ctx.moveTo(x, y)
      } else {
        ctx.lineTo(x, y)
      }
    })
    ctx.strokeStyle = color
    ctx.lineWidth = 2
    ctx.stroke()

    // Draw zero line if needed
    if (minValue < 0 && maxValue > 0) {
      const zeroY = height - padding - ((0 - minValue) / range) * (height - 2 * padding)
      ctx.strokeStyle = "rgba(128, 128, 128, 0.3)"
      ctx.lineWidth = 1
      ctx.beginPath()
      ctx.moveTo(padding, zeroY)
      ctx.lineTo(width - padding, zeroY)
      ctx.stroke()
    }

    // Draw axes
    ctx.strokeStyle = "rgba(128, 128, 128, 0.3)"
    ctx.lineWidth = 1
    ctx.beginPath()
    ctx.moveTo(padding, padding)
    ctx.lineTo(padding, height - padding)
    ctx.lineTo(width - 20, height - padding)
    ctx.stroke()
  }, [data, dataKey, color])

  const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current
    if (!canvas || data.length === 0) return

    const rect = canvas.getBoundingClientRect()
    const x = e.clientX - rect.left
    const y = e.clientY - rect.top

    const width = canvas.width
    const height = canvas.height
    const padding = 50

    // Calculate which data point is closest
    const values = data.map((d) => Number(d[dataKey]))
    const maxValue = Math.max(...values, 0)
    const minValue = Math.min(...values, 0)
    const range = maxValue - minValue || 1

    let closestIndex = -1
    let closestDistance = 20

    data.forEach((point, index) => {
      const px = padding + (index / (data.length - 1)) * (width - padding - 20)
      const value = Number(point[dataKey])
      const py = height - padding - ((value - minValue) / range) * (height - 2 * padding)

      const distance = Math.sqrt((x - px) ** 2 + (y - py) ** 2)
      if (distance < closestDistance) {
        closestDistance = distance
        closestIndex = index
      }
    })

    if (closestIndex !== -1) {
      const px = padding + (closestIndex / (data.length - 1)) * (width - padding - 20)
      setTooltip({
        x: px,
        y: y,
        date: String(data[closestIndex].date),
        value: Number(data[closestIndex][dataKey]).toLocaleString("en-US", { maximumFractionDigits: 2 }),
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
        width={400}
        height={200}
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
          <div>Value: {tooltip.value}</div>
        </div>
      )}
    </div>
  )
}
