"use client";

// DOT-MATRIX FIELD — a full-bleed WebGL particle plane in slow recession:
// sparse volt dots on abyss black, soft depth fade, a breathing pulse, and a
// pointer-reactive camera drift. Technical, meditative, atmospheric.
//
// Engineering constraints:
//  · Custom ShaderMaterial — pulse and depth fade computed on the GPU
//  · DPR clamped at 1.75; single draw call (THREE.Points)
//  · Pauses when the tab is hidden; destroyed cleanly on unmount
//  · prefers-reduced-motion → one static frame (DOM gradient stays beneath)

import * as React from "react";
import * as THREE from "three";

const COLS = 64;
const ROWS = 36;

const VERT = /* glsl */ `
  uniform float uTime;
  attribute float aPhase;
  varying float vFade;
  void main() {
    vec3 p = position;
    // gentle vertical breath, staggered by phase
    p.y += sin(uTime * 0.6 + aPhase) * 1.2;
    vec4 mv = modelViewMatrix * vec4(p, 1.0);
    float dist = -mv.z;
    // soft depth fade: near dots bright, far dots dissolve
    vFade = smoothstep(220.0, 40.0, dist);
    // breathing pulse on size
    float pulse = 1.0 + 0.35 * sin(uTime * 0.8 + aPhase * 2.0);
    gl_PointSize = (140.0 / dist) * pulse;
    gl_Position = projectionMatrix * mv;
  }
`;

const FRAG = /* glsl */ `
  precision highp float;
  uniform vec3 uColor;
  varying float vFade;
  void main() {
    // round dot with soft edge
    vec2 uv = gl_PointCoord - 0.5;
    float d = length(uv);
    float alpha = smoothstep(0.5, 0.18, d) * vFade * 0.85;
    if (alpha < 0.01) discard;
    gl_FragColor = vec4(uColor, alpha);
  }
`;

export function DotMatrixField({ className }: { className?: string }) {
  const mountRef = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    const mount = mountRef.current;
    if (!mount) return;

    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(
      54,
      mount.clientWidth / mount.clientHeight,
      1,
      400
    );
    camera.position.set(0, 14, 60);

    const renderer = new THREE.WebGLRenderer({
      alpha: true,
      antialias: false,
      powerPreference: "low-power",
    });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.75));
    renderer.setSize(mount.clientWidth, mount.clientHeight);
    mount.appendChild(renderer.domElement);

    // receding dot plane
    const count = COLS * ROWS;
    const positions = new Float32Array(count * 3);
    const phases = new Float32Array(count);
    let i = 0;
    for (let r = 0; r < ROWS; r++) {
      for (let c = 0; c < COLS; c++) {
        positions[i * 3] = (c / (COLS - 1) - 0.5) * 320; // x spread
        positions[i * 3 + 1] = -10; // floor plane
        positions[i * 3 + 2] = -r * 7 + 40; // recede into depth
        phases[i] = (c * 0.55 + r * 0.85) % (Math.PI * 2);
        i++;
      }
    }
    const geo = new THREE.BufferGeometry();
    geo.setAttribute("position", new THREE.BufferAttribute(positions, 3));
    geo.setAttribute("aPhase", new THREE.BufferAttribute(phases, 1));

    const mat = new THREE.ShaderMaterial({
      vertexShader: VERT,
      fragmentShader: FRAG,
      transparent: true,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
      uniforms: {
        uTime: { value: 0 },
        uColor: { value: new THREE.Color("#00ED82") },
      },
    });
    scene.add(new THREE.Points(geo, mat));

    // pointer-reactive drift — subtle, eased
    const target = { x: 0, y: 0 };
    const onPointer = (e: PointerEvent) => {
      target.x = (e.clientX / window.innerWidth - 0.5) * 2;
      target.y = (e.clientY / window.innerHeight - 0.5) * 2;
    };
    window.addEventListener("pointermove", onPointer, { passive: true });

    const onResize = () => {
      camera.aspect = mount.clientWidth / mount.clientHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(mount.clientWidth, mount.clientHeight);
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
      mat.uniforms.uTime.value = t * 0.001;
      camera.position.x += (target.x * 7 - camera.position.x) * 0.025;
      camera.position.y += (14 - target.y * 4 - camera.position.y) * 0.025;
      camera.lookAt(0, -4, -60);
      renderer.render(scene, camera);
    };

    const loop = () => {
      if (hidden) return;
      raf = requestAnimationFrame((t) => {
        frame(t);
        loop();
      });
    };

    if (reduced) frame(0);
    else loop();

    return () => {
      cancelAnimationFrame(raf);
      document.removeEventListener("visibilitychange", onVisibility);
      window.removeEventListener("pointermove", onPointer);
      window.removeEventListener("resize", onResize);
      geo.dispose();
      mat.dispose();
      renderer.dispose();
      mount.removeChild(renderer.domElement);
    };
  }, []);

  return (
    <div
      ref={mountRef}
      aria-hidden
      className={className ?? "pointer-events-none absolute inset-0"}
    />
  );
}
