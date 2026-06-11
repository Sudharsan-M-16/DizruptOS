"use client";

// Login — the product's cinematic threshold. Split stage: the brand statement
// breathes on the left (aurora + neural field show through), the persona form
// stands on the right. Auth flow unchanged: POST /auth/login → single-session
// enforcement → httpOnly cookie (PRD §14.1); sign-in selects a viewing persona.

import * as React from "react";
import Link from "next/link";
import dynamic from "next/dynamic";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { ArrowLeft, Fingerprint, Lock, ShieldCheck, Zap } from "lucide-react";
import { PERSONAS, useSession } from "@/lib/session";
import { Button, EmpAvatar } from "@/components/ui/primitives";
import { RevealText } from "@/components/fx/reveal-text";
import { TextScramble } from "@/components/fx/text-scramble";
import { DizruptMark } from "@/components/ui/logo";
import { cn } from "@/lib/utils";

const DotMatrixField = dynamic(
  () => import("@/components/fx/dot-field").then((m) => m.DotMatrixField),
  { ssr: false }
);

export default function LoginPage() {
  const router = useRouter();
  const signIn = useSession((s) => s.signIn);
  const [selected, setSelected] = React.useState(PERSONAS[0].id);
  const [submitting, setSubmitting] = React.useState(false);

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
      router.push(from && from.startsWith("/") ? from : "/");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Sign-in failed.");
      setSubmitting(false);
    }
  };

  return (
    <div className="relative flex min-h-screen overflow-hidden">
      {/* The threshold field — dot-matrix recession, breathing, pointer drift */}
      <DotMatrixField className="pointer-events-none fixed inset-0 z-0" />
      {/* horizon wash + vignette so the form stage stays readable */}
      <div
        aria-hidden
        className="pointer-events-none fixed inset-0 z-0"
        style={{
          background:
            "radial-gradient(900px 480px at 30% 110%, rgba(0,237,130,0.10), transparent 65%), radial-gradient(800px 420px at 85% -10%, rgba(43,217,255,0.07), transparent 60%), linear-gradient(to bottom, rgba(5,11,16,0.2), transparent 30%, rgba(5,11,16,0.55))",
        }}
      />
      <div aria-hidden className="grain-layer" />

      {/* ------------------------- brand stage (left) ------------------------- */}
      <div className="relative z-10 hidden flex-1 flex-col justify-between overflow-hidden border-r border-line-subtle/60 p-10 lg:flex">
        <Link
          href="/welcome"
          className="relative inline-flex w-fit items-center gap-2 text-2xs text-fg-muted transition-colors hover:text-fg"
        >
          <ArrowLeft size={12} /> Back to overview
        </Link>

        <div className="relative max-w-lg">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
          >
            <DizruptMark size={64} glow />
          </motion.div>
          <h1 className="mt-7 font-display text-4xl font-bold leading-[1.08] tracking-[-0.03em]">
            <RevealText text="Every person. Every project." delay={0.2} per={0.07} />
            <br />
            {/* single element: bg-clip-text breaks across transformed children */}
            <motion.span
              initial={{ opacity: 0, y: 18, filter: "blur(8px)" }}
              animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
              transition={{ delay: 0.7, duration: 0.65, ease: [0.22, 1, 0.36, 1] }}
              className="inline-block bg-gradient-to-r from-brand via-[#7DF5C3] to-brand-secondary bg-clip-text text-transparent"
            >
              Every consequence.
            </motion.span>
          </h1>
          <p className="mt-4 text-sm leading-7 text-fg-secondary">
            <RevealText
              text="The operating system for your organization — live behind this screen."
              delay={1.0}
              per={0.03}
            />
          </p>
        </div>

        <div className="relative flex items-center gap-2 text-2xs text-fg-muted">
          <Zap size={11} className="text-brand" />
          <TextScramble text="SYSTEM STATUS: ALL CIRCUITS LIVE" auto />
        </div>
      </div>

      {/* --------------------------- form stage (right) ------------------------ */}
      <div className="relative z-10 flex w-full items-center justify-center p-6 lg:w-[480px] lg:shrink-0">
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35 }}
          className="w-full max-w-md"
        >
          {/* compact lockup for small screens */}
          <div className="mb-8 flex flex-col items-center text-center lg:hidden">
            <DizruptMark size={44} glow />
            <h1 className="mt-3 font-display text-2xl font-bold tracking-tight">DIZRUPT</h1>
            <p className="mt-1 text-2xs text-fg-muted">
              Every person. Every project. Every consequence.
            </p>
          </div>

          <div className="mb-5 hidden lg:block">
            <h2 className="font-display text-xl font-bold tracking-tight">Sign in</h2>
            <p className="mt-1 text-2xs text-fg-muted">
              Demo personas — one per role. Role shapes every screen.
            </p>
          </div>

          <form onSubmit={submit} className="panel panel-glass space-y-5 p-6">
            <div>
              <div className="label-xs mb-2">Sign in as</div>
              <div className="space-y-1.5">
                {PERSONAS.map((p) => (
                  <button
                    key={p.id}
                    type="button"
                    onClick={() => setSelected(p.id)}
                    className={cn(
                      "flex w-full items-center gap-3 rounded-card border p-2.5 text-left transition-all",
                      selected === p.id
                        ? "border-brand/60 bg-brand-soft shadow-glow"
                        : "border-line bg-ink-elevated hover:border-brand/30"
                    )}
                  >
                    <EmpAvatar initials={p.initials} accent={p.accent} size={30} />
                    <div className="min-w-0 flex-1">
                      <div className="text-xs font-semibold">{p.name}</div>
                      <div className="text-2xs text-fg-muted">{p.title}</div>
                    </div>
                    <span className="rounded-full border border-line bg-ink-surface px-2 py-px font-mono text-2xs text-fg-secondary">
                      {p.role.replace("_", " ")}
                    </span>
                  </button>
                ))}
              </div>
            </div>

            {error && (
              <p role="alert" className="rounded-lg border border-danger/40 bg-danger-soft px-3 py-2 text-2xs text-danger">
                {error}
              </p>
            )}

            <Button type="submit" disabled={submitting} className="h-10 w-full">
              {submitting ? "Establishing session…" : "Enter the command center"}
            </Button>

            <div className="space-y-2 border-t border-line-subtle pt-4">
              <Fact icon={Lock} text="Single-session enforcement — a second login revokes the first" />
              <Fact icon={Fingerprint} text="JWT held in memory only; refresh via httpOnly cookie" />
              <Fact icon={ShieldCheck} text="MFA mandatory for Admin and Executive roles" />
            </div>
          </form>

          <p className="mt-4 text-center text-2xs text-fg-faint">
            SSO / SAML and Google OAuth arrive with the production auth tier.
          </p>
        </motion.div>
      </div>
    </div>
  );
}

function Fact({ icon: Icon, text }: { icon: React.ElementType; text: string }) {
  return (
    <div className="flex items-center gap-2 text-2xs text-fg-muted">
      <Icon size={11} className="shrink-0 text-brand/70" />
      {text}
    </div>
  );
}
