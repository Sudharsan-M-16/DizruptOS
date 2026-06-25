"use client";

// DizruptOS — User Guide. A plain-language tour of *everything* the OS can do,
// written so anyone (a curious 10-year-old or a non-technical 60-year-old) can
// follow it. No jargon; analogies first, then the exact steps. Rendered inside
// System Settings → "Guide" and opened from the  menu → "About DizruptOS".

import {
  AppWindow, Bell, Boxes, Calendar, Command, FolderOpen, Home, KeyRound, LayoutGrid,
  Lock, MousePointerClick, Search, Settings, Sparkles, Sun, Users, Wand2, Zap,
} from "lucide-react";
import { DizruptMark } from "@/components/ui/logo";

export function GuideContent() {
  return (
    <div className="mx-auto max-w-[640px] pb-6">
      {/* hero */}
      <div className="mb-6 flex items-center gap-4">
        <DizruptMark size={48} glow />
        <div>
          <h1 className="font-display text-2xl font-bold tracking-tight">Welcome to DizruptOS</h1>
          <p className="text-xs text-fg-muted">A complete computer desktop that runs inside your web browser. This guide explains every part in simple words.</p>
        </div>
      </div>

      <Callout>
        <b>The big idea:</b> DizruptOS works just like a Mac or Windows computer — but it lives in a browser tab.
        You open “apps” in little windows, move them around, and arrange your screen however you like. Nothing to install.
      </Callout>

      {SECTIONS.map((s) => (
        <section key={s.title} className="mt-7">
          <div className="mb-2 flex items-center gap-2">
            <span className="grid h-7 w-7 place-items-center rounded-lg border border-line bg-ink-surface" style={{ color: "var(--os-accent,#00ED82)" }}>
              <s.icon size={15} />
            </span>
            <h2 className="font-display text-base font-bold tracking-tight">{s.title}</h2>
          </div>
          {s.intro && <p className="mb-2.5 text-xs leading-relaxed text-fg-secondary">{s.intro}</p>}
          <div className="space-y-2">
            {s.items.map((it) => (
              <div key={it.term} className="rounded-xl border border-line bg-ink-surface p-3">
                <div className="text-xs font-semibold text-fg">{it.term}</div>
                <div className="mt-0.5 text-xs leading-relaxed text-fg-secondary">{it.desc}</div>
                {it.steps && (
                  <ol className="mt-1.5 space-y-1">
                    {it.steps.map((st, i) => (
                      <li key={i} className="flex gap-2 text-2xs text-fg-muted">
                        <span className="grid h-4 w-4 shrink-0 place-items-center rounded-full bg-ink-elevated text-[9px] font-bold text-fg-secondary">{i + 1}</span>
                        <span className="leading-relaxed">{st}</span>
                      </li>
                    ))}
                  </ol>
                )}
              </div>
            ))}
          </div>
        </section>
      ))}

      {/* shortcuts */}
      <section className="mt-7">
        <div className="mb-2 flex items-center gap-2">
          <span className="grid h-7 w-7 place-items-center rounded-lg border border-line bg-ink-surface" style={{ color: "var(--os-accent,#00ED82)" }}><Command size={15} /></span>
          <h2 className="font-display text-base font-bold tracking-tight">Keyboard shortcuts (optional)</h2>
        </div>
        <p className="mb-2.5 text-xs leading-relaxed text-fg-secondary">You never <i>need</i> the keyboard — everything is clickable. But these are quick if you like them. On Windows use <b>Ctrl</b>; on Mac use <b>⌘ Command</b>.</p>
        <div className="overflow-hidden rounded-xl border border-line">
          {SHORTCUTS.map(([k, what], i) => (
            <div key={k} className={`flex items-center gap-3 px-3 py-2 ${i % 2 ? "bg-ink-surface/40" : ""}`}>
              <kbd className="shrink-0 rounded-md border border-line bg-ink-elevated px-2 py-0.5 font-mono text-2xs text-fg">{k}</kbd>
              <span className="text-xs text-fg-secondary">{what}</span>
            </div>
          ))}
        </div>
      </section>

      <Callout className="mt-7">
        <b>Can’t find something?</b> Press the magnifying glass in the top bar (or <kbd className="rounded border border-line bg-ink-elevated px-1">⌘/Ctrl</kbd> + <kbd className="rounded border border-line bg-ink-elevated px-1">Space</kbd>) and just type what you want — “Risks”, a person’s name, “dark mode”. It finds it for you.
      </Callout>

      <p className="mt-6 text-center text-2xs text-fg-faint">DizruptOS · you can reopen this guide any time from the  menu → About DizruptOS.</p>
    </div>
  );
}

function Callout({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return (
    <div className={`rounded-xl border border-[var(--os-accent-line,#00ED8244)] bg-[var(--os-accent-soft,rgba(0,237,130,0.10))] p-3.5 text-xs leading-relaxed text-fg-secondary ${className}`}>
      {children}
    </div>
  );
}

interface Item { term: string; desc: string; steps?: string[] }
interface Section { title: string; icon: React.ElementType; intro?: string; items: Item[] }

const SECTIONS: Section[] = [
  {
    title: "Turning it on", icon: Zap,
    intro: "When you sign in, DizruptOS “boots up” like a real computer.",
    items: [
      { term: "The start-up screen", desc: "You first see the DizruptOS logo with a loading bar. That’s the system waking up — it only takes a moment." },
      { term: "The lock screen", desc: "Next you see a big clock and your name with a photo circle. This is the ‘door’ to your desktop.", steps: ["Type anything in the password box (this demo doesn’t check it).", "Press the green arrow, hit Return, or click ‘Touch ID to unlock’.", "Your desktop appears."] },
    ],
  },
  {
    title: "The desktop — the basics", icon: LayoutGrid,
    intro: "Once unlocked, you’re on the ‘desktop’: a colourful background with a bar at the top and a row of icons at the bottom.",
    items: [
      { term: "The menu bar (top strip)", desc: "The thin bar across the very top. On the left it says ‘DizruptOS’ and a few menus. On the right are little status icons, a bell, sliders, and the clock." },
      { term: "The Dock (bottom row)", desc: "The row of rounded app icons at the bottom. This is your launcher — click an icon to open that app. Icons gently grow as your mouse passes over them." },
      { term: "The wallpaper", desc: "The background picture. You can change its colour and pattern whenever you like (see ‘Make it yours’ below)." },
    ],
  },
  {
    title: "Opening and using apps", icon: AppWindow,
    intro: "An ‘app’ opens in a ‘window’ — a movable box on your screen. You can have many open at once.",
    items: [
      { term: "Open an app", desc: "Click its icon in the Dock. A window springs open. Click the icon again later to bring it back to the front.", steps: ["Move your mouse over a Dock icon — its name pops up.", "Click it once.", "The app opens in a window."] },
      { term: "Move a window", desc: "Click and hold the top bar of the window (the title strip), then drag it anywhere. Let go to drop it." },
      { term: "Resize a window", desc: "Move your mouse to any edge or corner of a window until the arrow changes, then drag to make it bigger or smaller." },
      { term: "The three coloured dots", desc: "Top-left of every window. Red ✕ closes it. Yellow – hides it down to the Dock (minimise). Green + makes it fill the screen (zoom). Hover them to see the symbols." },
      { term: "Snap windows side-by-side", desc: "Drag a window’s top bar to the very left or right edge of the screen and let go — it neatly fills half the screen. Drag to the top edge to make it full-screen. A glowing outline shows where it will land." },
      { term: "Bring a window to the front", desc: "Just click anywhere on it. The one you’re using sits on top of the others." },
    ],
  },
  {
    title: "Ways to find and switch", icon: Search,
    items: [
      { term: "Spotlight — search everything", desc: "The fastest way to do anything. Click the magnifying glass (top-right) or press ⌘/Ctrl + Space. Start typing — apps, people, projects and settings all appear. Click one to open it." },
      { term: "Mission Control — see all open windows", desc: "Click the windows icon (top-right) or press F3. Every open window shrinks into a tidy grid so you can spot the one you want and click it." },
      { term: "Launchpad — all your apps", desc: "Click the grid icon on the far-left of the Dock, or press F4. You get a full page of every app. Click one to open it. You can also pin/unpin apps to your Dock from here (hover an app and click the small circle)." },
    ],
  },
  {
    title: "The top menu bar in detail", icon: Calendar,
    items: [
      { term: "The DizruptOS ( ) menu", desc: "Far left. Click it for ‘About DizruptOS’ (this guide!), ‘System Settings’, ‘Lock Screen’, ‘Sign Out’ and ‘Restart’." },
      { term: "App menus (Overview, Capacity, Intelligence)", desc: "Quick links that open the matching work windows — they never throw you out of the desktop." },
      { term: "The bell — notifications", desc: "A small number on the bell means you have unread alerts. Click it to see them, grouped into Risks, Proposals, Commitments and System. Click an alert to jump to the related window, or ‘Mark all read’ to clear the number." },
      { term: "The sliders — Control Center", desc: "Your quick-settings panel (next item explains what’s inside)." },
      { term: "The clock — calendar", desc: "Click the date/time to pop open a little month calendar with today highlighted." },
    ],
  },
  {
    title: "Make it yours (Control Center)", icon: Sun,
    intro: "Click the sliders icon at the top-right to open Control Center. Everything here changes instantly.",
    items: [
      { term: "Light or Dark", desc: "Switch the whole system between a bright (Light) look and a dark look. ‘Auto’ follows your computer’s setting." },
      { term: "Accent colour", desc: "Pick the highlight colour used across the system — green, blue, purple, amber and more. Buttons, the Dock glow and highlights all re-colour at once." },
      { term: "Wallpaper", desc: "Choose a background from the little picture grid. (You can also right-click the empty desktop for the same quick choices.)" },
      { term: "Brightness", desc: "Drag the slider to dim or brighten the background." },
      { term: "Performance mode", desc: "Turn this ON if DizruptOS feels slow on an older or low-memory computer. It removes the fancy blur and background motion to run faster. It switches on automatically on low-spec machines." },
      { term: "Lock", desc: "A quick button to lock the screen (go back to the clock screen)." },
    ],
  },
  {
    title: "The built-in apps", icon: Home,
    intro: "These are the main apps made specially for your work. Some may be hidden depending on your role (see ‘Who sees what’).",
    items: [
      { term: "Home", desc: "Your personal start page. It shows your workload, and your tasks split into three simple tabs — ‘Today’ (due now), ‘Pending’ (not started), and ‘Critical’ (urgent or at-risk). Each task shows which project it belongs to. It also lists your team and anything needing attention." },
      { term: "Project Matrix", desc: "A board of cards for tasks, arranged in columns by stage (Backlog → To Do → In Progress → Blocked → In Review → Done). Pick up a card with your mouse and drop it in another column to update it." },
      { term: "Capacity", desc: "The team's workload, week by week. See who's overloaded (red), near their limit (amber), and who has room (green/blue). Click anyone to open their sidebar — their tasks, projects, skills and a one-click way to move work to the best-fit person." },
      { term: "Knowledge Vault", desc: "Your private file cabinet for PDFs, notes and documents — saved right in your browser. It has folders, a Recent view and a Trash, just like Finder/Explorer.", steps: ["Open the Vault from the Dock.", "Drag any file from your computer onto the window — a glowing box appears — and drop it to save it.", "Or click ‘Upload’. Click ‘New Folder’ to organise. Click a file to open it. Hover a file and click the bin to move it to Trash."] },
      { term: "Work windows (Capacity, Risks, People, etc.)", desc: "The rest of the Dock opens your existing work pages inside windows, so you never leave the desktop." },
      { term: "System Settings", desc: "The same choices as Control Center, plus this guide and ‘About’ system info, in a bigger window." },
    ],
  },
  {
    title: "Saving and remembering", icon: Sparkles,
    items: [
      { term: "Your layout is remembered", desc: "Where you put your windows, which apps you opened, and your colour/wallpaper choices are saved automatically. They come back next time you sign in." },
      { term: "Your files stay private", desc: "Files in the Knowledge Vault are stored only in your own browser on this device — they aren’t uploaded anywhere." },
    ],
  },
  {
    title: "Who sees what (roles)", icon: KeyRound,
    items: [
      { term: "Apps match your job", desc: "DizruptOS shows different apps depending on who you are. A team leader might see ‘Executive’ and ‘Capacity’; a team member sees a simpler set. If an app isn’t in your Dock, your role doesn’t have access to it — that’s normal and keeps sensitive information safe." },
    ],
  },
  {
    title: "Finishing up", icon: Lock,
    items: [
      { term: "Lock the screen", desc: "Use the  menu → Lock Screen (or the Lock button in Control Center) to step away. Your work stays exactly as you left it." },
      { term: "Sign out", desc: " menu → Sign Out when you’re done for the day." },
      { term: "Restart", desc: " menu → Restart replays the start-up animation — handy if anything looks stuck." },
    ],
  },
];

const SHORTCUTS: [string, string][] = [
  ["⌘/Ctrl + Space", "Open Spotlight search"],
  ["F3", "Mission Control (see all windows)"],
  ["F4", "Launchpad (all apps)"],
  ["⌘/Ctrl + `", "Switch to the next window"],
  ["⌃⌘ + Q", "Lock the screen"],
  ["Esc", "Close any open menu or search"],
  ["Double-click title bar", "Zoom a window to full screen"],
];
