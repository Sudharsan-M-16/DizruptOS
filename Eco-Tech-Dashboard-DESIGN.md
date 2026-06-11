---
version: "alpha"
name: "Eco-Tech Dashboard"
description: "Eco Tech Dashboard Section is designed for demonstrating application workflows and interface hierarchy. Key features include clear information density, modular panels, and interface rhythm. It is suitable for product showcases, admin panels, and analytics experiences."
colors:
  primary: "#A1B887"
  secondary: "#2D3B23"
  tertiary: "#4F663C"
  neutral: "#FFFFFF"
  background: "#FFFFFF"
  surface: "#A1B887"
  text-primary: "#5E6B52"
  text-secondary: "#FFFFFF"
  border: "#B6CC9D"
  accent: "#A1B887"
typography:
  headline-lg:
    fontFamily: "Gloock"
    fontSize: "36px"
    fontWeight: 300
    lineHeight: "40px"
    letterSpacing: "-0.025em"
  body-md:
    fontFamily: "Inter"
    fontSize: "14px"
    fontWeight: 400
    lineHeight: "20px"
  label-md:
    fontFamily: "Inter"
    fontSize: "12px"
    fontWeight: 300
    lineHeight: "15px"
    letterSpacing: "0.3px"
rounded:
  md: "0px"
spacing:
  base: "4px"
  sm: "1px"
  md: "4px"
  lg: "6px"
  xl: "8px"
  gap: "6px"
  card-padding: "9px"
  section-padding: "32px"
components:
  button-link:
    textColor: "{colors.neutral}"
    typography: "{typography.label-md}"
    rounded: "{rounded.md}"
    padding: "0px"
  card:
    backgroundColor: "#0D120D"
    rounded: "31px"
    padding: "32px"
---

## Overview

- **Composition cues:**
  - Layout: Grid
  - Content Width: Full Bleed
  - Framing: Glassy
  - Grid: Strong

## Colors

The color system uses dark mode with #A1B887 as the main accent and #FFFFFF as the neutral foundation.

- **Primary (#A1B887):** Main accent and emphasis color.
- **Secondary (#2D3B23):** Supporting accent for secondary emphasis.
- **Tertiary (#4F663C):** Reserved accent for supporting contrast moments.
- **Neutral (#FFFFFF):** Neutral foundation for backgrounds, surfaces, and supporting chrome.

- **Usage:** Background: #FFFFFF; Surface: #A1B887; Text Primary: #5E6B52; Text Secondary: #FFFFFF; Border: #B6CC9D; Accent: #A1B887

- **Gradients:** bg-gradient-to-b from-white/60 to-white/10, bg-gradient-to-b from-[#4d5744] to-transparent

## Typography

Typography pairs Gloock for display hierarchy with Inter for supporting content and interface copy.

- **Headlines (`headline-lg`):** Gloock, 36px, weight 300, line-height 40px, letter-spacing -0.025em.
- **Body (`body-md`):** Inter, 14px, weight 400, line-height 20px.
- **Labels (`label-md`):** Inter, 12px, weight 300, line-height 15px, letter-spacing 0.3px.

## Layout

Layout follows a grid composition with reusable spacing tokens. Preserve the grid, full bleed structural frame before changing ornament or component styling. Use 4px as the base rhythm and let larger gaps step up from that cadence instead of introducing unrelated spacing values.

Treat the page as a grid / full bleed composition, and keep that framing stable when adding or remixing sections.

- **Layout type:** Grid
- **Content width:** Full Bleed
- **Base unit:** 4px
- **Scale:** 1px, 4px, 6px, 8px, 10px, 12px, 16px, 22.41px
- **Section padding:** 32px
- **Card padding:** 9px, 10px, 14px, 32px
- **Gaps:** 6px, 8px, 12px, 16px

## Elevation & Depth

Depth is communicated through glass, border contrast, and reusable shadow or blur treatments. Keep those recipes consistent across hero panels, cards, and controls so the page reads as one material system.

Surfaces should read as glass first, with borders, shadows, and blur only reinforcing that material choice.

- **Surface style:** Glass
- **Borders:** 0.82px #B6CC9D; 0.82px #2D3B23; 0.82px #E0E3D5; 0.82px #FFFFFF
- **Shadows:** rgba(0, 0, 0, 0) 0px 0px 0px 0px, rgba(0, 0, 0, 0) 0px 0px 0px 0px, rgba(0, 0, 0, 0.1) 0px 2px 3px -1px, rgba(25, 28, 33, 0.02) 0px 1px 0px 0px, rgba(25, 28, 33, 0.08) 0px 0px 0px 1px; rgba(0, 0, 0, 0) 0px 0px 0px 0px, rgba(0, 0, 0, 0) 0px 0px 0px 0px, rgba(0, 0, 0, 0.05) 0px 1px 2px 0px; rgba(0, 0, 0, 0) 0px 0px 0px 0px, rgba(0, 0, 0, 0) 0px 0px 0px 0px, rgba(0, 0, 0, 0.06) 0px 0px 0px 1px, rgba(0, 0, 0, 0.06) 0px 1px 1px -0.5px, rgba(0, 0, 0, 0.06) 0px 3px 3px -1.5px, rgba(0, 0, 0, 0.06) 0px 6px 6px -3px, rgba(0, 0, 0, 0.06) 0px 12px 12px -6px, rgba(0, 0, 0, 0.06) 0px 24px 24px -12px
- **Blur:** 12px

### Techniques
- **Gradient border shell:** Use a thin gradient border shell around the main card. Wrap the surface in an outer shell with 0px padding and a 0px radius. Drive the shell with radial-gradient(circle at 70% 50%, rgba(26, 38, 24, 0.8) 0%, rgb(0, 0, 0) 100%) so the edge reads like premium depth instead of a flat stroke. Keep the actual stroke understated so the gradient shell remains the hero edge treatment. Inset the real content surface inside the wrapper with a slightly smaller radius so the gradient only appears as a hairline frame.

## Shapes

Shapes rely on a tight radius system anchored by 16px and scaled across cards, buttons, and supporting surfaces. Icon geometry should stay compatible with that soft-to-controlled silhouette.

Use the radius family intentionally: larger surfaces can open up, but controls and badges should stay within the same rounded DNA instead of inventing sharper or pill-only exceptions.

- **Corner radii:** 16px, 31px, 32px, 9999px
- **Icon treatment:** Linear
- **Icon sets:** Solar

## Components

Anchor interactions to the detected button styles. Reuse the existing card surface recipe for content blocks.

### Buttons
- **Links:** text #FFFFFF, radius 0px, padding 0px, border 0px solid rgb(229, 231, 235).

### Cards and Surfaces
- **Card surface:** background #0D120D, border 0px solid rgb(229, 231, 235), radius 31px, padding 32px, shadow none.

### Iconography
- **Treatment:** Linear.
- **Sets:** Solar.

## Do's and Don'ts

Use these constraints to keep future generations aligned with the current system instead of drifting into adjacent styles.

### Do
- Do use the primary palette as the main accent for emphasis and action states.
- Do keep spacing aligned to the detected 4px rhythm.
- Do reuse the Glass surface treatment consistently across cards and controls.
- Do keep corner radii within the detected 16px, 31px, 32px, 9999px family.

### Don't
- Don't introduce extra accent colors outside the core palette roles unless the page needs a new semantic state.
- Don't mix unrelated shadow or blur recipes that break the current depth system.
- Don't exceed the detected expressive motion intensity without a deliberate reason.

## Motion

Motion feels expressive but remains focused on interface, text, and layout transitions. Timing clusters around 150ms and 500ms. Easing favors ease and 0. Hover behavior focuses on color and text changes.

**Motion Level:** expressive

**Durations:** 150ms, 500ms, 700ms, 1000ms

**Easings:** ease, 0, 0.2, 1), cubic-bezier(0, cubic-bezier(0.4

**Hover Patterns:** color, text, shadow, underline
