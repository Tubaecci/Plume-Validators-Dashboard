"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { RechartsLineChart } from "@/components/recharts-line-chart"
import { RechartsBarChart } from "@/components/recharts-bar-chart"
import { RechartsAreaChart } from "@/components/recharts-area-chart"

interface PerformanceData {
  date: string
  amount_staked: string
  amount_staked_growth_24h: number
  amount_staked_growth_7D: number
  amount_staked_growth_30D: number
  stakers: string
  stakers_growth_24h: number
  stakers_growth_7D: number
  stakers_growth_30D: number
}

const VALIDATOR_COLORS: Record<string, string> = {
  "Plume Foundation": "#3b82f6",
  Republic: "#10b981",
  "Korea Web3 Embassy": "#8b5cf6",
  Bioeconomy: "#f59e0b",
  SBI_DeFimans: "#ef4444",
  "Nano Labs": "#06b6d4",
  "CoinSummer labs": "#ec4899",
  DSRV: "#14b8a6",
  "PNP MAX": "#f97316",
  "Hello Moon": "#6366f1",
}

export default function ValidatorPerformance() {
  const [validators, setValidators] = useState<string[]>([])
  const [selectedValidator, setSelectedValidator] = useState<string>("")
  const [performanceData, setPerformanceData] = useState<PerformanceData[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // Fetch validator list
    fetch("https://plume-validators-dashboard-production.up.railway.app/api/validators")
      .then((res) => res.json())
      .then((data) => {
        setValidators(data.validators)
        if (data.validators.length > 0) {
          setSelectedValidator(data.validators[0])
        }
      })
      .catch((err) => console.error("Failed to fetch validators:", err))
  }, [])

  useEffect(() => {
    if (!selectedValidator) return

    setLoading(true)
    fetch(
      `https://plume-validators-dashboard-production.up.railway.app/api/validator/${encodeURIComponent(selectedValidator)}`,
    )
      .then((res) => res.json())
      .then((data) => {
        setPerformanceData(data)
        setLoading(false)
      })
      .catch((err) => {
        console.error("Failed to fetch performance data:", err)
        setLoading(false)
      })
  }, [selectedValidator])

  const validatorColor = VALIDATOR_COLORS[selectedValidator] || "#3b82f6"

  return (
    <div className="space-y-6">
      {/* Validator Selector */}
      <Card>
        <CardHeader>
          <CardTitle>Select Validator</CardTitle>
        </CardHeader>
        <CardContent>
          <select
            value={selectedValidator}
            onChange={(e) => setSelectedValidator(e.target.value)}
            className="w-full px-4 py-2 rounded-md border border-border bg-background text-foreground"
          >
            {validators.map((validator) => (
              <option key={validator} value={validator}>
                {validator}
              </option>
            ))}
          </select>
        </CardContent>
      </Card>

      {loading ? (
        <div className="flex items-center justify-center py-12">
          <div className="text-muted-foreground">Loading performance data...</div>
        </div>
      ) : (
        <>
          {/* Amount Staked Charts */}
          <Card>
            <CardHeader>
              <CardTitle>Daily PLUME Staked</CardTitle>
            </CardHeader>
            <CardContent>
              <RechartsAreaChart data={performanceData} color={validatorColor} />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-sm">Amount Staked Growth (24h) %</CardTitle>
            </CardHeader>
            <CardContent>
              <RechartsLineChart data={performanceData} dataKey="amount_staked_growth_24h" color={validatorColor} />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-sm">Amount Staked Growth (7D) %</CardTitle>
            </CardHeader>
            <CardContent>
              <RechartsLineChart data={performanceData} dataKey="amount_staked_growth_7D" color={validatorColor} />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-sm">Amount Staked Growth (30D) %</CardTitle>
            </CardHeader>
            <CardContent>
              <RechartsLineChart data={performanceData} dataKey="amount_staked_growth_30D" color={validatorColor} />
            </CardContent>
          </Card>

          {/* Stakers Charts */}
          <Card>
            <CardHeader>
              <CardTitle>Daily Stakers</CardTitle>
            </CardHeader>
            <CardContent>
              <RechartsBarChart data={performanceData} dataKey="stakers" color={validatorColor} />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-sm">Daily Stakers Growth (24h) %</CardTitle>
            </CardHeader>
            <CardContent>
              <RechartsLineChart data={performanceData} dataKey="stakers_growth_24h" color={validatorColor} />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-sm">Daily Stakers Growth (7D) %</CardTitle>
            </CardHeader>
            <CardContent>
              <RechartsLineChart data={performanceData} dataKey="stakers_growth_7D" color={validatorColor} />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-sm">Daily Stakers Growth (30D) %</CardTitle>
            </CardHeader>
            <CardContent>
              <RechartsLineChart data={performanceData} dataKey="stakers_growth_30D" color={validatorColor} />
            </CardContent>
          </Card>
        </>
      )}
    </div>
  )
}
