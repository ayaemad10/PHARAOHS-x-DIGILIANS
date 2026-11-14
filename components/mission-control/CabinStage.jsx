"use client";

import { useEffect, useRef } from "react";
import * as THREE from "three";
import { RoomEnvironment } from "three/addons/environments/RoomEnvironment.js";
import { EffectComposer } from "three/addons/postprocessing/EffectComposer.js";
import { RenderPass } from "three/addons/postprocessing/RenderPass.js";
import { UnrealBloomPass } from "three/addons/postprocessing/UnrealBloomPass.js";
import { OutputPass } from "three/addons/postprocessing/OutputPass.js";
import { createRig, glowSprite, reducedMotion, seeded } from "@/components/scenes/orbit";
import { SENSORS } from "./sensors";

/**
 * The 3D cabin, controlled from outside: the Mission Control experience owns the clock, the
 * sample, the selected sensor and the camera view; this component only draws them.
 * times = absolute detection seconds per sensor id (null = no detection).
 */
const PARTS = [
  { id: "fan", text: "Fan · airflow →", pos: [-2.35, -0.75, -0.4] },
  { id: "sample", text: "Ignition edge", pos: [-1.65, -0.92, -0.4] },
  { id: "screen", text: "NASA Saffire-V footage", pos: [-4.7, 1.5, -2.05] },
];

/* ---------- procedural textures ---------- */
function tex(draw, w, h, repeat) {
  const c = document.createElement("canvas"); c.width = w; c.height = h; draw(c.getContext("2d"), w, h);
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 8;
  if (repeat) { t.wrapS = t.wrapT = THREE.RepeatWrapping; t.repeat.set(...repeat); }
  return t;
}
function rackTexture(seed) {
  const R = seeded(seed);
  return tex((x, w, h) => {
    x.fillStyle = "#d9d6cc"; x.fillRect(0, 0, w, h);
    const cols = 2, rows = 3, pw = w / cols, ph = h / rows;
    for (let i = 0; i < cols; i++) for (let j = 0; j < rows; j++) {
      const px = i * pw, py = j * ph, shade = 205 + Math.floor(R() * 25);
      x.fillStyle = `rgb(${shade},${shade - 2},${shade - 8})`; x.fillRect(px + 4, py + 4, pw - 8, ph - 8);
      x.strokeStyle = "rgba(60,55,45,.55)"; x.lineWidth = 3; x.strokeRect(px + 4, py + 4, pw - 8, ph - 8);
      x.fillStyle = "rgba(90,85,75,.8)"; [[12, 12], [pw - 16, 12], [12, ph - 16], [pw - 16, ph - 16]].forEach(([a, b]) => { x.beginPath(); x.arc(px + a, py + b, 3, 0, 7); x.fill(); });
      if (R() > 0.45) { x.fillStyle = R() > 0.5 ? "#1e3f78" : "#e2e2dc"; x.fillRect(px + 20, py + 22, 46 + R() * 40, 12); x.fillStyle = "rgba(255,255,255,.8)"; x.fillRect(px + 24, py + 26, 30, 4); }
      if (R() > 0.6) { x.fillStyle = "#6e6a60"; x.fillRect(px + pw * 0.3, py + ph * 0.55, pw * 0.4, 10); }
      if (R() > 0.7) { x.fillStyle = "#3b6db3"; x.fillRect(px + pw - 40, py + ph * 0.4, 18, 30); }
    }
  }, 512, 512);
}
function fabricTexture() {
  return tex((x, w, h) => {
    x.fillStyle = "#cdbf9c"; x.fillRect(0, 0, w, h);
    for (let y = 0; y < h; y += 3) { x.fillStyle = `rgba(90,70,40,${0.05 + (y % 6 === 0 ? 0.05 : 0)})`; x.fillRect(0, y, w, 1); }
    for (let xx = 0; xx < w; xx += 3) { x.fillStyle = "rgba(255,255,255,.04)"; x.fillRect(xx, 0, 1, h); }
  }, 512, 256);
}

/* ---------- low-gravity flame shader ---------- */
const flameVS = `varying vec2 vUv; void main(){ vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position,1.0); }`;
const flameFS = `
uniform float uTime; uniform float uIntensity; varying vec2 vUv;
float h(vec2 p){ return fract(sin(dot(p, vec2(127.1,311.7))) * 43758.5453); }
float n(vec2 p){ vec2 i=floor(p), f=fract(p); f=f*f*(3.-2.*f); return mix(mix(h(i),h(i+vec2(1,0)),f.x), mix(h(i+vec2(0,1)),h(i+vec2(1,1)),f.x), f.y); }
float fbm(vec2 p){ float v=0., a=.5; for(int i=0;i<5;i++){ v+=a*n(p); p*=2.03; a*=.5; } return v; }
void main(){
  // x: 0 = leading edge (upstream), 1 = tail (downstream). y: across the sample.
  vec2 uv = vUv; float x = uv.x, y = uv.y - .5;
  float flow = fbm(vec2(x*3. - uTime*1.6, y*6. + uTime*.4));
  float width = .42 * (1. - pow(x, 1.4)) + .04;
  float body = smoothstep(width, width*.25, abs(y) + (flow-.5)*.18);
  float tail = smoothstep(1., .15, x + (flow-.5)*.35);
  float a = body * tail * smoothstep(0., .06, x);
  float blue = smoothstep(.42, 0., x) * a;
  vec3 col = mix(vec3(1.0,.62,.18), vec3(1.0,.9,.62), smoothstep(.2,.9,a));
  col = mix(col, vec3(.25,.45,1.), blue*.85);
  col *= 1.4 + flow*.8;
  gl_FragColor = vec4(col, a * uIntensity);
}`;


const FX_OFF = { fan: 1, flame: 1, gas: null };

export default function CabinStage({ t, ig, times, spreads, focus, view, onPick, showParts = true, fx, paused = false }) {
  const host = useRef(null), canvasRef = useRef(null), labels = useRef({}), api = useRef({});
  useEffect(() => { api.current.state = { t, times, ig, spreads, step: showParts ? 0 : 2, fx }; });
  useEffect(() => { api.current.onPick = onPick; }, [onPick]);
  // Stop drawing while a sheet covers the cabin (or the tab is hidden): the GPU is then free for the video and the sheets.
  useEffect(() => { api.current.paused = paused; if (!paused) api.current.wake?.(); }, [paused]);
  useEffect(() => { api.current.focus?.(focus); }, [focus]);
  useEffect(() => { api.current.wantView = view; if (!focus) api.current.view?.(view); }, [view, focus]);

  useEffect(() => {
    const canvas = canvasRef.current, box = host.current; if (!canvas || !box) return undefined;
    let renderer;
    try { renderer = new THREE.WebGLRenderer({ canvas, antialias: true, powerPreference: "high-performance" }); } catch { return undefined; }
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.6));
    renderer.toneMapping = THREE.ACESFilmicToneMapping; renderer.toneMappingExposure = 0.72;
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.shadowMap.enabled = true; renderer.shadowMap.type = THREE.PCFSoftShadowMap;

    const scene = new THREE.Scene(); scene.background = new THREE.Color(0x0b0a0e);
    const pmrem = new THREE.PMREMGenerator(renderer);
    scene.environment = pmrem.fromScene(new RoomEnvironment(), 0.04).texture; scene.environmentIntensity = 0.32;
    const camera = new THREE.PerspectiveCamera(40, 1, 0.05, 100);
    const ctl = createRig(camera, canvas, { yaw: 0.3, pitch: 0.14, dist: 13, min: 3, max: 34, target: [0.6, 0, -0.3] });
    const disposables = [];

    // ---- module interior: back wall, ceiling, floor of rack panels; front cut away ----
    const L = 14, H = 2.2, D = 2.1;
    const rack = (seed, w, h, rep) => { const t = rackTexture(seed); t.wrapS = t.wrapT = THREE.RepeatWrapping; t.repeat.set(rep, 1); disposables.push(t);
      return new THREE.MeshStandardMaterial({ map: t, roughness: 0.62, metalness: 0.05 }); };
    const wall = (geo, mat, pos, rot) => { const m = new THREE.Mesh(geo, mat); m.position.set(...pos); m.rotation.set(...rot); m.receiveShadow = true; scene.add(m); return m; };
    wall(new THREE.PlaneGeometry(L, H * 2), rack(3, L, H * 2, 7), [0.6, 0, -D], [0, 0, 0]);
    wall(new THREE.PlaneGeometry(L, D * 2), rack(9, L, D * 2, 7), [0.6, H, 0], [Math.PI / 2, 0, 0]);
    wall(new THREE.PlaneGeometry(L, D * 2), rack(17, L, D * 2, 7), [0.6, -H, 0], [-Math.PI / 2, 0, 0]);
    // chamfered corners like an ISS module
    const cham = new THREE.MeshStandardMaterial({ color: 0xbab5a8, roughness: 0.5, metalness: 0.2 });
    [[H - 0.25, -D + 0.25, Math.PI / 4], [-H + 0.25, -D + 0.25, -Math.PI / 4]].forEach(([y, z, r]) => wall(new THREE.PlaneGeometry(L, 0.72), cham, [0.6, y, z], [r > 0 ? Math.PI / 4 : -Math.PI / 4, 0, 0]));
    // end bulkhead with a hatch
    const bulk = new THREE.Mesh(new THREE.PlaneGeometry(D * 2, H * 2), new THREE.MeshStandardMaterial({ color: 0xc9c4b8, roughness: 0.55 })); bulk.position.set(-6.4, 0, 0); bulk.rotation.y = Math.PI / 2; scene.add(bulk);
    const hatch = new THREE.Mesh(new THREE.TorusGeometry(1.15, 0.09, 16, 64), new THREE.MeshStandardMaterial({ color: 0x9a9a98, metalness: 0.9, roughness: 0.3 })); hatch.position.set(-6.38, 0, 0); hatch.rotation.y = Math.PI / 2; scene.add(hatch);
    const hole = new THREE.Mesh(new THREE.CircleGeometry(1.1, 48), new THREE.MeshBasicMaterial({ color: 0x15130f })); hole.position.set(-6.37, 0, 0); hole.rotation.y = Math.PI / 2; scene.add(hole);
    // handrails (yellow) with standoffs
    const railMat = new THREE.MeshStandardMaterial({ color: 0xd9a92a, roughness: 0.35, metalness: 0.2 });
    [[-1.3], [0.9]].forEach(([y]) => { const r = new THREE.Mesh(new THREE.CylinderGeometry(0.035, 0.035, 9, 12), railMat); r.rotation.z = Math.PI / 2; r.position.set(0.6, y, -D + 0.12); r.castShadow = true; scene.add(r);
      for (let x = -3.5; x <= 4.5; x += 2) { const s = new THREE.Mesh(new THREE.CylinderGeometry(0.025, 0.025, 0.12, 8), railMat); s.rotation.x = Math.PI / 2; s.position.set(x, y, -D + 0.06); scene.add(s); } });
    // ceiling light strips + real lights
    const stripMat = new THREE.MeshStandardMaterial({ color: 0xfffaf0, emissive: 0xfff4dc, emissiveIntensity: 1.4 });
    [-3.5, 0.6, 4.7].forEach((x) => {
      const s = new THREE.Mesh(new THREE.BoxGeometry(1.6, 0.03, 0.32), stripMat); s.position.set(x, H - 0.02, -0.4); scene.add(s);
      const l = new THREE.SpotLight(0xfff1dc, 4.5, 9, 1.0, 0.7, 1.6); l.position.set(x, H - 0.1, -0.4); l.target.position.set(x, -H, -0.4); l.castShadow = x === 0.6; l.shadow.mapSize.set(1024, 1024); scene.add(l); scene.add(l.target);
    });
    scene.add(new THREE.AmbientLight(0xbfb7a6, 0.15));
    // cables along the ceiling edge
    const cableMat = new THREE.MeshStandardMaterial({ color: 0x2b2b2e, roughness: 0.7 });
    [0, 0.07, 0.14].forEach((dz, i) => { const c = new THREE.Mesh(new THREE.CylinderGeometry(0.018, 0.018, 12, 8), cableMat); c.rotation.z = Math.PI / 2; c.position.set(0.6, H - 0.35 - i * 0.03, -D + 0.32 + dz); scene.add(c); });

    // ---- wall monitor with real NASA footage ----
    const video = document.createElement("video");
    video.src = "/media/saffire-v.mp4"; video.muted = true; video.loop = true; video.playsInline = true; video.crossOrigin = "anonymous";
    video.play().catch(() => {});
    const vt = new THREE.VideoTexture(video); vt.colorSpace = THREE.SRGBColorSpace;
    const screenFrame = new THREE.Mesh(new THREE.BoxGeometry(1.9, 1.15, 0.06), new THREE.MeshStandardMaterial({ color: 0x1b1b1d, metalness: 0.6, roughness: 0.4 }));
    screenFrame.position.set(-4.7, 0.85, -D + 0.05); scene.add(screenFrame);
    const screen = new THREE.Mesh(new THREE.PlaneGeometry(1.76, 1.02), new THREE.MeshBasicMaterial({ map: vt, toneMapped: false }));
    screen.position.set(-4.7, 0.85, -D + 0.085); scene.add(screen);
    disposables.push(vt);

    // ---- SAFFIRE flow unit: aluminium frame + polycarbonate windows ----
    const alu = new THREE.MeshStandardMaterial({ color: 0xb8bcc2, metalness: 0.95, roughness: 0.32 });
    const unit = new THREE.Group(); scene.add(unit);
    const W = 4.2, UH = 1.9, UD = 0.9;
    [[0, UH / 2, 0, W, 0.06, UD], [0, -UH / 2, 0, W, 0.06, UD]].forEach(([x, y, z, a, b, c]) => { const m = new THREE.Mesh(new THREE.BoxGeometry(a, b, c), alu); m.position.set(x, y, z); m.castShadow = true; unit.add(m); });
    [[-W / 2, 0, UD / 2], [W / 2, 0, UD / 2], [-W / 2, 0, -UD / 2], [W / 2, 0, -UD / 2]].forEach(([x, y, z]) => { const m = new THREE.Mesh(new THREE.BoxGeometry(0.06, UH, 0.06), alu); m.position.set(x, y, z); unit.add(m); });
    const glass = new THREE.MeshPhysicalMaterial({ color: 0xffffff, metalness: 0, roughness: 0.05, transmission: 0.92, thickness: 0.02, ior: 1.58, transparent: true, opacity: 0.35 });
    const back = new THREE.Mesh(new THREE.BoxGeometry(W, UH, 0.02), new THREE.MeshStandardMaterial({ color: 0x2a2b2e, roughness: 0.7, metalness: 0.3 })); back.position.z = -UD / 2; back.receiveShadow = true; unit.add(back);
    const front = new THREE.Mesh(new THREE.PlaneGeometry(W, UH), glass); front.position.z = UD / 2; unit.add(front);
    // fan housing upstream
    const fan = new THREE.Mesh(new THREE.CylinderGeometry(0.6, 0.6, 0.25, 32), alu); fan.rotation.z = Math.PI / 2; fan.position.set(-W / 2 - 0.13, 0, 0); unit.add(fan);
    const blades = new THREE.Mesh(new THREE.CylinderGeometry(0.5, 0.5, 0.03, 6), new THREE.MeshStandardMaterial({ color: 0x333, metalness: 0.8, roughness: 0.4 })); blades.rotation.z = Math.PI / 2; blades.position.set(-W / 2 - 0.27, 0, 0); unit.add(blades);
    unit.position.set(0, 0, -0.4);

    // sample card (fabric) — repainted as the flame front moves
    const fab = fabricTexture(); disposables.push(fab);
    const cv = document.createElement("canvas"); cv.width = 512; cv.height = 256; const cx = cv.getContext("2d");
    const cardTex = new THREE.CanvasTexture(cv); cardTex.colorSpace = THREE.SRGBColorSpace; disposables.push(cardTex);
    const card = new THREE.Mesh(new THREE.PlaneGeometry(3.3, 1.45), new THREE.MeshStandardMaterial({ map: cardTex, roughness: 0.95, side: THREE.DoubleSide }));
    card.position.set(0, 0, -0.4); card.receiveShadow = true; scene.add(card);
    const holder = new THREE.Mesh(new THREE.BoxGeometry(3.42, 1.55, 0.03), alu); holder.position.set(0, 0, -0.42); scene.add(holder);
    const fabImg = fab.image;
    const paint = (front, burning) => {
      cx.drawImage(fabImg, 0, 0, 512, 256);
      if (front > 0) { const g = cx.createLinearGradient(0, 0, front * 512, 0); g.addColorStop(0, "#0d0a07"); g.addColorStop(Math.max(0, 1 - 30 / (front * 512 + 1)), "#1a1209"); g.addColorStop(1, "#4a2c12"); cx.fillStyle = g; cx.fillRect(0, 0, front * 512, 256); }
      if (burning) { const fx = front * 512, g = cx.createLinearGradient(fx - 26, 0, fx + 12, 0); g.addColorStop(0, "rgba(255,90,20,0)"); g.addColorStop(0.7, "rgba(255,150,50,.9)"); g.addColorStop(1, "rgba(255,210,120,0)"); cx.fillStyle = g; cx.fillRect(fx - 26, 0, 38, 256); }
      cardTex.needsUpdate = true;
    };
    paint(0, false);

    // flame: shader sheet standing off the card, leaning downstream (+x)
    const flameMat = new THREE.ShaderMaterial({ vertexShader: flameVS, fragmentShader: flameFS, uniforms: { uTime: { value: 0 }, uIntensity: { value: 0 } }, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, side: THREE.DoubleSide });
    const flame = new THREE.Mesh(new THREE.PlaneGeometry(1.1, 1.5), flameMat); scene.add(flame);
    const flame2 = flame.clone(); flame2.rotation.y = Math.PI / 2.4; scene.add(flame2);
    const flameLight = new THREE.PointLight(0xff8a2a, 0, 6, 1.6); flameLight.castShadow = true; flameLight.shadow.mapSize.set(512, 512); scene.add(flameLight);
    const glow = new THREE.Sprite(new THREE.SpriteMaterial({ map: glowSprite(), color: 0xff7a2a, transparent: true, opacity: 0, blending: THREE.AdditiveBlending, depthWrite: false })); glow.scale.set(2.4, 2, 1); scene.add(glow);

    // smoke: soft grey particles drifting downstream, hot near the flame
    const smokeSprite = tex((x, w, h) => { const g = x.createRadialGradient(w / 2, h / 2, 0, w / 2, h / 2, w / 2); g.addColorStop(0, "rgba(255,255,255,.55)"); g.addColorStop(1, "rgba(255,255,255,0)"); x.fillStyle = g; x.fillRect(0, 0, w, h); }, 64, 64); disposables.push(smokeSprite);
    const NS = 140, sp = new Float32Array(NS * 3), sseed = []; for (let i = 0; i < NS; i++) sseed.push([Math.random(), (Math.random() - 0.5) * 1.2, (Math.random() - 0.5) * 0.5]);
    const sg = new THREE.BufferGeometry(); sg.setAttribute("position", new THREE.BufferAttribute(sp, 3));
    const smoke = new THREE.Points(sg, new THREE.PointsMaterial({ map: smokeSprite, color: 0x8d857a, size: 0.55, transparent: true, opacity: 0, depthWrite: false })); scene.add(smoke);

    // sensors: small instrument boxes with a lens and a status LED
    const sens = {};
    SENSORS.forEach((s) => {
      const g = new THREE.Group(); g.position.set(...s.pos);
      const body = new THREE.Mesh(new THREE.BoxGeometry(0.22, 0.16, 0.16), new THREE.MeshStandardMaterial({ color: 0x2c2f35, metalness: 0.7, roughness: 0.35 })); body.castShadow = true;
      const lens = new THREE.Mesh(new THREE.SphereGeometry(0.05, 20, 14), new THREE.MeshPhysicalMaterial({ color: 0x223344, metalness: 0, roughness: 0.02, clearcoat: 1 })); lens.position.z = 0.09;
      const led = new THREE.Mesh(new THREE.SphereGeometry(0.022, 10, 8), new THREE.MeshBasicMaterial({ color: 0x3a3440, toneMapped: false })); led.position.set(0.08, 0.06, 0.08);
      const hit = new THREE.Mesh(new THREE.SphereGeometry(0.35, 8, 8), new THREE.MeshBasicMaterial({ visible: false })); hit.userData.id = s.id;
      g.add(body, lens, led, hit); g.lookAt(0, 0, -0.4); scene.add(g);
      const beam = new THREE.Line(new THREE.BufferGeometry().setFromPoints([new THREE.Vector3(...s.pos), new THREE.Vector3(0, 0, -0.4)]), new THREE.LineDashedMaterial({ color: s.color, dashSize: 0.08, gapSize: 0.06, transparent: true, opacity: 0 }));
      beam.computeLineDistances(); scene.add(beam);
      sens[s.id] = { g, led, hit, beam, def: s };
    });

    // post-processing: bloom so the flame and lights glow like a camera sees them
    const composer = new EffectComposer(renderer);
    composer.addPass(new RenderPass(scene, camera));
    const bloom = new UnrealBloomPass(new THREE.Vector2(512, 512), 0.45, 0.5, 0.9); composer.addPass(bloom);
    composer.addPass(new OutputPass());

    const ray = new THREE.Raycaster(), ndc = new THREE.Vector2();
    const pick = (e) => { const b = canvas.getBoundingClientRect(); ndc.set(((e.clientX - b.left) / b.width) * 2 - 1, -((e.clientY - b.top) / b.height) * 2 + 1); ray.setFromCamera(ndc, camera); return ray.intersectObjects(Object.values(sens).map((x) => x.hit), false)[0]?.object.userData.id ?? null; };
    const onMove = (e) => { if (!ctl.dragging) canvas.style.cursor = pick(e) ? "pointer" : "grab"; };
    const onUp = (e) => { const d = ctl.endDrag(); if (d && d.moved > 6) return; api.current.onPick?.(pick(e)); };
    canvas.addEventListener("pointermove", onMove); canvas.addEventListener("pointerup", onUp);
    api.current.view = (name) => {
      const narrow = box.clientWidth < 640;
      if (name === "sample") ctl.flyTo(new THREE.Vector3(-0.4, 0, -0.4), narrow ? 8 : 6.2);
      else if (name === "sensors") ctl.flyTo(new THREE.Vector3(1.6, 0.3, -0.3), narrow ? 15 : 12.5);
      else if (name === "full") {
        // pull back until the whole cabin (14 long, 2.2 high) sits inside the frame with a margin
        const vf = THREE.MathUtils.degToRad(camera.fov) / 2, hf = Math.atan(Math.tan(vf) * camera.aspect);
        api.current.fullDist = Math.min(34, Math.max(9.4 / Math.tan(hf) + 2.6, 2.9 / Math.tan(vf) + 2.6));
        ctl.flyTo(new THREE.Vector3(0, -0.15, -0.6), api.current.fullDist);
        ctl.goal.pitch = 0.2;
      }
      else ctl.flyTo(new THREE.Vector3(0.6, 0, -0.3), narrow ? 16 : 13);
      api.current.viewName = name;
    };
    api.current.focus = (id) => {
      // in the whole-cabin view a picked sensor only draws the camera a little closer, so the model stays in frame
      if (api.current.viewName === "full") { if (id && sens[id]) ctl.flyTo(sens[id].g.position.clone().multiplyScalar(0.25).add(new THREE.Vector3(0, -0.15, -0.6)), api.current.fullDist * 0.86); return; }
      if (id && sens[id]) ctl.flyTo(sens[id].g.position.clone().lerp(new THREE.Vector3(0.6, 0, -0.4), 0.6), 7.5); else ctl.flyTo(new THREE.Vector3(0.6, 0, -0.3), box.clientWidth < 640 ? 13 : 9.5); };

    const resize = () => { const w = box.clientWidth, h = box.clientHeight; renderer.setSize(w, h, false); composer.setSize(w, h); camera.aspect = w / h; camera.updateProjectionMatrix(); if (w < 640) ctl.goal.dist = 13; if (api.current.viewName === "full") api.current.view("full"); };
    const ro = new ResizeObserver(resize); ro.observe(box); resize();
    if (api.current.wantView === "full") { api.current.view("full"); ctl.rig.dist = ctl.goal.dist; ctl.rig.pitch = ctl.goal.pitch; ctl.rig.target.copy(ctl.goal.target); }

    let clock = 0, last = performance.now(), raf = 0, on = true, lastFront = -1, lastBurn = null;
    const awake = () => on && !api.current.paused && !document.hidden;
    const wake = () => { if (awake() && !raf) { last = performance.now(); raf = requestAnimationFrame(loop); video.play().catch(() => {}); } };
    api.current.wake = wake;
    const onVis = () => wake();
    document.addEventListener("visibilitychange", onVis);
    const io = new IntersectionObserver(([en]) => { on = en.isIntersecting; if (on) wake(); else video.pause(); }); io.observe(box);
    const v = new THREE.Vector3();
    const cur = { fan: 1, flame: 1, gas: 0 };
    const placed = [];
    function loop(now) {
      if (!awake()) { raf = 0; video.pause(); return; }
      const dt = Math.min(0.05, (now - last) / 1000); last = now; if (!reducedMotion()) clock += dt;
      const st = api.current.state; if (!st) { raf = requestAnimationFrame(loop); return; }
      const since = st.t - st.ig, burning = since >= 0;
      const front = !burning ? 0 : st.spreads ? Math.min(0.94, 0.03 + since * 0.012) : 0.03;
      if (Math.abs(front - lastFront) > 0.002 || burning !== lastBurn) { paint(front, burning); lastFront = front; lastBurn = burning; }
      // Fire Response effects (illustrative): fan speed, flame strength and a suppressant haze ease toward their targets
      const want = st.fx || FX_OFF;
      cur.fan += ((want.fan ?? 1) - cur.fan) * Math.min(1, dt * 1.6); cur.flame += ((want.flame ?? 1) - cur.flame) * Math.min(1, dt * 1.2); cur.gas += ((want.gas ? 1 : 0) - cur.gas) * Math.min(1, dt * 1.5);
      const fx = -1.65 + front * 3.3, k = (burning ? Math.min(1, since * 1.5 + 0.2) * (st.spreads ? 1 : 0.55) : 0) * cur.flame;
      [flame, flame2].forEach((f) => { f.position.set(fx + 0.5, 0, -0.32); });
      flameMat.uniforms.uTime.value = clock; flameMat.uniforms.uIntensity.value = k * 0.8;
      flameLight.position.set(fx + 0.2, 0, -0.05); flameLight.intensity = k * (3 + Math.sin(clock * 13) * 0.8 + Math.sin(clock * 7.3) * 0.6);
      glow.position.set(fx + 0.3, 0, -0.2); glow.material.opacity = k * 0.35;
      blades.rotation.x += dt * 10 * cur.fan;
      // smoke flows downstream from the flame
      sseed.forEach((p, i) => { const age = (p[0] + clock * (0.05 + 0.13 * cur.fan)) % 1, still = 1 - cur.fan; sp[i * 3] = fx + 0.2 + age * (5.5 * cur.fan + p[1] * 1.6 * still); sp[i * 3 + 1] = p[1] * (0.3 + age * (1.1 + still * 0.9)) + age * 0.25 * cur.fan; sp[i * 3 + 2] = -0.35 + p[2] * (0.3 + age * (1 + still)); });
      sg.attributes.position.needsUpdate = true; smoke.material.opacity = Math.max(cur.gas * 0.5, burning ? Math.min(0.45, since * 0.06) * (st.spreads ? 1 : 0.4) : 0);
      smoke.material.color.setRGB(0.553 + (0.72 - 0.553) * cur.gas, 0.522 + (0.86 - 0.522) * cur.gas, 0.478 + (1 - 0.478) * cur.gas);
      // sensors light at their measured second
      const b = canvas.getBoundingClientRect();
      Object.entries(sens).forEach(([id, s]) => {
        const tt = st.times[id], lit = tt != null && st.t >= tt;
        s.led.material.color.setHex(lit ? s.def.color : 0x3a3440); s.led.scale.setScalar(lit ? 1.6 + Math.sin(clock * 6) * 0.3 : 1);
        s.beam.material.opacity = lit ? 0.55 : 0;
        const el = labels.current[id];
        if (el && false) { v.copy(s.g.position); v.y += 0.2; v.project(camera); el.style.transform = `translate(${(v.x * 0.5 + 0.5) * b.width}px, ${(-v.y * 0.5 + 0.5) * b.height}px) translate(-50%, -100%)`; el.style.opacity = v.z < 1 ? 1 : 0; el.dataset.lit = lit; }
      });
      [...SENSORS.map((x) => [x.id, sens[x.id].g.position, 0.2]), ...PARTS.map((x) => [x.id, new THREE.Vector3(...x.pos), 0])].forEach(([id, p, dy]) => {
        const el = labels.current[id]; if (!el) return;
        v.copy(p); v.y += dy; v.project(camera);
        el.style.transform = `translate(${(v.x * 0.5 + 0.5) * b.width}px, ${(-v.y * 0.5 + 0.5) * b.height}px) translate(-50%, -100%)`;
        const sd = SENSORS.find((x) => x.id === id); if (sd) { const tt = st.times[id]; el.dataset.lit = tt != null && st.t >= tt; }
        const show = v.z < 1 && !(!sd && st.step >= 2);
        placed.push([el, (v.x * 0.5 + 0.5) * b.width, (-v.y * 0.5 + 0.5) * b.height, !sd, show]);
      });
      // Labels never sit on top of each other: sensors keep their place, a part label that would overlap
      // is hidden (on a phone an overlapping sensor label is hidden too). Opacity is set once per frame,
      // so a hidden label does not flicker through its CSS fade.
      const kept = [];
      placed.forEach(([el, x, y, isPart, show]) => {
        let visible = show;
        if (visible) {
          const w = el.offsetWidth || 80, h = el.offsetHeight || 20;
          const hit = kept.some(([kx, ky, kw, kh]) => Math.abs(kx - x) < (kw + w) / 2 + 2 && Math.abs(ky - y) < (kh + h) / 2 + 1);
          if (hit && (isPart || b.width < 640)) visible = false; else kept.push([x, y, w, h]);
        }
        const o = visible ? "1" : "0";
        if (el.style.opacity !== o) el.style.opacity = o;
        el.style.pointerEvents = visible ? "" : "none";
      });
      placed.length = 0;
      if (!ctl.userMoved && !reducedMotion()) ctl.goal.yaw = api.current.viewName === "full" ? 0.16 + Math.sin(clock * 0.07) * 0.08 : 0.35 + Math.sin(clock * 0.07) * 0.22;
      ctl.update(dt); composer.render(); raf = requestAnimationFrame(loop);
    }
    raf = requestAnimationFrame(loop);
    return () => { cancelAnimationFrame(raf); document.removeEventListener("visibilitychange", onVis); ro.disconnect(); io.disconnect(); ctl.dispose(); canvas.removeEventListener("pointermove", onMove); canvas.removeEventListener("pointerup", onUp);
      video.pause(); video.removeAttribute("src"); disposables.forEach((d) => d.dispose()); pmrem.dispose(); composer.dispose?.(); renderer.dispose(); };
  }, []);

  return (
    <div ref={host} className="mc-stage">
      <canvas ref={canvasRef} className="absolute inset-0 size-full touch-none" aria-label="3D cutaway of the spacecraft cabin: burning sample, airflow and five sensors" />
      {SENSORS.map((s) => (
        <button key={s.id} ref={(el) => { labels.current[s.id] = el; }} type="button" className="fx-cabin-label" onClick={() => onPick?.(focus === s.id ? null : s.id)} style={{ "--c": s.css }} aria-pressed={focus === s.id}>
          {s.short}
        </button>
      ))}
      {PARTS.map((p) => (
        <span key={p.id} ref={(el) => { labels.current[p.id] = el; }} className="fx-cabin-part">{p.text}</span>
      ))}
    </div>
  );
}
