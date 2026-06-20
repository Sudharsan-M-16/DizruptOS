"use client";

// Real-auth sign-in (Supabase). Rendered ONLY when Supabase is configured.
// Two tabs: Log in / Create account — both use passwordless email (no password
// required). Google + Microsoft OAuth buttons below.

import { useState } from "react";
import { Mail, Loader2 } from "lucide-react";
import { signInWithMagicLink, signInWithOAuth } from "@/lib/auth-supabase";
import { cn } from "@/lib/utils";

const AMBER = "#F97316";
type Tab = "login" | "signup";

export function RealAuthForm() {
  const [tab, setTab]     = useState<Tab>("login");
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<"idle" | "sending" | "sent" | "error">("idle");
  const [msg, setMsg]     = useState<string | null>(null);

  const sendLink = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) return;
    setStatus("sending"); setMsg(null);
    const r = await signInWithMagicLink(email.trim());
    if (r.ok) {
      setStatus("sent");
      setMsg(
        tab === "login"
          ? "Check your inbox — we've sent you a sign-in link."
          : "Check your inbox to confirm and activate your account."
      );
    } else {
      setStatus("error");
      setMsg(r.error ?? "Could not send the link. Please try again.");
    }
  };

  const oauth = async (provider: "google" | "azure") => {
    setStatus("sending"); setMsg(null);
    const r = await signInWithOAuth(provider);
    if (!r.ok) { setStatus("error"); setMsg(r.error ?? "Sign-in failed."); }
  };

  return (
    <div className="mb-6 mt-6">
      {/* tabs */}
      <div className="mb-4 flex gap-0 rounded-lg border border-white/[0.08] bg-white/[0.03] p-0.5">
        {(["login", "signup"] as Tab[]).map((t) => (
          <button
            key={t}
            type="button"
            onClick={() => { setTab(t); setStatus("idle"); setMsg(null); }}
            className={cn(
              "flex-1 rounded-[6px] py-2 text-[13px] font-medium transition-all duration-150",
              tab === t
                ? "bg-[#1a1a1a] text-white shadow-sm"
                : "text-[#898989] hover:text-[#B1B1B1]"
            )}
          >
            {t === "login" ? "Log in" : "Create account"}
          </button>
        ))}
      </div>

      <form onSubmit={sendLink} className="space-y-2">
        <div className="flex items-center gap-2 rounded-lg border border-white/[0.08] bg-white/[0.03] px-3 transition-colors focus-within:border-[#F97316]/40">
          <Mail size={14} className="text-[#4F4F4F]" />
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            placeholder="you@company.com"
            className="h-10 flex-1 bg-transparent text-[13px] text-white placeholder:text-[#4F4F4F] focus:outline-none"
          />
        </div>
        <button
          type="submit"
          disabled={status === "sending" || status === "sent"}
          className="flex h-10 w-full items-center justify-center gap-2 rounded-lg text-[13px] font-semibold text-[#FED7AA] transition-all hover:brightness-110 disabled:opacity-60"
          style={{ background: AMBER, border: "0.82px solid rgba(249,115,22,0.2)" }}
        >
          {status === "sending" && <Loader2 size={14} className="animate-spin" />}
          {status === "sent"
            ? "Link sent — check your inbox"
            : tab === "login"
            ? "Continue"
            : "Create account"}
        </button>
      </form>

      <div className="my-3 flex items-center gap-3 text-[11px] text-[#4F4F4F]">
        <span className="h-px flex-1 bg-white/[0.07]" /> or continue with <span className="h-px flex-1 bg-white/[0.07]" />
      </div>

      <div className="grid grid-cols-2 gap-2">
        <button
          onClick={() => oauth("google")}
          className="h-9 rounded-lg border border-white/[0.08] bg-white/[0.02] text-[12px] font-medium text-[#B1B1B1] transition-colors hover:bg-white/[0.05] hover:text-white"
        >
          Google
        </button>
        <button
          onClick={() => oauth("azure")}
          className="h-9 rounded-lg border border-white/[0.08] bg-white/[0.02] text-[12px] font-medium text-[#B1B1B1] transition-colors hover:bg-white/[0.05] hover:text-white"
        >
          Microsoft
        </button>
      </div>

      {msg && (
        <p className={cn("mt-3 text-[12px] leading-relaxed", status === "error" ? "text-red-400" : "text-emerald-400")}>
          {msg}
        </p>
      )}
    </div>
  );
}
