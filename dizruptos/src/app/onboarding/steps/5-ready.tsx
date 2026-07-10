"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { CheckCircle2, Rocket, Users, Upload, Link2, Building2 } from "lucide-react";
import type { StepProps } from "../page";

const BRAND_GREEN = "#00ED82";
const BRAND_TEAL = "#00D9D5";

export function StepReady({ state }: StepProps) {
  const router = useRouter();
  const [launching, setLaunching] = React.useState(false);

  const summary = [
    {
      icon: Building2,
      label: "Organization created",
      value: state.orgName || "Your workspace",
      done: !!state.orgId || !!state.orgName,
    },
    {
      icon: Users,
      label: "Team invites sent",
      value: state.invitedEmails.length > 0 ? `${state.invitedEmails.length} invite${state.invitedEmails.length !== 1 ? "s" : ""}` : "Skipped",
      done: state.invitedEmails.length > 0,
    },
    {
      icon: Upload,
      label: "People imported",
      value: state.importedCount > 0 ? `${state.importedCount} people` : "Skipped",
      done: state.importedCount > 0,
    },
    {
      icon: Link2,
      label: "Tools connected",
      value: state.connectedTools.length > 0 ? state.connectedTools.join(", ") : "Skipped",
      done: state.connectedTools.length > 0,
    },
  ];

  const launch = async () => {
    setLaunching(true);
    // Mark onboarding complete
    try {
      await fetch("/api/v1/organizations", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ onboardingCompleted: true }),
      }).catch(() => {}); // best-effort
    } catch { /* ignore */ }
    router.push("/");
  };

  return (
    <div className="space-y-6">
      <div className="text-center">
        <motion.div
          initial={{ scale: 0.7, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 0.5, type: "spring", bounce: 0.35 }}
          className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-full"
          style={{ background: "rgba(0,237,130,0.12)", border: "2px solid rgba(0,237,130,0.3)" }}
        >
          <Rocket size={30} style={{ color: BRAND_GREEN }} />
        </motion.div>

        <div className="mb-1.5 flex items-center justify-center gap-2">
          <span className="h-1.5 w-1.5 rounded-full" style={{ background: BRAND_GREEN }} />
          <span className="text-[11px] font-semibold uppercase tracking-[0.26em]" style={{ color: BRAND_GREEN }}>Step 5 of 5</span>
        </div>
        <h2 className="mb-2 text-[2rem] font-light tracking-tight" style={{ fontFamily: "Georgia, serif", color: "#F0F5F4" }}>
          Your workspace is <em style={{ fontStyle: "italic", color: "#E8FFFC" }}>ready</em>.
        </h2>
        <p className="text-[13px] leading-relaxed" style={{ color: "rgba(160,200,195,0.75)" }}>
          {state.orgName ? `${state.orgName} is` : "Your workspace is"} all set. DizruptOS will boot and your intelligence layer will start building.
        </p>
      </div>

      {/* Summary checklist */}
      <div className="space-y-2 rounded-xl p-4" style={{ background: "rgba(0,180,170,0.04)", border: "1px solid rgba(0,200,195,0.1)" }}>
        {summary.map((item, i) => {
          const Icon = item.icon;
          return (
            <motion.div
              key={item.label}
              initial={{ opacity: 0, x: -12 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.08, duration: 0.3 }}
              className="flex items-center gap-3"
            >
              <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg" style={{ background: item.done ? "rgba(0,237,130,0.1)" : "rgba(255,255,255,0.04)" }}>
                <Icon size={13} style={{ color: item.done ? BRAND_GREEN : "rgba(255,255,255,0.3)" }} />
              </div>
              <div className="flex flex-1 items-center justify-between">
                <span className="text-[13px]" style={{ color: "rgba(160,210,205,0.8)" }}>{item.label}</span>
                <span className="text-[12px] font-medium" style={{ color: item.done ? BRAND_GREEN : "rgba(100,160,155,0.5)" }}>
                  {item.done ? <><CheckCircle2 size={12} className="inline mr-1" />{item.value}</> : item.value}
                </span>
              </div>
            </motion.div>
          );
        })}
      </div>

      <motion.button
        onClick={launch}
        disabled={launching}
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
        className="flex h-12 w-full items-center justify-center gap-2.5 rounded-xl text-[14px] font-bold tracking-wide transition-all hover:brightness-110 disabled:opacity-70"
        style={{ background: BRAND_GREEN, color: "#021A0E", boxShadow: `0 0 28px rgba(0,237,130,0.25)` }}
      >
        {launching ? "Launching…" : "Launch DizruptOS"}
        <Rocket size={16} />
      </motion.button>
    </div>
  );
}
