"use client";

// Onboarding wizard — 5-step guided setup for new accounts.
// Steps: 1-org-name → 2-invite-team → 3-import-data → 4-connect-tools → 5-ready
//
// Progress stored in tenant_settings.onboarding.step (live) or localStorage (demo).
// Design: Nexus dark glass aesthetic matching login and accept-invite pages.

import * as React from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
  Building2, Users, Upload, Link2, Rocket,
  CheckCircle2, ArrowRight, ArrowLeft
} from "lucide-react";

// Step components
import { StepOrgName } from "./steps/1-org-name";
import { StepInviteTeam } from "./steps/2-invite-team";
import { StepImportData } from "./steps/3-import-data";
import { StepConnectTools } from "./steps/4-connect-tools";
import { StepReady } from "./steps/5-ready";

// Uses useSearchParams — opt out of static prerender.
export const dynamic = "force-dynamic";

export default function OnboardingPage() {
  return (
    <React.Suspense fallback={<div className="min-h-screen" style={{ background: "#040C12" }} />}>
      <OnboardingContent />
    </React.Suspense>
  );
}

const BRAND_GREEN = "#00ED82";
const BRAND_TEAL = "#00D9D5";

const STEPS = [
  { id: 1, label: "Organization", icon: Building2, description: "Name your workspace" },
  { id: 2, label: "Team", icon: Users, description: "Invite your team" },
  { id: 3, label: "Import", icon: Upload, description: "Import people & projects" },
  { id: 4, label: "Connect", icon: Link2, description: "Connect your tools" },
  { id: 5, label: "Launch", icon: Rocket, description: "You're ready to go" },
];

export interface OnboardingState {
  orgId: string | null;
  orgName: string;
  orgSlug: string;
  invitedEmails: string[];
  importedCount: number;
  connectedTools: string[];
}

export interface StepProps {
  state: OnboardingState;
  updateState: (patch: Partial<OnboardingState>) => void;
  onNext: () => void;
  onBack: () => void;
  isFirstStep: boolean;
  isLastStep: boolean;
}

function OnboardingContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const initialStep = parseInt(searchParams.get("step") ?? "1", 10);
  const [step, setStep] = React.useState(Math.min(Math.max(1, initialStep), STEPS.length));
  const [direction, setDirection] = React.useState(1);

  const [state, setState] = React.useState<OnboardingState>({
    orgId: null,
    orgName: "",
    orgSlug: "",
    invitedEmails: [],
    importedCount: 0,
    connectedTools: [],
  });

  const updateState = (patch: Partial<OnboardingState>) =>
    setState((s) => ({ ...s, ...patch }));

  const goNext = () => {
    if (step >= STEPS.length) { router.push("/"); return; }
    setDirection(1);
    setStep((s) => s + 1);
    // Update URL without navigation
    const url = new URL(window.location.href);
    url.searchParams.set("step", String(step + 1));
    window.history.pushState({}, "", url.toString());
  };

  const goBack = () => {
    if (step <= 1) return;
    setDirection(-1);
    setStep((s) => s - 1);
    const url = new URL(window.location.href);
    url.searchParams.set("step", String(step - 1));
    window.history.pushState({}, "", url.toString());
  };

  const stepProps: StepProps = {
    state,
    updateState,
    onNext: goNext,
    onBack: goBack,
    isFirstStep: step === 1,
    isLastStep: step === STEPS.length,
  };

  const StepComponents = [StepOrgName, StepInviteTeam, StepImportData, StepConnectTools, StepReady];
  const CurrentStep = StepComponents[step - 1];

  return (
    <div className="relative min-h-screen overflow-hidden">
      {/* Background glow */}
      <div style={{
        position: "absolute", inset: 0, pointerEvents: "none",
        background: "radial-gradient(ellipse 70% 55% at 50% 30%, rgba(0,220,210,0.06) 0%, transparent 65%)",
      }} />

      {/* Top progress bar */}
      <div className="relative z-20 px-6 py-5 lg:px-10">
        <div className="mx-auto max-w-2xl">
          {/* Logo row */}
          <div className="mb-8 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="flex h-7 w-7 items-center justify-center rounded-md" style={{ background: "rgba(0,237,130,0.15)" }}>
                <Rocket size={14} style={{ color: BRAND_GREEN }} />
              </div>
              <span className="text-[13px] font-bold tracking-[0.28em]">DIZRUPT</span>
            </div>
            <span className="text-[12px]" style={{ color: "rgba(100,160,155,0.6)" }}>
              Step {step} of {STEPS.length}
            </span>
          </div>

          {/* Step pills */}
          <div className="flex items-center gap-2">
            {STEPS.map((s, i) => {
              const done = step > s.id;
              const active = step === s.id;
              const Icon = s.icon;
              return (
                <React.Fragment key={s.id}>
                  <div className="flex flex-col items-center gap-1.5">
                    <div
                      className="flex h-8 w-8 items-center justify-center rounded-full transition-all duration-300"
                      style={{
                        background: done
                          ? `rgba(0,237,130,0.15)` : active
                          ? `rgba(0,220,210,0.12)` : `rgba(255,255,255,0.04)`,
                        border: `1px solid ${done ? "rgba(0,237,130,0.4)" : active ? "rgba(0,220,210,0.35)" : "rgba(255,255,255,0.08)"}`,
                      }}
                    >
                      {done ? (
                        <CheckCircle2 size={14} style={{ color: BRAND_GREEN }} />
                      ) : (
                        <Icon size={13} style={{ color: active ? BRAND_TEAL : "rgba(255,255,255,0.3)" }} />
                      )}
                    </div>
                    <span className="hidden text-[10px] font-medium sm:block" style={{ color: active ? "#E8FFFC" : done ? "rgba(0,237,130,0.7)" : "rgba(255,255,255,0.3)" }}>
                      {s.label}
                    </span>
                  </div>
                  {i < STEPS.length - 1 && (
                    <div className="h-px flex-1 transition-all duration-500" style={{ background: done ? `rgba(0,237,130,0.3)` : "rgba(255,255,255,0.08)" }} />
                  )}
                </React.Fragment>
              );
            })}
          </div>
        </div>
      </div>

      {/* Step content */}
      <div className="relative z-10 px-5 pb-12 pt-4">
        <div className="mx-auto max-w-2xl">
          <AnimatePresence mode="wait" custom={direction}>
            <motion.div
              key={step}
              custom={direction}
              initial={{ opacity: 0, x: direction * 40 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: direction * -40 }}
              transition={{ duration: 0.3, ease: [0.4, 0, 0.2, 1] }}
            >
              <div
                className="rounded-2xl p-7 sm:p-9"
                style={{
                  background: "rgba(8,18,26,0.80)",
                  border: "1px solid rgba(0,200,195,0.13)",
                  backdropFilter: "blur(24px)",
                  boxShadow: "0 0 0 1px rgba(0,200,195,0.04), 0 24px 60px rgba(0,0,0,0.7)",
                }}
              >
                <CurrentStep {...stepProps} />
              </div>
            </motion.div>
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}
