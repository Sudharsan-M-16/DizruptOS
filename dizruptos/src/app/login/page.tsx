"use client";

// Login — the Nexus gateway. A single luminous orb hangs in near-black while a
// satellite traces its circumference (OrbitField); over it floats one glass
// panel carrying a Newsreader headline and the persona sign-in. Palette is the
// Nexus system: amber #F97316 on #0A0A0A, white/amber hairline borders, 24px
// blur. The auth flow is untouched: POST /auth/login → single-session
// enforcement → httpOnly cookie (PRD §14.1).

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { ArrowLeft, ArrowUpRight, CheckCircle2, Globe, Shield } from "lucide-react";
import { PERSONAS, useSession } from "@/lib/session";
import { EmpAvatar } from "@/components/ui/primitives";
import { DizruptMark } from "@/components/ui/logo";
import { cn } from "@/lib/utils";
import { useOS } from "@/lib/os";

import { OrbitField } from "@/components/fx/orbit-field";
import { RealAuthForm } from "@/components/auth/real-auth-form";
import { isAuthConfigured } from "@/lib/auth-supabase";

const AMBER = "#F97316";

export default function LoginPage() {
  const router = useRouter();
  const signIn = useSession((s) => s.signIn);
  const powerOn = useOS((s) => s.powerOn);
  const [selected, setSelected] = React.useState(PERSONAS[0].id);
  const [submitting, setSubmitting] = React.useState(false);
  const [leaving, setLeaving] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  const rise = (i: number) => ({
    initial: { opacity: 0, y: 16 },
    animate: { opacity: 1, y: 0 },
    transition: { duration: 0.5, delay: i * 0.08, ease: [0.4, 0, 0.2, 1] as const },
  });

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setError(null);
    try {
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
      powerOn();
      const from = new URLSearchParams(window.location.search).get("from");
      const dest = from && from.startsWith("/") ? from : "/";
      setLeaving(true);
      window.setTimeout(() => router.push(dest), 720);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Sign-in failed.");
      setSubmitting(false);
    }
  };

  return (
    <div className="relative min-h-screen overflow-hidden bg-[#0A0A0A] text-white">
      {/* orbital field — the orb and its satellite fill the dark */}
      <OrbitField className="absolute inset-0 h-full w-full" intensity={1} />
      {/* legibility veil so the glass panel always wins */}
      <div className="pointer-events-none absolute inset-0 bg-gradient-to-b from-[#0A0A0A]/40 via-transparent to-[#0A0A0A]/70" />

      {/* top bar */}
      <header className="relative z-20 flex items-center justify-between px-6 py-6 lg:px-10">
        <motion.div {...rise(0)}>
          <Link
            href="/welcome"
            className="flex items-center gap-2.5 text-[13px] font-medium tracking-wide text-[#A3A3A3] transition-colors duration-150 hover:text-white"
          >
            <ArrowLeft size={15} /> Overview
          </Link>
        </motion.div>
        <motion.div {...rise(1)} className="flex items-center gap-2.5">
          <DizruptMark size={24} />
          <span className="text-[13px] font-semibold tracking-[0.22em] text-white">DIZRUPT</span>
        </motion.div>
      </header>

      {/* gateway — centered glass panel; the orb glows in the dark behind it */}
      <div className="relative z-10 flex min-h-[calc(100vh-160px)] items-center justify-center px-6 py-10">
        <motion.div
          initial={{ opacity: 0, y: 28, scale: 0.985 }}
          animate={leaving ? { opacity: 0, y: -24, scale: 0.98 } : { opacity: 1, y: 0, scale: 1 }}
          transition={{ duration: 0.6, ease: [0.4, 0, 0.2, 1] }}
          className="w-full max-w-[460px] rounded-xl border border-white/[0.14] bg-[#0f0f0f]/80 p-8 backdrop-blur-2xl sm:p-10"
          style={{
            boxShadow:
              "0 0 30px 0 rgba(255,100,0,0.05), inset 0 0 10px 0 rgba(255,165,0,0.06), 0 24px 80px rgba(0,0,0,0.6)",
          }}
        >
          {/* kicker */}
          <motion.div {...rise(2)} className="mb-5 flex items-center gap-2.5">
            <span className="h-1.5 w-1.5 rounded-full" style={{ background: AMBER }} />
            <span className="text-[13px] font-medium uppercase tracking-[0.24em] text-[#A3A3A3]">
              Resource Intelligence
            </span>
          </motion.div>

          {/* Newsreader headline */}
          <motion.h1
            {...rise(3)}
            className="font-serif text-[clamp(2.8rem,7vw,3.6rem)] font-light leading-[1.02] tracking-[-0.025em] text-white"
          >
            Take the{" "}
            <span className="italic" style={{ color: AMBER }}>
              controls
            </span>
            .
          </motion.h1>
          <motion.p
            {...rise(4)}
            className="mt-4 text-[18px] font-medium leading-7 tracking-[0.01em] text-[#A3A3A3]"
          >
            Sign in and <span className="font-semibold text-white">DizruptOS</span> boots up —
            your whole workplace as a desktop operating system. Windows, a Dock, your
            tasks and your team, all on one screen.
          </motion.p>

          {/* real auth (only when Supabase is configured — invisible in demo) */}
          {isAuthConfigured && (
            <motion.div {...rise(5)}><RealAuthForm /></motion.div>
          )}

          {/* persona picker */}
          <motion.div {...rise(isAuthConfigured ? 6 : 5)} className="mt-8">
            <div className="mb-3 flex items-baseline justify-between">
              <span className="text-[13px] font-medium uppercase tracking-[0.16em] text-white">
                {isAuthConfigured ? "Demo accounts" : "Sign in as"}
              </span>
              <span className="text-[13px] text-[#A3A3A3]">demo personas · one per role</span>
            </div>
            <form onSubmit={submit} className="space-y-2.5">
              <div className="space-y-2">
                {PERSONAS.map((p) => {
                  const active = selected === p.id;
                  return (
                    <button
                      key={p.id}
                      type="button"
                      onClick={() => setSelected(p.id)}
                      className={cn(
                        "flex w-full items-center gap-3.5 rounded-lg border p-3 text-left transition-colors duration-150",
                        active
                          ? "border-[#F97316]/70 bg-[#F97316]/10"
                          : "border-white/10 bg-white/[0.02] hover:border-[#F97316]/40"
                      )}
                    >
                      <EmpAvatar initials={p.initials} accent={active ? AMBER : "#898989"} size={38} />
                      <div className="min-w-0 flex-1">
                        <div className="text-[15px] font-semibold text-white">{p.name}</div>
                        <div className="text-[13px] text-[#A3A3A3]">{p.title}</div>
                      </div>
                      <span
                        className={cn(
                          "rounded-md border px-2.5 py-1 text-[13px] font-medium capitalize",
                          active
                            ? "border-[#F97316]/50 text-[#FED7AA]"
                            : "border-white/15 text-[#A3A3A3]"
                        )}
                      >
                        {p.role.replace("_", " ")}
                      </span>
                    </button>
                  );
                })}
              </div>

              {error && (
                <p
                  role="alert"
                  className="rounded-lg border border-danger/40 bg-danger/10 px-4 py-2.5 text-[15px] text-danger"
                >
                  {error}
                </p>
              )}

              <button
                type="submit"
                disabled={submitting}
                className="group mt-1 flex h-14 w-full items-center justify-center gap-2.5 rounded-lg text-[15px] font-semibold tracking-wide text-[#FED7AA] transition-all duration-150 hover:brightness-110 disabled:opacity-50"
                style={{ background: AMBER, border: "0.82px solid rgba(249,115,22,0.3)" }}
              >
                {leaving ? "Controls engaged —" : submitting ? "Establishing session…" : "Enter the command center"}
                <ArrowUpRight
                  size={18}
                  strokeWidth={2.5}
                  className="transition-transform duration-150 group-hover:translate-x-0.5 group-hover:-translate-y-0.5"
                />
              </button>
            </form>
          </motion.div>

          {/* trust signals */}
          <motion.div {...rise(6)} className="mt-7 space-y-2.5 border-t border-white/10 pt-6">
            <Fact icon={Shield} text="Your session is private and isolated — no shared access" />
            <Fact icon={CheckCircle2} text="Your data stays in your organisation — no cross-tenant access" />
            <Fact icon={Globe} text="Enterprise sign-in (Google, Microsoft SSO) coming soon" />
          </motion.div>
        </motion.div>
      </div>

      {/* "engage" transition — an amber warp blooms from the orb and floods the
          screen as the session is established, then the command center loads */}
      {leaving && (
        <div className="pointer-events-none fixed inset-0 z-50 flex items-center justify-center">
          <motion.span
            initial={{ scale: 0, opacity: 0.9 }}
            animate={{ scale: 42, opacity: 1 }}
            transition={{ duration: 0.7, ease: [0.4, 0, 0.2, 1] }}
            className="block h-24 w-24 rounded-full"
            style={{ background: "radial-gradient(circle, #FFE9D0 0%, #F97316 46%, #0A0A0A 78%)" }}
          />
          <motion.span
            initial={{ opacity: 0 }}
            animate={{ opacity: [0, 1, 0] }}
            transition={{ duration: 0.5, times: [0, 0.35, 1] }}
            className="absolute inset-0 bg-white/15"
          />
        </div>
      )}
    </div>
  );
}

function Fact({ icon: Icon, text }: { icon: React.ElementType; text: string }) {
  return (
    <div className="flex items-center gap-2.5 text-[13px] leading-relaxed text-[#A3A3A3]">
      <Icon size={14} className="shrink-0" style={{ color: AMBER }} />
      {text}
    </div>
  );
}
