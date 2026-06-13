"use client";

// ChromaField — the koki-kiko festival engine. A fullscreen Three.js shader
// paints enormous overlapping gradient discs that drift, breathe, and lean
// toward the cursor. Palette is the product's own physics: volt green
// (healthy), cyan (signal), ultramarine (depth), amber (hot), vermilion
// (overload) — so the poster IS the capacity map, abstracted.
//
// One quad, one fragment shader, zero geometry churn. Pauses when the tab
// hides or the canvas scrolls out; honors prefers-reduced-motion by freezing
// time (the composition still renders — it just doesn't drift).

import * as React from "react";
import * as THREE from "three";

const FRAG = /* glsl */ `
precision highp float;

uniform vec2 uRes;
uniform float uTime;
uniform vec2 uMouse;
uniform float uIntensity;

// brand palette as vivid light
const vec3 VOLT  = vec3(0.000, 0.929, 0.510);  // #00ED82
const vec3 CYAN  = vec3(0.169, 0.851, 1.000);  // #2BD9FF
const vec3 ULTRA = vec3(0.106, 0.302, 1.000);  // ultramarine
const vec3 AMBER = vec3(0.961, 0.620, 0.043);  // #F59E0B
const vec3 VERM  = vec3(0.937, 0.267, 0.267);  // #EF4444
const vec3 INK   = vec3(0.031, 0.035, 0.039);  // #08090A

// soft-edged disc: 1 inside, feathered rim
float disc(vec2 p, vec2 c, float r) {
  float d = length(p - c);
  return 1.0 - smoothstep(r * 0.55, r, d);
}

void main() {
  vec2 uv = gl_FragCoord.xy / uRes.xy;
  vec2 p = uv;
  p.x *= uRes.x / uRes.y;        // aspect-correct space
  float t = uTime * 0.05;
  vec2 m = (uMouse - 0.5) * 0.14; // cursor parallax

  vec3 col = INK;

  // each disc drifts on its own slow lissajous orbit
  vec2 c1 = vec2(0.95 + 0.22 * sin(t * 1.10), 0.62 + 0.18 * cos(t * 0.90)) + m * 1.4;
  vec2 c2 = vec2(1.45 + 0.26 * cos(t * 0.70), 0.30 + 0.20 * sin(t * 1.30)) + m * 1.0;
  vec2 c3 = vec2(1.30 + 0.20 * sin(t * 1.70), 0.85 + 0.16 * cos(t * 1.10)) + m * 0.7;
  vec2 c4 = vec2(0.55 + 0.18 * cos(t * 1.30), 0.18 + 0.14 * sin(t * 0.80)) + m * 1.8;
  vec2 c5 = vec2(1.75 + 0.16 * sin(t * 0.90), 0.62 + 0.22 * cos(t * 1.50)) + m * 0.5;
  vec2 c6 = vec2(0.25 + 0.20 * sin(t * 0.60), 0.78 + 0.16 * sin(t * 1.20)) + m * 1.1;

  // breathing radii
  float r1 = 0.52 + 0.05 * sin(t * 2.0);
  float r2 = 0.62 + 0.06 * cos(t * 1.6);
  float r3 = 0.40 + 0.04 * sin(t * 2.4);
  float r4 = 0.36 + 0.05 * cos(t * 1.9);
  float r5 = 0.46 + 0.05 * sin(t * 1.3);
  float r6 = 0.34 + 0.04 * cos(t * 2.2);

  // additive light mixing — overlaps bloom like stage gels
  col += VOLT  * disc(p, c1, r1) * 0.85;
  col += ULTRA * disc(p, c2, r2) * 0.90;
  col += CYAN  * disc(p, c3, r3) * 0.65;
  col += AMBER * disc(p, c4, r4) * 0.55;
  col += VERM  * disc(p, c5, r5) * 0.45;
  col += VOLT  * disc(p, c6, r6) * 0.35;

  // tame the blowout, keep the saturation
  col = col / (1.0 + col * 0.45);
  col *= uIntensity;

  // vignette toward the ink so type zones stay legible
  float vig = smoothstep(1.25, 0.35, length(uv - vec2(0.42, 0.5)));
  col = mix(INK, col, clamp(vig + 0.55, 0.0, 1.0));

  // film grain
  float g = fract(sin(dot(gl_FragCoord.xy, vec2(12.9898, 78.233)) + uTime) * 43758.5453);
  col += (g - 0.5) * 0.028;

  gl_FragColor = vec4(col, 1.0);
}
`;

const VERT = /* glsl */ `
void main() { gl_Position = vec4(position, 1.0); }
`;

export function ChromaField({
  className,
  intensity = 1,
}: {
  className?: string;
  intensity?: number;
}) {
  const ref = React.useRef<HTMLCanvasElement>(null);

  React.useEffect(() => {
    const canvas = ref.current;
    if (!canvas) return;

    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const renderer = new THREE.WebGLRenderer({
      canvas,
      antialias: false,
      powerPreference: "high-performance",
    });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.5));

    const scene = new THREE.Scene();
    const camera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1);
    const uniforms = {
      uRes: { value: new THREE.Vector2(1, 1) },
      uTime: { value: 0 },
      uMouse: { value: new THREE.Vector2(0.5, 0.5) },
      uIntensity: { value: intensity },
    };
    const quad = new THREE.Mesh(
      new THREE.PlaneGeometry(2, 2),
      new THREE.ShaderMaterial({ fragmentShader: FRAG, vertexShader: VERT, uniforms })
    );
    scene.add(quad);

    const resize = () => {
      const { clientWidth: w, clientHeight: h } = canvas;
      renderer.setSize(w, h, false);
      uniforms.uRes.value.set(w * renderer.getPixelRatio(), h * renderer.getPixelRatio());
    };
    resize();
    const ro = new ResizeObserver(resize);
    ro.observe(canvas);

    // eased cursor follow
    const target = new THREE.Vector2(0.5, 0.5);
    const onMove = (e: PointerEvent) => {
      target.set(e.clientX / window.innerWidth, 1 - e.clientY / window.innerHeight);
    };
    window.addEventListener("pointermove", onMove, { passive: true });

    let visible = true;
    const io = new IntersectionObserver(([en]) => (visible = en.isIntersecting));
    io.observe(canvas);

    let raf = 0;
    const t0 = performance.now();
    const loop = () => {
      raf = requestAnimationFrame(loop);
      if (!visible || document.hidden) return;
      if (!reduced) uniforms.uTime.value = (performance.now() - t0) / 1000;
      uniforms.uMouse.value.lerp(target, 0.05);
      renderer.render(scene, camera);
    };
    loop();

    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("pointermove", onMove);
      ro.disconnect();
      io.disconnect();
      quad.geometry.dispose();
      (quad.material as THREE.Material).dispose();
      renderer.dispose();
    };
  }, [intensity]);

  return <canvas ref={ref} className={className} aria-hidden />;
}
