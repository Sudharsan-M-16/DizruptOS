---
version: "alpha"
name: "Vortex — Data Topography"
description: "Vortex Data Dashboard Section is designed for demonstrating application workflows and interface hierarchy. Key features include clear information density, modular panels, and interface rhythm. It is suitable for product showcases, admin panels, and analytics experiences."
colors:
  primary: "#BDDB72"
  secondary: "#7EDFD2"
  tertiary: "#FFDEA0"
  neutral: "#F2EEE5"
  background: "#07090B"
  surface: "#F2EEE5"
  text-primary: "#F2EEE5"
  text-secondary: "#FFF8EC"
  border: "#F2EEE5"
  accent: "#BDDB72"
typography:
  display-lg:
    fontFamily: "Bricolage Grotesque"
    fontSize: "93.8172px"
    fontWeight: 400
    lineHeight: "80.6828px"
    letterSpacing: "-0.075em"
  body-md:
    fontFamily: "Geist"
    fontSize: "12px"
    fontWeight: 400
    lineHeight: "17.76px"
  label-md:
    fontFamily: "Geist"
    fontSize: "13px"
    fontWeight: 720
    lineHeight: "19.5px"
    letterSpacing: "-0.13px"
rounded:
  md: "0px"
  full: "999px"
spacing:
  base: "7px"
  sm: "1px"
  md: "3.75px"
  lg: "7px"
  xl: "8px"
  gap: "8px"
  card-padding: "9.5px"
  section-padding: "28px"
components:
  button-primary:
    textColor: "{colors.text-secondary}"
    typography: "{typography.label-md}"
    rounded: "{rounded.full}"
    padding: "0px"
  button-link:
    textColor: "{colors.neutral}"
    rounded: "{rounded.md}"
    padding: "0px"
  card:
    rounded: "24px"
    padding: "18px"
---

## Overview

- **Composition cues:**
  - Layout: Grid
  - Content Width: Full Bleed
  - Framing: Glassy
  - Grid: Strong

## Colors

The color system uses light mode with #BDDB72 as the main accent and #F2EEE5 as the neutral foundation.

- **Primary (#BDDB72):** Main accent and emphasis color.
- **Secondary (#7EDFD2):** Supporting accent for secondary emphasis.
- **Tertiary (#FFDEA0):** Reserved accent for supporting contrast moments.
- **Neutral (#F2EEE5):** Neutral foundation for backgrounds, surfaces, and supporting chrome.

- **Usage:** Background: #07090B; Surface: #F2EEE5; Text Primary: #F2EEE5; Text Secondary: #FFF8EC; Border: #F2EEE5; Accent: #BDDB72

## Typography

Typography pairs Bricolage Grotesque for display hierarchy with Geist for supporting content and interface copy.

- **Display (`display-lg`):** Bricolage Grotesque, 93.8172px, weight 400, line-height 80.6828px, letter-spacing -0.075em.
- **Body (`body-md`):** Geist, 12px, weight 400, line-height 17.76px.
- **Labels (`label-md`):** Geist, 13px, weight 720, line-height 19.5px, letter-spacing -0.13px.

## Layout

Layout follows a grid composition with reusable spacing tokens. Preserve the grid, full bleed structural frame before changing ornament or component styling. Use 7px as the base rhythm and let larger gaps step up from that cadence instead of introducing unrelated spacing values.

Treat the page as a grid / full bleed composition, and keep that framing stable when adding or remixing sections.

- **Layout type:** Grid
- **Content width:** Full Bleed
- **Base unit:** 7px
- **Scale:** 1px, 3.75px, 7px, 8px, 9px, 11px, 12px, 15px
- **Section padding:** 28px, 32px, 56px
- **Card padding:** 9.5px, 16px, 18px, 28px
- **Gaps:** 8px, 10px, 12px, 13px

## Elevation & Depth

Depth is communicated through glass, border contrast, and reusable shadow or blur treatments. Keep those recipes consistent across hero panels, cards, and controls so the page reads as one material system.

Surfaces should read as glass first, with borders, shadows, and blur only reinforcing that material choice.

- **Surface style:** Glass
- **Borders:** 0.82px #F2EEE5; 0.82px #FFDEA0
- **Shadows:** rgba(255, 255, 255, 0.06) 0px 1px 0px 0px inset, rgba(0, 0, 0, 0.18) 0px 18px 48px 0px; rgba(255, 255, 255, 0.055) 0px 1px 0px 0px inset; rgba(245, 168, 75, 0.035) 0px 0px 120px 0px inset
- **Blur:** 20px, 18px, 16px

### Techniques
- **Gradient border shell:** Use a thin gradient border shell around the main card. Wrap the surface in an outer shell with 1px padding and a 34px radius. Drive the shell with linear-gradient(rgba(242, 238, 229, 0.2), rgba(242, 238, 229, 0.035) 50%, rgba(245, 168, 75, 0.14)) so the edge reads like premium depth instead of a flat stroke. Keep the actual stroke understated so the gradient shell remains the hero edge treatment. Inset the real content surface inside the wrapper with a slightly smaller radius so the gradient only appears as a hairline frame.

## Shapes

Shapes rely on a tight radius system anchored by 13px and scaled across cards, buttons, and supporting surfaces. Icon geometry should stay compatible with that soft-to-controlled silhouette.

Use the radius family intentionally: larger surfaces can open up, but controls and badges should stay within the same rounded DNA instead of inventing sharper or pill-only exceptions.

- **Corner radii:** 13px, 14px, 18px, 24px, 999px
- **Icon treatment:** Linear
- **Icon sets:** Solar

## Components

Anchor interactions to the detected button styles. Reuse the existing card surface recipe for content blocks.

### Buttons
- **Primary:** text #FFF8EC, radius 999px, padding 0px, border 0px solid rgb(229, 231, 235).
- **Links:** text #F2EEE5, radius 0px, padding 0px, border 0px solid rgb(229, 231, 235).

### Cards and Surfaces
- **Card surface:** background rgba(7, 9, 11, 0.54), border 0.819672px solid rgba(242, 238, 229, 0.094), radius 24px, padding 18px, shadow rgba(255, 255, 255, 0.06) 0px 1px 0px 0px inset, rgba(0, 0, 0, 0.18) 0px 18px 48px 0px, blur 20px.
- **Card surface:** background rgba(242, 238, 229, 0.035), border 0.819672px solid rgba(242, 238, 229, 0.08), radius 18px, padding 16px, shadow none.

### Iconography
- **Treatment:** Linear.
- **Sets:** Solar.

## Do's and Don'ts

Use these constraints to keep future generations aligned with the current system instead of drifting into adjacent styles.

### Do
- Do use the primary palette as the main accent for emphasis and action states.
- Do keep spacing aligned to the detected 7px rhythm.
- Do reuse the Glass surface treatment consistently across cards and controls.
- Do keep corner radii within the detected 13px, 14px, 18px, 24px, 999px family.

### Don't
- Don't introduce extra accent colors outside the core palette roles unless the page needs a new semantic state.
- Don't mix unrelated shadow or blur recipes that break the current depth system.
- Don't exceed the detected minimal motion intensity without a deliberate reason.

## Motion

Motion stays restrained and interface-led across text, layout, and scroll transitions. Timing clusters around 0ms. Easing favors ease and cubic-bezier(0.16.

**Motion Level:** minimal

**Durations:** 0ms

**Easings:** ease, cubic-bezier(0.16, 1, 0.3, 1), ease-in-out

## WebGL

Reconstruct the graphics as a full-bleed background field using webgl, renderer, antialias, dpr clamp, custom shaders. The effect should read as retro-futurist, technical, and meditative: perspective grid field with green on black and sparse spacing. Build it from grid lines + depth fade so the effect reads clearly. Animate it as slow breathing pulse. Interaction can react to the pointer, but only as a subtle drift. Preserve reduced motion + dom fallback.

**Id:** webgl

**Label:** WebGL

**Stack:** ThreeJS, WebGL

**Insights:**
  - **Scene:**
    - **Value:** Full-bleed background field
  - **Effect:**
    - **Value:** Perspective grid field
  - **Primitives:**
    - **Value:** Grid lines + depth fade
  - **Motion:**
    - **Value:** Slow breathing pulse
  - **Interaction:**
    - **Value:** Pointer-reactive drift
  - **Render:**
    - **Value:** WebGL, Renderer, antialias, DPR clamp, custom shaders

**Techniques:** Perspective grid, Breathing pulse, Pointer parallax, Shader gradients, Noise fields

**Code Evidence:**
  - **HTML reference:**
    - **Language:** html
    - **Snippet:**
      ```html
      <body>
        <canvas id="webgl-canvas" aria-hidden="true"></canvas>
        <div class="bg-layer" aria-hidden="true"></div>
        <div class="noise" aria-hidden="true"></div>
      ```
  - **JS reference:**
    - **Language:** js
    - **Snippet:**
      ```
      "three": "https://unpkg.com/three@0.160.0/build/three.module.js",
          "three/addons/": "https://unpkg.com/three@0.160.0/examples/jsm/"
        }
      }

      import * as THREE from "three";
      import { EffectComposer } from "three/addons/postprocessing/EffectComposer.js";
      import { RenderPass } from "three/addons/postprocessing/RenderPass.js";
      …
      ```
  - **Interaction hook:**
    - **Language:** js
    - **Snippet:**
      ```
      const trailObjects = [];
      const trailMaterials = [];

      const pointer = new THREE.Vector2(0, 0);
      const easedPointer = new THREE.Vector2(0, 0);
      …
      ```
  - **Scene setup:**
    - **Language:** js
    - **Snippet:**
      ```json
      {
        "imports": {
          "three": "https://unpkg.com/three@0.160.0/build/three.module.js",
          "three/addons/": "https://unpkg.com/three@0.160.0/examples/jsm/"
        }
      }
      ```

## ThreeJS

Reconstruct the Three.js layer as a full-bleed background field with layered spatial depth that feels retro-futurist and technical. Use antialias, tone mapping, dpr clamp renderer settings, perspective, ~54deg fov, plane + custom buffer geometry geometry, shadermaterial + meshbasicmaterial materials, and ambient + key + rim lighting. Motion should read as slow orbital drift, with reduced motion + non-3d fallback.

**Id:** threejs

**Label:** ThreeJS

**Stack:** ThreeJS, WebGL

**Insights:**
  - **Scene:**
    - **Value:** Full-bleed background field with layered spatial depth
  - **Render:**
    - **Value:** antialias, tone mapping, DPR clamp
  - **Camera:**
    - **Value:** Perspective, ~54deg FOV
  - **Lighting:**
    - **Value:** ambient + key + rim
  - **Materials:**
    - **Value:** ShaderMaterial + MeshBasicMaterial
  - **Geometry:**
    - **Value:** plane + custom buffer geometry
  - **Motion:**
    - **Value:** Slow orbital drift

**Techniques:** Shader materials, Bloom shaping, Timeline beats, antialias, tone mapping, DPR clamp, Reduced motion + non-3D fallback

**Code Evidence:**
  - **HTML reference:**
    - **Language:** html
    - **Snippet:**
      ```html
      <body>
        <canvas id="webgl-canvas" aria-hidden="true"></canvas>
        <div class="bg-layer" aria-hidden="true"></div>
        <div class="noise" aria-hidden="true"></div>
      ```
  - **JS reference:**
    - **Language:** js
    - **Snippet:**
      ```
      "three": "https://unpkg.com/three@0.160.0/build/three.module.js",
          "three/addons/": "https://unpkg.com/three@0.160.0/examples/jsm/"
        }
      }

      import * as THREE from "three";
      import { EffectComposer } from "three/addons/postprocessing/EffectComposer.js";
      import { RenderPass } from "three/addons/postprocessing/RenderPass.js";
      …
      ```
  - **Interaction hook:**
    - **Language:** js
    - **Snippet:**
      ```
      const trailObjects = [];
      const trailMaterials = [];

      const pointer = new THREE.Vector2(0, 0);
      const easedPointer = new THREE.Vector2(0, 0);
      …
      ```
  - **Scene setup:**
    - **Language:** js
    - **Snippet:**
      ```json
      {
        "imports": {
          "three": "https://unpkg.com/three@0.160.0/build/three.module.js",
          "three/addons/": "https://unpkg.com/three@0.160.0/examples/jsm/"
        }
      }
      ```
