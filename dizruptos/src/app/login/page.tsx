"use client";

// Login — Brand-aligned design. Deep teal-black canvas with twin cyan glow
// spheres (left + right), subtle dot-grid overlay, and a centered card with
// the DIZRUPT identity: "Take the controls." in serif, green CTA, social auth,
// and the demo-persona picker. Visual identity matches brand reference image.

import * as React from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { motion } from "framer-motion";
import { AlertCircle, ArrowLeft, ArrowUpRight, CheckCircle2, Chrome, Mail, Zap } from "lucide-react";
import { PERSONAS, useSession } from "@/lib/session";
import { EmpAvatar } from "@/components/ui/primitives";
import { DizruptMark } from "@/components/ui/logo";
import { cn } from "@/lib/utils";
import { useOS } from "@/lib/os";
import { RealAuthForm } from "@/components/auth/real-auth-form";
import { isAuthConfigured } from "@/lib/auth-supabase";

// Uses useSearchParams (reason/from) — opt out of static prerender.
export const dynamic = "force-dynamic";

// useSearchParams must sit under a Suspense boundary for the production build.
export default function LoginPage() {
  return (
    <React.Suspense fallback={<div className="min-h-screen" style={{ background: "#040C12" }} />}>
      <LoginContent />
    </React.Suspense>
  );
}

/* ------------------------------------------------------------------ */
/* Brand background — twin cyan halos + dot grid                        */
/* ------------------------------------------------------------------ */
function BrandBackground() {
  const canvasRef = React.useRef<HTMLCanvasElement>(null);

  React.useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let animId: number;
    let tid: ReturnType<typeof setTimeout>;
    let t = 0;
    let dpr = 1;

    const setSize = () => {
      dpr = window.devicePixelRatio || 1;
      const W = canvas.parentElement?.clientWidth ?? window.innerWidth;
      const H = canvas.parentElement?.clientHeight ?? window.innerHeight;
      canvas.width = Math.round(W * dpr);
      canvas.height = Math.round(H * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };

    // Two cyan light sources — left orb and right orb, as in reference image
    const lights = [
      { x: 0.05, y: 0.48, vx: 0.00018, vy: 0.00025, r: 0.42, intensity: 0.95 }, // left
      { x: 0.95, y: 0.52, vx: -0.00015, vy: -0.00022, r: 0.40, intensity: 0.88 }, // right
      { x: 0.50, y: 0.15, vx: 0.0001, vy: 0.00012, r: 0.25, intensity: 0.35 }, // top faint
    ];

    // Cyan channel values — #00D9D5
    const CR = 0, CG = 217, CB = 213;

    const SPACING = 28;
    const DOT_R = 1.4;

    const draw = () => {
      t += 0.012;

      const W = canvas.width / dpr;
      const H = canvas.height / dpr;
      if (W < 10 || H < 10) { animId = requestAnimationFrame(draw); return; }

      ctx.clearRect(0, 0, W, H);

      // Update light positions (slow drift)
      for (const l of lights) {
        l.x += l.vx;
        l.y += l.vy;
        if (l.x < 0.02 || l.x > 0.98) { l.vx *= -1; l.x = Math.max(0.02, Math.min(0.98, l.x)); }
        if (l.y < 0.15 || l.y > 0.85) { l.vy *= -1; l.y = Math.max(0.15, Math.min(0.85, l.y)); }
      }

      const cols = Math.ceil(W / SPACING) + 1;
      const rows = Math.ceil(H / SPACING) + 1;

      for (let row = 0; row <= rows; row++) {
        for (let col = 0; col <= cols; col++) {
          const x = col * SPACING;
          const y = row * SPACING;
          let brightness = 0;

          for (const l of lights) {
            const lx = l.x * W;
            const ly = l.y * H;
            const maxR = l.r * Math.max(W, H);
            const d = Math.sqrt((x - lx) ** 2 + (y - ly) ** 2);
            if (d < maxR) {
              const falloff = 1 - d / maxR;
              brightness += falloff * falloff * l.intensity;
            }
          }

          brightness = Math.min(1, brightness);
          if (brightness < 0.008) continue;

          ctx.beginPath();
          ctx.arc(x, y, DOT_R, 0, Math.PI * 2);
          ctx.fillStyle = `rgba(${CR},${CG},${CB},${(brightness * 0.7).toFixed(3)})`;
          ctx.fill();
        }
      }

      animId = requestAnimationFrame(draw);
    };

    const onVisibility = () => {
      if (document.hidden) { cancelAnimationFrame(animId); }
      else { animId = requestAnimationFrame(draw); }
    };
    document.addEventListener("visibilitychange", onVisibility);

    tid = setTimeout(() => {
      setSize();
      window.addEventListener("resize", setSize);
      animId = requestAnimationFrame(draw);
    }, 50);

    return () => {
      clearTimeout(tid);
      cancelAnimationFrame(animId);
      window.removeEventListener("resize", setSize);
      document.removeEventListener("visibilitychange", onVisibility);
    };
  }, []);

  return (
    <div className="absolute inset-0 overflow-hidden" style={{ background: "#040C12" }}>
      {/* Canvas dot grid */}
      <canvas
        ref={canvasRef}
        aria-hidden="true"
        style={{ position: "absolute", inset: 0, display: "block", width: "100%", height: "100%" }}
      />

      {/* LEFT cyan halo sphere */}
      <div className="brand-orb-left" style={{
        position: "absolute",
        left: "-8%", top: "20%",
        width: "46vw", height: "60vh",
        borderRadius: "50%",
        background: "radial-gradient(ellipse at center, rgba(0,220,210,0.55) 0%, rgba(0,180,170,0.25) 32%, rgba(0,100,100,0.08) 60%, transparent 80%)",
        filter: "blur(48px)",
        pointerEvents: "none",
      }} />

      {/* LEFT inner bright core */}
      <div className="brand-orb-left-core" style={{
        position: "absolute",
        left: "0%", top: "30%",
        width: "22vw", height: "40vh",
        borderRadius: "50%",
        background: "radial-gradient(ellipse at center, rgba(0,240,230,0.75) 0%, rgba(0,200,195,0.35) 40%, transparent 72%)",
        filter: "blur(20px)",
        pointerEvents: "none",
      }} />

      {/* RIGHT cyan halo sphere */}
      <div className="brand-orb-right" style={{
        position: "absolute",
        right: "-8%", top: "18%",
        width: "46vw", height: "60vh",
        borderRadius: "50%",
        background: "radial-gradient(ellipse at center, rgba(0,220,210,0.50) 0%, rgba(0,170,165,0.22) 32%, rgba(0,90,90,0.07) 60%, transparent 80%)",
        filter: "blur(52px)",
        pointerEvents: "none",
      }} />

      {/* RIGHT inner bright core */}
      <div className="brand-orb-right-core" style={{
        position: "absolute",
        right: "0%", top: "28%",
        width: "22vw", height: "40vh",
        borderRadius: "50%",
        background: "radial-gradient(ellipse at center, rgba(0,240,230,0.70) 0%, rgba(0,200,195,0.30) 40%, transparent 72%)",
        filter: "blur(22px)",
        pointerEvents: "none",
      }} />

      {/* Subtle center bottom glow */}
      <div style={{
        position: "absolute",
        bottom: "-10%", left: "50%",
        transform: "translateX(-50%)",
        width: "60vw", height: "35vh",
        borderRadius: "50%",
        background: "radial-gradient(ellipse at center, rgba(0,180,170,0.12) 0%, transparent 70%)",
        filter: "blur(40px)",
        pointerEvents: "none",
      }} />

      {/* Sparkle diamond — bottom right as in reference */}
      <div className="brand-sparkle" style={{
        position: "absolute",
        bottom: "8%", right: "6%",
        pointerEvents: "none",
      }}>
        <svg width="32" height="32" viewBox="0 0 32 32" fill="none">
          <path d="M16 0 L17.8 14.2 L32 16 L17.8 17.8 L16 32 L14.2 17.8 L0 16 L14.2 14.2 Z"
            fill="rgba(0,230,220,0.6)" />
        </svg>
      </div>

      <style>{`
        @keyframes brand-orb-l {
          0%,100% { transform: translate(0,0) scale(1); opacity:.9; }
          48%     { transform: translate(2vw,3vh) scale(1.08); opacity:1; }
        }
        @keyframes brand-orb-r {
          0%,100% { transform: translate(0,0) scale(1); opacity:.85; }
          52%     { transform: translate(-2vw,-3vh) scale(1.06); opacity:.95; }
        }
        @keyframes brand-sparkle {
          0%,100% { opacity:.4; transform:rotate(0deg) scale(1); }
          50%     { opacity:.9; transform:rotate(45deg) scale(1.3); }
        }
        .brand-orb-left       { animation: brand-orb-l  14s ease-in-out infinite; }
        .brand-orb-left-core  { animation: brand-orb-l  10s ease-in-out infinite reverse; }
        .brand-orb-right      { animation: brand-orb-r  16s ease-in-out infinite; }
        .brand-orb-right-core { animation: brand-orb-r  11s ease-in-out infinite reverse; }
        .brand-sparkle        { animation: brand-sparkle 4s ease-in-out infinite; }
      `}</style>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Page                                                                 */
/* ------------------------------------------------------------------ */
const BRAND_TEAL = "#00D9D5";
const BRAND_GREEN = "#00ED82";

function LoginContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const sessionExpired = searchParams.get("reason") === "session_expired";
  const signIn = useSession((s) => s.signIn);
  const powerOn = useOS((s) => s.powerOn);
  const [selected, setSelected] = React.useState(PERSONAS[0].id);
  const [submitting, setSubmitting] = React.useState(false);
  const [leaving, setLeaving] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  const rise = (i: number) => ({
    initial: { opacity: 0, y: 14 },
    animate: { opacity: 1, y: 0 },
    transition: { duration: 0.45, delay: i * 0.07, ease: [0.4, 0, 0.2, 1] as const },
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
    <div className="relative min-h-screen overflow-hidden text-white" style={{ fontFamily: "var(--font-geist-sans, ui-sans-serif, system-ui)" }}>
      {/* Brand background */}
      <BrandBackground />

      {/* Legibility veil */}
      <div className="pointer-events-none absolute inset-0" style={{
        background: "linear-gradient(to bottom, rgba(4,12,18,0.25) 0%, transparent 30%, transparent 70%, rgba(4,12,18,0.55) 100%)"
      }} />

      {/* Top bar */}
      <header className="relative z-20 flex items-center justify-between px-6 py-5 lg:px-10">
        <motion.div {...rise(0)}>
          <Link
            href="/welcome"
            className="flex items-center gap-2 text-[13px] font-medium tracking-wide transition-colors duration-150 hover:text-white"
            style={{ color: "rgba(180,220,218,0.7)" }}
          >
            <ArrowLeft size={14} />
            Overview
          </Link>
        </motion.div>
        <motion.div {...rise(1)} className="flex items-center gap-2">
          <div className="flex h-7 w-7 items-center justify-center rounded-md" style={{ background: "rgba(0,237,130,0.15)" }}>
            <Zap size={14} fill={BRAND_GREEN} stroke={BRAND_GREEN} />
          </div>
          <span className="text-[13px] font-bold tracking-[0.28em] text-white">DIZRUPT</span>
        </motion.div>
      </header>

      {/* Centered card */}
      <div className="relative z-10 flex min-h-[calc(100vh-100px)] items-center justify-center px-5 py-8">
        <motion.div
          initial={{ opacity: 0, y: 24, scale: 0.988 }}
          animate={leaving ? { opacity: 0, y: -20, scale: 0.98 } : { opacity: 1, y: 0, scale: 1 }}
          transition={{ duration: 0.55, ease: [0.4, 0, 0.2, 1] }}
          className="w-full max-w-[440px] rounded-2xl p-7 sm:p-9"
          style={{
            background: "rgba(8,18,26,0.82)",
            border: "1px solid rgba(0,200,195,0.15)",
            backdropFilter: "blur(28px)",
            boxShadow: "0 0 0 1px rgba(0,200,195,0.05), 0 32px 80px rgba(0,0,0,0.75), inset 0 1px 0 rgba(0,220,210,0.06)",
          }}
        >
          {/* Session expired banner */}
          {sessionExpired && (
            <motion.div
              initial={{ opacity: 0, y: -8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3 }}
              className="mb-5 flex items-center gap-2.5 rounded-lg px-3.5 py-2.5"
              style={{
                background: "rgba(251,191,36,0.08)",
                border: "1px solid rgba(251,191,36,0.3)",
              }}
              role="alert"
            >
              <AlertCircle size={14} style={{ color: "#FCD34D", flexShrink: 0 }} />
              <p className="text-[12px]" style={{ color: "#FDE68A" }}>
                Your session expired. Sign in again to continue.
              </p>
            </motion.div>
          )}

          {/* Kicker */}
          <motion.div {...rise(2)} className="mb-5 flex items-center gap-2">
            <span className="h-1.5 w-1.5 rounded-full" style={{ background: BRAND_GREEN }} />
            <span className="text-[11px] font-semibold uppercase tracking-[0.26em]" style={{ color: BRAND_GREEN }}>
              Resource Intelligence
            </span>
          </motion.div>

          {/* Headline — serif italic "controls" */}
          <motion.h1
            {...rise(3)}
            className="leading-[1.03] tracking-[-0.02em]"
            style={{
              fontFamily: "Georgia, 'Times New Roman', serif",
              fontSize: "clamp(2.4rem,6.5vw,3.2rem)",
              fontWeight: 300,
              color: "#F0F5F4",
            }}
          >
            Take the{" "}
            <em style={{ fontStyle: "italic", color: "#E8FFFC" }}>controls</em>.
          </motion.h1>

          <motion.p {...rise(4)} className="mt-3.5 text-[14px] leading-[1.65]" style={{ color: "rgba(160,200,195,0.75)" }}>
            Sign in and{" "}
            <span style={{ color: "#E8FFFC", fontWeight: 600 }}>DizruptOS</span>{" "}
            boots up — your whole workplace as a desktop operating system.
          </motion.p>

          {/* Real auth (Supabase) or email field */}
          {isAuthConfigured ? (
            <motion.div {...rise(5)} className="mt-6">
              <RealAuthForm />
              <div className="mt-3 text-center">
                <Link
                  href="/reset-password"
                  className="text-[12px] transition-colors duration-150 hover:text-white"
                  style={{ color: "rgba(0,200,195,0.6)" }}
                >
                  Forgot password?
                </Link>
              </div>
            </motion.div>
          ) : (
            <motion.div {...rise(6)} className="mt-5 space-y-3">
              {/* Email field */}
              <div className="relative flex items-center">
                <Mail size={14} className="absolute left-3.5" style={{ color: "rgba(0,200,195,0.6)" }} />
                <input
                  type="email"
                  placeholder="you@company.com"
                  readOnly
                  className="h-11 w-full rounded-lg pl-10 pr-10 text-[13px] focus:outline-none"
                  style={{
                    background: "rgba(0,180,170,0.06)",
                    border: "1px solid rgba(0,200,195,0.25)",
                    color: "rgba(200,240,235,0.9)",
                  }}
                />
                <CheckCircle2 size={14} className="absolute right-3.5" style={{ color: BRAND_GREEN }} />
              </div>

              {/* Continue button */}
              <button
                className="w-full rounded-lg py-2.5 text-[13px] font-bold tracking-wide transition-all duration-150 hover:brightness-110 active:scale-[0.98]"
                style={{
                  background: BRAND_GREEN,
                  color: "#021A0E",
                  boxShadow: `0 0 20px rgba(0,237,130,0.35)`,
                }}
              >
                Continue
              </button>

              {/* Divider */}
              <div className="flex items-center gap-3 py-1">
                <div className="h-px flex-1" style={{ background: "rgba(0,180,170,0.15)" }} />
                <span className="text-[11px]" style={{ color: "rgba(100,160,155,0.6)" }}>or continue with</span>
                <div className="h-px flex-1" style={{ background: "rgba(0,180,170,0.15)" }} />
              </div>

              {/* Social auth buttons */}
              <div className="grid grid-cols-2 gap-2.5">
                {[
                  { label: "Google", icon: "G" },
                  { label: "Microsoft", icon: "M" },
                ].map(({ label, icon }) => (
                  <button
                    key={label}
                    className="flex items-center justify-center gap-2 rounded-lg py-2 text-[12px] font-semibold transition-all duration-150 hover:border-[rgba(0,200,195,0.35)]"
                    style={{
                      background: "rgba(0,180,170,0.05)",
                      border: "1px solid rgba(0,180,170,0.18)",
                      color: "rgba(180,220,215,0.85)",
                    }}
                  >
                    <span className="text-[13px] font-bold">{icon}</span>
                    {label}
                  </button>
                ))}
              </div>
            </motion.div>
          )}

          {/* Demo accounts */}
          <motion.div {...rise(7)} className="mt-6">
            <div className="mb-3 flex items-baseline justify-between">
              <span className="text-[11px] font-bold uppercase tracking-[0.2em]" style={{ color: "rgba(0,200,195,0.7)" }}>
                Demo Accounts
              </span>
              <span className="text-[10px]" style={{ color: "rgba(100,150,145,0.55)" }}>one per role</span>
            </div>

            <form onSubmit={submit} className="space-y-2">
              {PERSONAS.map((p) => {
                const active = selected === p.id;
                return (
                  <button
                    key={p.id}
                    type="button"
                    onClick={() => setSelected(p.id)}
                    className="flex w-full items-center gap-3 rounded-lg p-2.5 text-left transition-all duration-150"
                    style={active ? {
                      background: "rgba(0,200,195,0.08)",
                      border: "1px solid rgba(0,200,195,0.28)",
                    } : {
                      background: "rgba(0,180,170,0.03)",
                      border: "1px solid rgba(0,180,170,0.10)",
                    }}
                  >
                    <EmpAvatar initials={p.initials} accent={active ? BRAND_TEAL : "#2A4A47"} size={34} />
                    <div className="min-w-0 flex-1">
                      <div className="text-[13px] font-semibold" style={{ color: active ? "#E8FFFC" : "rgba(180,215,210,0.85)" }}>
                        {p.name}
                      </div>
                      <div className="text-[11px]" style={{ color: "rgba(100,160,155,0.65)" }}>{p.title}</div>
                    </div>
                    <span
                      className="shrink-0 rounded px-2 py-0.5 text-[10px] font-semibold"
                      style={active ? {
                        background: "rgba(0,200,195,0.12)",
                        border: "1px solid rgba(0,200,195,0.30)",
                        color: BRAND_TEAL,
                      } : {
                        background: "rgba(0,0,0,0.2)",
                        border: "1px solid rgba(0,180,170,0.12)",
                        color: "rgba(100,160,155,0.7)",
                      }}
                    >
                      {p.role.replace("_", " ")}
                    </span>
                  </button>
                );
              })}

              {error && (
                <p role="alert" className="rounded-lg px-3 py-2 text-[12px]"
                  style={{ background: "rgba(239,68,68,0.08)", border: "1px solid rgba(239,68,68,0.25)", color: "#FCA5A5" }}>
                  {error}
                </p>
              )}

              <button
                type="submit"
                disabled={submitting}
                className="group mt-1 flex h-11 w-full items-center justify-center gap-2 rounded-lg text-[13px] font-bold tracking-wide transition-all duration-150 hover:brightness-110 disabled:opacity-50 active:scale-[0.98]"
                style={{
                  background: BRAND_GREEN,
                  color: "#021A0E",
                  boxShadow: `0 0 24px rgba(0,237,130,0.30)`,
                }}
              >
                {leaving ? "Booting…" : submitting ? "Signing in…" : (() => {
                  const p = PERSONAS.find((x) => x.id === selected);
                  return `Enter as ${p?.name?.split(" ")[0] ?? "Guest"}`;
                })()}
                <ArrowUpRight
                  size={14}
                  strokeWidth={2.5}
                  className="transition-transform duration-150 group-hover:translate-x-0.5 group-hover:-translate-y-0.5"
                />
              </button>
            </form>
          </motion.div>
        </motion.div>
      </div>

      {/* Teal warp transition on login */}
      {leaving && (
        <div className="pointer-events-none fixed inset-0 z-50 flex items-center justify-center">
          <motion.span
            initial={{ scale: 0, opacity: 0.9 }}
            animate={{ scale: 42, opacity: 1 }}
            transition={{ duration: 0.7, ease: [0.4, 0, 0.2, 1] }}
            className="block h-24 w-24 rounded-full"
            style={{ background: `radial-gradient(circle, #E0FFFD 0%, ${BRAND_TEAL} 46%, #040C12 78%)` }}
          />
          <motion.span
            initial={{ opacity: 0 }}
            animate={{ opacity: [0, 1, 0] }}
            transition={{ duration: 0.5, times: [0, 0.35, 1] }}
            className="absolute inset-0"
            style={{ background: "rgba(0,220,210,0.12)" }}
          />
        </div>
      )}
    </div>
  );
}
