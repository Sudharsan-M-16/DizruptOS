"use client";

// Password reset request page — matches Nexus login design (dark #0A0A0A, orange #F97316).
// In demo mode: shows a notice that password reset requires real auth.

import * as React from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { ArrowLeft, Mail, KeyRound, CheckCircle2 } from "lucide-react";
import { browserClient, isAuthConfigured } from "@/lib/auth-supabase";

const BRAND_GREEN = "#00ED82";
const BRAND_TEAL = "#00D9D5";

export default function ResetPasswordPage() {
  const [email, setEmail] = React.useState("");
  const [submitting, setSubmitting] = React.useState(false);
  const [sent, setSent] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  const rise = (i: number) => ({
    initial: { opacity: 0, y: 14 },
    animate: { opacity: 1, y: 0 },
    transition: { duration: 0.45, delay: i * 0.07, ease: [0.4, 0, 0.2, 1] as const },
  });

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) return;
    setSubmitting(true);
    setError(null);
    try {
      if (!isAuthConfigured) {
        throw new Error("Password reset requires real authentication. Switch to a Supabase-connected environment.");
      }
      const sb = browserClient();
      if (!sb) throw new Error("Auth client unavailable.");
      const { error: sbErr } = await sb.auth.resetPasswordForEmail(email.trim(), {
        redirectTo: `${window.location.origin}/reset-password/confirm`,
      });
      if (sbErr) throw new Error(sbErr.message);
      setSent(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to send reset email.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div
      className="relative min-h-screen overflow-hidden text-white"
      style={{ background: "linear-gradient(135deg, #040C12 0%, #060F17 50%, #040C12 100%)" }}
    >
      {/* Background glow */}
      <div style={{
        position: "absolute", inset: 0, pointerEvents: "none",
        background: "radial-gradient(ellipse 60% 50% at 20% 50%, rgba(0,220,210,0.07) 0%, transparent 60%), radial-gradient(ellipse 60% 50% at 80% 50%, rgba(0,220,210,0.05) 0%, transparent 60%)",
      }} />

      {/* Top bar */}
      <header className="relative z-20 flex items-center justify-between px-6 py-5 lg:px-10">
        <Link
          href="/login"
          className="flex items-center gap-2 text-[13px] font-medium tracking-wide transition-colors duration-150 hover:text-white"
          style={{ color: "rgba(180,220,218,0.7)" }}
        >
          <ArrowLeft size={14} />
          Back to login
        </Link>
        <div className="flex items-center gap-2">
          <div className="flex h-7 w-7 items-center justify-center rounded-md" style={{ background: "rgba(0,237,130,0.15)" }}>
            <KeyRound size={14} style={{ color: BRAND_GREEN }} />
          </div>
          <span className="text-[13px] font-bold tracking-[0.28em] text-white">DIZRUPT</span>
        </div>
      </header>

      {/* Card */}
      <div className="relative z-10 flex min-h-[calc(100vh-100px)] items-center justify-center px-5 py-8">
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease: [0.4, 0, 0.2, 1] }}
          className="w-full max-w-[420px] rounded-2xl p-7 sm:p-9"
          style={{
            background: "rgba(8,18,26,0.82)",
            border: "1px solid rgba(0,200,195,0.15)",
            backdropFilter: "blur(28px)",
            boxShadow: "0 0 0 1px rgba(0,200,195,0.05), 0 32px 80px rgba(0,0,0,0.75), inset 0 1px 0 rgba(0,220,210,0.06)",
          }}
        >
          {sent ? (
            /* Success state */
            <motion.div initial={{ opacity: 0, scale: 0.97 }} animate={{ opacity: 1, scale: 1 }} className="text-center">
              <div className="mx-auto mb-5 flex h-14 w-14 items-center justify-center rounded-full" style={{ background: "rgba(0,237,130,0.12)", border: "1px solid rgba(0,237,130,0.25)" }}>
                <CheckCircle2 size={28} style={{ color: BRAND_GREEN }} />
              </div>
              <h2 className="mb-2 text-[22px] font-semibold tracking-tight" style={{ fontFamily: "Georgia, serif", color: "#F0F5F4" }}>
                Check your email
              </h2>
              <p className="text-[13px] leading-[1.65]" style={{ color: "rgba(160,200,195,0.75)" }}>
                We sent a password reset link to{" "}
                <strong style={{ color: "#E8FFFC" }}>{email}</strong>. Check your inbox and follow the link to set a new password.
              </p>
              <Link
                href="/login"
                className="mt-6 inline-flex h-10 items-center gap-2 rounded-lg px-5 text-[13px] font-semibold transition-colors duration-150 hover:brightness-110"
                style={{ background: BRAND_GREEN, color: "#021A0E" }}
              >
                Back to login
              </Link>
            </motion.div>
          ) : (
            <>
              <motion.div {...rise(0)} className="mb-5 flex items-center gap-2">
                <span className="h-1.5 w-1.5 rounded-full" style={{ background: BRAND_GREEN }} />
                <span className="text-[11px] font-semibold uppercase tracking-[0.26em]" style={{ color: BRAND_GREEN }}>
                  Account Recovery
                </span>
              </motion.div>

              <motion.h1
                {...rise(1)}
                className="mb-2 leading-tight tracking-tight"
                style={{ fontFamily: "Georgia, serif", fontSize: "clamp(1.7rem,5vw,2.2rem)", fontWeight: 300, color: "#F0F5F4" }}
              >
                Reset your{" "}
                <em style={{ fontStyle: "italic", color: "#E8FFFC" }}>password</em>.
              </motion.h1>

              <motion.p {...rise(2)} className="mb-6 text-[13px] leading-[1.65]" style={{ color: "rgba(160,200,195,0.75)" }}>
                Enter your email address and we&apos;ll send you a link to reset your password.
              </motion.p>

              <motion.form {...rise(3)} onSubmit={submit} className="space-y-3">
                <div className="relative flex items-center">
                  <Mail size={14} className="absolute left-3.5" style={{ color: "rgba(0,200,195,0.6)" }} />
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="you@company.com"
                    required
                    autoFocus
                    className="h-11 w-full rounded-lg pl-10 pr-4 text-[13px] focus:outline-none"
                    style={{
                      background: "rgba(0,180,170,0.06)",
                      border: `1px solid ${email ? "rgba(0,200,195,0.35)" : "rgba(0,200,195,0.18)"}`,
                      color: "rgba(200,240,235,0.9)",
                    }}
                  />
                </div>

                {error && (
                  <p role="alert" className="rounded-lg px-3 py-2 text-[12px]"
                    style={{ background: "rgba(239,68,68,0.08)", border: "1px solid rgba(239,68,68,0.25)", color: "#FCA5A5" }}>
                    {error}
                  </p>
                )}

                <button
                  type="submit"
                  disabled={submitting || !email.trim()}
                  className="h-11 w-full rounded-lg text-[13px] font-bold tracking-wide transition-all duration-150 hover:brightness-110 disabled:opacity-50"
                  style={{ background: BRAND_GREEN, color: "#021A0E" }}
                >
                  {submitting ? "Sending…" : "Send reset link"}
                </button>
              </motion.form>
            </>
          )}
        </motion.div>
      </div>
    </div>
  );
}
