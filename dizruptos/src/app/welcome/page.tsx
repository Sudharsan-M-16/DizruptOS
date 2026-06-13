"use client";

// DIZRUPT landing — festival-grade poster design after c2mtl.koki-kiko.com.
// Hard-edged color blocks, headline type at viewport scale, a Three.js
// chroma field of drifting stage-gel discs, GSAP scroll choreography, and a
// product preview you can actually operate. The page should stop a stranger.
//
// Engine split: GSAP owns scroll (hero intro timeline, scrubbed marquee,
// the product un-tilt, block reveals); framer-motion owns component state
// (story crossfades, testimonial morphs). ChromaField owns the GPU.

import * as React from "react";
import Link from "next/link";
import gsap from "gsap";
import { useGSAP } from "@gsap/react";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { AnimatePresence, motion, useMotionValueEvent, useScroll } from "framer-motion";
import {
  ArrowRight,
  ArrowUpRight,
  ChevronDown,
  Flame,
  GitBranch,
  Inbox,
  Network,
  ScrollText,
  Workflow,
  Zap,
} from "lucide-react";
import { DizruptWordmark } from "@/components/ui/logo";
import { NumberTicker } from "@/components/ui/ascension";
import { TextScramble } from "@/components/fx/text-scramble";
import { ProductFrame } from "@/components/landing/product-frame";
import { cn } from "@/lib/utils";

gsap.registerPlugin(useGSAP, ScrollTrigger);

import { ChromaField } from "@/components/fx/chroma-field";

/* -------------------------------- top nav ---------------------------------- */
// Horizontal command bar pinned to the top edge — brand on the left, section
// links in the center, a hard volt-green Enter block on the right. Translucent
// ink with a backdrop blur so the hero's chroma reads through it.

const NAV_LINKS = [
  ["Product", "#product"],
  ["Method", "#method"],
  ["Customers", "#customers"],
  ["Manifesto", "#manifesto"],
] as const;

function TopNav() {
  return (
    <header className="fixed inset-x-0 top-0 z-50 flex h-[72px] items-center justify-between border-b border-white/10 bg-ink/75 pl-5 backdrop-blur-xl lg:pl-10">
      <DizruptWordmark markSize={30} />
      <nav className="hidden items-center gap-9 md:flex">
        {NAV_LINKS.map(([label, href]) => (
          <a
            key={label}
            href={href}
            className="text-base font-semibold uppercase tracking-[0.16em] text-fg-muted transition-colors hover:text-fg"
          >
            <TextScramble text={label} />
          </a>
        ))}
      </nav>
      <Link
        href="/login"
        className="group flex h-full items-center gap-2.5 bg-brand px-6 text-base font-extrabold uppercase tracking-[0.12em] text-[#04281A] transition-colors hover:bg-[#3DF59E] lg:px-9"
      >
        Enter
        <ArrowUpRight size={20} strokeWidth={2.5} className="transition-transform duration-300 group-hover:rotate-45" />
      </Link>
    </header>
  );
}

/* ----------------------------------- hero ---------------------------------- */
// Full-bleed chroma field; a hard black block carries the poster type. The
// GSAP intro slides the blocks in like printed plates landing on a press.

const plateIn = (i: number) => ({
  initial: { x: "-101%" },
  animate: { x: "0%" },
  transition: { duration: 0.9, delay: i * 0.12, ease: [0.22, 1, 0.36, 1] as const },
});
const lineIn = (i: number) => ({
  initial: { y: "110%" },
  animate: { y: "0%" },
  transition: { duration: 0.8, delay: 0.35 + i * 0.1, ease: [0.22, 1, 0.36, 1] as const },
});
const metaIn = (i: number) => ({
  initial: { opacity: 0, y: 18 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.6, delay: 0.9 + i * 0.08, ease: [0.22, 1, 0.36, 1] as const },
});

function Hero() {
  return (
    <section className="relative flex min-h-screen flex-col justify-end overflow-hidden">
      <ChromaField className="absolute inset-0 h-full w-full" />

      {/* meta row — pushed clear of the fixed 72px top nav */}
      <motion.div {...metaIn(0)} className="absolute left-6 top-[88px] z-10 flex items-center gap-3 lg:left-10 lg:top-28">
        <span className="bg-ink px-3 py-2 font-mono text-sm font-semibold uppercase tracking-[0.2em] text-brand">
          Resource Intelligence Platform
        </span>
      </motion.div>
      <motion.div {...metaIn(1)} className="absolute right-6 top-[88px] z-10 hidden bg-ink px-3 py-2 font-mono text-sm text-fg-secondary lg:right-10 lg:top-28 lg:block">
        EST. 2026 — RUNS YOUR ORG
      </motion.div>

      {/* the poster stack */}
      <div className="relative z-10 pb-20 pt-44 lg:pb-24">
        <motion.div {...plateIn(0)} className="inline-block bg-ink py-2 pl-6 pr-8 lg:pl-10 lg:pr-14">
          <div className="overflow-hidden">
            <motion.h1 {...lineIn(0)} className="font-display text-[clamp(4rem,14vw,12rem)] font-extrabold leading-[0.9] tracking-[-0.045em] text-fg">
              DIZRUPT
            </motion.h1>
          </div>
        </motion.div>
        <br />
        <motion.div {...plateIn(1)} className="mt-3 inline-block bg-brand py-2 pl-6 pr-8 lg:pl-10 lg:pr-14">
          <div className="overflow-hidden">
            <motion.p {...lineIn(1)} className="font-display text-[clamp(1.6rem,4.6vw,3.8rem)] font-extrabold leading-[1.02] tracking-[-0.03em] text-[#04281A]">
              every person. every project.
            </motion.p>
          </div>
        </motion.div>
        <br />
        <motion.div {...plateIn(2)} className="mt-3 inline-block bg-ink py-2 pl-6 pr-8 lg:pl-10 lg:pr-14">
          <div className="overflow-hidden">
            <motion.p {...lineIn(2)} className="font-display text-[clamp(2.2rem,7vw,6rem)] font-extrabold leading-[1] tracking-[-0.04em] text-fg">
              every <span className="text-brand">consequence.</span>
            </motion.p>
          </div>
        </motion.div>

        <motion.div {...metaIn(2)} className="mt-8 flex flex-wrap items-center gap-4 pl-6 lg:pl-10">
          <Link
            href="/login"
            className="group flex h-14 items-center gap-3 bg-brand px-7 text-base font-extrabold uppercase tracking-wide text-[#04281A] transition-colors hover:bg-[#3DF59E]"
          >
            Enter the command center
            <ArrowRight size={18} strokeWidth={2.5} className="transition-transform duration-300 group-hover:translate-x-1.5" />
          </Link>
          <a
            href="#product"
            className="flex h-14 items-center gap-3 border border-white/25 bg-ink/70 px-7 text-base font-semibold text-fg backdrop-blur transition-colors hover:border-brand hover:text-brand"
          >
            See it live
            <ChevronDown size={17} />
          </a>
        </motion.div>
      </div>
    </section>
  );
}

/* --------------------------------- marquee ---------------------------------- */
// Scroll-scrubbed giant ribbon — the type moves only when you do.

function MarqueeBand() {
  const ref = React.useRef<HTMLDivElement>(null);
  useGSAP(
    () => {
      gsap.fromTo(
        ".marquee-track",
        { xPercent: 0 },
        {
          xPercent: -40,
          ease: "none",
          scrollTrigger: { trigger: ref.current, start: "top bottom", end: "bottom top", scrub: 0.6 },
        }
      );
    },
    { scope: ref }
  );
  return (
    <div ref={ref} aria-hidden className="overflow-hidden border-y border-white/10 bg-ink py-8">
      <div className="marquee-track flex w-max whitespace-nowrap font-display text-[clamp(3.5rem,9vw,8rem)] font-extrabold leading-none tracking-[-0.04em]">
        {Array.from({ length: 4 }).map((_, i) => (
          <span key={i} className="flex items-center">
            <span className="px-6 text-fg">SEE THE BREAK</span>
            <span className="px-6 text-transparent" style={{ WebkitTextStroke: "2px rgba(0,237,130,0.8)" }}>
              BEFORE THE BREAK
            </span>
            <Zap className="mx-4 h-12 w-12 shrink-0 text-brand" />
          </span>
        ))}
      </div>
    </div>
  );
}

/* ------------------------- interactive product stage ------------------------ */
// The frame lies back 40° and GSAP scrubs it upright; once flat, it's a real
// miniature you can operate — the caption dares the visitor to click.

function ProductStage() {
  const ref = React.useRef<HTMLElement>(null);
  useGSAP(
    () => {
      gsap.fromTo(
        ".stage-frame",
        { rotateX: 40, scale: 0.86, opacity: 0.45, y: 90 },
        {
          rotateX: 0,
          scale: 1,
          opacity: 1,
          y: 0,
          ease: "none",
          scrollTrigger: { trigger: ".stage-frame", start: "top 92%", end: "top 30%", scrub: 0.5 },
        }
      );
    },
    { scope: ref }
  );

  return (
    <section ref={ref} id="product" className="relative bg-ink px-6 py-28 lg:px-10">
      <div className="mx-auto max-w-6xl">
        {/* observer lives on the unclipped wrapper — the line inside would be
            fully clipped at y:110% and IntersectionObserver would never fire */}
        <motion.div
          className="overflow-hidden"
          initial="hidden"
          whileInView="show"
          viewport={{ once: true, margin: "-10% 0px" }}
        >
          <motion.h2
            variants={{
              hidden: { y: "110%" },
              show: { y: "0%", transition: { duration: 0.8, ease: [0.22, 1, 0.36, 1] } },
            }}
            className="font-display text-[clamp(2.6rem,6.5vw,5.5rem)] font-extrabold leading-[0.95] tracking-[-0.04em]"
          >
            This one is <span className="text-brand">alive.</span>
            <br />
            Go ahead — click it.
          </motion.h2>
        </motion.div>
        <p className="mt-6 max-w-2xl text-lg leading-8 text-fg-secondary">
          A working miniature of the command center. Switch views in the
          sidebar, hover the heatmap, accept an agent proposal. Everything
          you touch here is real in the product.
        </p>
        <div className="mt-12" style={{ perspective: 1100 }}>
          <div
            className="stage-frame aspect-[16/10] w-full rounded-2xl border border-line bg-ink-surface/85 p-2 sm:aspect-[16/9]"
            style={{
              transformOrigin: "center top",
              boxShadow:
                "0 0 0 1px rgba(0,237,130,0.14), 0 24px 80px rgba(0,0,0,0.55), 0 8px 28px rgba(0,237,130,0.10)",
            }}
          >
            <ProductFrame />
          </div>
        </div>
      </div>
    </section>
  );
}

/* ------------------------------ scrollytelling ------------------------------ */

const STORY = [
  {
    id: "capacity",
    icon: Flame,
    title: "See the load before it breaks",
    body: "Eight weeks of organizational capacity, person by person. Overload glows amber at 85%, red past 100% — days before burnout becomes a resignation letter.",
    visual: (
      <div className="space-y-3">
        {[
          ["Sarah K", [0.72, 0.88, 1.13, 0.94, 0.71, 0.6]],
          ["Dev M", [0.55, 0.62, 0.7, 0.81, 0.92, 0.66]],
          ["Priya S", [0.81, 0.74, 0.6, 0.55, 0.49, 0.58]],
          ["Jon T", [0.62, 0.95, 0.83, 0.71, 1.06, 0.77]],
          ["Mara L", [0.45, 0.52, 0.61, 0.68, 0.74, 0.8]],
        ].map(([name, row]) => (
          <div key={name as string} className="flex items-center gap-2">
            <span className="w-16 font-mono text-xs text-fg-muted">{name as string}</span>
            {(row as number[]).map((v, i) => (
              <div key={i} className="relative h-8 flex-1 overflow-hidden rounded-md bg-ink-elevated">
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
        <div className="flex items-center justify-between pt-1 font-mono text-xs text-fg-muted">
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
            <text x={(x as number) + 14} y={(y as number) + 4} fill="#989CA3" fontSize="12" fontFamily="monospace">
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
      <div className="space-y-3">
        {[
          { t: "Rebalance Sarah → Dev · 12h of Atlas QA", c: "98% fit", tone: "text-brand border-brand/40" },
          { t: "Slip Atlas QA gate by 2 days", c: "compromise", tone: "text-warn border-warn/40" },
          { t: "Escalate Northwind SLA breach to legal", c: "urgent", tone: "text-danger border-danger/40" },
        ].map((p) => (
          <div key={p.t} className={cn("rounded-xl border bg-ink-elevated/80 p-4", p.tone.split(" ")[1])}>
            <div className="flex items-center justify-between gap-3">
              <span className="text-sm font-medium text-fg-secondary">{p.t}</span>
              <span className={cn("shrink-0 font-mono text-xs", p.tone.split(" ")[0])}>{p.c}</span>
            </div>
            <div className="mt-3 flex gap-2">
              <span className="rounded-md bg-brand px-3 py-1.5 text-xs font-bold text-[#04281A]">Accept</span>
              <span className="rounded-md border border-line px-3 py-1.5 text-xs text-fg-secondary">Counter</span>
              <span className="rounded-md border border-line px-3 py-1.5 text-xs text-fg-muted">Defer</span>
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
      <div className="space-y-2.5">
        {[
          ["DEC-114", "Ledger-first architecture", "Active", "text-ok"],
          ["DEC-113", "Vendor consolidation Q3", "Superseded", "text-fg-faint"],
          ["DEC-112", "Freeze hiring in Platform", "Active", "text-ok"],
          ["DEC-111", "Adopt capacity guardrails at 80%", "Active", "text-ok"],
        ].map(([id, t, s, tone]) => (
          <div key={id as string} className="flex items-center gap-3 rounded-lg border border-line-subtle bg-ink-elevated/80 px-4 py-3">
            <span className="font-mono text-xs text-brand">{id as string}</span>
            <span className="flex-1 truncate text-sm text-fg-secondary">{t as string}</span>
            <span className={cn("font-mono text-xs", tone as string)}>{s as string}</span>
          </div>
        ))}
        <div className="pt-1 text-center font-mono text-xs text-fg-muted">
          1,204 entries · zero lost context
        </div>
      </div>
    ),
  },
];

function ScrollStory() {
  const ref = React.useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start start", "end end"] });
  const [active, setActive] = React.useState(0);
  useMotionValueEvent(scrollYProgress, "change", (v) => {
    setActive(Math.max(0, Math.min(STORY.length - 1, Math.floor(v * STORY.length))));
  });

  return (
    <section ref={ref} className="relative bg-ink" style={{ height: `${STORY.length * 100}vh` }}>
      <div className="sticky top-0 flex h-screen items-center">
        <div className="mx-auto grid w-full max-w-7xl grid-cols-1 gap-12 px-6 md:grid-cols-2 md:gap-16 lg:px-10">
          <div className="flex flex-col justify-center gap-9">
            <div className="flex items-center gap-2 font-mono text-sm font-semibold uppercase tracking-[0.22em] text-brand">
              <Zap size={14} />
              <TextScramble text="HOW DIZRUPT THINKS" />
            </div>
            {STORY.map((s, i) => (
              <button key={s.id} onClick={() => setActive(i)} className="group block text-left" aria-current={i === active}>
                <div className="flex items-start gap-4">
                  <span
                    className={cn(
                      "mt-1 grid h-10 w-10 shrink-0 place-items-center border transition-colors duration-300",
                      i === active ? "border-brand bg-brand-soft text-brand" : "border-line bg-ink-surface text-fg-faint"
                    )}
                  >
                    <s.icon size={17} />
                  </span>
                  <span>
                    <span
                      className={cn(
                        "block font-display text-2xl font-bold tracking-tight transition-colors duration-300",
                        i === active ? "text-fg" : "text-fg-faint group-hover:text-fg-muted"
                      )}
                    >
                      {s.title}
                    </span>
                    <span
                      className={cn(
                        "mt-2 block max-w-md text-base leading-7 transition-colors duration-300",
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
          <div className="relative hidden items-center md:flex">
            <div className="panel panel-glass relative min-h-[440px] w-full overflow-hidden p-7">
              <AnimatePresence mode="wait">
                <motion.div
                  key={STORY[active].id}
                  initial={{ opacity: 0, y: 24 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -16 }}
                  transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
                  className="flex h-full flex-col"
                >
                  <div className="mb-5 flex items-center justify-between">
                    <span className="text-sm font-semibold uppercase tracking-[0.12em] text-fg-muted">
                      {STORY[active].title}
                    </span>
                    <span className="font-mono text-xs text-brand">
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

/* ------------------------------- stat plates -------------------------------- */
// koki-kiko hard blocks: four full-color plates, ink type on volt, volt type
// on ink — numbers at poster scale.

const STATS = [
  { value: 92, suffix: "%", label: "forecast accuracy on delivery dates", bg: "bg-brand", fg: "text-[#04281A]", sub: "text-[#04281A]/70" },
  { value: 4.2, suffix: "×", decimals: 1, label: "faster resource reallocation", bg: "bg-ink", fg: "text-brand", sub: "text-fg-muted" },
  { value: 38, suffix: "min", label: "median decision latency, down from days", bg: "bg-[#1B4DFF]", fg: "text-white", sub: "text-white/70" },
  { value: 99.99, suffix: "%", decimals: 2, label: "platform availability", bg: "bg-ink", fg: "text-fg", sub: "text-fg-muted" },
];

function StatPlates() {
  return (
    <section className="grid grid-cols-1 border-y border-white/10 sm:grid-cols-2 lg:grid-cols-4">
      {STATS.map((s, i) => (
        <motion.div
          key={s.label}
          initial={{ opacity: 0, y: 36 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-10% 0px" }}
          transition={{ duration: 0.7, delay: i * 0.1, ease: [0.22, 1, 0.36, 1] }}
          className={cn("border-b border-r border-white/10 px-8 py-14", s.bg)}
        >
          <div className={cn("font-display text-[clamp(3.5rem,5.5vw,5rem)] font-extrabold leading-none tracking-[-0.04em]", s.fg)}>
            <NumberTicker value={s.value} suffix={s.suffix} decimals={s.decimals ?? 0} />
          </div>
          <p className={cn("mt-4 max-w-[220px] text-base font-medium leading-6", s.sub)}>{s.label}</p>
        </motion.div>
      ))}
    </section>
  );
}

/* ---------------------------------- bento ----------------------------------- */

function MiniGraph() {
  return (
    <svg viewBox="0 0 220 90" className="h-full w-full">
      {[
        [30, 45, 95, 20], [30, 45, 95, 70], [95, 20, 165, 45],
        [95, 70, 165, 45], [165, 45, 205, 25], [165, 45, 205, 68],
      ].map(([x1, y1, x2, y2], i) => (
        <line key={i} x1={x1} y1={y1} x2={x2} y2={y2} stroke="rgba(0,237,130,0.35)" strokeWidth="1.2" />
      ))}
      {[
        [30, 45, "#00ED82"], [95, 20, "#2BD9FF"], [95, 70, "#2BD9FF"],
        [165, 45, "#00ED82"], [205, 25, "#F59E0B"], [205, 68, "#2BD9FF"],
      ].map(([x, y, c], i) => (
        <circle key={i} cx={x as number} cy={y as number} r={i === 0 || i === 3 ? 6 : 4} fill={c as string} opacity={0.9} />
      ))}
    </svg>
  );
}

const FEATURES = [
  {
    icon: Flame,
    title: "Capacity Heatmap",
    body: "Eight weeks of organizational load, person by person. Overload glows before it burns.",
    span: "md:col-span-2",
    visual: (
      <div className="grid grid-cols-8 gap-1.5">
        {[0.5, 0.7, 0.62, 0.95, 1.1, 0.55, 0.8, 0.66, 0.72, 0.45, 0.88, 0.6, 0.92, 1.05, 0.5, 0.75].map((v, i) => (
          <div
            key={i}
            className="h-6 rounded"
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
      <div className="space-y-2">
        {["Rebalance 12h → Dev", "Slip QA gate 2 days"].map((t, i) => (
          <div key={t} className="flex items-center justify-between rounded-md border border-line-subtle bg-ink-elevated/70 px-3 py-2">
            <span className="text-xs text-fg-secondary">{t}</span>
            <span className={cn("font-mono text-xs", i === 0 ? "text-brand" : "text-warn")}>
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
    visual: (
      <div className="flex h-full flex-col justify-center gap-2">
        {["Budget −12%", "Atlas slips 9d", "$4.2M ARR at risk"].map((s, i) => (
          <div key={s} className="flex items-center gap-2">
            <span className={cn("h-2 w-2 rounded-full", i === 0 ? "bg-info" : i === 1 ? "bg-warn" : "bg-danger")} />
            <span className="font-mono text-xs text-fg-secondary">{s}</span>
            {i < 2 && <span className="text-fg-faint">→</span>}
          </div>
        ))}
      </div>
    ),
  },
  {
    icon: Zap,
    title: "Execution Predictability",
    body: "One score for whether you'll ship — and exactly why. Never a number without a reason.",
    span: "",
    visual: (
      <div className="flex h-full items-center justify-center">
        <span className="font-display text-6xl font-extrabold tracking-tight text-brand">
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
      <div className="space-y-2">
        {[
          ["DEC-114", "Ledger-first architecture", "Active"],
          ["DEC-113", "Vendor consolidation Q3", "Superseded"],
        ].map(([id, t, s]) => (
          <div key={id} className="flex items-center gap-3 rounded-md border border-line-subtle bg-ink-elevated/70 px-3 py-2">
            <span className="font-mono text-xs text-brand">{id}</span>
            <span className="flex-1 truncate text-xs text-fg-secondary">{t}</span>
            <span className={cn("font-mono text-xs", s === "Active" ? "text-ok" : "text-fg-faint")}>{s}</span>
          </div>
        ))}
      </div>
    ),
  },
];

function Bento() {
  return (
    <section className="relative mx-auto max-w-7xl px-6 py-28 lg:px-10">
      <div className="mb-14 max-w-3xl">
        <h2 className="font-display text-[clamp(2.4rem,5.5vw,4.5rem)] font-extrabold leading-[0.98] tracking-[-0.04em]">
          Six instruments.
          <span className="text-fg-muted"> One nervous system.</span>
        </h2>
        <p className="mt-5 text-lg leading-8 text-fg-secondary">
          Most tools show you tasks. DIZRUPT shows you the organization — load,
          risk, dependency and memory, wired together so every signal carries
          its cause.
        </p>
      </div>
      <div className="grid grid-cols-1 gap-5 md:grid-cols-3">
        {FEATURES.map((f, i) => (
          <motion.div
            key={f.title}
            initial={{ opacity: 0, y: 36 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-8% 0px" }}
            transition={{ duration: 0.65, delay: (i % 3) * 0.08, ease: [0.22, 1, 0.36, 1] }}
            className={cn("panel panel-glass panel-hover group flex flex-col overflow-hidden p-6", f.span)}>
            <div className="mb-3 flex items-center gap-3">
              <span className="grid h-10 w-10 place-items-center border border-brand/25 bg-brand-soft text-brand">
                <f.icon size={18} />
              </span>
              <h3 className="font-display text-lg font-bold tracking-tight">{f.title}</h3>
            </div>
            <p className="mb-5 text-sm leading-7 text-fg-secondary">{f.body}</p>
            <div className="mt-auto min-h-[84px] rounded-lg border border-line-subtle/70 bg-ink/50 p-3.5">{f.visual}</div>
          </motion.div>
        ))}
      </div>
    </section>
  );
}

/* --------------------------------- method ----------------------------------- */
// Numbered plates in the koki-kiko block grammar — 01/02/03 at poster size.

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
    <section id="method" className="mx-auto max-w-7xl px-6 py-28 lg:px-10">
      <h2 className="mb-14 font-display text-[clamp(2.4rem,5.5vw,4.5rem)] font-extrabold leading-[0.98] tracking-[-0.04em]">
        Built on conviction,<span className="text-fg-muted"> not configuration.</span>
      </h2>
      <div className="grid gap-5 md:grid-cols-3">
        {METHOD.map((m) => (
          <div key={m.n} className="group border border-line bg-ink-surface p-8 transition-colors hover:border-brand/50">
            <div className="font-display text-[clamp(3rem,5vw,4.5rem)] font-extrabold leading-none text-brand/25 transition-colors group-hover:text-brand">
              {m.n}
            </div>
            <h3 className="mt-6 font-display text-xl font-bold leading-snug tracking-tight">{m.title}</h3>
            <p className="mt-4 text-base leading-7 text-fg-secondary">{m.body}</p>
          </div>
        ))}
      </div>
    </section>
  );
}

/* ------------------------------- testimonials -------------------------------- */

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
    <section id="customers" className="mx-auto max-w-5xl px-6 py-28 text-center">
      <div className="mb-8 flex items-center justify-center gap-2 font-mono text-sm font-semibold uppercase tracking-[0.22em] text-brand">
        <Zap size={14} /> Operators on DIZRUPT
      </div>
      <p
        className={cn(
          "mx-auto max-w-3xl font-display text-[clamp(1.8rem,4vw,3rem)] font-bold leading-snug tracking-tight transition-all duration-300 ease-out",
          animating ? "scale-[0.98] opacity-0 blur-sm" : "scale-100 opacity-100 blur-0"
        )}
      >
        &ldquo;{shown.quote}&rdquo;
      </p>
      <p
        className={cn(
          "mt-8 text-sm font-semibold uppercase tracking-[0.2em] text-fg-muted transition-all duration-500",
          animating ? "translate-y-2 opacity-0" : "translate-y-0 opacity-100"
        )}
      >
        {shown.role}
      </p>
      <div className="mt-8 flex items-center justify-center gap-2.5">
        {TESTIMONIALS.map((t, i) => {
          const isActive = i === active;
          return (
            <button
              key={t.author}
              onClick={() => select(i)}
              aria-label={`Show quote from ${t.author}`}
              className={cn(
                "flex items-center rounded-full transition-all duration-500 ease-[cubic-bezier(0.4,0,0.2,1)]",
                isActive ? "bg-ink-elevated py-2 pl-2 pr-5 shadow-card" : "p-1 hover:bg-ink-elevated/60"
              )}
            >
              <span
                className="grid h-10 w-10 shrink-0 place-items-center rounded-full font-display text-sm font-bold"
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
                  isActive ? "ml-2.5 grid-cols-[1fr] opacity-100" : "ml-0 grid-cols-[0fr] opacity-0"
                )}
              >
                <span className="overflow-hidden whitespace-nowrap text-sm font-semibold text-fg">{t.author}</span>
              </span>
            </button>
          );
        })}
      </div>
    </section>
  );
}

/* ----------------------------------- CTA ------------------------------------ */
// Full-bleed chroma finale — the field comes back, the type goes enormous.

function FinalCTA() {
  return (
    <section id="manifesto" className="relative overflow-hidden border-t border-white/10">
      <ChromaField className="absolute inset-0 h-full w-full" intensity={0.85} />
      <div className="relative mx-auto max-w-5xl px-6 py-36 text-center">
        <h2 className="font-display text-[clamp(3rem,9vw,7.5rem)] font-extrabold leading-[0.92] tracking-[-0.045em]">
          <span className="bg-ink px-4 py-1 leading-tight text-fg [box-decoration-break:clone]">Strike before</span>
          <br />
          <span className="bg-brand px-4 py-1 leading-tight text-[#04281A] [box-decoration-break:clone]">it breaks.</span>
        </h2>
        <p className="mx-auto mt-8 inline-block max-w-xl bg-ink/85 px-5 py-3 text-lg leading-8 text-fg-secondary backdrop-blur">
          Ten minutes to onboard your org. One screen to run it. The next
          surprise in your company shouldn&apos;t be a surprise.
        </p>
        <div className="mt-10 flex flex-wrap items-center justify-center gap-4">
          <Link
            href="/login"
            className="group flex h-16 items-center gap-3 bg-brand px-9 text-lg font-extrabold uppercase tracking-wide text-[#04281A] transition-colors hover:bg-[#3DF59E]"
          >
            Get started free
            <ArrowRight size={20} strokeWidth={2.5} className="transition-transform duration-300 group-hover:translate-x-1.5" />
          </Link>
          <Link
            href="/login"
            className="flex h-16 items-center gap-3 border border-white/30 bg-ink/80 px-9 text-lg font-semibold text-fg backdrop-blur transition-colors hover:border-brand hover:text-brand"
          >
            Book a live strike <GitBranch size={17} />
          </Link>
        </div>
      </div>
    </section>
  );
}

/* ---------------------------------- footer ----------------------------------- */

const FOOTER_COLS: { title: string; links: string[] }[] = [
  { title: "Product", links: ["Command Center", "Capacity", "Graph", "Agent Inbox", "Decisions"] },
  { title: "Company", links: ["Manifesto", "Method", "Careers", "Press"] },
  { title: "Resources", links: ["Docs", "API", "Status", "Security"] },
];

function Footer() {
  return (
    <footer className="border-t border-white/10 bg-ink-surface/30">
      <div className="mx-auto grid max-w-7xl gap-10 px-6 py-16 md:grid-cols-[1.4fr_repeat(3,1fr)] lg:px-10">
        <div>
          <DizruptWordmark markSize={30} sub="Resource Intelligence" />
          <p className="mt-5 max-w-xs text-sm leading-7 text-fg-muted">
            The operating system for your organization. Built for the operators
            who can&apos;t afford surprises.
          </p>
        </div>
        {FOOTER_COLS.map((c) => (
          <div key={c.title}>
            <div className="mb-4 text-sm font-bold uppercase tracking-[0.14em] text-fg-muted">{c.title}</div>
            <ul className="space-y-3">
              {c.links.map((l) => (
                <li key={l}>
                  <a href="#" className="text-base text-fg-secondary transition-colors hover:text-brand">{l}</a>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
      <div className="border-t border-white/10">
        <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-3 px-6 py-6 text-sm text-fg-faint lg:px-10">
          <span>© 2026 DIZRUPT. All circuits reserved.</span>
          <span className="inline-flex items-center gap-2">
            <Zap size={13} className="text-brand" /> Built at full voltage
          </span>
        </div>
      </div>
    </footer>
  );
}

/* ----------------------------------- page ------------------------------------ */

export default function WelcomePage() {
  // ScrollTrigger measures against the document — refresh after fonts settle,
  // well clear of the hero intro timeline.
  React.useEffect(() => {
    const refresh = () => ScrollTrigger.refresh();
    if (document.fonts?.ready) {
      document.fonts.ready.then(refresh);
      return;
    }
    const t = setTimeout(refresh, 2500);
    return () => clearTimeout(t);
  }, []);

  return (
    <div className="relative min-h-screen bg-ink">
      <TopNav />
      <main>
        <Hero />
        <MarqueeBand />
        <ProductStage />
        <ScrollStory />
        <StatPlates />
        <Bento />
        <Method />
        <Testimonials />
        <FinalCTA />
      </main>
      <Footer />
    </div>
  );
}
