---
version: "alpha"
name: "Ethereal Minimal System"
description: "Ethereal Minimal Testimonial Section is designed for showcasing social proof and customer credibility. Key features include reusable structure, responsive behavior, and production-ready presentation. It is suitable for component libraries and responsive product interfaces."
colors:
  primary: "#4B4BA0"
  secondary: "#18181B"
  tertiary: "#8F47AE"
  neutral: "#18181B"
  background: "#18181B"
  surface: "#27272A"
  text-primary: "#E4E4E7"
  text-secondary: "#71717A"
  border: "#FFFFFF"
  accent: "#4B4BA0"
typography:
  headline-lg:
    fontFamily: "Inter"
    fontSize: "18px"
    fontWeight: 500
    lineHeight: "28px"
    letterSpacing: "-0.025em"
  body-md:
    fontFamily: "Inter"
    fontSize: "12px"
    fontWeight: 400
    lineHeight: "19.5px"
  label-md:
    fontFamily: "Inter"
    fontSize: "12px"
    fontWeight: 500
    lineHeight: "16px"
rounded:
  md: "8px"
spacing:
  base: "8px"
  sm: "2px"
  md: "8px"
  lg: "12px"
  xl: "16px"
  gap: "12px"
  card-padding: "22px"
  section-padding: "24px"
components:
  button-primary:
    backgroundColor: "#F4F4F5"
    textColor: "#000000"
    typography: "{typography.label-md}"
    rounded: "{rounded.md}"
    padding: "8px"
  card:
    rounded: "0px"
    padding: "8px"
---

## Overview

- **Composition cues:**
  - Layout: Grid
  - Content Width: Full Bleed
  - Framing: Glassy
  - Grid: Strong

## Colors

The color system uses dark mode with #4B4BA0 as the main accent and #18181B as the neutral foundation.

- **Primary (#4B4BA0):** Main accent and emphasis color.
- **Secondary (#18181B):** Supporting accent for secondary emphasis.
- **Tertiary (#8F47AE):** Reserved accent for supporting contrast moments.
- **Neutral (#18181B):** Neutral foundation for backgrounds, surfaces, and supporting chrome.

- **Usage:** Background: #18181B; Surface: #27272A; Text Primary: #E4E4E7; Text Secondary: #71717A; Border: #FFFFFF; Accent: #4B4BA0

## Typography

Typography relies on Inter across display, body, and utility text.

- **Headlines (`headline-lg`):** Inter, 18px, weight 500, line-height 28px, letter-spacing -0.025em.
- **Body (`body-md`):** Inter, 12px, weight 400, line-height 19.5px.
- **Labels (`label-md`):** Inter, 12px, weight 500, line-height 16px.

## Layout

Layout follows a grid composition with reusable spacing tokens. Preserve the grid, full bleed structural frame before changing ornament or component styling. Use 8px as the base rhythm and let larger gaps step up from that cadence instead of introducing unrelated spacing values.

Treat the page as a grid / full bleed composition, and keep that framing stable when adding or remixing sections.

- **Layout type:** Grid
- **Content width:** Full Bleed
- **Base unit:** 8px
- **Scale:** 2px, 8px, 12px, 16px, 20px, 24px, 48px
- **Section padding:** 24px, 48px
- **Card padding:** 22px, 24px, 48px
- **Gaps:** 12px, 16px, 32px

## Elevation & Depth

Depth is communicated through glass, border contrast, and reusable shadow or blur treatments. Keep those recipes consistent across hero panels, cards, and controls so the page reads as one material system.

Surfaces should read as glass first, with borders, shadows, and blur only reinforcing that material choice.

- **Surface style:** Glass
- **Borders:** 0.82px #FFFFFF
- **Shadows:** rgba(0, 0, 0, 0) 0px 0px 0px 0px, rgba(0, 0, 0, 0) 0px 0px 0px 0px, rgba(0, 0, 0, 0.05) 0px 1px 2px 0px; rgba(0, 0, 0, 0) 0px 0px 0px 0px, rgba(0, 0, 0, 0) 0px 0px 0px 0px, rgba(0, 0, 0, 0.06) 0px 0px 0px 1px, rgba(0, 0, 0, 0.06) 0px 1px 1px -0.5px, rgba(0, 0, 0, 0.06) 0px 3px 3px -1.5px, rgba(0, 0, 0, 0.06) 0px 6px 6px -3px, rgba(0, 0, 0, 0.06) 0px 12px 12px -6px, rgba(0, 0, 0, 0.06) 0px 24px 24px -12px; rgba(0, 0, 0, 0) 0px 0px 0px 0px, rgba(0, 0, 0, 0) 0px 0px 0px 0px, rgba(0, 0, 0, 0.035) 0px 2.8px 2.2px 0px, rgba(0, 0, 0, 0.047) 0px 6.7px 5.3px 0px, rgba(0, 0, 0, 0.06) 0px 12.5px 10px 0px, rgba(0, 0, 0, 0.07) 0px 22.3px 17.9px 0px, rgba(0, 0, 0, 0.086) 0px 41.8px 33.4px 0px, rgba(0, 0, 0, 0.12) 0px 100px 80px 0px
- **Blur:** 20px

## Shapes

Shapes rely on a tight radius system anchored by 8px and scaled across cards, buttons, and supporting surfaces. Icon geometry should stay compatible with that soft-to-controlled silhouette.

Use the radius family intentionally: larger surfaces can open up, but controls and badges should stay within the same rounded DNA instead of inventing sharper or pill-only exceptions.

- **Corner radii:** 8px, 16px, 9999px
- **Icon treatment:** Linear
- **Icon sets:** Solar

## Components

Anchor interactions to the detected button styles. Reuse the existing card surface recipe for content blocks.

### Buttons
- **Primary:** background #F4F4F5, text #000000, radius 8px, padding 8px, border 0px solid rgb(229, 231, 235).

### Cards and Surfaces
- **Card surface:** radius 0px, padding 8px, shadow none.
- **Card surface:** radius 0px, padding 10px, shadow none.

### Iconography
- **Treatment:** Linear.
- **Sets:** Solar.

## Do's and Don'ts

Use these constraints to keep future generations aligned with the current system instead of drifting into adjacent styles.

### Do
- Do use the primary palette as the main accent for emphasis and action states.
- Do keep spacing aligned to the detected 8px rhythm.
- Do reuse the Glass surface treatment consistently across cards and controls.
- Do keep corner radii within the detected 8px, 16px, 9999px family.

### Don't
- Don't introduce extra accent colors outside the core palette roles unless the page needs a new semantic state.
- Don't mix unrelated shadow or blur recipes that break the current depth system.
- Don't exceed the detected moderate motion intensity without a deliberate reason.

## Motion

Motion feels controlled and interface-led across text, layout, and section transitions. Timing clusters around 150ms and 1000ms. Easing favors ease and 0. Hover behavior focuses on text and color changes.

**Motion Level:** moderate

**Durations:** 150ms, 1000ms

**Easings:** ease, 0, 0.2, 1), cubic-bezier(0.4, cubic-bezier(0

**Hover Patterns:** text, color
