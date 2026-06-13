"use client";

// SaturnField — the login's signature: a slowly turning ringed planet adrift
// in a volt-green starfield. Raw Three.js (one scene, three materials, zero
// per-frame allocation), mirroring ChromaField's mount/cleanup contract so it
// drops in anywhere ChromaField does: <SaturnField className intensity />.
//
// The planet is offset to the right so a left-aligned poster plate stays on
// clean ink. Honors prefers-reduced-motion by freezing time — the composition
// still renders, it just stops drifting. Pauses when hidden or scrolled out.

import * as React from "react";
import * as THREE from "three";

/* ------------------------------- planet body ------------------------------- */
// Dark teal core with a volt fresnel rim and faint latitudinal banding.

const PLANET_VERT = /* glsl */ `
varying vec3 vNormalV;
varying vec3 vPosV;
varying vec3 vPosL;
void main() {
  vPosL = position;
  vec4 mv = modelViewMatrix * vec4(position, 1.0);
  vPosV = mv.xyz;
  vNormalV = normalize(normalMatrix * normal);
  gl_Position = projectionMatrix * mv;
}
`;

const PLANET_FRAG = /* glsl */ `
precision highp float;
varying vec3 vNormalV;
varying vec3 vPosV;
varying vec3 vPosL;
uniform float uTime;
uniform float uIntensity;

const vec3 VOLT = vec3(0.000, 0.929, 0.510);
const vec3 CYAN = vec3(0.169, 0.851, 1.000);
const vec3 CORE = vec3(0.020, 0.075, 0.060);

void main() {
  vec3 V = normalize(-vPosV);
  float fres = pow(1.0 - max(dot(V, normalize(vNormalV)), 0.0), 2.4);

  // terminator — a soft "sun" from the upper-left so the sphere reads 3D
  vec3 L = normalize(vec3(-0.6, 0.5, 0.7));
  float lambert = clamp(dot(normalize(vNormalV), L), 0.0, 1.0);

  // latitudinal banding driven by local Y, drifting slowly
  float bands = 0.5 + 0.5 * sin(vPosL.y * 9.0 + uTime * 0.25);
  bands = mix(0.85, 1.0, bands);

  vec3 col = CORE * (0.25 + lambert * 0.9) * bands;
  col += VOLT * fres * 1.15;                 // rim atmosphere
  col += CYAN * pow(lambert, 3.0) * 0.10;    // cool specular sheen
  col *= uIntensity;

  gl_FragColor = vec4(col, 1.0);
}
`;

/* ------------------------------- atmosphere -------------------------------- */
// A slightly larger backside-rendered shell that blooms a green halo.

const GLOW_VERT = PLANET_VERT;
const GLOW_FRAG = /* glsl */ `
precision highp float;
varying vec3 vNormalV;
varying vec3 vPosV;
varying vec3 vPosL;
uniform float uIntensity;
const vec3 VOLT = vec3(0.000, 0.929, 0.510);
void main() {
  vec3 V = normalize(-vPosV);
  float fres = pow(1.0 - max(dot(V, normalize(vNormalV)), 0.0), 3.2);
  gl_FragColor = vec4(VOLT * fres * 1.4 * uIntensity, fres);
}
`;

/* ---------------------------------- ring ----------------------------------- */
// Radial bands with gaps; volt→cyan gradient out to the rim. Lives in the XY
// plane (RingGeometry default), so radius is length(localPos.xy).

const RING_VERT = /* glsl */ `
varying vec3 vPosL;
void main() {
  vPosL = position;
  gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
}
`;

const RING_FRAG = /* glsl */ `
precision highp float;
varying vec3 vPosL;
uniform float uTime;
uniform float uInner;
uniform float uOuter;
uniform float uIntensity;
const vec3 VOLT = vec3(0.000, 0.929, 0.510);
const vec3 CYAN = vec3(0.169, 0.851, 1.000);
const vec3 AMBER = vec3(0.961, 0.620, 0.043);
void main() {
  float r = length(vPosL.xy);
  float t = clamp((r - uInner) / (uOuter - uInner), 0.0, 1.0);

  // concentric bands — sharp-ish gaps give the Cassini-division read
  float bands = 0.5 + 0.5 * sin(r * 26.0 - uTime * 0.4);
  bands = smoothstep(0.25, 0.9, bands);

  // fade both edges so the ring has no hard cut
  float edge = smoothstep(0.0, 0.12, t) * (1.0 - smoothstep(0.82, 1.0, t));

  vec3 col = mix(VOLT, CYAN, t);
  col = mix(col, AMBER, smoothstep(0.55, 0.62, t) * 0.5); // one warm divide

  float alpha = bands * edge * 0.85;
  gl_FragColor = vec4(col * uIntensity, alpha);
}
`;

/* --------------------------------- stars ----------------------------------- */

const STAR_VERT = /* glsl */ `
attribute float aSize;
attribute float aPhase;
varying float vPhase;
uniform float uTime;
void main() {
  vPhase = aPhase;
  vec4 mv = modelViewMatrix * vec4(position, 1.0);
  gl_PointSize = aSize * (300.0 / -mv.z);
  gl_Position = projectionMatrix * mv;
}
`;

const STAR_FRAG = /* glsl */ `
precision highp float;
varying float vPhase;
uniform float uTime;
void main() {
  vec2 d = gl_PointCoord - 0.5;
  float dist = length(d);
  if (dist > 0.5) discard;
  float core = 1.0 - smoothstep(0.0, 0.5, dist);
  float twinkle = 0.55 + 0.45 * sin(uTime * 1.6 + vPhase);
  vec3 col = mix(vec3(0.6, 0.95, 0.8), vec3(0.0, 0.929, 0.510), vPhase * 0.16);
  gl_FragColor = vec4(col, core * twinkle);
}
`;

export function SaturnField({
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
      antialias: true,
      alpha: false,
      powerPreference: "high-performance",
    });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.75));
    renderer.setClearColor(0x08090a, 1);

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(45, 1, 0.1, 100);
    camera.position.set(0, 0, 6.2);

    const shared = {
      uTime: { value: 0 },
      uIntensity: { value: intensity },
    };

    // group holds planet + ring so they tilt and parallax together; offset
    // right of center to leave the left third on clean ink for poster type
    const system = new THREE.Group();
    system.position.x = 1.7;
    system.rotation.z = 0.18;
    scene.add(system);

    // planet
    const planet = new THREE.Mesh(
      new THREE.SphereGeometry(1.3, 64, 64),
      new THREE.ShaderMaterial({
        vertexShader: PLANET_VERT,
        fragmentShader: PLANET_FRAG,
        uniforms: shared,
      })
    );
    system.add(planet);

    // atmosphere halo
    const glow = new THREE.Mesh(
      new THREE.SphereGeometry(1.55, 48, 48),
      new THREE.ShaderMaterial({
        vertexShader: GLOW_VERT,
        fragmentShader: GLOW_FRAG,
        uniforms: { uIntensity: shared.uIntensity },
        transparent: true,
        side: THREE.BackSide,
        blending: THREE.AdditiveBlending,
        depthWrite: false,
      })
    );
    system.add(glow);

    // ring — tilted toward the viewer
    const innerR = 1.95;
    const outerR = 3.2;
    const ring = new THREE.Mesh(
      new THREE.RingGeometry(innerR, outerR, 160, 4),
      new THREE.ShaderMaterial({
        vertexShader: RING_VERT,
        fragmentShader: RING_FRAG,
        uniforms: {
          uTime: shared.uTime,
          uIntensity: shared.uIntensity,
          uInner: { value: innerR },
          uOuter: { value: outerR },
        },
        transparent: true,
        side: THREE.DoubleSide,
        blending: THREE.AdditiveBlending,
        depthWrite: false,
      })
    );
    ring.rotation.x = THREE.MathUtils.degToRad(72);
    system.add(ring);

    // starfield — a shell of points well behind the system
    const STAR_COUNT = 1300;
    const pos = new Float32Array(STAR_COUNT * 3);
    const sizes = new Float32Array(STAR_COUNT);
    const phases = new Float32Array(STAR_COUNT);
    for (let i = 0; i < STAR_COUNT; i++) {
      // distribute on a wide shell
      const radius = 14 + Math.random() * 22;
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.acos(2 * Math.random() - 1);
      pos[i * 3] = radius * Math.sin(phi) * Math.cos(theta);
      pos[i * 3 + 1] = radius * Math.sin(phi) * Math.sin(theta);
      pos[i * 3 + 2] = -Math.abs(radius * Math.cos(phi)) - 4; // bias behind camera focus
      sizes[i] = 0.6 + Math.random() * 2.2;
      phases[i] = Math.random() * Math.PI * 2;
    }
    const starGeo = new THREE.BufferGeometry();
    starGeo.setAttribute("position", new THREE.BufferAttribute(pos, 3));
    starGeo.setAttribute("aSize", new THREE.BufferAttribute(sizes, 1));
    starGeo.setAttribute("aPhase", new THREE.BufferAttribute(phases, 1));
    const stars = new THREE.Points(
      starGeo,
      new THREE.ShaderMaterial({
        vertexShader: STAR_VERT,
        fragmentShader: STAR_FRAG,
        uniforms: { uTime: shared.uTime },
        transparent: true,
        blending: THREE.AdditiveBlending,
        depthWrite: false,
      })
    );
    scene.add(stars);

    const resize = () => {
      const { clientWidth: w, clientHeight: h } = canvas;
      renderer.setSize(w, h, false);
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
    };
    resize();
    const ro = new ResizeObserver(resize);
    ro.observe(canvas);

    // eased cursor parallax — tilts the whole system a few degrees
    const target = new THREE.Vector2(0, 0);
    const eased = new THREE.Vector2(0, 0);
    const onMove = (e: PointerEvent) => {
      target.set(e.clientX / window.innerWidth - 0.5, e.clientY / window.innerHeight - 0.5);
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
      const t = reduced ? 0 : (performance.now() - t0) / 1000;
      shared.uTime.value = t;

      eased.lerp(target, 0.04);
      system.rotation.x = -0.12 + eased.y * 0.25;
      system.rotation.y = (reduced ? 0 : t * 0.06) + eased.x * 0.3;
      ring.rotation.z = reduced ? 0 : t * 0.08;
      planet.rotation.y = reduced ? 0 : t * 0.12;
      stars.rotation.y = (reduced ? 0 : t * 0.01) + eased.x * 0.06;

      renderer.render(scene, camera);
    };
    loop();

    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("pointermove", onMove);
      ro.disconnect();
      io.disconnect();
      planet.geometry.dispose();
      (planet.material as THREE.Material).dispose();
      glow.geometry.dispose();
      (glow.material as THREE.Material).dispose();
      ring.geometry.dispose();
      (ring.material as THREE.Material).dispose();
      starGeo.dispose();
      (stars.material as THREE.Material).dispose();
      renderer.dispose();
    };
  }, [intensity]);

  return <canvas ref={ref} className={className} aria-hidden />;
}
