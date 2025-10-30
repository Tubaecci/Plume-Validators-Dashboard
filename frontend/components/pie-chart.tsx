"use client"

import type React from "react"

import { useEffect, useRef, useState } from "react"

interface Validator {
  validator: string
  plume_staked: string
  share_percent: number
}

interface PieChartProps {
  data: Validator[]
}

const COLORS = [
  "#f97316", // orange
  "#ef4444", // red
  "#eab308", // yellow
  "#fb923c", // light orange
  "#fbbf24", // light yellow
  "#dc2626", // dark red
  "#fdba74", // lighter orange
  "#fcd34d", // lighter yellow
  "#b91c1c", // darker red
  "#ea580c", // darker orange
]

export function PieChart({ data }: PieChartProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null)
  const [tooltip, setTooltip] = useState<{ x: number; y: number; validator: string; staked: string } | null>(null)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext("2d")
    if (!ctx) return

    const width = canvas.width
    const height = canvas.height
    const centerX = width / 2
    const centerY = height / 2
    const radius = Math.min(width, height) / 2 - 40
    const innerRadius = radius * 0.4 // reduced hole size from 0.6 to 0.4

    // Clear canvas
    ctx.clearRect(0, 0, width, height)

    let currentAngle = -Math.PI / 2

    data.forEach((validator, index) => {
      const sliceAngle = (validator.share_percent / 100) * 2 * Math.PI

      ctx.beginPath()
      ctx.arc(centerX, centerY, radius, currentAngle, currentAngle + sliceAngle)
      ctx.arc(centerX, centerY, innerRadius, currentAngle + sliceAngle, currentAngle, true)
      ctx.closePath()
      ctx.fillStyle = COLORS[index % COLORS.length]
      ctx.fill()

      const labelAngle = currentAngle + sliceAngle / 2
      const labelX = centerX + Math.cos(labelAngle) * (radius * 0.75)
      const labelY = centerY + Math.sin(labelAngle) * (radius * 0.75)

      ctx.fillStyle = "#ffffff"
      ctx.font = "bold 14px sans-serif"
      ctx.textAlign = "center"
      ctx.textBaseline = "middle"
      ctx.fillText(`${validator.share_percent.toFixed(1)}%`, labelX, labelY)

      currentAngle += sliceAngle
    })
  }, [data])

  const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current
    if (!canvas) return

    const rect = canvas.getBoundingClientRect()
    const x = e.clientX - rect.left
    const y = e.clientY - rect.top

    const width = canvas.width
    const height = canvas.height
    const centerX = width / 2
    const centerY = height / 2
    const radius = Math.min(width, height) / 2 - 40
    const innerRadius = radius * 0.4 // reduced hole size from 0.6 to 0.4

    // Calculate distance from center
    const dx = x - centerX
    const dy = y - centerY
    const distance = Math.sqrt(dx * dx + dy * dy)

    if (distance < radius && distance > innerRadius) {
      // Calculate angle
      let angle = Math.atan2(dy, dx) + Math.PI / 2
      if (angle < 0) angle += 2 * Math.PI

      let currentAngle = 0
      let foundIndex = -1

      for (let i = 0; i < data.length; i++) {
        const sliceAngle = (data[i].share_percent / 100) * 2 * Math.PI
        if (angle >= currentAngle && angle < currentAngle + sliceAngle) {
          foundIndex = i
          break
        }
        currentAngle += sliceAngle
      }

      if (foundIndex !== -1) {
        setHoveredIndex(foundIndex)
        setTooltip({
          x: e.clientX - rect.left,
          y: e.clientY - rect.top,
          validator: data[foundIndex].validator,
          staked: data[foundIndex].plume_staked,
        })
      }
    } else {
      setHoveredIndex(null)
      setTooltip(null)
    }
  }

  const handleMouseLeave = () => {
    setHoveredIndex(null)
    setTooltip(null)
  }

  return (
    <div className="space-y-4">
      <h3 className="text-center font-semibold text-foreground">PLUME Staked per Validator</h3>
      <div className="flex justify-center relative">
        <canvas
          ref={canvasRef}
          width={400}
          height={400}
          onMouseMove={handleMouseMove}
          onMouseLeave={handleMouseLeave}
          className="cursor-pointer"
        />
        {tooltip && (
          <div
            className="absolute bg-gray-900 text-white px-3 py-2 rounded text-sm pointer-events-none"
            style={{
              left: `${tooltip.x + 10}px`,
              top: `${tooltip.y + 10}px`,
            }}
          >
            <div className="font-semibold">{tooltip.validator}</div>
            <div>PLUME: {tooltip.staked}</div>
          </div>
        )}
      </div>
      <div className="grid grid-cols-2 gap-2">
        {data.map((validator, index) => (
          <div key={index} className="flex items-center gap-2">
            <div
              className="w-4 h-4 rounded-sm flex-shrink-0"
              style={{ backgroundColor: COLORS[index % COLORS.length] }}
            />
            <span className="text-sm truncate">{validator.validator}</span>
          </div>
        ))}
      </div>
    </div>
  )
}
