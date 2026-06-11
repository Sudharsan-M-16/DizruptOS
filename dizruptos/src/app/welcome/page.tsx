"use client";

// DIZRUPT marketing landing — the public face of the product. Linear's
// restraint, Monday's confidence, our voltage. One cinematic scroll:
// strike → proof → capability → trust → invitation.
//
// Motion grammar: hero loads with a staggered reveal; the product frame
// un-tilts from 24° as you scroll (perspective stage); sections rise on
// entry; everything collapses under prefers-reduced-motion via the global
// CSS guard.

import * as React from "react";
import Link from "next/link";
import dynamic from "next/dynamic";
import {
  AnimatePresence,
  motion,
  useMotionValueEvent,
  useReducedMotion,
  useScroll,
  useTransform,
} from "framer-motion";
import {
  ArrowRight,
  ChevronDown,
  ChevronRight,
  Flame,
  GitBranch,
  Inbox,
  Network,
  ScrollText,
  Sparkles,
  Workflow,
  Zap,
} from "lucide-react";
import { DizruptMark, DizruptWordmark } from "@/components/ui/logo";
import { NumberTicker, AuroraBackdrop } from "@/components/ui/ascension";
import { RevealText } from "@/components/fx/reveal-text";
import { TextScramble } from "@/components/fx/text-scramble";
import { ProductFrame } from "@/components/landing/product-frame";
import { cn } from "@/lib/utils";

const DotMatrixField = dynamic(
  () => import("@/components/fx/dot-field").then((m) => m.DotMatrixField),
  { ssr: false }
);

/* ------------------------------- mouse glow -------------------------------- */
// A soft white radial that follows the cursor across the entire page —
// direct style mutation, zero re-renders.

function MouseGlow() {
  const ref = React.useRef<HTMLDivElement>(null);
  React.useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const el = ref.current;
    if (!el) return;
    let raf = 0;
    const onMove = (e: PointerEvent) => {
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(() => {
        el.style.background = `radial-gradient(560px circle at ${e.clientX}px ${e.clientY}px, rgba(255,255,255,0.05), transparent 70%)`;
      });
    };
    window.addEventListener("pointermove", onMove, { passive: true });
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("pointermove", onMove);
    };
  }, []);
  return <div ref={ref} aria-hidden className="pointer-events-none fixed inset-0 z-[1]" />;
}

/* --------------------------------- shared --------------------------------- */

const rise = {
  initial: { opacity: 0, y: 24 },
  whileInView: { opacity: 1, y: 0 },
  viewport: { once: true, margin: "-12% 0px" },
  transition: { duration: 0.6, ease: [0.22, 1, 0.36, 1] as const },
};

function Kicker({ children }: { children: string }) {
  return (
    <div className="mb-3 flex items-center gap-2 text-2xs font-medium uppercase tracking-[0.22em] text-brand">
      <Zap size={11} />
      <TextScramble text={children} />
    </div>
  );
}

/* ----------------------------------- nav ---------------------------------- */

function LandingNav() {
  return (
    <header className="fixed inset-x-0 top-0 z-50 border-b border-line-subtle/60 bg-ink/70 backdrop-blur-xl">
      <nav className="mx-auto flex h-14 max-w-6xl items-center justify-between px-5">
        <Link href="/welcome" className="flex items-center">
          <DizruptWordmark markSize={24} />
        </Link>
        <div className="hidden items-center gap-7 text-xs text-fg-secondary md:flex">
          {["Product", "Method", "Customers", "Manifesto"].map((l) => (
            <a key={l} href={`#${l.toLowerCase()}`} className="transition-colors hover:text-fg">
              <TextScramble text={l} className="font-sans" />
            </a>
          ))}
        </div>
        <div className="flex items-center gap-2.5">
          <Link
            href="/login"
            className="rounded-lg px-3 py-1.5 text-xs font-medium text-fg-secondary transition-colors hover:text-fg"
          >
            Sign in
          </Link>
          <Link
            href="/login"
            className="group relative inline-flex h-8 items-center overflow-hidden rounded-lg bg-brand pl-3 pr-9 text-xs font-semibold text-[#04281A] transition-colors hover:bg-[#3DF59E]"
          >
            <span>Get started</span>
            <i className="absolute bottom-1 right-1 top-1 z-10 grid w-6 place-items-center rounded-md bg-[#04281A]/15 transition-all duration-500 group-hover:w-[calc(100%-0.5rem)] group-active:scale-95">
              <ChevronRight size={13} strokeWidth={2.5} aria-hidden />
            </i>
          </Link>
        </div>
      </nav>
    </header>
  );
}

/* ---------------------------------- hero ---------------------------------- */

function Hero() {
  const stageRef = React.useRef<HTMLDivElement>(null);
  const reduced = useReducedMotion();
  // The perspective reveal — the dashboard lies back at 45°, half-faded and
  // sunk 100px; scrolling scrubs it flat, full-scale, fully lit, centered.
  const { scrollYProgress } = useScroll({
    target: stageRef,
    offset: ["start 95%", "start 22%"],
  });
  const rotateX = useTransform(scrollYProgress, [0, 1], reduced ? [0, 0] : [45, 0]);
  const scale = useTransform(scrollYProgress, [0, 1], reduced ? [1, 1] : [0.8, 1]);
  const opacity = useTransform(scrollYProgress, [0, 1], reduced ? [1, 1] : [0.5, 1]);
  const y = useTransform(scrollYProgress, [0, 1], reduced ? [0, 0] : [100, 0]);
  const glow = useTransform(scrollYProgress, [0, 1], [0.12, 0.5]);

  return (
    <section className="relative overflow-hidden pt-32">
      <AuroraBackdrop className="opacity-80" />
      <div className="relative mx-auto max-w-6xl px-5 text-center">
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="mx-auto mb-7 inline-flex items-center gap-2 rounded-full border border-brand/30 bg-brand-soft px-3.5 py-1.5 text-2xs font-medium text-brand"
        >
          <Sparkles size={11} />
          Resource Intelligence Platform · now with agent negotiation
        </motion.div>

        <h1 className="mx-auto max-w-4xl font-display text-[clamp(2.6rem,7vw,4.6rem)] font-bold leading-[1.04] tracking-[-0.03em]">
          <RevealText text="Every person. Every project." per={0.07} />
          <br />
          {/* single element: bg-clip-text breaks across transformed children */}
          <motion.span
            initial={{ opacity: 0, y: 18, filter: "blur(8px)" }}
            animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
            transition={{ delay: 0.5, duration: 0.65, ease: [0.22, 1, 0.36, 1] }}
            className="inline-block bg-gradient-to-r from-brand via-[#7DF5C3] to-brand-secondary bg-clip-text text-transparent"
          >
            Every consequence.
          </motion.span>
        </h1>

        <motion.p
          initial={{ opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.75, duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
          className="mx-auto mt-6 max-w-2xl text-balance text-sm leading-7 text-fg-secondary sm:text-base"
        >
          DIZRUPT is the operating system for your organization — capacity,
          execution, memory and strategy fused into one live command center.
          When something is about to break, you know before it does.
        </motion.p>

        <motion.div
          initial={{ opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.95, duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
          className="mt-9 flex flex-wrap items-center justify-center gap-3"
        >
          <Link
            href="/login"
            className="group relative inline-flex h-11 items-center overflow-hidden rounded-xl bg-brand pl-5 pr-12 text-sm font-semibold text-[#04281A] shadow-glow transition-colors hover:bg-[#3DF59E]"
          >
            Enter the command center
            <i className="absolute bottom-1.5 right-1.5 top-1.5 z-10 grid w-8 place-items-center rounded-lg bg-[#04281A]/15 transition-all duration-500 group-hover:w-[calc(100%-0.75rem)] group-active:scale-95">
              <ArrowRight size={15} strokeWidth={2.5} aria-hidden />
            </i>
          </Link>
          <a
            href="#method"
            className="inline-flex h-11 items-center gap-2 rounded-xl border border-line bg-ink-surface/60 px-5 text-sm font-medium text-fg-secondary backdrop-blur transition-colors hover:border-brand/40 hover:text-fg"
          >
            Read the method
          </a>
        </motion.div>
      </div>

      {/* scroll-down cue */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1.6, duration: 0.6 }}
        className="relative mt-12 flex flex-col items-center gap-1.5 text-2xs uppercase tracking-[0.25em] text-fg-muted"
      >
        Scroll to flatten the org
        <motion.span
          animate={{ y: [0, 6, 0] }}
          transition={{ duration: 1.8, repeat: Infinity, ease: "easeInOut" }}
        >
          <ChevronDown size={14} className="text-brand" />
        </motion.span>
      </motion.div>

      {/* 3D perspective stage — the product un-tilts into your hands */}
      <div ref={stageRef} className="relative mx-auto mt-10 max-w-5xl px-5 pb-10 sm:mt-12">
        <div style={{ perspective: 1100 }}>
          <motion.div
            style={{
              rotateX,
              scale,
              opacity,
              y,
              transformOrigin: "center top",
              boxShadow:
                "0 0 0 1px rgba(0,237,130,0.12), 0 24px 80px rgba(0,0,0,0.55), 0 8px 28px rgba(0,237,130,0.10)",
            }}
            className="relative aspect-[16/10] w-full rounded-2xl border border-line bg-ink-surface/85 p-2 backdrop-blur sm:aspect-[16/9]"
          >
            <motion.div
              aria-hidden
              style={{ opacity: glow }}
              className="pointer-events-none absolute -inset-px rounded-2xl bg-[radial-gradient(60%_40%_at_50%_0%,rgba(0,237,130,0.18),transparent_70%)]"
            />
            <ProductFrame />
          </motion.div>
        </div>
        {/* floor reflection */}
        <div
          aria-hidden
          className="mx-auto mt-[-6px] h-16 max-w-3xl rounded-[100%] bg-brand/10 blur-3xl"
        />
      </div>
    </section>
  );
}

/* -------------------------------- logo strip ------------------------------- */

const CUSTOMERS = ["NORTHWIND", "HELIX LABS", "OCTANE", "KITEWORKS", "ATLASCORE", "MERIDIAN"];

function LogoStrip() {
  return (
    <motion.section {...rise} className="border-y border-line-subtle/60 bg-ink-surface/40 py-9 backdrop-blur">
      <div className="mx-auto max-w-6xl px-5">
        <p className="text-center text-2xs uppercase tracking-[0.25em] text-fg-muted">
          Operating the orgs that can&apos;t afford surprises
        </p>
        <div className="mt-5 flex flex-wrap items-center justify-center gap-x-12 gap-y-4">
          {CUSTOMERS.map((c) => (
            <span
              key={c}
              className="font-display text-sm font-bold tracking-[0.18em] text-fg-faint transition-colors hover:text-fg-secondary"
            >
              {c}
            </span>
          ))}
        </div>
      </div>
    </motion.section>
  );
}

/* ------------------------------ scrollytelling ------------------------------ */
// Sticky split-screen: the viewport pins while scroll progress walks through
// four chapters — active copy ignites on the left, its visual crossfades in
// on the right.

const STORY = [
  {
    id: "capacity",
    icon: Flame,
    title: "See the load before it breaks",
    body: "Eight weeks of organizational capacity, person by person. Overload glows amber at 85%, red past 100% — days before burnout becomes a resignation letter.",
    visual: (
      <div className="space-y-2.5">
        {[
          ["Sarah K", [0.72, 0.88, 1.13, 0.94, 0.71, 0.6]],
          ["Dev M", [0.55, 0.62, 0.7, 0.81, 0.92, 0.66]],
          ["Priya S", [0.81, 0.74, 0.6, 0.55, 0.49, 0.58]],
          ["Jon T", [0.62, 0.95, 0.83, 0.71, 1.06, 0.77]],
          ["Mara L", [0.45, 0.52, 0.61, 0.68, 0.74, 0.8]],
        ].map(([name, row]) => (
          <div key={name as string} className="flex items-center gap-2">
            <span className="w-14 font-mono text-[10px] text-fg-muted">{name as string}</span>
            {(row as number[]).map((v, i) => (
              <div key={i} className="relative h-7 flex-1 overflow-hidden rounded-md bg-ink-elevated">
                <div
                  className="absolute inset-y-0 left-0 rounded-md"
                  style={{
                    width: `${Math.min(v, 1.2) * 80}%`,
                    background:
                      v > 1 ? "rgba(239,68,68,0.8)" : v > 0.85 ? "rgba(245,158,11,0.7)" : `rgba(0,237,130,${0.25 + v * 0.4})`,
                  }}
                />
              </div>
            ))}
          </div>
        ))}
        <div className="flex items-center justify-between pt-1 font-mono text-[10px] text-fg-muted">
          <span>WK 24 → WK 29</span>
          <span className="text-warn">Sarah K breaches 113% in WK 26</span>
        </div>
      </div>
    ),
  },
  {
    id: "graph",
    icon: Network,
    title: "Every dependency, one constellation",
    body: "People, projects, vendors, systems and risks live as a single graph. Hover a node and its blast radius ignites — you see what a slip actually touches.",
    visual: (
      <svg viewBox="0 0 360 220" className="w-full">
        {[
          [60, 110, 160, 50], [60, 110, 160, 170], [160, 50, 260, 110],
          [160, 170, 260, 110], [260, 110, 330, 60], [260, 110, 330, 160],
          [160, 50, 160, 170],
        ].map(([a, b, c, d], i) => (
          <line key={i} x1={a} y1={b} x2={c} y2={d} stroke="rgba(0,237,130,0.4)" strokeWidth="1.4" strokeDasharray={i === 6 ? "4 4" : undefined} />
        ))}
        {[
          [60, 110, 11, "#00ED82", "Atlas"], [160, 50, 8, "#2BD9FF", "Sarah K"],
          [160, 170, 8, "#2BD9FF", "Payments API"], [260, 110, 11, "#00ED82", "Identity"],
          [330, 60, 7, "#F59E0B", "Vendor SLA"], [330, 160, 7, "#EF4444", "Risk R-12"],
        ].map(([x, y, r, c, label], i) => (
          <g key={i}>
            <circle cx={x as number} cy={y as number} r={r as number} fill={c as string} opacity={0.92} />
            <text x={(x as number) + 14} y={(y as number) + 4} fill="#8A9EAC" fontSize="10" fontFamily="monospace">
              {label as string}
            </text>
          </g>
        ))}
      </svg>
    ),
  },
  {
    id: "agents",
    icon: Inbox,
    title: "Agents negotiate. You decide.",
    body: "When dates slip or load breaks, agents draft the trade-offs with full causal chains. Accept, counter or defer — one click, permanently on the record.",
    visual: (
      <div className="space-y-2.5">
        {[
          { t: "Rebalance Sarah → Dev · 12h of Atlas QA", c: "98% fit", tone: "text-brand border-brand/40" },
          { t: "Slip Atlas QA gate by 2 days", c: "compromise", tone: "text-warn border-warn/40" },
          { t: "Escalate Northwind SLA breach to legal", c: "urgent", tone: "text-danger border-danger/40" },
        ].map((p) => (
          <div key={p.t} className={cn("rounded-xl border bg-ink-elevated/80 p-3.5", p.tone.split(" ")[1])}>
            <div className="flex items-center justify-between gap-3">
              <span className="text-xs font-medium text-fg-secondary">{p.t}</span>
              <span className={cn("shrink-0 font-mono text-[10px]", p.tone.split(" ")[0])}>{p.c}</span>
            </div>
            <div className="mt-2.5 flex gap-1.5">
              <span className="rounded-md bg-brand px-2.5 py-1 text-[10px] font-bold text-[#04281A]">Accept</span>
              <span className="rounded-md border border-line px-2.5 py-1 text-[10px] text-fg-secondary">Counter</span>
              <span className="rounded-md border border-line px-2.5 py-1 text-[10px] text-fg-muted">Defer</span>
            </div>
          </div>
        ))}
      </div>
    ),
  },
  {
    id: "memory",
    icon: ScrollText,
    title: "Memory that survives the reorg",
    body: "Every decision is a ledger entry: who, when, why, and what it caused. Six months later the context is still there — auditable, never regenerated.",
    visual: (
      <div className="space-y-2">
        {[
          ["DEC-114", "Ledger-first architecture", "Active", "text-ok"],
          ["DEC-113", "Vendor consolidation Q3", "Superseded", "text-fg-faint"],
          ["DEC-112", "Freeze hiring in Platform", "Active", "text-ok"],
          ["DEC-111", "Adopt capacity guardrails at 80%", "Active", "text-ok"],
        ].map(([id, t, s, tone]) => (
          <div key={id as string} className="flex items-center gap-3 rounded-lg border border-line-subtle bg-ink-elevated/80 px-3 py-2.5">
            <span className="font-mono text-[10px] text-brand">{id as string}</span>
            <span className="flex-1 truncate text-xs text-fg-secondary">{t as string}</span>
            <span className={cn("font-mono text-[10px]", tone as string)}>{s as string}</span>
          </div>
        ))}
        <div className="pt-1 text-center font-mono text-[10px] text-fg-muted">
          1,204 entries · zero lost context
        </div>
      </div>
    ),
  },
];

function ScrollStory() {
  const ref = React.useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ["start start", "end end"],
  });
  const [active, setActive] = React.useState(0);
  useMotionValueEvent(scrollYProgress, "change", (v) => {
    setActive(Math.max(0, Math.min(STORY.length - 1, Math.floor(v * STORY.length))));
  });

  return (
    <section ref={ref} className="relative" style={{ height: `${STORY.length * 100}vh` }}>
      <div className="sticky top-0 flex h-screen items-center">
        <div className="mx-auto grid w-full max-w-6xl grid-cols-1 gap-12 px-5 md:grid-cols-2 md:gap-16">
          {/* left: the chapters */}
          <div className="flex flex-col justify-center gap-9">
            <Kicker>HOW DIZRUPT THINKS</Kicker>
            {STORY.map((s, i) => (
              <button
                key={s.id}
                onClick={() => setActive(i)}
                className="group block text-left"
                aria-current={i === active}
              >
                <div className="flex items-start gap-3.5">
                  <span
                    className={cn(
                      "mt-0.5 grid h-8 w-8 shrink-0 place-items-center rounded-lg border transition-colors duration-300",
                      i === active
                        ? "border-brand/50 bg-brand-soft text-brand"
                        : "border-line bg-ink-surface text-fg-faint"
                    )}
                  >
                    <s.icon size={14} />
                  </span>
                  <span>
                    <span
                      className={cn(
                        "block font-display text-lg font-semibold tracking-tight transition-colors duration-300",
                        i === active ? "text-fg" : "text-fg-faint group-hover:text-fg-muted"
                      )}
                    >
                      {s.title}
                    </span>
                    <span
                      className={cn(
                        "mt-1.5 block max-w-md text-xs leading-6 transition-colors duration-300",
                        i === active ? "text-fg-secondary" : "text-fg-faint/70"
                      )}
                    >
                      {s.body}
                    </span>
                  </span>
                </div>
              </button>
            ))}
          </div>

          {/* right: the synced visual */}
          <div className="relative hidden items-center md:flex">
            <div className="panel panel-glass relative min-h-[380px] w-full overflow-hidden p-6">
              <AnimatePresence mode="wait">
                <motion.div
                  key={STORY[active].id}
                  initial={{ opacity: 0, y: 24 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -16 }}
                  transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
                  className="flex h-full flex-col"
                >
                  <div className="mb-4 flex items-center justify-between">
                    <span className="label-xs">{STORY[active].title}</span>
                    <span className="font-mono text-[10px] text-brand">
                      {String(active + 1).padStart(2, "0")} / {String(STORY.length).padStart(2, "0")}
                    </span>
                  </div>
                  {STORY[active].visual}
                </motion.div>
              </AnimatePresence>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

/* ---------------------------------- bento ---------------------------------- */

function MiniGraph() {
  return (
    <svg viewBox="0 0 220 90" className="h-full w-full">
      {[
        [30, 45, 95, 20],
        [30, 45, 95, 70],
        [95, 20, 165, 45],
        [95, 70, 165, 45],
        [165, 45, 205, 25],
        [165, 45, 205, 68],
      ].map(([x1, y1, x2, y2], i) => (
        <line key={i} x1={x1} y1={y1} x2={x2} y2={y2} stroke="rgba(0,237,130,0.35)" strokeWidth="1.2" />
      ))}
      {[
        [30, 45, "#00ED82"],
        [95, 20, "#2BD9FF"],
        [95, 70, "#2BD9FF"],
        [165, 45, "#00ED82"],
        [205, 25, "#F59E0B"],
        [205, 68, "#2BD9FF"],
      ].map(([x, y, c], i) => (
        <circle key={i} cx={x as number} cy={y as number} r={i === 0 || i === 3 ? 6 : 4} fill={c as string} opacity={0.9} />
      ))}
    </svg>
  );
}

function MiniChain() {
  const steps = ["Budget −12%", "Atlas slips 9d", "$4.2M ARR at risk"];
  return (
    <div className="flex h-full flex-col justify-center gap-1.5">
      {steps.map((s, i) => (
        <div key={s} className="flex items-center gap-2">
          <span
            className={cn(
              "h-1.5 w-1.5 rounded-full",
              i === 0 ? "bg-info" : i === 1 ? "bg-warn" : "bg-danger"
            )}
          />
          <span className="font-mono text-[10px] text-fg-secondary">{s}</span>
          {i < steps.length - 1 && <span className="text-fg-faint">→</span>}
        </div>
      ))}
    </div>
  );
}

const FEATURES = [
  {
    icon: Flame,
    title: "Capacity Heatmap",
    body: "Eight weeks of organizational load, person by person. Overload glows before it burns.",
    span: "md:col-span-2",
    visual: (
      <div className="grid grid-cols-8 gap-1">
        {[0.5, 0.7, 0.62, 0.95, 1.1, 0.55, 0.8, 0.66, 0.72, 0.45, 0.88, 0.6, 0.92, 1.05, 0.5, 0.75].map((v, i) => (
          <div
            key={i}
            className="h-5 rounded"
            style={{
              background:
                v > 1 ? "rgba(239,68,68,0.7)" : v > 0.85 ? "rgba(245,158,11,0.6)" : `rgba(0,237,130,${0.15 + v * 0.4})`,
            }}
          />
        ))}
      </div>
    ),
  },
  {
    icon: Network,
    title: "Organizational Graph",
    body: "People, projects, systems, risks — one living constellation of dependencies.",
    span: "",
    visual: <MiniGraph />,
  },
  {
    icon: Inbox,
    title: "Agent Negotiation Inbox",
    body: "AI agents propose, you decide. Every resolution is one click with a full causal trail.",
    span: "",
    visual: (
      <div className="space-y-1.5">
        {["Rebalance 12h → Dev", "Slip QA gate 2 days"].map((t, i) => (
          <div key={t} className="flex items-center justify-between rounded-md border border-line-subtle bg-ink-elevated/70 px-2 py-1.5">
            <span className="text-[10px] text-fg-secondary">{t}</span>
            <span className={cn("font-mono text-[9px]", i === 0 ? "text-brand" : "text-warn")}>
              {i === 0 ? "98% fit" : "compromise"}
            </span>
          </div>
        ))}
      </div>
    ),
  },
  {
    icon: Workflow,
    title: "Scenario Simulation",
    body: "Run the budget cut before you make it. Causal chains, not vibes.",
    span: "",
    visual: <MiniChain />,
  },
  {
    icon: Zap,
    title: "Execution Predictability",
    body: "One score for whether you'll ship — and exactly why. Never a number without a reason.",
    span: "",
    visual: (
      <div className="flex h-full items-center justify-center">
        <span className="font-display text-5xl font-bold tracking-tight text-brand">
          <NumberTicker value={94} />
        </span>
      </div>
    ),
  },
  {
    icon: ScrollText,
    title: "Decision Ledger",
    body: "Institutional memory that survives reorgs. Who decided, when, and what it caused.",
    span: "md:col-span-2",
    visual: (
      <div className="space-y-1.5">
        {[
          ["DEC-114", "Ledger-first architecture", "Active"],
          ["DEC-113", "Vendor consolidation Q3", "Superseded"],
        ].map(([id, t, s]) => (
          <div key={id} className="flex items-center gap-3 rounded-md border border-line-subtle bg-ink-elevated/70 px-2.5 py-1.5">
            <span className="font-mono text-[9px] text-brand">{id}</span>
            <span className="flex-1 truncate text-[10px] text-fg-secondary">{t}</span>
            <span className={cn("font-mono text-[9px]", s === "Active" ? "text-ok" : "text-fg-faint")}>{s}</span>
          </div>
        ))}
      </div>
    ),
  },
];

function Bento() {
  return (
    <section id="product" className="relative mx-auto max-w-6xl px-5 py-24">
      <motion.div {...rise} className="mb-12 max-w-2xl">
        <Kicker>THE INSTRUMENT PANEL</Kicker>
        <h2 className="font-display text-3xl font-bold tracking-tight sm:text-4xl">
          Six instruments.
          <span className="text-fg-muted"> One nervous system.</span>
        </h2>
        <p className="mt-3 text-sm leading-7 text-fg-secondary">
          Most tools show you tasks. DIZRUPT shows you the organization — load,
          risk, dependency and memory, wired together so every signal carries
          its cause.
        </p>
      </motion.div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        {FEATURES.map((f, i) => (
          <motion.div
            key={f.title}
            {...rise}
            transition={{ ...rise.transition, delay: (i % 3) * 0.08 }}
            className={cn(
              "panel panel-glass panel-hover group flex flex-col overflow-hidden p-5",
              f.span
            )}
          >
            <div className="mb-3 flex items-center gap-2.5">
              <span className="grid h-8 w-8 place-items-center rounded-lg border border-brand/25 bg-brand-soft text-brand">
                <f.icon size={15} />
              </span>
              <h3 className="font-display text-sm font-semibold tracking-tight">{f.title}</h3>
            </div>
            <p className="mb-4 text-xs leading-6 text-fg-secondary">{f.body}</p>
            <div className="mt-auto min-h-[72px] rounded-lg border border-line-subtle/70 bg-ink/50 p-3">
              {f.visual}
            </div>
          </motion.div>
        ))}
      </div>
    </section>
  );
}

/* -------------------------------- stats band ------------------------------- */

const STATS = [
  { value: 92, suffix: "%", label: "forecast accuracy on delivery dates" },
  { value: 4.2, suffix: "×", decimals: 1, label: "faster resource reallocation" },
  { value: 38, suffix: "min", label: "median decision latency, down from days" },
  { value: 99.99, suffix: "%", decimals: 2, label: "platform availability" },
];

function StatsBand() {
  return (
    <motion.section {...rise} className="border-y border-line-subtle/60 bg-ink-surface/40 py-16 backdrop-blur">
      <div className="mx-auto grid max-w-6xl grid-cols-2 gap-10 px-5 md:grid-cols-4">
        {STATS.map((s) => (
          <div key={s.label} className="text-center">
            <div className="font-display text-4xl font-bold tracking-tight text-fg">
              <NumberTicker value={s.value} suffix={s.suffix} decimals={s.decimals ?? 0} className="text-brand" />
            </div>
            <p className="mx-auto mt-2 max-w-[180px] text-2xs leading-relaxed text-fg-muted">{s.label}</p>
          </div>
        ))}
      </div>
    </motion.section>
  );
}

/* --------------------------------- method ---------------------------------- */

const METHOD = [
  {
    n: "01",
    title: "Model the organization, not the to-do list",
    body: "People, projects, vendors, systems and risks live as one graph. A task is never an island — it's a node with consequences.",
  },
  {
    n: "02",
    title: "Every score explains itself",
    body: "No black-box health indicators. Click any number and the causal signals behind it unfold — stored, auditable, never regenerated.",
  },
  {
    n: "03",
    title: "Agents negotiate, humans decide",
    body: "When load breaks or dates slip, agents draft the trade-offs. You accept, counter or defer — in one click, on the record.",
  },
];

function Method() {
  return (
    <section id="method" className="mx-auto max-w-6xl px-5 py-24">
      <motion.div {...rise} className="mb-12 max-w-2xl">
        <Kicker>THE DIZRUPT METHOD</Kicker>
        <h2 className="font-display text-3xl font-bold tracking-tight sm:text-4xl">
          Built on conviction,<span className="text-fg-muted"> not configuration.</span>
        </h2>
      </motion.div>
      <div className="grid gap-4 md:grid-cols-3">
        {METHOD.map((m, i) => (
          <motion.div
            key={m.n}
            {...rise}
            transition={{ ...rise.transition, delay: i * 0.1 }}
            className="panel panel-glass p-6"
          >
            <div className="font-mono text-2xs text-brand">{m.n}</div>
            <h3 className="mt-3 font-display text-base font-semibold leading-snug tracking-tight">
              {m.title}
            </h3>
            <p className="mt-3 text-xs leading-6 text-fg-secondary">{m.body}</p>
          </motion.div>
        ))}
      </div>
    </section>
  );
}

/* ------------------------------- testimonials ------------------------------ */

const TESTIMONIALS = [
  {
    quote: "The first tool that told me about a problem before my best PM did.",
    author: "Mara Lindqvist",
    role: "COO · Northwind Systems",
    initials: "ML",
    accent: "#00ED82",
  },
  {
    quote: "We stopped arguing about capacity. The heatmap ended the meeting.",
    author: "Dev Okafor",
    role: "VP Engineering · Helix Labs",
    initials: "DO",
    accent: "#2BD9FF",
  },
  {
    quote: "The decision ledger survived our reorg. Nothing else did.",
    author: "Sofia Reyes",
    role: "Chief of Staff · Atlascore",
    initials: "SR",
    accent: "#F59E0B",
  },
];

function Testimonials() {
  const [active, setActive] = React.useState(0);
  const [animating, setAnimating] = React.useState(false);
  const [shown, setShown] = React.useState(TESTIMONIALS[0]);

  const select = (i: number) => {
    if (i === active || animating) return;
    setAnimating(true);
    setTimeout(() => {
      setShown(TESTIMONIALS[i]);
      setActive(i);
      setTimeout(() => setAnimating(false), 400);
    }, 200);
  };

  return (
    <motion.section {...rise} id="customers" className="mx-auto max-w-4xl px-5 py-24 text-center">
      <Kicker>OPERATORS ON DIZRUPT</Kicker>
      <div className="relative mt-6 px-6">
        <span aria-hidden className="absolute -top-8 left-0 select-none font-display text-7xl text-brand/10">
          &ldquo;
        </span>
        <p
          className={cn(
            "mx-auto max-w-2xl font-display text-2xl font-medium leading-relaxed tracking-tight transition-all duration-300 ease-out sm:text-3xl",
            animating ? "scale-[0.98] opacity-0 blur-sm" : "scale-100 opacity-100 blur-0"
          )}
        >
          {shown.quote}
        </p>
        <span aria-hidden className="absolute -bottom-10 right-0 select-none font-display text-7xl text-brand/10">
          &rdquo;
        </span>
      </div>
      <p
        className={cn(
          "mt-8 text-2xs uppercase tracking-[0.2em] text-fg-muted transition-all duration-500",
          animating ? "translate-y-2 opacity-0" : "translate-y-0 opacity-100"
        )}
      >
        {shown.role}
      </p>
      <div className="mt-6 flex items-center justify-center gap-2">
        {TESTIMONIALS.map((t, i) => {
          const isActive = i === active;
          return (
            <button
              key={t.author}
              onClick={() => select(i)}
              aria-label={`Show quote from ${t.author}`}
              className={cn(
                "flex items-center gap-0 rounded-full transition-all duration-500 ease-[cubic-bezier(0.4,0,0.2,1)]",
                isActive ? "bg-ink-elevated py-1.5 pl-1.5 pr-4 shadow-card" : "p-0.5 hover:bg-ink-elevated/60"
              )}
            >
              <span
                className="grid h-8 w-8 shrink-0 place-items-center rounded-full font-display text-xs font-semibold"
                style={{
                  background: `linear-gradient(135deg, ${t.accent}33, ${t.accent}14)`,
                  color: t.accent,
                  border: `1px solid ${t.accent}55`,
                }}
              >
                {t.initials}
              </span>
              <span
                className={cn(
                  "grid transition-all duration-500 ease-[cubic-bezier(0.4,0,0.2,1)]",
                  isActive ? "ml-2 grid-cols-[1fr] opacity-100" : "ml-0 grid-cols-[0fr] opacity-0"
                )}
              >
                <span className="overflow-hidden whitespace-nowrap text-xs font-medium text-fg">
                  {t.author}
                </span>
              </span>
            </button>
          );
        })}
      </div>
    </motion.section>
  );
}

/* ----------------------------------- CTA ----------------------------------- */

function FinalCTA() {
  return (
    <section id="manifesto" className="relative overflow-hidden border-t border-line-subtle/60">
      <AuroraBackdrop className="opacity-60" />
      <motion.div {...rise} className="relative mx-auto max-w-3xl px-5 py-28 text-center">
        <DizruptMark size={56} glow className="mx-auto" />
        <h2 className="mt-8 font-display text-4xl font-bold tracking-[-0.03em] sm:text-5xl">
          Strike before it breaks.
        </h2>
        <p className="mx-auto mt-4 max-w-xl text-sm leading-7 text-fg-secondary">
          Ten minutes to onboard your org. One screen to run it. The next
          surprise in your company shouldn&apos;t be a surprise.
        </p>
        <div className="mt-9 flex flex-wrap items-center justify-center gap-3">
          <Link
            href="/login"
            className="group relative inline-flex h-11 items-center overflow-hidden rounded-xl bg-brand pl-5 pr-12 text-sm font-semibold text-[#04281A] shadow-glow transition-colors hover:bg-[#3DF59E]"
          >
            Get started free
            <i className="absolute bottom-1.5 right-1.5 top-1.5 z-10 grid w-8 place-items-center rounded-lg bg-[#04281A]/15 transition-all duration-500 group-hover:w-[calc(100%-0.75rem)] group-active:scale-95">
              <ArrowRight size={15} strokeWidth={2.5} aria-hidden />
            </i>
          </Link>
          <Link
            href="/login"
            className="inline-flex h-11 items-center gap-2 rounded-xl border border-line bg-ink-surface/60 px-5 text-sm font-medium text-fg-secondary backdrop-blur transition-colors hover:border-brand/40 hover:text-fg"
          >
            Book a live strike <GitBranch size={13} />
          </Link>
        </div>
      </motion.div>
    </section>
  );
}

/* ---------------------------------- footer --------------------------------- */

const FOOTER_COLS: { title: string; links: string[] }[] = [
  { title: "Product", links: ["Command Center", "Capacity", "Graph", "Agent Inbox", "Decisions"] },
  { title: "Company", links: ["Manifesto", "Method", "Careers", "Press"] },
  { title: "Resources", links: ["Docs", "API", "Status", "Security"] },
];

function Footer() {
  return (
    <footer className="border-t border-line-subtle/60 bg-ink-surface/30">
      <div className="mx-auto grid max-w-6xl gap-10 px-5 py-14 md:grid-cols-[1.4fr_repeat(3,1fr)]">
        <div>
          <DizruptWordmark markSize={26} sub="Resource Intelligence" />
          <p className="mt-4 max-w-xs text-2xs leading-relaxed text-fg-muted">
            The operating system for your organization. Built for the operators
            who can&apos;t afford surprises.
          </p>
        </div>
        {FOOTER_COLS.map((c) => (
          <div key={c.title}>
            <div className="label-xs mb-3">{c.title}</div>
            <ul className="space-y-2">
              {c.links.map((l) => (
                <li key={l}>
                  <a href="#" className="text-xs text-fg-secondary transition-colors hover:text-brand">
                    {l}
                  </a>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
      <div className="border-t border-line-subtle/60">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-3 px-5 py-5 text-2xs text-fg-faint">
          <span>© 2026 DIZRUPT. All circuits reserved.</span>
          <span className="inline-flex items-center gap-1.5">
            <Zap size={10} className="text-brand" /> Built at full voltage
          </span>
        </div>
      </div>
    </footer>
  );
}

/* ----------------------------------- page ---------------------------------- */

export default function WelcomePage() {
  return (
    <div className="relative min-h-screen">
      {/* full-bleed atmosphere: dot-matrix field + grain + cursor glow */}
      <DotMatrixField className="pointer-events-none fixed inset-0 z-0 opacity-70" />
      <div aria-hidden className="grain-layer" />
      <MouseGlow />
      <div className="relative z-10">
        <LandingNav />
        <main>
          <Hero />
          <LogoStrip />
          <ScrollStory />
          <Bento />
          <StatsBand />
          <Method />
          <Testimonials />
          <FinalCTA />
        </main>
        <Footer />
      </div>
    </div>
  );
}
