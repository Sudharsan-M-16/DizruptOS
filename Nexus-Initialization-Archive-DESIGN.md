---
version: "alpha"
name: "Nexus Initialization // Archive"
description: "Nexus Initialization Dashboard Section is designed for demonstrating application workflows and interface hierarchy. Key features include clear information density, modular panels, and interface rhythm. It is suitable for product showcases, admin panels, and analytics experiences."
colors:
  primary: "#0F172A"
  secondary: "#8B5CF6"
  tertiary: "#94A3B8"
  neutral: "#F8FAFC"
  background: "#05060A"
  surface: "#0F172A"
  text-primary: "#94A3B8"
  text-secondary: "#A78BFA"
  border: "#8B5CF6"
  accent: "#0F172A"
typography:
  display-lg:
    fontFamily: "Space Grotesk"
    fontSize: "128px"
    fontWeight: 500
    lineHeight: "128px"
    letterSpacing: "-0.085em"
    textTransform: "uppercase"
  body-md:
    fontFamily: "IBM Plex Mono"
    fontSize: "12px"
    fontWeight: 500
    lineHeight: "16px"
    letterSpacing: "0.22em"
    textTransform: "uppercase"
spacing:
  base: "4px"
  sm: "0.75px"
  md: "4px"
  lg: "10px"
  xl: "12.63px"
  gap: "8px"
  card-padding: "48px"
  section-padding: "48px"
---

## Overview

- **Composition cues:**
  - Layout: Grid
  - Content Width: Full Bleed
  - Framing: Glassy
  - Grid: Strong

## Colors

The color system uses light mode with #0F172A as the main accent and #F8FAFC as the neutral foundation.

- **Primary (#0F172A):** Main accent and emphasis color.
- **Secondary (#8B5CF6):** Supporting accent for secondary emphasis.
- **Tertiary (#94A3B8):** Reserved accent for supporting contrast moments.
- **Neutral (#F8FAFC):** Neutral foundation for backgrounds, surfaces, and supporting chrome.

- **Usage:** Background: #05060A; Surface: #0F172A; Text Primary: #94A3B8; Text Secondary: #A78BFA; Border: #8B5CF6; Accent: #0F172A

## Typography

Typography pairs Space Grotesk for display hierarchy with IBM Plex Mono for supporting content and interface copy.

- **Display (`display-lg`):** Space Grotesk, 128px, weight 500, line-height 128px, letter-spacing -0.085em, uppercase.
- **Body (`body-md`):** IBM Plex Mono, 12px, weight 500, line-height 16px, letter-spacing 0.22em, uppercase.

## Layout

Layout follows a grid composition with reusable spacing tokens. Preserve the grid, full bleed structural frame before changing ornament or component styling. Use 4px as the base rhythm and let larger gaps step up from that cadence instead of introducing unrelated spacing values.

Treat the page as a grid / full bleed composition, and keep that framing stable when adding or remixing sections.

- **Layout type:** Grid
- **Content width:** Full Bleed
- **Base unit:** 4px
- **Scale:** 0.75px, 4px, 10px, 12.63px, 16px, 20px, 24px, 28px
- **Section padding:** 48px, 160px
- **Card padding:** 48px
- **Gaps:** 8px, 12px, 16px, 32px

## Elevation & Depth

Depth is communicated through glass, border contrast, and reusable shadow or blur treatments. Keep those recipes consistent across hero panels, cards, and controls so the page reads as one material system.

Surfaces should read as glass first, with borders, shadows, and blur only reinforcing that material choice.

- **Surface style:** Glass
- **Borders:** 0.82px #8B5CF6
- **Shadows:** rgba(139, 92, 246, 0.18) 0px 0px 24px 0px, rgba(34, 211, 238, 0.08) 0px 0px 60px 0px, rgba(255, 255, 255, 0.08) 0px 1px 0px 0px inset; rgba(0, 0, 0, 0) 0px 0px 0px 0px, rgba(0, 0, 0, 0) 0px 0px 0px 0px, rgba(139, 92, 246, 0.08) 0px 0px 24px 0px
- **Blur:** 14px

### Techniques
- **Gradient border shell:** Use a thin gradient border shell around the main card. Wrap the surface in an outer shell with 0.75px padding and a 2px radius. Drive the shell with linear-gradient(to right bottom, rgba(139, 92, 246, 0.5), rgba(34, 211, 238, 0.2)) so the edge reads like premium depth instead of a flat stroke. Keep the actual stroke understated so the gradient shell remains the hero edge treatment. Inset the real content surface inside the wrapper with a slightly smaller radius so the gradient only appears as a hairline frame.

## Shapes

Shapes rely on a tight radius system anchored by 1.25px and scaled across cards, buttons, and supporting surfaces. Icon geometry should stay compatible with that soft-to-controlled silhouette.

Use the radius family intentionally: larger surfaces can open up, but controls and badges should stay within the same rounded DNA instead of inventing sharper or pill-only exceptions.

- **Corner radii:** 1.25px, 2px, 9999px
- **Icon treatment:** Linear
- **Icon sets:** Solar

## Components

Component styling should inherit the shared button, icon, spacing, and surface rules instead of inventing one-off treatments. Favor a small family of repeatable patterns for actions, content containers, and fields.

### Iconography
- **Treatment:** Linear.
- **Sets:** Solar.

## Do's and Don'ts

Use these constraints to keep future generations aligned with the current system instead of drifting into adjacent styles.

### Do
- Do use the primary palette as the main accent for emphasis and action states.
- Do keep spacing aligned to the detected 4px rhythm.
- Do reuse the Glass surface treatment consistently across cards and controls.
- Do keep corner radii within the detected 1.25px, 2px, 9999px family.

### Don't
- Don't introduce extra accent colors outside the core palette roles unless the page needs a new semantic state.
- Don't mix unrelated shadow or blur recipes that break the current depth system.
- Don't exceed the detected moderate motion intensity without a deliberate reason.

## Motion

Motion feels controlled and interface-led across text, layout, and section transitions. Timing clusters around 300ms. Easing favors ease and cubic-bezier(0.4. Hover behavior focuses on transform changes. Scroll choreography uses GSAP ScrollTrigger and Parallax for section reveals and pacing.

**Motion Level:** moderate

**Durations:** 300ms

**Easings:** ease, cubic-bezier(0.4, 0, 0.2, 1)

**Hover Patterns:** transform

**Scroll Patterns:** gsap-scrolltrigger, parallax

## WebGL

Reconstruct the graphics as a full-bleed background field using webgl, custom shaders. The effect should read as technical, meditative, and atmospheric: dot-matrix particle field with black and sparse spacing. Build it from dot particles + soft depth fade so the effect reads clearly. Animate it as slow breathing pulse. Interaction can react to the pointer, but only as a subtle drift. Preserve dom fallback.

**Id:** webgl

**Label:** WebGL

**Stack:** WebGL

**Insights:**
  - **Scene:**
    - **Value:** Full-bleed background field
  - **Effect:**
    - **Value:** Dot-matrix particle field
  - **Primitives:**
    - **Value:** Dot particles + soft depth fade
  - **Motion:**
    - **Value:** Slow breathing pulse
  - **Interaction:**
    - **Value:** Pointer-reactive drift
  - **Render:**
    - **Value:** WebGL, custom shaders

**Techniques:** Dot matrix, Breathing pulse, Pointer parallax, Shader gradients, Noise fields

**Code Evidence:**
  - **HTML reference:**
    - **Language:** html
    - **Snippet:**
      ```html
      <!-- WebGL Laser Beam Canvas -->
      <canvas id="laser-canvas" class="absolute inset-0 w-full h-full mix-blend-screen opacity-90"></canvas>

      <!-- Parallax Halftone Dot Overlay -->
      ```
  - **JS reference:**
    - **Language:** js
    - **Snippet:**
      ```
      // ---------------------------------------------------------
      // 1. WebGL Laser Shader System
      // ---------------------------------------------------------
      const canvas = document.getElementById('laser-canvas');
      const gl = canvas.getContext('webgl') || canvas.getContext('experimental-webgl');

      if (gl) {
          const vsSource = `
      …
      ```
  - **Draw call:**
    - **Language:** js
    - **Snippet:**
      ```
      `;

      const fsSource = `
          precision highp float;
          uniform vec2 u_resolution;
          uniform float u_time;

          float random(vec2 st) {
      …
      ```
