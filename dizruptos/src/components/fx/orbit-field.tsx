"use client";

// OrbitField — the login gateway: a single luminous orb suspended in the dark
// with a bright satellite tracing its circumference, the orbit path lighting up
// like a comet tail in its wake. Tuned to the Nexus system (amber #F97316 on
// near-black #0A0A0A, glass, restrained motion).
//
// Raw Three.js, mirrors ChromaField's {className, intensity} contract. One orb,
// one glow shell, one orbit ring (comet shader), one satellite, a faint dust
// shell. Honors prefers-reduced-motion (freezes the satellite), pauses when
// hidden or scrolled out, disposes everything on unmount.

import * as React from "react";
import * as THREE from "three";

/* --------------------------------- the orb --------------------------------- */

const ORB_VERT = /* glsl */ `
varying vec3 vNormalV;
varying vec3 vPosV;
void main() {
  vec4 mv = modelViewMatrix * vec4(position, 1.0);
  vPosV = mv.xyz;
  vNormalV = normalize(normalMatrix * normal);
  gl_Position = projectionMatrix * mv;
}
`;

const ORB_FRAG = /* glsl */ `
precision highp float;
varying vec3 vNormalV;
varying vec3 vPosV;
uniform float uIntensity;
const vec3 AMBER = vec3(0.976, 0.451, 0.086);   // #F97316
const vec3 EMBER = vec3(0.400, 0.220, 0.110);   // #66381D-ish warm
const vec3 CORE  = vec3(0.039, 0.039, 0.039);   // #0A0A0A
void main() {
  vec3 V = normalize(-vPosV);
  vec3 N = normalize(vNormalV);
  float fres = pow(1.0 - max(dot(V, N), 0.0), 2.6);
  // a warm key light from upper-left gives the orb its sphere read
  vec3 L = normalize(vec3(-0.5, 0.6, 0.7));
  float lambert = clamp(dot(N, L), 0.0, 1.0);
  vec3 col = mix(CORE, EMBER, lambert * 0.5);
  col += AMBER * fres * 1.25;                 // bright amber rim
  col += AMBER * pow(lambert, 4.0) * 0.18;    // soft warm sheen
  gl_FragColor = vec4(col * uIntensity, 1.0);
}
`;

/* ------------------------------ glow halo shell ---------------------------- */

const GLOW_FRAG = /* glsl */ `
precision highp float;
varying vec3 vNormalV;
varying vec3 vPosV;
uniform float uIntensity;
const vec3 AMBER = vec3(0.976, 0.451, 0.086);
void main() {
  vec3 V = normalize(-vPosV);
  float fres = pow(1.0 - max(dot(V, normalize(vNormalV)), 0.0), 3.0);
  gl_FragColor = vec4(AMBER * fres * 1.5 * uIntensity, fres);
}
`;

/* ------------------------------- orbit + comet ----------------------------- */
// A thin ring in local XY. The fragment reads its own angle and brightens in a
// tail trailing the satellite's angle (uAngle), so the path glows like a comet.

const RING_VERT = /* glsl */ `
varying vec2 vXY;
void main() {
  vXY = position.xy;
  gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
}
`;

const RING_FRAG = /* glsl */ `
precision highp float;
varying vec2 vXY;
uniform float uAngle;
uniform float uInner;
uniform float uOuter;
uniform float uIntensity;
const vec3 AMBER = vec3(0.976, 0.451, 0.086);
const vec3 PALE  = vec3(0.996, 0.843, 0.667);   // #FED7AA
void main() {
  float a = atan(vXY.y, vXY.x);                 // -PI..PI
  // angular distance trailing the satellite (wrap to 0..2PI)
  float d = mod(uAngle - a, 6.28318530718);
  float comet = exp(-d * 2.4);                  // bright just behind the head
  float base = 0.22;                            // the full ring stays visible
  // thin-ring radial fade so the band has soft edges
  float r = length(vXY);
  float t = clamp((r - uInner) / (uOuter - uInner), 0.0, 1.0);
  float edge = smoothstep(0.0, 0.5, t) * (1.0 - smoothstep(0.5, 1.0, t));
  vec3 col = mix(AMBER, PALE, comet);
  float glow = base + comet * 2.4;
  gl_FragColor = vec4(col * glow * uIntensity, clamp(base + comet, 0.0, 1.0) * edge);
}
`;

export function OrbitField({
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
      powerPreference: "high-performance",
    });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.75));
    renderer.setClearColor(0x0a0a0a, 1);

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(45, 1, 0.1, 100);
    camera.position.set(0, 0.2, 7);

    const uIntensity = { value: intensity };

    // everything orbital lives in a core group suspended in the upper-right
    // negative space — the circular object floats between center and top-right,
    // deep in the dark rather than glowing behind the sign-in panel.
    const core = new THREE.Group();
    core.position.set(0.5, 0.05, 0);
    scene.add(core);

    // centerpiece orb
    const orb = new THREE.Mesh(
      new THREE.SphereGeometry(1.18, 64, 64),
      new THREE.ShaderMaterial({
        vertexShader: ORB_VERT,
        fragmentShader: ORB_FRAG,
        uniforms: { uIntensity },
      })
    );
    core.add(orb);

    // halo
    const glow = new THREE.Mesh(
      new THREE.SphereGeometry(1.46, 48, 48),
      new THREE.ShaderMaterial({
        vertexShader: ORB_VERT,
        fragmentShader: GLOW_FRAG,
        uniforms: { uIntensity },
        transparent: true,
        side: THREE.BackSide,
        blending: THREE.AdditiveBlending,
        depthWrite: false,
      })
    );
    core.add(glow);

    // soft radial bloom behind the orb — a billboarded gradient disc
    const bloom = new THREE.Mesh(
      new THREE.PlaneGeometry(9.5, 9.5),
      new THREE.ShaderMaterial({
        uniforms: { uIntensity },
        vertexShader: `varying vec2 vUv; void main(){ vUv=uv; gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.0);} `,
        fragmentShader: `
          precision highp float; varying vec2 vUv; uniform float uIntensity;
          const vec3 AMBER = vec3(0.976,0.451,0.086);
          void main(){
            float d = length(vUv-0.5)*2.0;
            float g = smoothstep(1.0,0.0,d);
            gl_FragColor = vec4(AMBER*g*0.32*uIntensity, g*0.32);
          }`,
        transparent: true,
        blending: THREE.AdditiveBlending,
        depthWrite: false,
      })
    );
    bloom.position.z = -1.2;
    core.add(bloom);

    // orbit group — a near-vertical ring facing the viewer (a standing ellipse,
    // not a flat Saturn plane); holds ring + satellite so they share the plane.
    // A small x-tilt gives depth so the light passes in front up top and behind
    // down low as it circles the circumference.
    const orbit = new THREE.Group();
    orbit.rotation.x = THREE.MathUtils.degToRad(16);
    orbit.rotation.z = THREE.MathUtils.degToRad(-8);
    core.add(orbit);

    const innerR = 2.3;
    const outerR = 2.58;
    const midR = (innerR + outerR) / 2;
    const ringUniforms = {
      uAngle: { value: 0 },
      uInner: { value: innerR },
      uOuter: { value: outerR },
      uIntensity,
    };
    const ring = new THREE.Mesh(
      new THREE.RingGeometry(innerR, outerR, 220, 1),
      new THREE.ShaderMaterial({
        vertexShader: RING_VERT,
        fragmentShader: RING_FRAG,
        uniforms: ringUniforms,
        transparent: true,
        side: THREE.DoubleSide,
        blending: THREE.AdditiveBlending,
        depthWrite: false,
      })
    );
    orbit.add(ring);

    // the satellite riding the circumference
    const sat = new THREE.Mesh(
      new THREE.SphereGeometry(0.11, 24, 24),
      new THREE.MeshBasicMaterial({ color: 0xfff1de })
    );
    orbit.add(sat);
    const satGlow = new THREE.Mesh(
      new THREE.SphereGeometry(0.42, 24, 24),
      new THREE.MeshBasicMaterial({
        color: 0xf97316,
        transparent: true,
        opacity: 0.75,
        blending: THREE.AdditiveBlending,
        depthWrite: false,
      })
    );
    orbit.add(satGlow);

    // a faint, static outer ring for depth
    const ghostRing = new THREE.Mesh(
      new THREE.RingGeometry(2.95, 3.0, 160, 1),
      new THREE.MeshBasicMaterial({
        color: 0xf97316,
        transparent: true,
        opacity: 0.08,
        side: THREE.DoubleSide,
        depthWrite: false,
      })
    );
    ghostRing.rotation.x = THREE.MathUtils.degToRad(22);
    ghostRing.rotation.y = THREE.MathUtils.degToRad(38);
    ghostRing.rotation.z = THREE.MathUtils.degToRad(14);
    core.add(ghostRing);

    // starfield shell — each point twinkles on its own phase and the whole
    // shell slowly rotates, so the dark reads as a living sky around the orb
    const DUST = 1100;
    const dpos = new Float32Array(DUST * 3);
    const dsize = new Float32Array(DUST);
    const dphase = new Float32Array(DUST);
    for (let i = 0; i < DUST; i++) {
      const radius = 9 + Math.random() * 22;
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.acos(2 * Math.random() - 1);
      dpos[i * 3] = radius * Math.sin(phi) * Math.cos(theta);
      dpos[i * 3 + 1] = radius * Math.sin(phi) * Math.sin(theta);
      dpos[i * 3 + 2] = -Math.abs(radius * Math.cos(phi)) - 3;
      dsize[i] = 1.2 + Math.random() * 3.2;
      dphase[i] = Math.random() * Math.PI * 2;
    }
    const dustGeo = new THREE.BufferGeometry();
    dustGeo.setAttribute("position", new THREE.BufferAttribute(dpos, 3));
    dustGeo.setAttribute("aSize", new THREE.BufferAttribute(dsize, 1));
    dustGeo.setAttribute("aPhase", new THREE.BufferAttribute(dphase, 1));
    const dustUniforms = { uTime: { value: 0 } };
    const dust = new THREE.Points(
      dustGeo,
      new THREE.ShaderMaterial({
        uniforms: dustUniforms,
        transparent: true,
        blending: THREE.AdditiveBlending,
        depthWrite: false,
        vertexShader: `
          attribute float aSize; attribute float aPhase; varying float vP;
          uniform float uTime;
          void main(){ vP=aPhase; vec4 mv=modelViewMatrix*vec4(position,1.0);
            gl_PointSize=aSize*(300.0/-mv.z); gl_Position=projectionMatrix*mv; }`,
        fragmentShader: `
          precision highp float; varying float vP; uniform float uTime;
          void main(){ vec2 d=gl_PointCoord-0.5; float r=length(d);
            if(r>0.5) discard; float core=1.0-smoothstep(0.0,0.5,r);
            float tw=0.45+0.55*sin(uTime*1.8+vP);              // twinkle
            vec3 c=mix(vec3(0.98,0.80,0.55),vec3(0.976,0.451,0.086),vP*0.16);
            gl_FragColor=vec4(c, core*tw); }`,
      })
    );
    scene.add(dust);

    const resize = () => {
      const { clientWidth: w, clientHeight: h } = canvas;
      renderer.setSize(w, h, false);
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
    };
    resize();
    const ro = new ResizeObserver(resize);
    ro.observe(canvas);

    // eased cursor parallax
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

      const angle = reduced ? Math.PI * 0.25 : t * 0.62;
      ringUniforms.uAngle.value = angle;
      // place satellite on the circle (local plane of the orbit group)
      sat.position.set(Math.cos(angle) * midR, Math.sin(angle) * midR, 0);
      satGlow.position.copy(sat.position);

      eased.lerp(target, 0.045);
      // the object drifts: a slow vertical bob + cursor parallax keep it alive
      core.position.y = 0.05 + (reduced ? 0 : Math.sin(t * 0.5) * 0.12);
      // continuous spin of the whole system + parallax, so it's visibly moving
      core.rotation.y = (reduced ? 0 : t * 0.07) + eased.x * 0.3;
      core.rotation.x = eased.y * 0.2;
      orb.rotation.y = reduced ? 0 : t * 0.16;
      dustUniforms.uTime.value = t;                       // twinkle clock
      dust.rotation.y = (reduced ? 0 : t * 0.035) + eased.x * 0.05;
      dust.rotation.x = reduced ? 0 : t * 0.012;
      // billboard the bloom to the camera
      bloom.quaternion.copy(camera.quaternion);

      renderer.render(scene, camera);
    };
    loop();

    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("pointermove", onMove);
      ro.disconnect();
      io.disconnect();
      [orb, glow, bloom, ring, sat, satGlow, ghostRing, dust].forEach((m) => {
        m.geometry.dispose();
        (m.material as THREE.Material).dispose();
      });
      renderer.dispose();
    };
  }, [intensity]);

  return <canvas ref={ref} className={className} aria-hidden />;
}
