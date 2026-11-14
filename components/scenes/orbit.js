/**
 * Tiny shared helpers for the page scenes: drag-to-orbit / wheel-to-zoom camera rig with eased
 * fly-to, and a canvas-texture sprite. Plain three.js, no extra dependency.
 */
import * as THREE from "three";

export function createRig(camera, dom, { yaw = 0.4, pitch = 0.45, dist = 30, min = 6, max = 80, target = [0, 0, 0] } = {}) {
  const rig = { yaw, pitch, dist, target: new THREE.Vector3(...target) };
  const goal = { yaw, pitch, dist, target: rig.target.clone() };
  let drag = null;
  let userMoved = false;
  const down = (e) => { drag = { x: e.clientX, y: e.clientY, moved: 0 }; userMoved = true; dom.setPointerCapture?.(e.pointerId); };
  const move = (e) => {
    if (!drag) return;
    const dx = e.clientX - drag.x, dy = e.clientY - drag.y;
    drag.moved += Math.abs(dx) + Math.abs(dy); drag.x = e.clientX; drag.y = e.clientY;
    goal.yaw -= dx * 0.005; goal.pitch = Math.max(-0.1, Math.min(1.35, goal.pitch + dy * 0.004));
  };
  const up = () => { const d = drag; drag = null; return d; };
  const wheel = (e) => { e.preventDefault(); goal.dist = Math.max(min, Math.min(max, goal.dist * (1 + Math.sign(e.deltaY) * 0.1))); };
  dom.addEventListener("pointerdown", down);
  dom.addEventListener("pointermove", move);
  dom.addEventListener("wheel", wheel, { passive: false });
  return {
    rig, goal,
    get dragging() { return !!drag; },
    get userMoved() { return userMoved; },
    endDrag: up,
    flyTo(t, d) { goal.target.copy(t); if (d) goal.dist = d; },
    update(dt) {
      const k = 1 - Math.pow(0.002, dt);
      rig.yaw += (goal.yaw - rig.yaw) * k; rig.pitch += (goal.pitch - rig.pitch) * k; rig.dist += (goal.dist - rig.dist) * k;
      rig.target.lerp(goal.target, k);
      camera.position.set(
        rig.target.x + rig.dist * Math.cos(rig.pitch) * Math.sin(rig.yaw),
        rig.target.y + rig.dist * Math.sin(rig.pitch),
        rig.target.z + rig.dist * Math.cos(rig.pitch) * Math.cos(rig.yaw),
      );
      camera.lookAt(rig.target);
    },
    dispose() { dom.removeEventListener("pointerdown", down); dom.removeEventListener("pointermove", move); dom.removeEventListener("wheel", wheel); },
  };
}

export function glowSprite(size = 64) {
  const c = document.createElement("canvas"); c.width = c.height = size;
  const x = c.getContext("2d"), g = x.createRadialGradient(size / 2, size / 2, 0, size / 2, size / 2, size / 2);
  g.addColorStop(0, "rgba(255,255,255,1)"); g.addColorStop(0.35, "rgba(255,255,255,.7)"); g.addColorStop(1, "rgba(255,255,255,0)");
  x.fillStyle = g; x.fillRect(0, 0, size, size);
  return new THREE.CanvasTexture(c);
}

export function canvasTexture(draw, w = 512, h = 256) {
  const c = document.createElement("canvas"); c.width = w; c.height = h; draw(c.getContext("2d"), w, h);
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; return t;
}

export function seeded(seed) { let s = seed; return () => (s = (s * 16807) % 2147483647) / 2147483647; }

export function reducedMotion() { return typeof window !== "undefined" && !!window.matchMedia?.("(prefers-reduced-motion: reduce)").matches; }
