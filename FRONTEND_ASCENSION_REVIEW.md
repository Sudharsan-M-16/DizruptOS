# FRONTEND ASCENSION REVIEW
### Sprint record: what changed, why, and the system behind it

> Companion to `MASTER_EXECUTION_PLAN.md` (operating manual). This document is
> the design-system and motion-system reference plus the honest critique loop
> that produced this sprint. June 2026.

---

## 1. The dissatisfaction audit (before)

The pre-sprint frontend was polished but listed facts instead of commanding
attention:

| Weakness | Where | Verdict |
|---|---|---|
| No entrance choreography outside the home page | every route | screens "appeared", never *arrived* |
| Static numbers | all metric tiles | no perceived liveness |
| Dashboard = grid of equal-weight cards | Command Center | didn't answer "what matters right now?" in 2 seconds |
| No cinematic moment anywhere | login, executive | first impression read "competent", not "expensive" |
| Graph was static topology | /graph | relationships visible but not *explorable* |
| Tables lost headers on scroll | people, audit | orientation tax at scale |
| Heatmap had no headline | /capacity | the wedge screen made you compute the org's state yourself |
| Matrix crushed below ~1100px | /capacity | density compressed blindly (violates inspiration rule 3) |

## 2. What shipped (after)

1. **Motion architecture** (`src/lib/motion.ts` + `app/(shell)/template.tsx`)
   — a three-tier system, not scattered animations:
   - **T1 ambient**: every route now rises into place via `template.tsx`
     (Next re-mounts it per navigation → free choreography for all future
     screens). Easing `[0.22,1,0.36,1]`, 45ms child stagger.
   - **T2 structural**: drawers/modals/palette/kanban on exactly two springs —
     `springStructural` (380/36) and `springSnappy` (500/34). No bespoke curves.
   - **T3 signal**: critical pulse, guardrail trip, live-sync flash — color +
     motion together, reserved for state the operator must notice.
   - All tiers collapse under `prefers-reduced-motion`.
   **Rule: a new animation must name its tier or it doesn't merge.**

2. **Signature components** (`src/components/ui/ascension.tsx`):
   - `NumberTicker` — counts up in view, tabular-nums, static suffix (no
     jitter). Now on Command Center + Executive tiles and the capacity strip.
   - `CriticalFrame` — animated gradient border. **Budget: one per view.**
     If two things wear it, neither is critical.
   - `AuroraBackdrop` — two drifting radial fields + conic sweep, pure CSS,
     GPU-composited. **Used once in the product** (login). Cinema is a spice.

3. **Command Center → situation room.** New top banner inside a danger
   `CriticalFrame`: *"Atlas Payments Migration is CRITICAL — $4.2M ARR
   exposed"* with the causal one-liner and three computed one-click actions
   (Review compromise / Relieve Sarah · 113% / Open Atlas). The screen now
   answers "what matters right now?" before the user scrolls.

4. **Capacity heatmap headline.** Org-load strip: ticking average (73%),
   red/amber/green counts, the capacity bar. "Now" column tinted brand;
   matrix gets `min-w-[1080px]` + horizontal scroll so density never
   collapses — found and fixed during the critique loop (see §4).

5. **Graph → exploration instrument.** Hover a node: its edges ignite
   (brand stroke, 2.5px, animated) and everything else recedes to 12%
   opacity — motion communicating connection. Styled MiniMap for orientation.
   Edge width still ∝ relationship strength; `·~` marks inferred edges.

6. **Tables.** Sticky headers (docked under the 56px topbar) on People and
   Audit; crafted press feedback (`scale(0.985)`) on every button globally.

7. **Login.** Aurora backdrop + gradient wordmark — the product's single
   cinematic moment, on the first screen anyone sees.

## 3. Design system reference (for future contributors)

- **Tokens** (`globals.css` + `tailwind.config.ts`): neutrals are CSS-variable
  RGB triplets per theme (`--ink*`, `--line*`, `--fg*`, `--shadow-*`); signal
  colors are theme-invariant hex (brand `#6366F1`, ok `#10B981`, warn
  `#F59E0B`, danger `#EF4444`, info `#38BDF8`). Never hardcode a neutral.
- **Type**: IBM Plex Sans (body, `tnum` on), IBM Plex Mono (data), Sora
  (display). Scale in practice: 11px labels (`text-2xs` + tracking) · 12–13px
  body · 14–17px headings · 28px tile numerals.
- **Surfaces**: `panel` (card) → `bg-ink-elevated` (nested) → `shadow-pop`
  (floating). Three levels, no more.
- **Spacing rhythm**: 4px base; sections `space-y-6`, cards `p-4/p-5`,
  dense rows `py-3`.
- **Doctrine components**: every metric wears `Explain`; status pills are
  icon + text (never color alone); capacity bars carry the 80% tick.
- **Ascension budget per screen**: ≤1 `CriticalFrame`, tickers only on
  decision numbers, aurora **only** on login. Restraint is the brand.

## 4. The critique loop (evidence of iteration)

- **Pass 1**: banner + tickers + aurora + graph hover shipped; screenshots
  reviewed at 800px.
- **Critique found**: heatmap matrix crushed — chips collided with
  percentages in the now-column at narrow widths. Violation of "dense
  information should be structured, not compressed blindly."
- **Pass 2**: `min-w-[1080px]` + `overflow-x-auto`; re-verified — now-column
  is full-width and legible, later weeks scroll. Screenshot confirmed.
- **Verified surfaces this sprint**: login (aurora), Command Center (banner +
  tickers), capacity (strip + matrix), graph (minimap + state chips), all in
  dark; light theme verified in prior sprint and tokens unchanged.

## 5. Verification record

`npm run lint` 0 warnings · `tsc --noEmit` clean · **40/40 tests** ·
`next build` 18 routes + middleware. App reviewed live at
**http://localhost:5175** (launch config pinned to port 5175, auto-fallback
if occupied). Relaunch: `cd dizruptos && npm run dev` (preview config) or
`npx next dev -p 5175`. No env vars required (demo mode).

## 6. Future design opportunities (deliberately not done)

- Shared-element transition project card → detail header (App Router
  `layoutId` limits; revisit with View Transitions API).
- Graph: click-to-pin focus + path-to-root tracing; dagre auto-layout past
  ~20 nodes.
- Heatmap: week-range brush + forecast ghost bars (scenario engine tie-in).
- Command palette: action verbs ("reassign…", "escalate…") with argument
  prompts — operator grammar, post-T1.
- Density toggle (comfortable/compact) persisted per user.
