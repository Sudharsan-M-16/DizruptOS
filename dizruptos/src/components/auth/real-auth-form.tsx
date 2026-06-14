"use client";

// Real-auth sign-in (Supabase). Rendered ONLY when Supabase is configured
// (`isAuthConfigured`), so in demo mode it never appears and the persona picker
// stays the way it is. Magic-link email + Google / Microsoft OAuth, all wired to
// `/auth/callback`. This is the production sign-in surface, code-complete and
// waiting on credentials.

import { useState } from "react";
import { Mail, Loader2 } from "lucide-react";
import { signInWithMagicLink, signInWithOAuth } from "@/lib/auth-supabase";

const AMBER = "#F97316";

export function RealAuthForm() {
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<"idle" | "sending" | "sent" | "error">("idle");
  const [msg, setMsg] = useState<string | null>(null);

  const sendLink = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) return;
    setStatus("sending"); setMsg(null);
    const r = await signInWithMagicLink(email.trim());
    if (r.ok) { setStatus("sent"); setMsg("Check your inbox for a secure sign-in link."); }
    else { setStatus("error"); setMsg(r.error ?? "Could not send the link."); }
  };

  const oauth = async (provider: "google" | "azure") => {
    setStatus("sending"); setMsg(null);
    const r = await signInWithOAuth(provider);
    if (!r.ok) { setStatus("error"); setMsg(r.error ?? "Sign-in failed."); }
  };

  return (
    <div className="mb-7">
      <form onSubmit={sendLink} className="space-y-2.5">
        <label className="block text-[13px] font-medium uppercase tracking-[0.16em] text-white">Sign in</label>
        <div className="flex items-center gap-2 rounded-lg border border-white/15 bg-white/[0.04] px-3">
          <Mail size={15} className="text-[#A3A3A3]" />
          <input
            type="email" value={email} onChange={(e) => setEmail(e.target.value)} required
            placeholder="you@company.com"
            className="h-11 flex-1 bg-transparent text-sm text-white placeholder:text-[#6b6b6b] focus:outline-none"
          />
        </div>
        <button
          type="submit" disabled={status === "sending"}
          className="flex h-11 w-full items-center justify-center gap-2 rounded-lg text-sm font-semibold text-black transition-transform hover:scale-[1.01] disabled:opacity-60"
          style={{ background: AMBER }}
        >
          {status === "sending" ? <Loader2 size={16} className="animate-spin" /> : null}
          Email me a magic link
        </button>
      </form>

      <div className="my-3 flex items-center gap-3 text-2xs text-[#6b6b6b]">
        <span className="h-px flex-1 bg-white/10" /> or <span className="h-px flex-1 bg-white/10" />
      </div>

      <div className="grid grid-cols-2 gap-2">
        <button onClick={() => oauth("google")} className="h-10 rounded-lg border border-white/15 bg-white/[0.04] text-xs font-medium text-white transition-colors hover:bg-white/[0.08]">Google</button>
        <button onClick={() => oauth("azure")} className="h-10 rounded-lg border border-white/15 bg-white/[0.04] text-xs font-medium text-white transition-colors hover:bg-white/[0.08]">Microsoft</button>
      </div>

      {msg && <p className={`mt-3 text-2xs ${status === "error" ? "text-red-400" : "text-emerald-400"}`}>{msg}</p>}
    </div>
  );
}
