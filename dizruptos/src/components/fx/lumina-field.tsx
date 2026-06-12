"use client";

// LUMINA FIELD — engineered depth. A full-bleed fragment-shader plane:
// domain-warped fbm noise folded into silk ribbons of abyssal teal, flowing
// like fabric caught in a deep current. The left half stays near-black so
// display type reads; the right half carries the bright emerald silk.
//
// Engineering constraints:
//  · Orthographic camera + single full-screen plane, one draw call
//  · DPR clamped at 1.5 (full-screen fragment work is the cost center)
//  · Slow time base (×0.04) — meditative, never busy
//  · Pointer drift eased at 2.5%/frame; pauses when the tab is hidden
//  · prefers-reduced-motion → one static frame (a poster, not a void)

import * as React from "react";
import * as THREE from "three";

const VERT = /* glsl */ `
  void main() { gl_Position = vec4(position, 1.0); }
`;

const FRAG = /* glsl */ `
  precision highp float;
  uniform vec2 uRes;
  uniform float uTime;
  uniform vec2 uPointer;

  // -- value noise + fbm ----------------------------------------------------
  float hash(vec2 p) {
    return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453123);
  }
  float noise(vec2 p) {
    vec2 i = floor(p);
    vec2 f = fract(p);
    vec2 u = f * f * (3.0 - 2.0 * f);
    return mix(
      mix(hash(i), hash(i + vec2(1.0, 0.0)), u.x),
      mix(hash(i + vec2(0.0, 1.0)), hash(i + vec2(1.0, 1.0)), u.x),
      u.y
    );
  }
  float fbm(vec2 p) {
    float v = 0.0;
    float a = 0.5;
    mat2 rot = mat2(0.8, 0.6, -0.6, 0.8);
    for (int i = 0; i < 5; i++) {
      v += a * noise(p);
      p = rot * p * 2.02;
      a *= 0.5;
    }
    return v;
  }

  void main() {
    vec2 uv = gl_FragCoord.xy / uRes.xy;
    vec2 p = uv;
    p.x *= uRes.x / uRes.y;

    // visible current: the silk must clearly FLOW, not just shimmer
    float t = uTime * 0.13;

    // pointer drift — the whole field leans
    p += uPointer * 0.1;

    // -- domain warp: q warps r warps the final field (iq technique) --------
    vec2 q = vec2(
      fbm(p * 1.4 + vec2(0.0, t)),
      fbm(p * 1.4 + vec2(5.2, 1.3) - vec2(t * 0.7, 0.0))
    );
    vec2 r = vec2(
      fbm(p * 1.4 + 2.6 * q + vec2(1.7, 9.2) + t * 0.5),
      fbm(p * 1.4 + 2.6 * q + vec2(8.3, 2.8) - t * 0.3)
    );
    float f = fbm(p * 1.4 + 2.2 * r);

    // -- fold the field into silk ribbons -----------------------------------
    // sharp sin bands over the warped coordinate read as fabric folds
    // the bands themselves travel (− t term): folds visibly slide diagonally
    float ribbon = 0.5 + 0.5 * sin((f * 6.0 + r.x * 4.0 - p.x * 1.5) * 2.4 - uTime * 0.22);
    ribbon = pow(ribbon, 2.4);

    // sheen: tighter highlight running the folds, on its own faster clock
    float sheen = 0.5 + 0.5 * sin((f * 9.0 + q.y * 5.0) * 3.0 + 1.7 + uTime * 0.35);
    sheen = pow(sheen, 8.0);

    // -- palette: abyss -> deep teal -> emerald silk -> white-hot sheen ------
    vec3 abyss   = vec3(0.008, 0.043, 0.039); // #02110A-ish
    vec3 deep    = vec3(0.035, 0.18, 0.155);  // deep sea teal
    vec3 silk    = vec3(0.066, 0.55, 0.43);   // emerald body
    vec3 bright  = vec3(0.176, 0.886, 0.773); // #2DE2C5
    vec3 blueTint= vec3(0.184, 0.52, 0.918);  // #2F85EA shadow tint

    vec3 col = abyss;
    col = mix(col, deep, smoothstep(0.1, 0.65, f));
    col = mix(col, silk, ribbon * smoothstep(0.12, 0.8, f) * 1.15);
    col += bright * sheen * ribbon * 1.4;
    col += silk * ribbon * 0.35; // ambient fill so folds never go muddy
    // cool blue breath in the troughs
    col = mix(col, col * 0.7 + blueTint * 0.12, smoothstep(0.6, 0.0, ribbon) * 0.3);

    // -- composition: near-black left third for type, radiant right ---------
    float lightside = smoothstep(0.12, 0.72, uv.x);
    col *= mix(0.14, 1.45, lightside);

    // vignette + perceptible global breath (~12s cycle)
    float vig = 1.0 - 0.35 * length(uv - vec2(0.66, 0.5));
    col *= vig * (0.9 + 0.1 * sin(uTime * 0.5));
    // gentle filmic rolloff so the sheen blooms instead of clipping
    col = col / (1.0 + col * 0.35);

    gl_FragColor = vec4(col, 1.0);
  }
`;

export function LuminaField({ className }: { className?: string }) {
  const mountRef = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    const mount = mountRef.current;
    if (!mount) return;

    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    const scene = new THREE.Scene();
    const camera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1);

    const renderer = new THREE.WebGLRenderer({
      antialias: false,
      powerPreference: "low-power",
    });
    const dpr = Math.min(window.devicePixelRatio, 1.5);
    renderer.setPixelRatio(dpr);

    const size = () => ({
      w: mount.clientWidth || window.innerWidth,
      h: mount.clientHeight || window.innerHeight,
    });
    renderer.setSize(size().w, size().h);
    mount.appendChild(renderer.domElement);

    const uniforms = {
      uTime: { value: 0 },
      uRes: { value: new THREE.Vector2(size().w * dpr, size().h * dpr) },
      uPointer: { value: new THREE.Vector2(0, 0) },
    };

    const mat = new THREE.ShaderMaterial({
      vertexShader: VERT,
      fragmentShader: FRAG,
      uniforms,
      depthWrite: false,
      depthTest: false,
    });
    scene.add(new THREE.Mesh(new THREE.PlaneGeometry(2, 2), mat));

    const target = new THREE.Vector2(0, 0);
    const onPointer = (e: PointerEvent) => {
      target.set(
        (e.clientX / window.innerWidth - 0.5) * 2,
        (e.clientY / window.innerHeight - 0.5) * 2
      );
    };
    window.addEventListener("pointermove", onPointer, { passive: true });

    const onResize = () => {
      renderer.setSize(size().w, size().h);
      uniforms.uRes.value.set(size().w * dpr, size().h * dpr);
    };
    window.addEventListener("resize", onResize);

    let raf = 0;
    let hidden = false;
    const onVisibility = () => {
      hidden = document.hidden;
      if (!hidden && !reduced) loop();
    };
    document.addEventListener("visibilitychange", onVisibility);

    const frame = (t: number) => {
      uniforms.uTime.value = t * 0.001;
      uniforms.uPointer.value.lerp(target, 0.025);
      renderer.render(scene, camera);
    };

    const loop = () => {
      if (hidden) return;
      raf = requestAnimationFrame((t) => {
        frame(t);
        loop();
      });
    };

    if (reduced) frame(2000); // poster frame, mid-flow
    else loop();

    return () => {
      cancelAnimationFrame(raf);
      document.removeEventListener("visibilitychange", onVisibility);
      window.removeEventListener("pointermove", onPointer);
      window.removeEventListener("resize", onResize);
      mat.dispose();
      renderer.dispose();
      mount.removeChild(renderer.domElement);
    };
  }, []);

  return (
    <div
      ref={mountRef}
      aria-hidden
      className={className ?? "pointer-events-none fixed inset-0 z-0"}
    />
  );
}

/* ------------------------------ sonar overlay ------------------------------ */
// The instrument layer from the reference: concentric survey rings, a slow
// crosshair rotation, and two pinging contact dots. Pure SVG + CSS.

export function SonarRings({ className }: { className?: string }) {
  return (
    <div aria-hidden className={className}>
      <svg
        viewBox="0 0 600 600"
        className="h-full w-full animate-[spin_48s_linear_infinite]"
        fill="none"
      >
        {[80, 150, 220, 290].map((r) => (
          <circle
            key={r}
            cx="300"
            cy="300"
            r={r}
            stroke="rgba(45,226,197,0.16)"
            strokeWidth="0.8"
          />
        ))}
        <circle cx="300" cy="300" r="220" stroke="rgba(255,255,255,0.07)" strokeWidth="0.6" strokeDasharray="2 8" />
        <line x1="300" y1="10" x2="300" y2="590" stroke="rgba(45,226,197,0.07)" strokeWidth="0.6" />
        <line x1="10" y1="300" x2="590" y2="300" stroke="rgba(45,226,197,0.07)" strokeWidth="0.6" />
      </svg>
      {/* contact pings */}
      {[
        { top: "32%", left: "58%", delay: "0s" },
        { top: "63%", left: "40%", delay: "2.2s" },
      ].map((p, i) => (
        <span key={i} className="absolute" style={{ top: p.top, left: p.left }}>
          <span
            className="absolute inline-flex h-8 w-8 -translate-x-1/2 -translate-y-1/2 animate-ping rounded-full bg-[#2DE2C5] opacity-20"
            style={{ animationDuration: "3.5s", animationDelay: p.delay }}
          />
          <span className="absolute h-2 w-2 -translate-x-1/2 -translate-y-1/2 rounded-full bg-[#2DE2C5] shadow-[0_0_12px_rgba(45,226,197,0.9)]" />
        </span>
      ))}
    </div>
  );
}
