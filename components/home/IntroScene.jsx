"use client";

import { useEffect, useRef, useState } from "react";
import * as THREE from "three";
import { EffectComposer } from "three/addons/postprocessing/EffectComposer.js";
import { RenderPass } from "three/addons/postprocessing/RenderPass.js";
import { UnrealBloomPass } from "three/addons/postprocessing/UnrealBloomPass.js";
import { OutputPass } from "three/addons/postprocessing/OutputPass.js";

/**
 * Opening scene: seen from outside through a hull porthole, a fuel droplet held on a thin fibre
 * burns inside a pressurised module.
 *
 * The flame is the droplet flame the FLEX campaign studied: with no buoyancy, the flame sits as a
 * near-spherical shell around the droplet instead of a rising teardrop. This is an illustration
 * of that published behaviour (labelled as such on the page), not a combustion model.
 * Dust motes drift without settling, because nothing in the cabin falls.
 */

const flameVS = `
varying vec3 vN; varying vec3 vV; varying vec3 vP;
uniform float uTime;
void main(){
  vec3 p = position;
  float n = sin(p.y*7.0+uTime*1.7)*0.012 + sin(p.x*9.0-uTime*1.3)*0.010 + sin(p.z*8.0+uTime*2.1)*0.010;
  p += normal * n;
  vec4 mv = modelViewMatrix * vec4(p,1.0);
  vN = normalize(normalMatrix * normal); vV = normalize(-mv.xyz); vP = p;
  gl_Position = projectionMatrix * mv;
}`;
const flameFS = `
varying vec3 vN; varying vec3 vV; varying vec3 vP;
uniform float uTime; uniform vec3 uColor; uniform float uPower; uniform float uAlpha;
void main(){
  float f = pow(1.0 - abs(dot(vN, vV)), uPower);
  float flick = 0.92 + 0.08*sin(uTime*6.0 + vP.y*12.0);
  gl_FragColor = vec4(uColor * f * flick * 2.2, f * uAlpha);
}`;

function panelTexture() {
  const c = document.createElement("canvas"); c.width = 512; c.height = 512;
  const x = c.getContext("2d");
  x.fillStyle = "#c9ccd1"; x.fillRect(0, 0, 512, 512);
  const g = x.createLinearGradient(0, 0, 512, 512); g.addColorStop(0, "rgba(255,255,255,.06)"); g.addColorStop(1, "rgba(0,0,0,.08)");
  x.fillStyle = g; x.fillRect(0, 0, 512, 512);
  x.strokeStyle = "#8e939b"; x.lineWidth = 4;
  [[8, 8, 240, 300], [264, 8, 240, 150], [264, 166, 240, 142], [8, 316, 496, 188]].forEach(([a, b, w, h]) => { x.strokeRect(a, b, w, h); });
  x.fillStyle = "#9aa0a8"; for (let i = 0; i < 40; i++) { x.beginPath(); x.arc(14 + (i % 10) * 54, i < 10 ? 14 : i < 20 ? 304 : i < 30 ? 322 : 498, 3, 0, 7); x.fill(); }
  x.fillStyle = "#2f5fa8"; x.fillRect(40, 40, 64, 10); x.fillRect(300, 40, 40, 10); x.fillRect(40, 350, 90, 10);
  x.fillStyle = "#e1b54a"; x.fillRect(300, 200, 26, 26);
  x.fillStyle = "#3b3f46"; x.fillRect(380, 360, 90, 40); x.fillRect(120, 120, 70, 8); x.fillRect(120, 140, 50, 8);
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 4; return t;
}

function moteTexture() {
  const c = document.createElement("canvas"); c.width = c.height = 64;
  const x = c.getContext("2d"), g = x.createRadialGradient(32, 32, 0, 32, 32, 32);
  g.addColorStop(0, "rgba(255,255,255,1)"); g.addColorStop(0.3, "rgba(255,255,255,.35)"); g.addColorStop(1, "rgba(255,255,255,0)");
  x.fillStyle = g; x.fillRect(0, 0, 64, 64); return new THREE.CanvasTexture(c);
}

export default function IntroScene({ go = false, onArrive }) {
  const host = useRef(null);
  // the fly-through: when `go` turns true the camera glides through the porthole, then reports back
  const fly = useRef({ go: false, t0: 0, done: false, arrive: null, reduced: false });
  useEffect(() => { fly.current.arrive = onArrive; }, [onArrive]);
  useEffect(() => {
    if (!go) return;
    fly.current.go = true;
    if (fly.current.reduced) { fly.current.done = true; fly.current.arrive?.(); }
  }, [go]);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    const el = host.current; if (!el) return undefined;
    let renderer;
    try { renderer = new THREE.WebGLRenderer({ antialias: true, powerPreference: "high-performance" }); }
    catch { requestAnimationFrame(() => setFailed(true)); return undefined; }
    const reduced = window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;
    fly.current.reduced = !!reduced;
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.5));
    renderer.toneMapping = THREE.ACESFilmicToneMapping; renderer.toneMappingExposure = 1.05;
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    el.appendChild(renderer.domElement);
    renderer.domElement.setAttribute("aria-hidden", "true");

    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x07080b);
    scene.fog = new THREE.FogExp2(0x07080b, 0.055);
    const camera = new THREE.PerspectiveCamera(46, 1, 0.05, 80);
    camera.position.set(0, 0.05, 3.2);

    /* ---------- module: octagonal corridor ---------- */
    const R = 2.1, SIDES = 8, LEN = 22;
    const tex = panelTexture(); tex.wrapS = tex.wrapT = THREE.RepeatWrapping; tex.repeat.set(1, 1);
    const panelMat = new THREE.MeshStandardMaterial({ map: tex, roughness: 0.62, metalness: 0.15, color: 0xe8eaee });
    const darkMat = new THREE.MeshStandardMaterial({ color: 0x1b1e24, roughness: 0.5, metalness: 0.6 });
    const railMat = new THREE.MeshStandardMaterial({ color: 0xd9a531, roughness: 0.35, metalness: 0.5 });
    const side = 2 * R * Math.tan(Math.PI / SIDES);
    const hull = new THREE.Group(); scene.add(hull);
    for (let z = 0; z < LEN; z += 2.2) {
      for (let i = 0; i < SIDES; i++) {
        const a = (i / SIDES) * Math.PI * 2; // flats at floor, ceiling and both walls
        // box: x = tangent width, y = wall thickness (radial), z = bay length; rotate so y points at the axis
        const panel = new THREE.Mesh(new THREE.BoxGeometry(side * 0.97, 0.12, 2.1), panelMat);
        panel.position.set(Math.cos(a) * R, Math.sin(a) * R, -z);
        panel.rotation.z = a - Math.PI / 2;
        hull.add(panel);
      }
      // ring frame between bays
      const ring = new THREE.Mesh(new THREE.TorusGeometry(R * 1.02, 0.07, 6, SIDES), darkMat);
      ring.rotation.z = Math.PI / SIDES; ring.position.z = -z - 1.1; hull.add(ring);
      // ceiling light strip
      const strip = new THREE.Mesh(new THREE.BoxGeometry(0.9, 0.04, 1.3), new THREE.MeshBasicMaterial({ color: 0xdfe8ff }));
      strip.position.set(0, R * 0.93, -z); hull.add(strip);
      // handrails on both walls
      [-1, 1].forEach((s) => {
        const rail = new THREE.Mesh(new THREE.CylinderGeometry(0.025, 0.025, 1.6, 8), railMat);
        rail.rotation.x = Math.PI / 2; rail.position.set(s * R * 0.86, -0.55, -z); hull.add(rail);
      });
    }
    // hatch at the far end: octagonal ring with a cold glow behind it
    const hatch = new THREE.Mesh(new THREE.TorusGeometry(1.0, 0.12, 8, SIDES), darkMat);
    hatch.rotation.z = Math.PI / SIDES; hatch.position.z = -LEN + 0.5; hull.add(hatch);
    const hatchGlow = new THREE.Mesh(new THREE.CircleGeometry(0.98, SIDES), new THREE.MeshBasicMaterial({ color: 0x3a4658 }));
    hatchGlow.rotation.z = Math.PI / SIDES; hatchGlow.position.z = -LEN + 0.45; hull.add(hatchGlow);

    scene.add(new THREE.HemisphereLight(0xcfd8ea, 0x14161b, 0.55));
    for (let z = 0; z < LEN; z += 4.4) { const l = new THREE.PointLight(0xdfe8ff, 3.2, 7, 2); l.position.set(0, R * 0.8, -z); scene.add(l); }

    /* ---------- the droplet flame ---------- */
    const FZ = 0.35;
    const flameGroup = new THREE.Group(); flameGroup.position.set(0.0, 0.08, FZ); scene.add(flameGroup);
    // support fibre (FLEX droplets are tethered or free-floating; drawn tethered so the scale reads)
    const fibre = new THREE.Mesh(new THREE.CylinderGeometry(0.004, 0.004, 1.6, 6), new THREE.MeshStandardMaterial({ color: 0x9aa3ad, metalness: 0.8, roughness: 0.3 }));
    fibre.position.set(0, -0.8, 0); flameGroup.add(fibre);
    const mount = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.09, 0.18, 12), darkMat); mount.position.set(0, -1.6, 0); flameGroup.add(mount);
    const droplet = new THREE.Mesh(new THREE.SphereGeometry(0.045, 24, 16), new THREE.MeshStandardMaterial({ color: 0x2a1c10, roughness: 0.1, metalness: 0.2, emissive: 0x331400 }));
    flameGroup.add(droplet);
    const mk = (r, color, power, alpha) => new THREE.Mesh(new THREE.SphereGeometry(r, 64, 48), new THREE.ShaderMaterial({
      vertexShader: flameVS, fragmentShader: flameFS, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending,
      uniforms: { uTime: { value: 0 }, uColor: { value: new THREE.Color(color) }, uPower: { value: power }, uAlpha: { value: alpha } },
    }));
    const shellOuter = mk(0.42, 0x3f86ff, 2.8, 0.95);
    const shellInner = mk(0.39, 0x9cc6ff, 5.0, 0.5);
    flameGroup.add(shellOuter, shellInner);
    // faint sooty core near the droplet: a soft sprite, not a surface
    const soot = new THREE.Sprite(new THREE.SpriteMaterial({ map: moteTexture(), color: 0xff8a3d, transparent: true, opacity: 0.32, blending: THREE.AdditiveBlending, depthWrite: false }));
    soot.scale.set(0.42, 0.42, 1); flameGroup.add(soot);
    const glow = new THREE.Sprite(new THREE.SpriteMaterial({ map: moteTexture(), color: 0x4f8dff, transparent: true, opacity: 0.35, blending: THREE.AdditiveBlending, depthWrite: false }));
    glow.scale.set(2.8, 2.8, 1); flameGroup.add(glow);
    const flameLight = new THREE.PointLight(0x5b95ff, 6, 5, 2); flameGroup.add(flameLight);

    /* ---------- the porthole: we look in from outside, through the hull ---------- */
    const WZ = 1.7, HOLE = 0.5, CY = 0.07;
    const hullTex = panelTexture(); hullTex.wrapS = hullTex.wrapT = THREE.RepeatWrapping; hullTex.repeat.set(0.55, 0.55);
    const wallShape = new THREE.Shape(); wallShape.moveTo(-5, -3); wallShape.lineTo(5, -3); wallShape.lineTo(5, 3); wallShape.lineTo(-5, 3); wallShape.lineTo(-5, -3);
    const hole = new THREE.Path(); hole.absarc(0, 0, HOLE, 0, Math.PI * 2, true); wallShape.holes.push(hole);
    const wall = new THREE.Mesh(new THREE.ShapeGeometry(wallShape, 96), new THREE.MeshStandardMaterial({ map: hullTex, color: 0x6a707c, roughness: 0.7, metalness: 0.15 }));
    wall.position.set(0, CY, WZ); scene.add(wall);
    const steel = new THREE.MeshStandardMaterial({ color: 0x7c838f, roughness: 0.55, metalness: 0.35 });
    const plate = new THREE.Mesh(new THREE.RingGeometry(HOLE + 0.02, HOLE + 0.2, 96), new THREE.MeshStandardMaterial({ color: 0x4d535e, roughness: 0.6, metalness: 0.3 }));
    plate.position.set(0, CY, WZ + 0.004); scene.add(plate);
    const ringFrame = new THREE.Mesh(new THREE.TorusGeometry(HOLE + 0.02, 0.045, 20, 96), steel); ringFrame.position.set(0, CY, WZ + 0.01); scene.add(ringFrame);
    const lip = new THREE.Mesh(new THREE.TorusGeometry(HOLE + 0.2, 0.014, 10, 96), steel); lip.position.set(0, CY, WZ + 0.006); scene.add(lip);
    for (let i = 0; i < 16; i++) {
      const a = (i / 16) * Math.PI * 2, bolt = new THREE.Mesh(new THREE.CylinderGeometry(0.02, 0.02, 0.03, 6), steel);
      bolt.rotation.x = Math.PI / 2; bolt.position.set(Math.cos(a) * (HOLE + 0.125), CY + Math.sin(a) * (HOLE + 0.125), WZ + 0.02); scene.add(bolt);
    }
    const glass = new THREE.Mesh(new THREE.CircleGeometry(HOLE, 96), new THREE.MeshBasicMaterial({ color: 0x9fc4ff, transparent: true, opacity: 0.02, depthWrite: false }));
    glass.position.set(0, CY, WZ - 0.02); scene.add(glass);
    // outside light: cool key from the upper left, so the hull reads as metal and the window as the bright thing
    const key = new THREE.DirectionalLight(0xbfd2ff, 0.9); key.position.set(-2.5, 2.2, 5); scene.add(key);
    const rim = new THREE.PointLight(0x5b95ff, 0.25, 2.2, 2); rim.position.set(0, CY, WZ + 0.5); scene.add(rim);

    /* ---------- drifting motes: nothing settles ---------- */
    const N = 260, pos = new Float32Array(N * 3), vel = new Float32Array(N * 3);
    for (let i = 0; i < N; i++) {
      pos[i * 3] = (Math.random() - 0.5) * 3.4; pos[i * 3 + 1] = (Math.random() - 0.5) * 3; pos[i * 3 + 2] = 1.4 - Math.random() * 10;
      vel[i * 3] = (Math.random() - 0.5) * 0.02; vel[i * 3 + 1] = (Math.random() - 0.5) * 0.02; vel[i * 3 + 2] = (Math.random() - 0.5) * 0.02;
    }
    const mg = new THREE.BufferGeometry(); mg.setAttribute("position", new THREE.BufferAttribute(pos, 3));
    const motes = new THREE.Points(mg, new THREE.PointsMaterial({ size: 0.03, map: moteTexture(), color: 0xc8d6ee, transparent: true, opacity: 0.6, depthWrite: false, blending: THREE.AdditiveBlending }));
    scene.add(motes);

    /* ---------- post ---------- */
    const composer = new EffectComposer(renderer);
    composer.addPass(new RenderPass(scene, camera));
    const bloom = new UnrealBloomPass(new THREE.Vector2(256, 256), 0.85, 0.6, 0.62);
    composer.addPass(bloom); composer.addPass(new OutputPass());

    const size = { w: 1, h: 1 };
    const resize = () => {
      const w = el.clientWidth, h = el.clientHeight; if (!w || !h) return;
      renderer.setSize(w, h, false); composer.setSize(w, h); bloom.resolution.set(w / 2, h / 2);
      camera.aspect = w / h;
      // keep the flame large on portrait phones
      camera.fov = w / h < 0.9 ? 62 : 46;
      // on wide screens the window sits right of centre, leaving the left for the headline
      size.w = w; size.h = h;
      if (w / h > 1.3) camera.setViewOffset(w, h, -w * 0.13, 0, w, h); else camera.clearViewOffset();
      camera.updateProjectionMatrix();
    };
    resize();
    const ro = new ResizeObserver(resize); ro.observe(el);

    const target = { x: 0, y: 0 }, cur = { x: 0, y: 0 };
    const onMove = (e) => { const r = el.getBoundingClientRect(); target.x = ((e.clientX - r.left) / r.width - 0.5) * 2; target.y = ((e.clientY - r.top) / r.height - 0.5) * 2; };
    window.addEventListener("pointermove", onMove, { passive: true });

    let visible = true, raf = 0; const t0 = performance.now();
    const io = new IntersectionObserver(([e]) => { visible = e.isIntersecting; if (visible && !raf) raf = requestAnimationFrame(frame); }, { threshold: 0 });
    io.observe(el);

    function frame(now) {
      raf = 0;
      const t = (now - t0) / 1000;
      cur.x += (target.x - cur.x) * 0.04; cur.y += (target.y - cur.y) * 0.04;
      const drift = reduced ? 0 : t;
      // 0 → 1 while the camera travels from outside the hull, through the window, up to the flame
      const f = fly.current;
      let e = 0;
      if (f.go) {
        if (!f.t0) f.t0 = now;
        const q = Math.min(1, (now - f.t0) / 2600);
        e = q < 0.5 ? 4 * q * q * q : 1 - Math.pow(-2 * q + 2, 3) / 2;
        if (q >= 1 && !f.done) { f.done = true; f.arrive?.(); }
      }
      const still = 1 - e;
      camera.position.set((Math.sin(drift * 0.12) * 0.07 + cur.x * 0.16) * still, 0.07 + (Math.sin(drift * 0.09) * 0.04 - cur.y * 0.1) * still, 3.3 + Math.sin(drift * 0.07) * 0.06 * still - e * 2.3);
      camera.lookAt(cur.x * 0.04 * still, 0.07 - cur.y * 0.02 * still, -1.5 * e);
      if (f.go && size.w / size.h > 1.3) camera.setViewOffset(size.w, size.h, -size.w * 0.13 * still, 0, size.w, size.h);
      [shellOuter, shellInner].forEach((m) => { m.material.uniforms.uTime.value = drift; });
      const breathe = 1 + Math.sin(drift * 1.3) * 0.02;
      shellOuter.scale.setScalar(breathe); shellInner.scale.setScalar(1 + Math.sin(drift * 1.7 + 1) * 0.025);
      flameLight.intensity = 5.5 + Math.sin(drift * 5) * 0.4;
      if (!reduced) {
        for (let i = 0; i < N; i++) {
          pos[i * 3] += vel[i * 3] * 0.016; pos[i * 3 + 1] += vel[i * 3 + 1] * 0.016; pos[i * 3 + 2] += vel[i * 3 + 2] * 0.016;
          if (Math.abs(pos[i * 3]) > 1.9) vel[i * 3] *= -1; if (Math.abs(pos[i * 3 + 1]) > 1.8) vel[i * 3 + 1] *= -1;
          if (pos[i * 3 + 2] > 1.5 || pos[i * 3 + 2] < -9) vel[i * 3 + 2] *= -1;
        }
        mg.attributes.position.needsUpdate = true;
      }
      composer.render();
      if (visible && !reduced) raf = requestAnimationFrame(frame);
    }
    raf = requestAnimationFrame(frame);

    return () => {
      cancelAnimationFrame(raf); io.disconnect(); ro.disconnect(); window.removeEventListener("pointermove", onMove);
      scene.traverse((o) => { o.geometry?.dispose?.(); const m = o.material; if (m) (Array.isArray(m) ? m : [m]).forEach((x) => { x.map?.dispose?.(); x.dispose?.(); }); });
      composer.dispose?.(); renderer.dispose(); renderer.domElement.remove();
    };
  }, []);

  return <div ref={host} className={`hs-intro-canvas ${failed ? "is-fallback" : ""}`} />;
}
