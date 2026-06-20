"use client";

// OrgHealthSparkline — fetches the 30-day health history from
// /api/v1/intelligence/health-history and renders a compact sparkline
// card with current score, trend arrow, and delta.

import { useQuery } from "@tanstack/react-query";
import { TrendingDown, TrendingUp, Minus } from "lucide-react";
import { apiGet } from "@/lib/query";
import { SparkArea } from "./spark";
import { cn } from "@/lib/utils";

interface HealthPoint {
  date: string;
  score: number;
}

interface HealthHistoryResult {
  points: HealthPoint[];
  trend: "improving" | "declining" | "stable";
  trendDelta: number;
  current: number;
  low: number;
  high: number;
}

const TREND_META = {
  improving: { icon: TrendingUp, color: "#10B981", label: "Improving" },
  declining: { icon: TrendingDown, color: "#EF4444", label: "Declining" },
  stable: { icon: Minus, color: "#9AA3AD", label: "Stable" },
};

/** Compact 7-point sparkline of org health with current score + trend. */
export function OrgHealthSparkline({ days = 7 }: { days?: number }) {
  const { data, isLoading, isError } = useQuery<HealthHistoryResult>({
    queryKey: ["health-history", days],
    queryFn: () => apiGet<HealthHistoryResult>(`intelligence/health-history?days=${days}`),
    staleTime: 60_000,
    retry: 1,
  });

  if (isLoading) return <HealthSkeleton />;
  if (isError || !data) return null;

  const lastN = data.points.slice(-days);
  const scores = lastN.map((p) => p.score);
  const trend = TREND_META[data.trend];
  const TrendIcon = trend.icon;
  const deltaSign = data.trendDelta >= 0 ? "+" : "";

  const healthColor = data.current >= 75 ? "#10B981" : data.current >= 55 ? "#F59E0B" : "#EF4444";

  return (
    <div className="flex items-center gap-4 rounded-xl border border-line bg-ink-surface px-4 py-3">
      {/* Score */}
      <div className="shrink-0">
        <div className="font-display text-2xl font-bold tabular-nums" style={{ color: healthColor }}>
          {Math.round(data.current)}
        </div>
        <div className="text-[10px] uppercase tracking-wider text-fg-muted">Org Health</div>
      </div>

      {/* Sparkline */}
      <div className="h-10 flex-1">
        <SparkArea data={scores} color={healthColor} />
      </div>

      {/* Trend */}
      <div className="shrink-0 flex flex-col items-end gap-0.5">
        <span className="flex items-center gap-1 text-xs font-semibold" style={{ color: trend.color }}>
          <TrendIcon size={13} />
          {trend.label}
        </span>
        <span className={cn("text-2xs font-mono font-medium", data.trendDelta >= 0 ? "text-ok" : "text-danger")}>
          {deltaSign}{data.trendDelta.toFixed(1)} pts / {days}d
        </span>
      </div>
    </div>
  );
}

function HealthSkeleton() {
  return (
    <div className="flex items-center gap-4 rounded-xl border border-line bg-ink-surface px-4 py-3 animate-pulse">
      <div className="h-10 w-14 rounded-lg bg-ink-elevated" />
      <div className="h-10 flex-1 rounded-lg bg-ink-elevated" />
      <div className="h-8 w-20 rounded-lg bg-ink-elevated" />
    </div>
  );
}
