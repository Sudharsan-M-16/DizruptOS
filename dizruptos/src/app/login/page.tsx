"use client";

// Login — "Engineered Depth". A full-bleed silk shader flows behind the whole
// stage: abyssal teal fabric caught in a deep current, bright on the right
// where the signal-channel card floats over sonar survey rings, near-black on
// the left where light Sora display type carries the brand statement.
//
// Auth flow unchanged: POST /auth/login → single-session enforcement →
// httpOnly cookie (PRD §14.1); sign-in selects a viewing persona. The
// chromatic glitch-in and the seismic fracture exit survive the redesign —
// retuned to the teal/blue palette.

import * as React from "react";
import Link from "next/link";
import dynamic from "next/dynamic";
import { useRouter } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import { ArrowLeft, Fingerprint, Lock, ShieldCheck } from "lucide-react";
import { PERSONAS, useSession } from "@/lib/session";
import { EmpAvatar } from "@/components/ui/primitives";
import { RevealText } from "@/components/fx/reveal-text";
import { TextScramble } from "@/components/fx/text-scramble";
import { DizruptMark } from "@/components/ui/logo";
import { SonarRings } from "@/components/fx/lumina-field";
import { cn } from "@/lib/utils";

const LuminaField = dynamic(
  () => import("@/components/fx/lumina-field").then((m) => m.LuminaField),
  { ssr: false }
);

const TEAL = "#2DE2C5";

export default function LoginPage() {
  const router = useRouter();
  const signIn = useSession((s) => s.signIn);
  const [selected, setSelected] = React.useState(PERSONAS[0].id);
  const [submitting, setSubmitting] = React.useState(false);
  const [leaving, setLeaving] = React.useState(false); // seismic exit

  const [error, setError] = React.useState<string | null>(null);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setError(null);
    try {
      // Real session issuance: httpOnly cookie set server-side; the edge
      // middleware enforces it on every shell route.
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ personaId: selected }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => null);
        throw new Error(data?.message ?? "Sign-in failed.");
      }
      signIn(selected);
      const from = new URLSearchParams(window.location.search).get("from");
      const dest = from && from.startsWith("/") ? from : "/";
      // Seismic transition: the card fractures along a fault line and slides
      // apart — disrupting the barrier — then the dashboard loads.
      setLeaving(true);
      window.setTimeout(() => router.push(dest), 520);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Sign-in failed.");
      setSubmitting(false);
    }
  };

  return (
    <div className="relative flex min-h-screen overflow-hidden bg-[#020D0B] text-white">
      {/* the engineered-depth field — silk ribbons in slow current */}
      <LuminaField className="pointer-events-none fixed inset-0 z-0" />
      {/* left scrim — the display type reads on near-black, the silk stays
          radiant on the right (reference composition) */}
      <div
        aria-hidden
        className="pointer-events-none fixed inset-0 z-[1] hidden lg:block"
        style={{
          background:
            "linear-gradient(to right, rgba(2,13,11,0.88) 0%, rgba(2,13,11,0.55) 30%, rgba(2,13,11,0.12) 52%, transparent 70%)",
        }}
      />
      <div aria-hidden className="grain-layer" />

      {/* sonar survey rings, riding the bright silk on the right */}
      <SonarRings className="pointer-events-none absolute -right-[12%] top-1/2 z-[1] hidden h-[140vh] w-[70vw] -translate-y-1/2 lg:block" />

      {/* vertical rail — the reference's spine text */}
      <div
        aria-hidden
        className="absolute left-5 top-1/2 z-[2] hidden -translate-y-1/2 select-none font-mono text-2xs font-light tracking-[0.5em] text-white/35 lg:block"
        style={{ writingMode: "vertical-rl", transform: "translateY(-50%) rotate(180deg)" }}
      >
        DIZRUPT — RESOURCE INTELLIGENCE
      </div>

      {/* telemetry readout, top right */}
      <div className="absolute right-8 top-8 z-[2] hidden font-mono text-2xs font-light tracking-[0.25em] text-white/70 lg:block">
        <TextScramble text="CLEARANCE / RBAC-5" auto />
      </div>

      {/* ------------------------- brand stage (left) ------------------------- */}
      <div className="relative z-10 hidden flex-1 flex-col justify-between p-12 pl-20 lg:flex">
        <Link
          href="/welcome"
          className="inline-flex w-fit items-center gap-2 font-mono text-2xs font-light tracking-[0.2em] text-white/50 transition-colors hover:text-white"
        >
          <span className="grid h-8 w-8 place-items-center rounded-full border border-white/15 transition-colors group-hover:border-white/40">
            <ArrowLeft size={12} />
          </span>
          BACK TO OVERVIEW
        </Link>

        <div className="max-w-xl">
          {/* eyebrow */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5 }}
            className="mb-8 flex items-center gap-2.5 font-mono text-2xs font-light tracking-[0.3em]"
            style={{ color: TEAL }}
          >
            <span
              className="h-1.5 w-1.5 rounded-full"
              style={{ background: TEAL, boxShadow: `0 0 10px ${TEAL}` }}
            />
            ACCESS.07
          </motion.div>

          <h1 className="font-display text-[clamp(2.8rem,5vw,4.5rem)] font-light leading-[1.02] tracking-[-0.045em] text-white">
            <RevealText text="Every person." delay={0.15} per={0.07} />
            <br />
            <RevealText text="Every project." delay={0.45} per={0.07} />
            <br />
            <span className="inline-flex items-baseline">
              <RevealText text="Every consequence" delay={0.75} per={0.06} />
              <motion.span
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 1.35, duration: 0.4 }}
                style={{ color: TEAL, textShadow: `0 0 18px ${TEAL}` }}
              >
                .
              </motion.span>
            </span>
          </h1>

          <p className="mt-8 max-w-md font-mono text-[13px] font-light leading-7 text-white/55">
            <RevealText
              text="Abyssal intelligence for teams mapping capacity, pressure, and hidden dependencies beneath the surface."
              delay={1.2}
              per={0.02}
            />
          </p>
        </div>

        <div className="flex items-center gap-3 font-mono text-2xs font-light tracking-[0.25em] text-white/40">
          <DizruptMark size={20} />
          <TextScramble text="SYSTEM STATUS: ALL CHANNELS LIVE" auto />
        </div>
      </div>

      {/* --------------------------- form stage (right) ------------------------ */}
      <div className="relative z-10 flex w-full items-center justify-center p-6 lg:w-[520px] lg:shrink-0 lg:pr-16">
        <div className="w-full max-w-md">
          {/* compact lockup for small screens */}
          <div className="mb-8 flex flex-col items-center text-center lg:hidden">
            <DizruptMark size={44} glow />
            <h1 className="mt-3 font-display text-2xl font-light tracking-tight">
              <TextScramble text="DIZRUPT" auto className="font-display" />
            </h1>
            <p className="mt-1 font-mono text-2xs font-light text-white/50">
              Every person. Every project. Every consequence.
            </p>
          </div>

          {/* fracture stage: glitch in, fracture out */}
          <div className="relative" style={{ perspective: 900 }}>
            <AnimatePresence>
              {leaving && (
                <>
                  <motion.div
                    aria-hidden
                    initial={{ x: 0, y: 0, rotate: 0, opacity: 1 }}
                    animate={{ x: -56, y: -34, rotate: -3, opacity: 0 }}
                    transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
                    className="absolute inset-0 z-20 border border-white/10 bg-[#04120F]/70 backdrop-blur-[18px]"
                    style={{ clipPath: "polygon(0 0, 100% 0, 100% 32%, 0 72%)" }}
                  />
                  <motion.div
                    aria-hidden
                    initial={{ x: 0, y: 0, rotate: 0, opacity: 1 }}
                    animate={{ x: 56, y: 34, rotate: 3, opacity: 0 }}
                    transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
                    className="absolute inset-0 z-20 border border-white/10 bg-[#04120F]/70 backdrop-blur-[18px]"
                    style={{ clipPath: "polygon(0 72%, 100% 32%, 100% 100%, 0 100%)" }}
                  />
                  <motion.div
                    aria-hidden
                    initial={{ opacity: 1, scaleX: 0 }}
                    animate={{ opacity: 0, scaleX: 1 }}
                    transition={{ duration: 0.4, ease: "circOut" }}
                    className="absolute left-0 right-0 top-1/2 z-30 h-px origin-left"
                    style={{
                      background: TEAL,
                      boxShadow: `0 0 16px ${TEAL}`,
                      transform: "rotate(-11deg)",
                    }}
                  />
                </>
              )}
            </AnimatePresence>

            <motion.form
              onSubmit={submit}
              animate={leaving ? { opacity: 0, scale: 0.985 } : { opacity: 1, scale: 1 }}
              transition={{ duration: 0.18, delay: leaving ? 0.1 : 0 }}
              className="glitch-in space-y-5 border border-white/10 bg-[#04120F]/60 p-7 backdrop-blur-[18px]"
              style={{
                boxShadow:
                  "rgba(0,0,0,0.65) 0px 20px 40px -15px, rgba(45,226,197,0.08) 0px 0px 26px 0px",
              }}
            >
              {/* signal channel header */}
              <div>
                <div
                  className="flex items-center gap-2 font-mono text-2xs font-light tracking-[0.3em]"
                  style={{ color: TEAL }}
                >
                  <span
                    className="h-1.5 w-1.5 rounded-full"
                    style={{ background: TEAL, boxShadow: `0 0 8px ${TEAL}` }}
                  />
                  SIGNAL CHANNEL
                </div>
                <div className="mt-3 flex items-baseline justify-between border-b border-white/10 pb-3">
                  <span className="font-mono text-2xs font-light tracking-[0.25em] text-white/70">
                    TRANSMISSION CLARITY
                  </span>
                  <span className="font-mono text-2xs font-light" style={{ color: TEAL }}>
                    98.4%
                  </span>
                </div>
              </div>

              <div>
                <div className="mb-2 font-mono text-2xs font-light uppercase tracking-[0.25em] text-white/50">
                  Sign in as
                </div>
                <div className="space-y-1.5">
                  {PERSONAS.map((p) => (
                    <button
                      key={p.id}
                      type="button"
                      onClick={() => setSelected(p.id)}
                      className={cn(
                        "flex w-full items-center gap-3 border p-2.5 text-left transition-all duration-150",
                        selected === p.id
                          ? "border-[#2DE2C5]/70 bg-[#2DE2C5]/10 shadow-[0_0_18px_rgba(45,226,197,0.25)]"
                          : "border-white/10 bg-white/[0.03] hover:border-[#2DE2C5]/35"
                      )}
                    >
                      <EmpAvatar initials={p.initials} accent={p.accent} size={30} />
                      <div className="min-w-0 flex-1">
                        <div className="text-xs font-semibold text-white">{p.name}</div>
                        <div className="text-2xs text-white/45">{p.title}</div>
                      </div>
                      <span className="border border-white/10 bg-white/[0.04] px-2 py-px font-mono text-2xs font-light text-white/60">
                        {p.role.replace("_", " ")}
                      </span>
                    </button>
                  ))}
                </div>
              </div>

              {error && (
                <p role="alert" className="border border-danger/40 bg-danger-soft px-3 py-2 text-2xs text-danger">
                  {error}
                </p>
              )}

              {/* primary action — dark plate, teal arrow cell (reference button) */}
              <button
                type="submit"
                disabled={submitting}
                className="btn-glitch group relative flex h-11 w-full items-center border border-white/15 bg-[#061011] font-mono text-[13px] font-light tracking-[0.08em] text-white transition-colors duration-150 hover:border-[#2DE2C5]/60 disabled:opacity-50"
              >
                <span className="flex-1 pl-4 text-left">
                  {leaving
                    ? "BARRIER DISRUPTED —"
                    : submitting
                      ? "ESTABLISHING SESSION…"
                      : "Enter the command center"}
                </span>
                <span
                  className="grid h-full w-12 shrink-0 place-items-center border-l border-white/15 transition-all duration-300 group-hover:bg-[#2DE2C5]/15"
                  style={{ color: TEAL }}
                >
                  ↗
                </span>
              </button>

              <div className="space-y-2 border-t border-white/10 pt-4">
                <Fact icon={Lock} text="Single-session enforcement — a second login revokes the first" />
                <Fact icon={Fingerprint} text="JWT held in memory only; refresh via httpOnly cookie" />
                <Fact icon={ShieldCheck} text="MFA mandatory for Admin and Executive roles" />
              </div>
            </motion.form>
          </div>

          <p className="mt-4 text-center font-mono text-2xs font-light text-white/35">
            SSO / SAML and Google OAuth arrive with the production auth tier.
          </p>
        </div>
      </div>
    </div>
  );
}

function Fact({ icon: Icon, text }: { icon: React.ElementType; text: string }) {
  return (
    <div className="flex items-center gap-2 text-2xs text-white/45">
      <Icon size={11} className="shrink-0" style={{ color: "rgba(45,226,197,0.7)" }} />
      {text}
    </div>
  );
}
