# DizruptOS Front-End UI/UX Master Brief

This document consolidates the provided PRD context, the user-selected inspiration links, and a curated set of enterprise UI/design references for rebuilding DizruptOS from scratch as a premium employee and project management system.

The goal is not to mirror existing implementation details. The goal is to give Claude a dense, direct, link-rich source of inspiration and structure for a new enterprise-grade front end focused on UI, interaction design, dashboards, data density, and polished workflow UX.

## Product Lens

DizruptOS should feel like a dark, premium command center for employee and project operations.

The interface should support:

- Employee and project management
- Capacity and utilization intelligence
- Sprint and workload planning
- Resource allocation and reassignment
- Executive dashboards
- Agent proposal review and negotiation
- Dense operational tables and filters
- Kanban and timeline-based task movement
- Graph and dependency visualization
- Search, command palette, and fast global navigation

## Core UI Doctrine

Use these principles as the default design contract:

- Dark, premium, mysterious, but readable
- Dense data without visual clutter
- Strong spatial hierarchy
- Every score, chart, or risk signal should explain itself
- Fast keyboard-driven workflows
- Two-click access to critical management actions
- Optimistic interactions for drag, reassignment, and state changes
- Glassmorphic depth only where it adds clarity
- Micro-animations should feel intentional, not decorative
- UI should be enterprise-native, not consumer-SaaS generic

## User-Provided Anchor Links

These are the exact links the user called out first and should be treated as primary inspiration anchors:

- [AlignUI installation](https://www.alignui.com/docs/v1.2/installation)
- [EvilCharts docs](https://evilcharts.com/docs)
- [Solar icon collection](https://icones.js.org/collection/solar)
- [Aura build home](https://www.aura.build/)
- [The Noun Project](https://thenounproject.com/)

## Claude-Ready Reading Order

If Claude only studies a small set first, use this order:

1. [shadcn/ui dashboard example](https://ui.shadcn.com/examples/dashboard)
2. [AlignUI installation](https://www.alignui.com/docs/v1.2/installation)
3. [AlignUI introduction](https://www.alignui.com/docs/v1.2/introduction)
4. [AlignUI command menu](https://www.alignui.com/docs/v1.2/ui/command-menu)
5. [EvilCharts installation](https://evilcharts.com/docs/installation)
6. [EvilCharts area chart static](https://evilcharts.com/docs/area-chart/static)
7. [Radix UI primitives intro](https://www.radix-ui.com/primitives/docs/overview/introduction)
8. [TanStack Table intro](https://tanstack.com/table/latest/docs/introduction)
9. [Pragmatic Drag and Drop about](https://atlassian.design/components/pragmatic-drag-and-drop/about)
10. [Framer Motion layout animations](https://www.framer.com/motion/layout-animations/)
11. [React Flow learn](https://reactflow.dev/learn)
12. [Solar icons collection](https://icones.js.org/collection/solar)

## Core Structural UI Libraries

### AlignUI

AlignUI is one of the strongest starting points for polished, enterprise-friendly UI patterns.

- [AlignUI docs](https://www.alignui.com/docs)
- [AlignUI installation](https://www.alignui.com/docs/v1.2/installation)
- [AlignUI introduction](https://www.alignui.com/docs/v1.2/introduction)
- [AlignUI command menu](https://www.alignui.com/docs/v1.2/ui/command-menu)
- [AlignUI file upload](https://www.alignui.com/docs/v1.2/ui/file-upload)
- [AlignUI digit input](https://www.alignui.com/docs/v1.2/ui/digit-input)
- [AlignUI modal](https://www.alignui.com/docs/v1.2/ui/modal)

### Aura / Aura UI

Useful for layout discipline, breathing room, and spatial design language.

- [Aura home](https://www.aura.build/)
- [Aura UI docs](https://www.auraui.com/docs)
- [Aura article](https://www.auraui.com/docs/article)
- [Aura field component](https://aura-ui.com/docs/components/field)

### shadcn/ui

Best used as a composable base layer for enterprise dashboards, forms, dialogs, tables, and blocks.

- [shadcn/ui docs](https://ui.shadcn.com/docs)
- [shadcn/ui installation for Next.js](https://ui.shadcn.com/docs/installation/next)
- [shadcn/ui blocks](https://ui.shadcn.com/blocks)
- [shadcn/ui data table](https://ui.shadcn.com/docs/components/data-table)
- [shadcn/ui dashboard example](https://ui.shadcn.com/examples/dashboard)

### Radix UI

Use for accessible primitives and interaction foundations.

- [Radix primitives introduction](https://www.radix-ui.com/primitives/docs/overview/introduction)
- [Radix accessibility guide](https://www.radix-ui.com/primitives/docs/guides/accessibility)

### NextUI

A modern React component option with strong presentation for data-heavy interfaces.

- [NextUI introduction](https://nextui.org/docs/guide/introduction)
- [NextUI table](https://nextui.org/docs/components/table)

### Ant Design

Excellent reference for enterprise density, tables, forms, navigation, and dashboards.

- [Ant Design components overview](https://ant.design/components/overview)

### MUI

Strong enterprise option for dashboards and scalable design systems.

- [MUI getting started](https://mui.com/material-ui/getting-started/)
- [MUI templates](https://mui.com/material-ui/getting-started/templates/)
- [MUI store item: Berry React Material Admin](https://mui.com/store/items/berry-react-material-admin/)
- [MUI X docs](https://mui.com/x/)

### Chakra UI

Accessible and flexible with a polished component baseline.

- [Chakra UI docs](https://chakra-ui.com/docs/components)
- [Chakra UI Pro](https://pro.chakra-ui.com)

### CoreUI

Very useful for admin and dashboard shell ideas.

- [CoreUI React](https://coreui.io/react/)
- [CoreUI main site](https://coreui.io/)

### Tabler

Clean dashboard styling and highly legible admin aesthetics.

- [Tabler UI docs](https://docs.tabler.io/ui/components)
- [Tabler docs root](https://docs.tabler.io/)

### Tailwind UI / TailGrids / HeroUI / DaisyUI

Useful for additional dashboard and component reference.

- [Tailwind UI](https://tailwindui.com)
- [TailGrids tailwind components](https://tailgridz.com/tailwind-ui-components)
- [HeroUI docs](https://www.heroui.com/docs/react/components/link)
- [daisyUI components](https://daisyui.com/components/?lang=en)

## High-End Motion and Interaction Systems

### Framer Motion

Critical for layout transitions, drag and drop polish, modal behavior, and animated state changes.

- [Framer Motion introduction](https://www.framer.com/motion/introduction/)
- [Framer Motion layout animations](https://www.framer.com/motion/layout-animations/)
- [Framer Motion animate presence](https://www.framer.com/motion/animate-presence/)

### Aceternity UI

Good for cinematic background treatments, bento layouts, and premium visual texture.

- [Aceternity UI docs](https://ui.aceternity.com/docs)
- [Aceternity add utilities](https://ui.aceternity.com/docs/add-utilities)
- [Aceternity components](https://ui.aceternity.com/components)
- [Aceternity bento grid](https://ui.aceternity.com/components/bento-grid)
- [Aceternity background beams](https://ui.aceternity.com/components/background-beams)
- [Aceternity sticky scroll reveal](https://ui.aceternity.com/components/sticky-scroll-reveal)

### Magic UI

Excellent for smooth micro-interactions, shiny text, number tickers, and animated bento surfaces.

- [Magic UI docs](https://magicui.design/docs)
- [Magic UI bento grid](https://magicui.design/docs/components/bento-grid)
- [Magic UI number ticker](https://magicui.design/docs/components/number-ticker)
- [Magic UI shiny button](https://magicui.design/docs/components/shiny-button)

### CMDK

Useful for enterprise search and command palette behavior.

- [CMDK home](https://cmdk.paco.me/)

## Data Visualization and Dashboard Engines

### EvilCharts

Best match for a dark dashboard with opinionated, animated charts.

- [EvilCharts docs](https://evilcharts.com/docs)
- [EvilCharts installation](https://evilcharts.com/docs/installation)
- [EvilCharts area chart static](https://evilcharts.com/docs/area-chart/static)
- [EvilCharts chart config](https://evilcharts.com/docs/chart-config)
- [EvilCharts components](https://evilcharts.com/docs/components)

### Tremor

Enterprise dashboard reference with clear data presentation.

- [Tremor installation](https://tremor.so/docs/getting-started/installation)
- [Tremor bar chart](https://tremor.so/docs/components/bar-chart)

### Recharts

Good reference for React-native chart composition and custom dashboard visualization.

- [Recharts getting started](https://recharts.org/en-US/guide/getting-started)
- [Recharts API](https://recharts.org/en-US/api)

### Visx

Use for low-level custom charting and data visualization control.

- [Visx docs](https://airbnb.io/visx/docs)

### ApexCharts

Useful for polished dashboard chart patterns and quick enterprise visualizations.

- [ApexCharts docs](https://apexcharts.com/docs/)
- [ApexCharts installation](https://apexcharts.com/docs/installation)
- [ApexCharts demos](https://apexcharts.com/javascript-chart-demos/)

### ECharts

Powerful enterprise visualization reference for richer charting interactions.

- [ECharts handbook](https://echarts.apache.org/handbook/en/get-started/)

## Heavy Enterprise Primitives

### TanStack Table

Important for large-scale tables, filtering, sorting, and dense operational data.

- [TanStack Table introduction](https://tanstack.com/table/latest/docs/introduction)
- [TanStack column filtering](https://tanstack.com/table/latest/docs/guide/column-filtering)

### Pragmatic Drag and Drop

Best reference for fast, reliable drag-and-drop behavior in Kanban and resource boards.

- [Pragmatic Drag and Drop about](https://atlassian.design/components/pragmatic-drag-and-drop/about)
- [Pragmatic Drag and Drop core package](https://atlassian.design/components/pragmatic-drag-and-drop/core-package)

### React Flow

Best for organizational graphs, dependency graphs, and agent negotiation maps.

- [React Flow learn](https://reactflow.dev/learn)
- [React Flow custom nodes](https://reactflow.dev/learn/customization/custom-nodes)

### FullCalendar

Useful for availability, scheduling, timelines, and coordination views.

- [FullCalendar React integration](https://fullcalendar.io/docs/react)

## Iconography and Micro-Aesthetics

### Solar Icons

Primary icon set recommendation for a clean, sharp, modern enterprise interface.

- [Solar icons collection](https://icones.js.org/collection/solar)
- [Solar icons React/Next.js integration](https://solar-icons.vercel.app/)
- [Solar icons npm package](https://www.jsdelivr.com/package/npm/@solar-icons/react)

### The Noun Project

Useful for niche enterprise concepts, custom symbolic language, and special-case icon needs.

- [The Noun Project](https://thenounproject.com/)
- [The Noun Project developers](https://thenounproject.com/developers/)
- [The Noun Project API documentation](https://thenounproject.com/developers/api-documentation/)

### Lucide

Good fallback icon system.

- [Lucide React guide](https://lucide.dev/guide/packages/lucide-react)

## Dashboard and Template Inspiration

These are useful for layout, density, shell structure, and enterprise visual language.

- [shadcn/ui dashboard example](https://ui.shadcn.com/examples/dashboard)
- [Horizon shadcn dashboard](https://horizon-ui.com/shadcn-ui)
- [Ant Design multipurpose dashboard template](https://github.com/design-sparx/antd-multipurpose-dashboard)
- [Muse Ant Design dashboard](https://github.com/creativetimofficial/muse-ant-design-dashboard)
- [Berry React Material Admin](https://mui.com/store/items/berry-react-material-admin/)
- [AdminMart Material UI templates](https://adminmart.com/templates/material-ui)
- [MUI dashboard templates](https://mui.com/material-ui/getting-started/templates/)
- [Shadcn UI kit](https://shadcnuikit.com)
- [Best dashboard designs 2026](https://wrappixel.com/blog/best-dashboard-designs)
- [Dashboard design concepts](https://design4users.com/dashboard-design-concepts/)

## Inspiration Platforms

Use these for visual and interaction inspiration only, not as copy targets.

- [Dribbble project management search](https://dribbble.com/search/project-management-system)
- [Dribbble employee management search](https://dribbble.com/search/employee-management)
- [Dribbble team project management software shot](https://dribbble.com/shots/26702159-Team-Project-Management-Software-UI-UX-Design-Workplace)
- [Behance project management UI search](https://www.behance.net/search/projects/project%20management%20ui)
- [Behance employee management search](https://www.behance.net/search/projects/employee%20management)
- [Behance SaaS project management search](https://www.behance.net/search/projects/digital%20marquee%20project%20management)
- [Muzli dashboard inspiration](https://muz.li/inspiration/dashboard-inspiration/)
- [Muzli dashboard examples article](https://muz.li/blog/best-dashboard-design-examples-inspirations-for-2026/)
- [Dashboard UX patterns article](https://www.pencilandpaper.io/articles/ux-pattern-analysis-data-dashboards)
- [Enterprise design system basics](https://www.door3.com/blog/enterprise-design-system-all-the-basics-you-need-to-know)
- [Top 7 enterprise UX patterns](https://www.onething.design/post/top-7-enterprise-ux-design-patterns)
- [Enterprise UX design services](https://cieden.com/enterprise-ux-design)

## Thematic Screens To Study

For an employee and project management system, the most important screens are:

- Executive dashboard
- Capacity heatmap
- Resource matrix
- Sprint board / Kanban board
- Employee profile
- Project detail
- Workload planning view
- Negotiation inbox
- Risk register
- Decision registry
- Dependency graph
- Availability timeline
- Global search and command palette
- Table-heavy administration panels

## Design Patterns To Extract

Claude should extract and synthesize these patterns from the sources above:

- Dark surface layering with restrained contrast
- Spatial rhythm and readable density
- Command palette as a first-class navigation surface
- Data table ergonomics with filters, sorting, grouping, and row actions
- Side panels and contextual drawers for deep detail
- Kanban movement with motion continuity
- Heatmaps that explain capacity clearly
- Dashboard cards that make trends obvious at a glance
- Strong empty states and state explanations
- Premium form inputs for complex enterprise entry flows
- Graph layouts that communicate relationships, not just nodes
- Visual hierarchy between operational, managerial, and executive data

## Key UX Rules For Rebuild

These rules should govern the rebuilt front end:

1. Critical workflows must be reachable in two interactions or fewer.
2. Every metric should have a rationale, tooltip, or contextual explanation.
3. Dense information should be structured, not compressed blindly.
4. Motion should reinforce meaning, especially during board moves and transitions.
5. Tables and boards should remain usable at scale without visual fatigue.
6. Executive surfaces should privilege summary plus drill-down.
7. Human reviewers should always be able to override AI proposals quickly.
8. Search and command entry should feel instant.
9. The system should favor optimistic UI for reassignments and task moves.
10. The design system should remain consistent across dashboards, forms, modals, and graphs.

## Suggested Product Architecture For Claude

When Claude begins designing the front end, it should think in terms of these surfaces:

- Shell: left nav, top search, quick actions, contextual profile area
- Operations: heatmap + board split view
- Intelligence: executive dashboard, risk, capacity, workload, forecast panels
- Review: negotiation inbox, proposal cards, AI summaries, decision trails
- Data administration: employee table, project table, schedule table, filters
- Graphs: dependency maps, org trees, allocation relationships
- Modals and drawers: edits, reassignment, approval, details, audits

## Suggested Implementation Direction

The preferred stack direction implied by the provided materials is:

- Next.js App Router
- Tailwind CSS for styling
- shadcn/ui + Radix for composable primitives
- AlignUI and Aura concepts for premium structure and spacing
- Magic UI and Aceternity UI for high-end motion and visual polish
- Framer Motion for layout animation and transition continuity
- TanStack Table for dense grids
- Pragmatic Drag and Drop for fast Kanban/resource movement
- React Flow for dependency and organizational graphs
- EvilCharts, Tremor, Recharts, ECharts, or Visx for charting layers
- Solar Icons as primary iconography
- The Noun Project for niche conceptual icons

## Concise Copy-Paste Claude Directive

You are designing the front end for an enterprise employee and project management system. Use the links in this document as your inspiration corpus. Do not produce generic SaaS UI. Build a dark, premium, highly readable, management-first interface with exceptional dashboards, dense tables, optimistic drag-and-drop interactions, a command palette, a negotiation inbox, graph-based dependency views, and polished executive summaries. Prioritize Tailwind, shadcn/ui, Radix, AlignUI, Aura, Magic UI, Aceternity UI, Framer Motion, TanStack Table, Pragmatic Drag and Drop, React Flow, and strong charting libraries. The result should feel like a command center for human and AI collaboration.

## Notes On Scope

This file is intentionally focused on general UI, layout, motion, design systems, and enterprise front-end inspiration. It avoids existing implementation specifics from the current rebuild and instead provides a large direct-link map for a clean restart.

## Expanded Direct Link Catalog

The following additional links were explicitly mentioned in the supplied material and should be retained as part of the full source set:

- [AlignUI main docs](https://www.alignui.com/docs)
- [AlignUI introduction](https://www.alignui.com/docs/v1.2/introduction)
- [AlignUI Figma root](https://figma.alignui.com)
- [AlignUI Figma examples](https://figma.alignui.com/components/examples)
- [AlignUI Figma updates note](https://figma.alignui.com/updates/final-stages-documentation-organizing-figma-file-and-more)
- [EvilCharts main site](https://evilcharts.com)
- [EvilCharts examples](https://evilcharts.com/examples)
- [Solar all collections](https://icones.js.org/collection/all)
- [Icônes home](https://icones.js.org)
- [Aura UI home](https://www.auraui.com)
- [Aura templates](https://www.aura.build/templates)
- [The Noun Project icons](https://thenounproject.com/icons)
- [The Noun Project illustrations](https://thenounproject.com/illustrations)
- [Tailwind CSS docs](https://tailwindcss.com/docs)
- [Bootstrap examples](https://getbootstrap.com/docs/5.0/examples)
- [CoreUI React](https://coreui.io/react/)
- [CoreUI main site](https://coreui.io)
- [Tabler site](https://tabler.io)
- [Tabler docs](https://docs.tabler.io)
- [Metronic main site](https://keenthemes.com/metronic)
- [Metronic demo](https://preview.keenthemes.com/metronic8/demo53/)
- [MUI X charts and platform](https://mui.com/x/)
- [MUI templates](https://mui.com/material-ui/getting-started/templates/)
- [ApexCharts demos](https://apexcharts.com/javascript-chart-demos/)
- [ApexCharts docs](https://apexcharts.com/docs/)
- [ECharts handbook](https://echarts.apache.org/handbook/en/get-started/)
- [Recharts docs](https://recharts.org/en-US/api)
- [Framer Motion intro](https://www.framer.com/motion/introduction/)
- [Aceternity components](https://ui.aceternity.com/components)
- [Magic UI docs](https://magicui.design/docs)
- [CMDK docs](https://cmdk.paco.me/)
- [NextUI docs](https://nextui.org/docs/guide/introduction)
- [HeroUI docs](https://www.heroui.com/docs/react/components/link)

## Enterprise UI Recommendation Stack From The Provided Material

The source material repeatedly converges on this stack:

- Primary UI shell: shadcn/ui + Radix
- Primary visual polish: AlignUI, Aura, Aceternity UI, Magic UI
- Primary dashboard/data presentation: MUI, Ant Design, CoreUI, Tabler, Metronic
- Primary charting: EvilCharts, ApexCharts, ECharts, Recharts, Tremor, Visx
- Primary drag and drop: Pragmatic Drag and Drop + Framer Motion
- Primary graphing: React Flow
- Primary icons: Solar Icons, Lucide, The Noun Project

## Verbatim-Style Summary Of The Long-Form Brief

The long-form brief that was supplied alongside the links boils down to the following complete front-end directive, retained here as a structured summary for the rebuilt file:

The product is a premium enterprise employee and project management system. The UI should feel like a command center rather than a typical SaaS app. It should privilege dark premium surfaces, strong hierarchy, detailed operational views, fast navigation, and dense but readable enterprise dashboards. The system should use design systems and documentation from the links above as inspiration for spacing, input behavior, modal behavior, dashboard layouts, chart presentation, and iconography.

The most important product surfaces are the executive dashboard, resource or capacity heatmap, sprint or Kanban board, employee profile view, project detail page, workload planning surface, negotiation inbox, risk register, decision log, dependency graph, availability timeline, search/command palette, and admin tables.

The most important behavioral rules are that critical workflows must be reachable in two interactions or fewer, every metric must explain itself, dense data must stay structured, motion must reinforce meaning, tables and boards must remain usable at scale, executive surfaces should support drill-down, human reviewers must be able to override AI quickly, search should feel instant, optimistic UI should be used for reassignments and task moves, and the design system must remain consistent across dashboards, forms, modals, and graphs.

The design language should include dark layered surfaces, glassmorphic depth used sparingly, command palette centric navigation, accessible headless primitives, premium data tables, animated cards, chart-heavy intelligence surfaces, and graph-based relationship views that communicate actual operational meaning rather than decorative topology.

## Full Source Brief Appendix

The following appendix preserves the supplied directional content in a compact but top-to-bottom form so the document stays self-contained:

> Yes — and I used your attached PRD plus the links you gave to build a much stronger, more targeted inspiration map for DIZRUPTOS as an enterprise employee/project operations product. The attached PRD explicitly frames DIZRUPT as a resource intelligence platform, with a dark premium UI, capacity heatmaps, drag-and-drop reallocation, command palette, executive dashboards, and a management-first design doctrine, so the best inspiration sources are enterprise dashboards, data-heavy admin systems, and polished design systems.

> Your PRD’s UI doctrine is very clear: the interface must feel premium, calm, dense-but-readable, and decision-oriented, with dark theme, micro-animations, spatial hierarchy, explanatory intelligence, and the Two-Click Rule. That means Cloud should study design systems that are good at tables, filters, side panels, command palettes, status colors, charts, and hierarchical dashboards, not just marketing pages. The most useful sources are therefore component docs, dashboard templates, and enterprise UX pattern libraries.

### Best Direct Docs

- AlignUI docs: https://www.alignui.com/docs/v1.2/installation
- AlignUI introduction: https://www.alignui.com/docs/v1.2/introduction
- AlignUI Figma examples: https://figma.alignui.com/components/examples
- AlignUI Figma root: https://figma.alignui.com
- Aura UI: https://www.auraui.com
- Tabler docs: https://docs.tabler.io/ui/components
- Tabler docs root: https://docs.tabler.io
- CoreUI React: https://coreui.io/react/
- CoreUI main site: https://coreui.io
- shadcn dashboard: https://ui.shadcn.com/examples/dashboard
- HeroUI docs: https://www.heroui.com/docs/react/components/link
- daisyUI components: https://daisyui.com/components/?lang=en
- Tailwind CSS docs: https://tailwindcss.com/docs
- Bootstrap examples: https://getbootstrap.com/docs/5.0/examples

### Dashboard Systems

- MUI templates: https://mui.com/material-ui/getting-started/templates/
- MUI store dashboard: https://mui.com/store/items/berry-react-material-admin/
- Ant Design dashboard template: https://github.com/design-sparx/antd-multipurpose-dashboard
- Ant Design enterprise docs: https://ant.design/components/overview
- CoreUI free React: https://coreui.io/react/
- Tabler site: https://tabler.io
- Metronic: https://keenthemes.com/metronic
- Metronic demo: https://preview.keenthemes.com/metronic8/demo53/
- AdminMart MUI templates: https://adminmart.com/templates/material-ui
- shadcn dashboard example: https://ui.shadcn.com/examples/dashboard
- Horizon shadcn dashboard: https://horizon-ui.com/shadcn-ui

### Charts and Data

- ApexCharts docs: https://apexcharts.com/docs/
- ApexCharts demos: https://apexcharts.com/javascript-chart-demos/
- ApexCharts installation: https://apexcharts.com/docs/installation/
- ECharts handbook: https://echarts.apache.org/handbook/en/get-started/
- Recharts getting started: https://recharts.org/en-US/guide/getting-started
- Recharts API: https://recharts.org/en-US/api
- ApexCharts repo: https://github.com/apexcharts/apexcharts.js
- ECharts repo: https://github.com/apache/echarts

### Inspiration Sources

- Dribbble project management: https://dribbble.com/search/project-management-system
- Dribbble employee management: https://dribbble.com/search/employee-management
- Dribbble team PM shot: https://dribbble.com/shots/26702159-Team-Project-Management-Software-UI-UX-Design-Workplace
- Behance project management UI: https://www.behance.net/search/projects/project%20management%20ui
- Behance employee management: https://www.behance.net/search/projects/employee%20management
- Behance SaaS project management: https://www.behance.net/search/projects/digital%20marquee%20project%20management
- Muzli dashboard inspiration: https://muz.li/inspiration/dashboard-inspiration/
- Muzli dashboard examples: https://muz.li/blog/best-dashboard-design-examples-inspirations-for-2026/
- Dashboard design concepts: https://design4users.com/dashboard-design-concepts/

### Enterprise UX Rules

- Show the why behind every score.
- Keep the interface management-first.
- Never make the user pay an administrative tax for intelligence.
- Prioritize scalability, accessibility, keyboard support, high contrast, readable type, and safe dense-data patterns.
- Use progressive disclosure.
- Keep dense tables readable.
- Make every critical workflow reachable in two clicks.
- Attach explanations to every metric.

### What To Build From This

- Dark command-center dashboard
- Left navigation rail
- Top command palette
- Central work surface
- Right-side contextual drawer
- Dense polished data cards
- Capacity heatmap
- Employee profile
- Project detail
- Project board
- Executive dashboard
- Risk register
- Decision registry
- Search and command palette

### Final Direction For Claude

Do not produce generic React code. Synthesize glassmorphic inputs from AlignUI, bento-grid layouts from Magic UI, and animated data charts from EvilCharts. Cross-reference Pragmatic Drag and Drop with Framer Motion layout animations to build a sub-50ms React architecture for the Resource Manager's Kanban/Heatmap view. Use pure Tailwind CSS for styling and generate exact Next.js 14 App Router component files.