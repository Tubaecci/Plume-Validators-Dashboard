"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { PieChart } from "@/components/pie-chart"

interface Validator {
  validator: string
  plume_staked: string
  share_percent: number
  stakers: string
  commission: number
}

interface OverviewData {
  num_validators: number
  total_plume_staked: string
  validators: Validator[]
}

export default function Overview() {
  const [data, setData] = useState<OverviewData | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch("https://plume-validators-dashboard-production.up.railway.app/api/overview")
      .then((res) => res.json())
      .then((data) => {
        setData(data)
        setLoading(false)
      })
      .catch((err) => {
        console.error("Failed to fetch overview data:", err)
        setLoading(false)
      })
  }, [])

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-muted-foreground">Loading overview data...</div>
      </div>
    )
  }

  if (!data) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-destructive">Failed to load overview data</div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium text-muted-foreground">Total Validators</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{data.num_validators}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium text-muted-foreground">Total PLUME Staked</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{data.total_plume_staked}</div>
          </CardContent>
        </Card>
      </div>

      {/* Validators Table */}
      <Card>
        <CardHeader>
          <CardTitle>Validators</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-border">
                  <th className="text-left py-3 px-4 font-medium text-muted-foreground">Validator</th>
                  <th className="text-right py-3 px-4 font-medium text-muted-foreground">PLUME Staked</th>
                  <th className="text-right py-3 px-4 font-medium text-muted-foreground">% Share</th>
                  <th className="text-right py-3 px-4 font-medium text-muted-foreground">Stakers</th>
                  <th className="text-right py-3 px-4 font-medium text-muted-foreground">Commission</th>
                </tr>
              </thead>
              <tbody>
                {data.validators.map((validator, index) => (
                  <tr key={index} className="border-b border-border last:border-0">
                    <td className="py-3 px-4 font-medium">{validator.validator}</td>
                    <td className="py-3 px-4 text-right font-mono">{validator.plume_staked}</td>
                    <td className="py-3 px-4 text-right">{validator.share_percent}%</td>
                    <td className="py-3 px-4 text-right font-mono">{validator.stakers}</td>
                    <td className="py-3 px-4 text-right">{validator.commission}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* Pie Chart */}
      <Card>
        <CardHeader>
          <CardTitle>PLUME Staked Distribution</CardTitle>
        </CardHeader>
        <CardContent>
          <PieChart data={data.validators} />
        </CardContent>
      </Card>
    </div>
  )
}
