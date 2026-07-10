"use client";

// Lock screen — the macOS hand-off between power-on and the desktop. The chosen
// wallpaper fills the field; a large clock floats top-center; the signed-in
// persona sits bottom-center with a password well and a Touch-ID affordance.
// Any submit (or Touch ID) unlocks — this is a demo gate, not real auth, which
// already happened at /login. Theme + accent aware.

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { ArrowRight, Fingerprint } from "lucide-react";
import { useOS } from "@/lib/os";
import { PERSONAS, useSession } from "@/lib/session";
import { EmpAvatar } from "@/components/ui/primitives";
import { Wallpaper } from "./wallpaper";

function useClock() {
  const [now, setNow] = useState<Date | null>(null);
  useEffect(() => {
    setNow(new Date());
    const t = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(t);
  }, []);
  return now;
}

export function LockScreen() {
  const unlock = useOS((s) => s.unlock);
  const accent = useOS((s) => s.accent().hex);
  const personaId = useSession((s) => s.personaId);
  const persona = PERSONAS.find((p) => p.id === personaId) ?? PERSONAS[0];
  const now = useClock();
  const [pw, setPw] = useState("");
  const [auth, setAuth] = useState(false);

  const doUnlock = () => {
    if (auth) return;
    setAuth(true);
    setTimeout(unlock, 520);
  };

  return (
    <motion.div
      className="fixed inset-0 z-[190] overflow-hidden"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0, scale: 1.03, filter: "blur(8px)" }}
      transition={{ duration: 0.5, ease: "easeInOut" }}
    >
      <Wallpaper />
      <div className="absolute inset-0 bg-black/20 backdrop-blur-[2px]" />

      {/* centered column — clock + user grouped in the middle of the screen */}
      <div className="absolute inset-0 z-10 flex flex-col items-center justify-center gap-[9vh] px-6">

      {/* clock */}
      <motion.div
        initial={{ opacity: 0, y: -16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.15, duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
        className="select-none text-center text-white"
        style={{ textShadow: "0 2px 30px rgba(0,0,0,0.45)" }}
      >
        <div className="text-base font-medium tracking-wide text-white/80">
          {now?.toLocaleDateString(undefined, { weekday: "long", month: "long", day: "numeric" }) ?? " "}
        </div>
        <div className="mt-1 font-display text-[112px] font-bold leading-none tracking-tight tabular-nums">
          {now?.toLocaleTimeString(undefined, { hour: "2-digit", minute: "2-digit", hour12: false }) ?? " "}
        </div>
      </motion.div>

      {/* user + unlock */}
      <motion.div
        initial={{ opacity: 0, y: 18 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.32, duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
        className="flex w-[320px] flex-col items-center"
      >
        <motion.div animate={auth ? { scale: [1, 1.08, 1] } : {}} transition={{ duration: 0.5 }}>
          <EmpAvatar initials={persona.initials} accent={persona.accent} size={84} />
        </motion.div>
        <div className="mt-3 text-lg font-semibold text-white" style={{ textShadow: "0 1px 12px rgba(0,0,0,0.5)" }}>
          {persona.name}
        </div>
        <div className="text-2xs text-white/60">{persona.title}</div>

        <form
          onSubmit={(e) => { e.preventDefault(); doUnlock(); }}
          className="mt-5 flex w-full items-center gap-2"
        >
          <div className="flex flex-1 items-center rounded-full border border-white/20 bg-white/10 pl-4 pr-1.5 backdrop-blur-xl focus-within:border-white/40">
            <input
              autoFocus
              type="password"
              value={pw}
              onChange={(e) => setPw(e.target.value)}
              placeholder="Enter Password"
              className="h-10 flex-1 bg-transparent text-sm text-white placeholder:text-white/45 focus:outline-none"
            />
            <button
              type="submit"
              aria-label="Unlock"
              className="grid h-8 w-8 place-items-center rounded-full text-black transition-transform hover:scale-105 active:scale-95"
              style={{ background: accent }}
            >
              <ArrowRight size={16} />
            </button>
          </div>
        </form>

        <button
          onClick={doUnlock}
          className="mt-4 flex items-center gap-2 rounded-full border border-white/15 bg-white/[0.06] px-4 py-2 text-2xs font-medium text-white/80 backdrop-blur-xl transition-colors hover:bg-white/[0.12]"
        >
          <Fingerprint size={16} style={{ color: accent }} />
          Touch ID to unlock
        </button>
        <div className="mt-3 text-[11px] text-white/40">Press <span className="font-semibold text-white/60">Return</span> — demo unlock</div>
      </motion.div>
      </div>
    </motion.div>
  );
}
