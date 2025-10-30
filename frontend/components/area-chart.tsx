"use client"

import type React from "react"

import { useEffect, useRef, useState } from "react"

interface DataPoint {
  date: string
  amount_staked: string
}

interface AreaChartProps {
  data: DataPoint[]
  color: string
}

export function AreaChart({ data, color }: AreaChartProps) {
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

    // Parse data
    const values = data.map((d) => Number.parseFloat(d.amount_staked.replace(/,/g, "")))
    const maxValue = Math.max(...values)
    const minValue = Math.min(...values)
    const range = maxValue - minValue

    ctx.fillStyle = "rgba(128, 128, 128, 0.7)"
    ctx.font = "12px sans-serif"
    ctx.textAlign = "right"
    ctx.textBaseline = "middle"

    for (let i = 0; i <= 5; i++) {
      const value = minValue + (range / 5) * i
      const y = height - padding - (i / 5) * (height - 2 * padding)
      ctx.fillText(value.toLocaleString("en-US", { maximumFractionDigits: 0 }), padding - 10, y)

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
    const step = Math.ceil(data.length / 6)
    for (let i = 0; i < data.length; i += step) {
      const x = padding + (i / (data.length - 1)) * (width - padding - 20)
      ctx.fillText(data[i].date, x, height - padding + 10)
    }

    // Draw area
    ctx.beginPath()
    ctx.moveTo(padding, height - padding)

    data.forEach((point, index) => {
      const x = padding + (index / (data.length - 1)) * (width - padding - 20)
      const value = Number.parseFloat(point.amount_staked.replace(/,/g, ""))
      const y = height - padding - ((value - minValue) / range) * (height - 2 * padding)

      if (index === 0) {
        ctx.lineTo(x, y)
      } else {
        ctx.lineTo(x, y)
      }
    })

    ctx.lineTo(width - 20, height - padding)
    ctx.closePath()

    // Fill with gradient
    const gradient = ctx.createLinearGradient(0, 0, 0, height)
    gradient.addColorStop(0, color + "80")
    gradient.addColorStop(1, color + "10")
    ctx.fillStyle = gradient
    ctx.fill()

    // Draw line
    ctx.beginPath()
    data.forEach((point, index) => {
      const x = padding + (index / (data.length - 1)) * (width - padding - 20)
      const value = Number.parseFloat(point.amount_staked.replace(/,/g, ""))
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

    // Draw axes
    ctx.strokeStyle = "rgba(128, 128, 128, 0.3)"
    ctx.lineWidth = 1
    ctx.beginPath()
    ctx.moveTo(padding, padding)
    ctx.lineTo(padding, height - padding)
    ctx.lineTo(width - 20, height - padding)
    ctx.stroke()
  }, [data, color])

  const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current
    if (!canvas || data.length === 0) return

    const rect = canvas.getBoundingClientRect()
    const x = e.clientX - rect.left
    const y = e.clientY - rect.top

    const width = canvas.width
    const height = canvas.height
    const padding = 60

    // Calculate which data point is closest
    const values = data.map((d) => Number.parseFloat(d.amount_staked.replace(/,/g, "")))
    const maxValue = Math.max(...values)
    const minValue = Math.min(...values)
    const range = maxValue - minValue

    let closestIndex = -1
    let closestDistance = 20

    data.forEach((point, index) => {
      const px = padding + (index / (data.length - 1)) * (width - padding - 20)
      const value = Number.parseFloat(point.amount_staked.replace(/,/g, ""))
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
        date: data[closestIndex].date,
        value: data[closestIndex].amount_staked,
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
          <div>Amount: {tooltip.value}</div>
        </div>
      )}
    </div>
  )
}
