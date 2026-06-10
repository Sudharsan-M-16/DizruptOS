import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export const fmtMoney = (micro: number) => {
  const dollars = micro / 1_000_000;
  if (dollars >= 1_000_000) return `$${(dollars / 1_000_000).toFixed(1)}M`;
  if (dollars >= 1_000) return `$${(dollars / 1_000).toFixed(0)}k`;
  return `$${dollars.toFixed(0)}`;
};

export const fmtPct = (v: number) => `${Math.round(v * 100)}%`;

export const fmtDate = (iso: string) =>
  new Date(iso + (iso.length === 10 ? "T00:00:00" : "")).toLocaleDateString(
    "en-US",
    { month: "short", day: "numeric" }
  );

export const fmtDateTime = (iso: string) =>
  new Date(iso).toLocaleString("en-US", {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });

export const timeAgo = (iso: string, now = "2026-06-10T07:00:00Z") => {
  const diff = new Date(now).getTime() - new Date(iso).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return `${Math.floor(hrs / 24)}d ago`;
};

export const timeUntil = (iso: string, now = "2026-06-10T07:00:00Z") => {
  const diff = new Date(iso).getTime() - new Date(now).getTime();
  if (diff <= 0) return "expired";
  const hrs = Math.floor(diff / 3600000);
  if (hrs < 1) return `in ${Math.floor(diff / 60000)}m`;
  if (hrs < 48) return `in ${hrs}h`;
  return `in ${Math.floor(hrs / 24)}d`;
};

// Capacity color law (PRD §3.1): green <80%, yellow 80–99%, red ≥100%
export const utilizationTone = (pct: number): "ok" | "warn" | "danger" =>
  pct >= 1 ? "danger" : pct >= 0.8 ? "warn" : "ok";
