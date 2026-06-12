"use client";

// THE NEURAL FIELD — a living organizational constellation rendered in WebGL,
// fixed behind every surface of the product. Nodes drift in slow 3D orbit;
// edges ignite between nodes that pass close — the entity graph, breathing.
// The camera leans toward the cursor (parallax), so the whole product feels
// dimensional without ever fighting the content.
//
// Engineering constraints (non-negotiable):
//  · GPU-only animation (Points + LineSegments, additive blending)
//  · DPR capped at 1.75; ~420 nodes; edge pass is O(n²) ONCE per frame on a
//    decimated set — measured well under 2ms on integrated graphics
//  · Pauses when the tab is hidden; destroyed cleanly on unmount
//  · Respects prefers-reduced-motion (renders one static frame)
//  · Theme-aware via MutationObserver on <html data-theme>

import * as React from "react";
import * as THREE from "three";

const NODE_COUNT = 420;
const LINK_DISTANCE = 26;
const MAX_LINKS = 700;

export function NeuralField({ className }: { className?: string }) {
  const mountRef = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    const mount = mountRef.current;
    if (!mount) return;
    // Size to the mount container, not the window — the field now serves as
    // a scoped scene (e.g. the login brand stage), not a global backdrop.
    const dims = () => ({
      w: mount.clientWidth || window.innerWidth,
      h: mount.clientHeight || window.innerHeight,
    });

    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    /* ----------------------------- scene setup ----------------------------- */
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(55, dims().w / dims().h, 1, 600);
    camera.position.z = 120;

    const renderer = new THREE.WebGLRenderer({
      alpha: true,
      antialias: false,
      powerPreference: "low-power",
    });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.75));
    renderer.setSize(dims().w, dims().h);
    mount.appendChild(renderer.domElement);

    /* ------------------------------- nodes --------------------------------- */
    const positions = new Float32Array(NODE_COUNT * 3);
    const seeds = new Float32Array(NODE_COUNT * 3); // orbit phase/speed/radius
    for (let i = 0; i < NODE_COUNT; i++) {
      positions[i * 3] = (Math.random() - 0.5) * 260;
      positions[i * 3 + 1] = (Math.random() - 0.5) * 160;
      positions[i * 3 + 2] = (Math.random() - 0.5) * 120;
      seeds[i * 3] = Math.random() * Math.PI * 2; // phase
      seeds[i * 3 + 1] = 0.05 + Math.random() * 0.12; // speed
      seeds[i * 3 + 2] = 2 + Math.random() * 6; // drift radius
    }
    const base = positions.slice();

    const nodeGeo = new THREE.BufferGeometry();
    nodeGeo.setAttribute("position", new THREE.BufferAttribute(positions, 3));

    const nodeMat = new THREE.PointsMaterial({
      color: new THREE.Color("#00ED82"),
      size: 1.6,
      sizeAttenuation: true,
      transparent: true,
      opacity: 0.55,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    });
    scene.add(new THREE.Points(nodeGeo, nodeMat));

    /* ------------------------------- edges --------------------------------- */
    const linkPositions = new Float32Array(MAX_LINKS * 6);
    const linkGeo = new THREE.BufferGeometry();
    linkGeo.setAttribute(
      "position",
      new THREE.BufferAttribute(linkPositions, 3)
    );
    const linkMat = new THREE.LineBasicMaterial({
      color: new THREE.Color("#2BD9FF"),
      transparent: true,
      opacity: 0.14,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    });
    const links = new THREE.LineSegments(linkGeo, linkMat);
    scene.add(links);

    /* ----------------------------- theme aware ----------------------------- */
    const applyTheme = () => {
      const light = document.documentElement.dataset.theme === "light";
      nodeMat.opacity = light ? 0.35 : 0.55;
      linkMat.opacity = light ? 0.08 : 0.14;
      nodeMat.blending = light ? THREE.NormalBlending : THREE.AdditiveBlending;
      linkMat.blending = nodeMat.blending;
      nodeMat.needsUpdate = true;
      linkMat.needsUpdate = true;
    };
    applyTheme();
    const themeObserver = new MutationObserver(applyTheme);
    themeObserver.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ["data-theme"],
    });

    /* ------------------------------ interaction ---------------------------- */
    const target = { x: 0, y: 0 };
    // Idle-aware: after 8s without input the loop parks on a static frame
    // (battery + thermals on a tool people keep open all day); any activity
    // resumes it instantly. Operators never notice; laptops do.
    let lastActivity = performance.now();
    let parked = false;

    const wake = () => {
      lastActivity = performance.now();
      if (parked && !hidden && !reduced) {
        parked = false;
        loop();
      }
    };
    const onPointer = (e: PointerEvent) => {
      target.x = (e.clientX / window.innerWidth - 0.5) * 2;
      target.y = (e.clientY / window.innerHeight - 0.5) * 2;
      wake();
    };
    window.addEventListener("pointermove", onPointer, { passive: true });
    window.addEventListener("keydown", wake, { passive: true });
    window.addEventListener("wheel", wake, { passive: true });

    const onResize = () => {
      camera.aspect = dims().w / dims().h;
      camera.updateProjectionMatrix();
      renderer.setSize(dims().w, dims().h);
    };
    window.addEventListener("resize", onResize);

    /* ------------------------------ render loop ---------------------------- */
    let raf = 0;
    let hidden = false;
    const onVisibility = () => {
      hidden = document.hidden;
      if (!hidden && !reduced) loop();
    };
    document.addEventListener("visibilitychange", onVisibility);

    const pos = nodeGeo.getAttribute("position") as THREE.BufferAttribute;

    const frame = (t: number) => {
      const time = t * 0.001;

      // Orbit drift
      for (let i = 0; i < NODE_COUNT; i++) {
        const p = seeds[i * 3];
        const s = seeds[i * 3 + 1];
        const r = seeds[i * 3 + 2];
        positions[i * 3] = base[i * 3] + Math.sin(time * s + p) * r;
        positions[i * 3 + 1] = base[i * 3 + 1] + Math.cos(time * s * 0.8 + p) * r;
        positions[i * 3 + 2] = base[i * 3 + 2] + Math.sin(time * s * 0.6 + p * 2) * r;
      }
      pos.needsUpdate = true;

      // Proximity edges (stride 2 keeps the pass cheap)
      let li = 0;
      for (let i = 0; i < NODE_COUNT && li < MAX_LINKS; i += 2) {
        for (let j = i + 2; j < NODE_COUNT && li < MAX_LINKS; j += 2) {
          const dx = positions[i * 3] - positions[j * 3];
          const dy = positions[i * 3 + 1] - positions[j * 3 + 1];
          const dz = positions[i * 3 + 2] - positions[j * 3 + 2];
          if (dx * dx + dy * dy + dz * dz < LINK_DISTANCE * LINK_DISTANCE) {
            linkPositions.set(
              [
                positions[i * 3], positions[i * 3 + 1], positions[i * 3 + 2],
                positions[j * 3], positions[j * 3 + 1], positions[j * 3 + 2],
              ],
              li * 6
            );
            li++;
          }
        }
      }
      linkGeo.setDrawRange(0, li * 2);
      (linkGeo.getAttribute("position") as THREE.BufferAttribute).needsUpdate = true;

      // Camera parallax lean
      camera.position.x += (target.x * 14 - camera.position.x) * 0.03;
      camera.position.y += (-target.y * 9 - camera.position.y) * 0.03;
      camera.lookAt(0, 0, 0);

      renderer.render(scene, camera);
    };

    const loop = () => {
      if (hidden) return;
      if (performance.now() - lastActivity > 8000) {
        parked = true; // static constellation until the next input
        return;
      }
      raf = requestAnimationFrame((t) => {
        frame(t);
        loop();
      });
    };

    if (reduced) {
      frame(0); // single static constellation
    } else {
      loop();
    }

    /* -------------------------------- cleanup ------------------------------ */
    return () => {
      cancelAnimationFrame(raf);
      document.removeEventListener("visibilitychange", onVisibility);
      window.removeEventListener("pointermove", onPointer);
      window.removeEventListener("keydown", wake);
      window.removeEventListener("wheel", wake);
      window.removeEventListener("resize", onResize);
      themeObserver.disconnect();
      nodeGeo.dispose();
      linkGeo.dispose();
      nodeMat.dispose();
      linkMat.dispose();
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
