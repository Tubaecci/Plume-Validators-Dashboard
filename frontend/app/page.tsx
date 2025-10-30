"use client"

import { useEffect, useState } from "react"
import Overview from "@/components/overview"
import ValidatorPerformance from "@/components/validator-performance"
import StakingRewards from "@/components/staking-rewards"
import { Button } from "@/components/ui/button"

type Section = "overview" | "performance" | "rewards"

export default function Home() {
  const [activeSection, setActiveSection] = useState<Section>("overview")
  const [theme, setTheme] = useState<"light" | "dark">("light")
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [lastRefresh, setLastRefresh] = useState<string>("")
  const [refreshKey, setRefreshKey] = useState(0)

  useEffect(() => {
    fetch("https://plume-validators-dashboard-production.up.railway.app/api/refresh/status")
      .then((res) => res.json())
      .then((data) => {
        if (data.last_refresh) {
          const date = new Date(data.last_refresh)
          setLastRefresh(date.toLocaleString())
        }
      })
      .catch((err) => console.error("Failed to fetch refresh status:", err))
  }, [])

  const toggleTheme = () => {
    setTheme((prev) => (prev === "light" ? "dark" : "light"))
    document.documentElement.classList.toggle("dark")
  }

  const handleRefresh = async () => {
    setIsRefreshing(true)
    try {
      const response = await fetch("https://plume-validators-dashboard-production.up.railway.app/api/refresh", {
        method: "POST",
      })
      const data = await response.json()

      // Fetch updated refresh status
      const statusResponse = await fetch(
        "https://plume-validators-dashboard-production.up.railway.app/api/refresh/status",
      )
      const statusData = await statusResponse.json()

      if (statusData.last_refresh) {
        const date = new Date(statusData.last_refresh)
        setLastRefresh(date.toLocaleString())
      }

      // Trigger re-render of components
      setRefreshKey((prev) => prev + 1)
    } catch (error) {
      console.error("Failed to refresh data:", error)
    } finally {
      setIsRefreshing(false)
    }
  }

  return (
    <div className={`min-h-screen ${theme}`}>
      <div className="min-h-screen bg-background text-foreground transition-colors">
        {/* Header */}
        <header className="border-b border-border bg-card">
          <div className="container mx-auto px-4 py-6">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-3xl font-bold text-balance">🪶 Plume Validators Dashboard</h1>
                <p className="text-sm text-muted-foreground mt-1">{lastRefresh && `Last updated: ${lastRefresh}`}</p>
              </div>
              <div className="flex items-center gap-3">
                <Button
                  onClick={handleRefresh}
                  disabled={isRefreshing}
                  variant="outline"
                  size="sm"
                  className="gap-2 bg-transparent"
                >
                  <span className={`inline-block ${isRefreshing ? "animate-spin" : ""}`}>🔄</span>
                  {isRefreshing ? "Refreshing..." : "Refresh Data"}
                </Button>
                <Button onClick={toggleTheme} variant="outline" size="icon" aria-label="Toggle theme">
                  {theme === "light" ? "🌙" : "☀️"}
                </Button>
              </div>
            </div>
          </div>
        </header>

        {/* About Section */}
        <div className="bg-accent/30 border-b border-border">
          <div className="container mx-auto px-4 py-4">
            <div className="flex items-start gap-2">
              <span className="text-lg font-semibold">💡</span>
              <div>
                <h2 className="font-semibold mb-1">About</h2>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  This dashboard is your interactive portal for exploring and analyzing validator activity on the Plume
                  blockchain. Monitor validator performance, visualize staking trends, and access comprehensive network
                  statistics in a visually engaging interface.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Navigation */}
        <div className="border-b border-border bg-card">
          <div className="container mx-auto px-4">
            <nav className="flex gap-1">
              <button
                onClick={() => setActiveSection("overview")}
                className={`px-6 py-4 font-medium transition-colors relative ${
                  activeSection === "overview" ? "text-primary" : "text-muted-foreground hover:text-foreground"
                }`}
              >
                Overview
                {activeSection === "overview" && <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary" />}
              </button>
              <button
                onClick={() => setActiveSection("performance")}
                className={`px-6 py-4 font-medium transition-colors relative ${
                  activeSection === "performance" ? "text-primary" : "text-muted-foreground hover:text-foreground"
                }`}
              >
                Validator Performance
                {activeSection === "performance" && (
                  <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary" />
                )}
              </button>
              <button
                onClick={() => setActiveSection("rewards")}
                className={`px-6 py-4 font-medium transition-colors relative ${
                  activeSection === "rewards" ? "text-primary" : "text-muted-foreground hover:text-foreground"
                }`}
              >
                Staking Rewards
                {activeSection === "rewards" && <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary" />}
              </button>
            </nav>
          </div>
        </div>

        {/* Content */}
        <main className="container mx-auto px-4 py-8">
          {activeSection === "overview" && <Overview key={refreshKey} />}
          {activeSection === "performance" && <ValidatorPerformance key={refreshKey} />}
          {activeSection === "rewards" && <StakingRewards />}
        </main>
      </div>
    </div>
  )
}
