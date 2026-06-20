"use client";

// Password reset confirmation — user arrives here from the email link.
// Updates the password via supabase.auth.updateUser().

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { ArrowLeft, Eye, EyeOff, Lock, CheckCircle2 } from "lucide-react";
import { browserClient, isAuthConfigured } from "@/lib/auth-supabase";

const BRAND_GREEN = "#00ED82";

export default function ResetPasswordConfirmPage() {
  const router = useRouter();
  const [password, setPassword] = React.useState("");
  const [confirm, setConfirm] = React.useState("");
  const [showPw, setShowPw] = React.useState(false);
  const [submitting, setSubmitting] = React.useState(false);
  const [done, setDone] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  const rise = (i: number) => ({
    initial: { opacity: 0, y: 14 },
    animate: { opacity: 1, y: 0 },
    transition: { duration: 0.45, delay: i * 0.07, ease: [0.4, 0, 0.2, 1] as const },
  });

  const valid = password.length >= 8 && password === confirm;

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!valid) return;
    setSubmitting(true);
    setError(null);
    try {
      if (!isAuthConfigured) throw new Error("Real auth not configured.");
      const sb = browserClient();
      if (!sb) throw new Error("Auth client unavailable.");
      const { error: sbErr } = await sb.auth.updateUser({ password });
      if (sbErr) throw new Error(sbErr.message);
      setDone(true);
      setTimeout(() => router.push("/login"), 2500);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Password update failed.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div
      className="relative min-h-screen overflow-hidden text-white"
      style={{ background: "linear-gradient(135deg, #040C12 0%, #060F17 50%, #040C12 100%)" }}
    >
      <div style={{
        position: "absolute", inset: 0, pointerEvents: "none",
        background: "radial-gradient(ellipse 60% 50% at 50% 40%, rgba(0,220,210,0.06) 0%, transparent 70%)",
      }} />

      <header className="relative z-20 flex items-center px-6 py-5 lg:px-10">
        <Link
          href="/login"
          className="flex items-center gap-2 text-[13px] font-medium tracking-wide transition-colors duration-150 hover:text-white"
          style={{ color: "rgba(180,220,218,0.7)" }}
        >
          <ArrowLeft size={14} />
          Back to login
        </Link>
      </header>

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
            boxShadow: "0 32px 80px rgba(0,0,0,0.75)",
          }}
        >
          {done ? (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-center">
              <div className="mx-auto mb-5 flex h-14 w-14 items-center justify-center rounded-full" style={{ background: "rgba(0,237,130,0.12)" }}>
                <CheckCircle2 size={28} style={{ color: BRAND_GREEN }} />
              </div>
              <h2 className="mb-2 text-[22px] font-semibold" style={{ fontFamily: "Georgia, serif", color: "#F0F5F4" }}>Password updated</h2>
              <p className="text-[13px]" style={{ color: "rgba(160,200,195,0.75)" }}>Redirecting you to sign in…</p>
            </motion.div>
          ) : (
            <>
              <motion.div {...rise(0)} className="mb-5 flex items-center gap-2">
                <span className="h-1.5 w-1.5 rounded-full" style={{ background: BRAND_GREEN }} />
                <span className="text-[11px] font-semibold uppercase tracking-[0.26em]" style={{ color: BRAND_GREEN }}>New Password</span>
              </motion.div>

              <motion.h1 {...rise(1)} className="mb-6" style={{ fontFamily: "Georgia, serif", fontSize: "1.9rem", fontWeight: 300, color: "#F0F5F4" }}>
                Set a new <em style={{ fontStyle: "italic" }}>password</em>.
              </motion.h1>

              <motion.form {...rise(2)} onSubmit={submit} className="space-y-3">
                <div className="relative flex items-center">
                  <Lock size={14} className="absolute left-3.5" style={{ color: "rgba(0,200,195,0.6)" }} />
                  <input
                    type={showPw ? "text" : "password"}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="New password (8+ chars)"
                    required
                    autoFocus
                    className="h-11 w-full rounded-lg pl-10 pr-10 text-[13px] focus:outline-none"
                    style={{
                      background: "rgba(0,180,170,0.06)",
                      border: "1px solid rgba(0,200,195,0.18)",
                      color: "rgba(200,240,235,0.9)",
                    }}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPw(!showPw)}
                    className="absolute right-3.5"
                    aria-label={showPw ? "Hide password" : "Show password"}
                  >
                    {showPw ? <EyeOff size={14} style={{ color: "rgba(0,200,195,0.5)" }} /> : <Eye size={14} style={{ color: "rgba(0,200,195,0.5)" }} />}
                  </button>
                </div>

                <div className="relative flex items-center">
                  <Lock size={14} className="absolute left-3.5" style={{ color: "rgba(0,200,195,0.6)" }} />
                  <input
                    type={showPw ? "text" : "password"}
                    value={confirm}
                    onChange={(e) => setConfirm(e.target.value)}
                    placeholder="Confirm new password"
                    required
                    className="h-11 w-full rounded-lg pl-10 pr-4 text-[13px] focus:outline-none"
                    style={{
                      background: "rgba(0,180,170,0.06)",
                      border: `1px solid ${confirm && !valid ? "rgba(239,68,68,0.4)" : "rgba(0,200,195,0.18)"}`,
                      color: "rgba(200,240,235,0.9)",
                    }}
                  />
                </div>

                {confirm && !valid && (
                  <p className="text-[12px]" style={{ color: "#FCA5A5" }}>
                    {password.length < 8 ? "Password must be at least 8 characters." : "Passwords don't match."}
                  </p>
                )}

                {error && (
                  <p role="alert" className="rounded-lg px-3 py-2 text-[12px]"
                    style={{ background: "rgba(239,68,68,0.08)", border: "1px solid rgba(239,68,68,0.25)", color: "#FCA5A5" }}>
                    {error}
                  </p>
                )}

                <button
                  type="submit"
                  disabled={submitting || !valid}
                  className="h-11 w-full rounded-lg text-[13px] font-bold tracking-wide transition-all duration-150 hover:brightness-110 disabled:opacity-50"
                  style={{ background: BRAND_GREEN, color: "#021A0E" }}
                >
                  {submitting ? "Updating…" : "Update password"}
                </button>
              </motion.form>
            </>
          )}
        </motion.div>
      </div>
    </div>
  );
}
