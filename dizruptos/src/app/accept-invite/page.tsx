"use client";

// Accept (or decline) a team invitation.
// Route: /accept-invite?token=<token>&email=<email>
// Flow:
//   1. On load: GET /api/v1/invitations/[token] → show org name + role
//   2. "Accept" → sign in via magic link → auth/callback → back here → POST accept
//   3. "Decline" → POST decline → redirect to /login

import * as React from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { motion } from "framer-motion";
import { ArrowLeft, Building2, CheckCircle2, UserPlus, X } from "lucide-react";

// Uses useSearchParams (token/email) — opt out of static prerender.
export const dynamic = "force-dynamic";

export default function AcceptInvitePage() {
  return (
    <React.Suspense fallback={<div className="min-h-screen" style={{ background: "#040C12" }} />}>
      <AcceptInviteContent />
    </React.Suspense>
  );
}
import { signInWithMagicLink, isAuthConfigured } from "@/lib/auth-supabase";
import { useSession } from "@/lib/session";

const BRAND_GREEN = "#00ED82";
const BRAND_TEAL = "#00D9D5";

type InviteState = "loading" | "ready" | "accepting" | "accepted" | "declining" | "declined" | "error";

interface InviteDetails {
  email: string;
  role: string;
  orgName: string;
  expiresAt: string;
  status: string;
}

function roleLabel(role: string) {
  return role.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
}

function AcceptInviteContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get("token") ?? "";
  const emailParam = searchParams.get("email") ?? "";
  const accepted = searchParams.get("accepted") === "1";

  const isAuthenticated = useSession((s) => s.authenticated);

  const [state, setState] = React.useState<InviteState>("loading");
  const [invite, setInvite] = React.useState<InviteDetails | null>(null);
  const [error, setError] = React.useState<string | null>(null);
  const [emailSent, setEmailSent] = React.useState(false);

  React.useEffect(() => {
    if (!token) { setState("error"); setError("Invalid invitation link."); return; }

    fetch(`/api/v1/invitations/${token}`)
      .then(async (res) => {
        const data = await res.json();
        if (!res.ok) {
          setState("error");
          setError(data?.message ?? `Invitation ${data?.code === "EXPIRED_OR_USED" ? "has already been used or expired" : "not found"}.`);
          return;
        }
        setInvite(data.data);
        // If we returned here after accepting (post-auth), auto-complete
        if (accepted && isAuthenticated) {
          setState("accepting");
          acceptInvite();
        } else {
          setState("ready");
        }
      })
      .catch(() => { setState("error"); setError("Could not load invitation. Please try again."); });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token]);

  const acceptInvite = async () => {
    setState("accepting");
    try {
      const res = await fetch(`/api/v1/invitations/${token}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "accept" }),
      });
      if (!res.ok) {
        const d = await res.json().catch(() => ({}));
        throw new Error(d.message ?? "Failed to accept invitation.");
      }
      setState("accepted");
      setTimeout(() => router.push("/"), 2000);
    } catch (err) {
      setState("error");
      setError(err instanceof Error ? err.message : "Failed to accept invitation.");
    }
  };

  const handleAccept = async () => {
    if (!isAuthenticated && isAuthConfigured) {
      // Need to sign in first — send magic link then come back
      setState("accepting");
      const email = emailParam || invite?.email;
      if (!email) { setError("Email required to accept. Please check your invitation link."); setState("ready"); return; }
      const result = await signInWithMagicLink(email);
      if (!result.ok) {
        setError("error" in result ? result.error : "Failed to send sign-in link.");
        setState("ready");
        return;
      }
      setEmailSent(true);
      setState("ready");
      return;
    }
    await acceptInvite();
  };

  const handleDecline = async () => {
    setState("declining");
    try {
      await fetch(`/api/v1/invitations/${token}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "decline" }),
      });
      setState("declined");
      setTimeout(() => router.push("/login"), 2000);
    } catch {
      setState("declined"); // decline even if the request fails
      setTimeout(() => router.push("/login"), 2000);
    }
  };

  const rise = (i: number) => ({
    initial: { opacity: 0, y: 14 },
    animate: { opacity: 1, y: 0 },
    transition: { duration: 0.45, delay: i * 0.08, ease: [0.4, 0, 0.2, 1] as const },
  });

  return (
    <div
      className="relative min-h-screen overflow-hidden text-white"
      style={{ background: "linear-gradient(135deg, #040C12 0%, #060F17 50%, #040C12 100%)" }}
    >
      {/* Background glow */}
      <div style={{
        position: "absolute", inset: 0, pointerEvents: "none",
        background: "radial-gradient(ellipse 60% 50% at 50% 35%, rgba(0,220,210,0.06) 0%, transparent 70%)",
      }} />

      <header className="relative z-20 flex items-center justify-between px-6 py-5 lg:px-10">
        <Link href="/login" className="flex items-center gap-2 text-[13px] font-medium transition-colors hover:text-white" style={{ color: "rgba(180,220,218,0.7)" }}>
          <ArrowLeft size={14} /> Login
        </Link>
        <div className="flex items-center gap-2">
          <div className="flex h-7 w-7 items-center justify-center rounded-md" style={{ background: "rgba(0,237,130,0.15)" }}>
            <UserPlus size={14} style={{ color: BRAND_GREEN }} />
          </div>
          <span className="text-[13px] font-bold tracking-[0.28em]">DIZRUPT</span>
        </div>
      </header>

      <div className="relative z-10 flex min-h-[calc(100vh-100px)] items-center justify-center px-5 py-8">
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease: [0.4, 0, 0.2, 1] }}
          className="w-full max-w-[460px] rounded-2xl p-7 sm:p-9"
          style={{
            background: "rgba(8,18,26,0.82)",
            border: "1px solid rgba(0,200,195,0.15)",
            backdropFilter: "blur(28px)",
            boxShadow: "0 0 0 1px rgba(0,200,195,0.05), 0 32px 80px rgba(0,0,0,0.75)",
          }}
        >
          {state === "loading" && (
            <div className="flex items-center justify-center py-12">
              <div className="h-8 w-8 animate-spin rounded-full border-2 border-transparent" style={{ borderTopColor: BRAND_TEAL }} />
            </div>
          )}

          {state === "error" && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-center">
              <div className="mx-auto mb-5 flex h-14 w-14 items-center justify-center rounded-full" style={{ background: "rgba(239,68,68,0.1)", border: "1px solid rgba(239,68,68,0.25)" }}>
                <X size={26} style={{ color: "#F87171" }} />
              </div>
              <h2 className="mb-2 text-[20px] font-semibold" style={{ fontFamily: "Georgia, serif", color: "#F0F5F4" }}>
                Invitation unavailable
              </h2>
              <p className="mb-6 text-[13px]" style={{ color: "rgba(160,200,195,0.75)" }}>{error}</p>
              <Link href="/login" className="inline-flex h-10 items-center gap-2 rounded-lg px-5 text-[13px] font-semibold" style={{ background: BRAND_GREEN, color: "#021A0E" }}>
                Go to login
              </Link>
            </motion.div>
          )}

          {(state === "ready" || state === "accepting" || (state as string) === "declining") && invite && (
            <>
              <motion.div {...rise(0)} className="mb-5 flex items-center gap-2">
                <span className="h-1.5 w-1.5 rounded-full" style={{ background: BRAND_GREEN }} />
                <span className="text-[11px] font-semibold uppercase tracking-[0.26em]" style={{ color: BRAND_GREEN }}>Team Invitation</span>
              </motion.div>

              <motion.div {...rise(1)} className="mb-5 flex items-center gap-3">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl" style={{ background: "rgba(0,200,195,0.1)", border: "1px solid rgba(0,200,195,0.2)" }}>
                  <Building2 size={18} style={{ color: BRAND_TEAL }} />
                </div>
                <div>
                  <div className="text-[17px] font-semibold" style={{ color: "#E8FFFC" }}>{invite.orgName}</div>
                  <div className="text-[12px]" style={{ color: "rgba(100,160,155,0.7)" }}>
                    invited you as <span className="font-semibold" style={{ color: BRAND_TEAL }}>{roleLabel(invite.role)}</span>
                  </div>
                </div>
              </motion.div>

              {invite.email && (
                <motion.p {...rise(2)} className="mb-5 rounded-lg px-3.5 py-2.5 text-[12px]" style={{ background: "rgba(0,180,170,0.06)", border: "1px solid rgba(0,200,195,0.15)", color: "rgba(160,210,205,0.8)" }}>
                  Invitation sent to: <strong style={{ color: "#E8FFFC" }}>{invite.email}</strong>
                </motion.p>
              )}

              {emailSent && (
                <motion.p {...rise(2)} className="mb-4 rounded-lg px-3.5 py-2.5 text-[12px]" style={{ background: "rgba(0,237,130,0.07)", border: "1px solid rgba(0,237,130,0.2)", color: "#86EFAC" }}>
                  Check your email for a sign-in link. Click it, then return here to accept.
                </motion.p>
              )}

              {error && (
                <motion.p {...rise(2)} role="alert" className="mb-4 rounded-lg px-3 py-2 text-[12px]" style={{ background: "rgba(239,68,68,0.08)", border: "1px solid rgba(239,68,68,0.25)", color: "#FCA5A5" }}>
                  {error}
                </motion.p>
              )}

              <motion.div {...rise(3)} className="mt-2 space-y-2">
                <button
                  onClick={handleAccept}
                  disabled={state === "accepting" || emailSent}
                  className="flex h-11 w-full items-center justify-center gap-2 rounded-lg text-[13px] font-bold tracking-wide transition-all duration-150 hover:brightness-110 disabled:opacity-50"
                  style={{ background: BRAND_GREEN, color: "#021A0E" }}
                >
                  {state === "accepting" ? "Accepting…" : emailSent ? "Check your email" : isAuthConfigured && !isAuthenticated ? "Sign in to accept" : "Accept invitation"}
                  {state !== "accepting" && <CheckCircle2 size={15} />}
                </button>

                <button
                  onClick={handleDecline}
                  disabled={state === "accepting" || state === "declining"}
                  className="flex h-10 w-full items-center justify-center gap-2 rounded-lg text-[12px] font-medium transition-all duration-150 hover:brightness-110 disabled:opacity-40"
                  style={{ background: "rgba(239,68,68,0.07)", border: "1px solid rgba(239,68,68,0.2)", color: "#FCA5A5" }}
                >
                  Decline
                </button>
              </motion.div>
            </>
          )}

          {state === "accepted" && (
            <motion.div initial={{ opacity: 0, scale: 0.97 }} animate={{ opacity: 1, scale: 1 }} className="text-center">
              <div className="mx-auto mb-5 flex h-14 w-14 items-center justify-center rounded-full" style={{ background: "rgba(0,237,130,0.12)", border: "1px solid rgba(0,237,130,0.25)" }}>
                <CheckCircle2 size={28} style={{ color: BRAND_GREEN }} />
              </div>
              <h2 className="mb-2 text-[20px] font-semibold" style={{ fontFamily: "Georgia, serif", color: "#F0F5F4" }}>Welcome aboard!</h2>
              <p className="text-[13px]" style={{ color: "rgba(160,200,195,0.75)" }}>Opening your workspace…</p>
            </motion.div>
          )}

          {state === "declined" && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-center">
              <div className="mx-auto mb-5 flex h-14 w-14 items-center justify-center rounded-full" style={{ background: "rgba(100,116,139,0.15)" }}>
                <X size={28} style={{ color: "#94A3B8" }} />
              </div>
              <h2 className="mb-2 text-[20px] font-semibold" style={{ color: "#F0F5F4" }}>Invitation declined</h2>
              <p className="text-[13px]" style={{ color: "rgba(160,200,195,0.75)" }}>Redirecting to login…</p>
            </motion.div>
          )}
        </motion.div>
      </div>
    </div>
  );
}
