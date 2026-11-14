"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Pause, Play } from "lucide-react";

/**
 * Background music for the Team pages only (the team holds the rights to this track).
 *
 * - Nothing downloads until the visitor presses play (preload="none"). Only a visitor who pressed
 *   play before gets it back automatically, at their first click or key press on a later visit.
 * - It starts quiet (0.15) and fades in over 1.5 s; the slider tops out at 0.6 of full volume;
 *   pausing fades out. A visitor who pauses is remembered, so it stays off next time.
 * - Collapsed it is one 28 px button; the track name and volume appear on hover or keyboard focus.
 */
const KEY = "fx:music";
const START = 0.15;
const MAX = 0.6;
const FADE_IN_MS = 1500;
const FADE_OUT_MS = 400;

export default function TeamMusic() {
  const audio = useRef(null);
  const fade = useRef(0);
  const [playing, setPlaying] = useState(false);
  const [volume, setVolume] = useState(START);
  const [tucked, setTucked] = useState(false);
  const box = useRef(null);
  const target = useRef(START);

  const ramp = useCallback((to, ms, done) => {
    const a = audio.current; if (!a) return;
    cancelAnimationFrame(fade.current);
    const from = a.volume, t0 = performance.now();
    const step = (now) => {
      const k = Math.min(1, (now - t0) / ms);
      a.volume = Math.max(0, Math.min(MAX, from + (to - from) * k));
      if (k < 1) fade.current = requestAnimationFrame(step); else done?.();
    };
    fade.current = requestAnimationFrame(step);
  }, []);

  const start = useCallback(() => {
    const a = audio.current; if (!a) return;
    a.volume = 0;
    a.play().then(() => { setPlaying(true); ramp(target.current, FADE_IN_MS); }).catch(() => {});
  }, [ramp]);

  useEffect(() => {
    const a = audio.current; if (!a) return undefined;
    let wanted = false;
    try { wanted = window.localStorage.getItem(KEY) === "on"; } catch { /* ignore */ }
    const resume = () => { cleanup(); start(); };
    const cleanup = () => { window.removeEventListener("pointerdown", resume); window.removeEventListener("keydown", resume); };
    if (wanted) { window.addEventListener("pointerdown", resume); window.addEventListener("keydown", resume); }
    const fadeRef = fade;
    return () => { cleanup(); cancelAnimationFrame(fadeRef.current); a.pause(); };
  }, [start]);

  /* Never cover a member photo: while one passes under the control, it slides to the screen edge. */
  useEffect(() => {
    let raf = 0;
    const check = () => {
      raf = 0;
      const el = box.current; if (!el) return;
      const r = el.getBoundingClientRect();
      const hit = [...document.querySelectorAll("[data-member-photo]")].some((img) => {
        const p = img.getBoundingClientRect();
        return p.left < r.right + 4 && p.right > r.left - 4 && p.top < r.bottom + 4 && p.bottom > r.top - 4;
      });
      setTucked(hit);
    };
    const onScroll = () => { if (!raf) raf = requestAnimationFrame(check); };
    check();
    window.addEventListener("scroll", onScroll, { passive: true, capture: true });
    window.addEventListener("resize", onScroll);
    return () => { cancelAnimationFrame(raf); window.removeEventListener("scroll", onScroll, { capture: true }); window.removeEventListener("resize", onScroll); };
  }, []);

  const toggle = (e) => {
    e.stopPropagation();
    const a = audio.current; if (!a) return;
    if (a.paused) {
      start();
      try { window.localStorage.setItem(KEY, "on"); } catch { /* ignore */ }
    } else {
      setPlaying(false);
      ramp(0, FADE_OUT_MS, () => a.pause());
      try { window.localStorage.setItem(KEY, "off"); } catch { /* ignore */ }
    }
  };
  const changeVolume = (v) => {
    const next = Math.min(MAX, Math.max(0, v));
    setVolume(next); target.current = next;
    cancelAnimationFrame(fade.current);
    if (audio.current && !audio.current.paused) audio.current.volume = next;
  };

  return (
    <div ref={box} className={`tm-music ${playing ? "is-playing" : ""} ${tucked ? "is-tucked" : ""}`} onPointerDown={(e) => e.stopPropagation()}>
      <audio ref={audio} src="/media/team-theme.mp3" loop preload="none" />
      <button type="button" onClick={toggle} aria-pressed={playing} aria-label={playing ? "Pause music" : "Play music"} title={playing ? "Pause music" : "Play music · Isis Hymn"}>
        {playing ? (
          <span className="tm-eq on" aria-hidden="true"><i /><i /><i /></span>
        ) : (
          <Play className="size-3" aria-hidden="true" />
        )}
        {playing ? <Pause className="tm-pause size-3" aria-hidden="true" /> : null}
      </button>
      <span className="tm-more">
        <span className="tm-label">Isis Hymn</span>
        <input type="range" min={0} max={MAX} step={0.05} value={volume} onChange={(e) => changeVolume(+e.target.value)} aria-label="Music volume" />
      </span>
    </div>
  );
}
