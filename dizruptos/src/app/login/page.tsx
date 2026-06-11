"use client";

// Login — persona-based demo auth. The form shape mirrors the production flow
// (PRD §14.1): POST /auth/login → single-session enforcement → JWT in memory +
// httpOnly refresh cookie. Here, sign-in selects a viewing persona.

import * as React from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { Fingerprint, Lock, ShieldCheck } from "lucide-react";
import { PERSONAS, useSession } from "@/lib/session";
import { Button, EmpAvatar } from "@/components/ui/primitives";
import { AuroraBackdrop } from "@/components/ui/ascension";
import { RevealText } from "@/components/fx/reveal-text";
import { cn } from "@/lib/utils";

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
    <div className="relative z-10 flex min-h-screen items-center justify-center overflow-hidden p-6">
      <AuroraBackdrop />
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35 }}
        className="w-full max-w-md"
      >
        <div className="mb-8 flex flex-col items-center text-center">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-brand to-brand-secondary shadow-glow">
            <span className="font-display text-xl font-bold text-white">D</span>
          </div>
          <h1 className="mt-4 bg-gradient-to-r from-fg via-brand-secondary to-fg bg-clip-text font-display text-3xl font-bold tracking-tight text-transparent">
            DIZRUPT
          </h1>
          <p className="mt-2 font-display text-sm font-medium text-fg-secondary">
            <RevealText text="Every person. Every project. Every consequence." delay={0.3} per={0.08} />
          </p>
          <p className="mt-1.5 text-2xs text-fg-muted">
            <RevealText text="The operating system for your organization — live behind this screen." delay={0.8} per={0.025} />
          </p>
        </div>

        <form onSubmit={submit} className="panel space-y-5 p-6">
          <div>
            <div className="label-xs mb-2">Sign in as — demo personas, one per role</div>
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
            {submitting ? "Establishing session…" : "Sign in"}
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
