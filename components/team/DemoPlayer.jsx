"use client";

import { useEffect, useRef } from "react";
import { Clapperboard } from "lucide-react";
import { TEAM_DEMO, youtubeEmbed } from "@/lib/team";

/**
 * The demo slot. Plays a local file or a YouTube link from TEAM_DEMO in lib/team.js; until one
 * is set it shows a framed "coming soon" placeholder at the same size, so the layout never jumps.
 */
/** Pauses a video when the tab is hidden or the view closes, so nothing keeps decoding in the background. */
export function usePauseWhenHidden() {
  const ref = useRef(null);
  useEffect(() => {
    const v = ref.current;
    const onVis = () => { if (document.hidden) v?.pause(); };
    document.addEventListener("visibilitychange", onVis);
    return () => { document.removeEventListener("visibilitychange", onVis); v?.pause(); };
  }, []);
  return ref;
}

export default function DemoPlayer() {
  const ref = usePauseWhenHidden();
  const embed = youtubeEmbed(TEAM_DEMO.youtube);
  return (
    <div className="fx-demo-frame overflow-hidden rounded-[var(--radius-panel)] border">
      <div className="relative aspect-video w-full bg-black">
        {TEAM_DEMO.src ? (
          <video ref={ref} controls playsInline preload="auto" poster={TEAM_DEMO.poster} className="absolute inset-0 size-full object-contain">
            <source src={TEAM_DEMO.src} type="video/mp4" />
          </video>
        ) : embed ? (
          <iframe
            src={embed}
            title={TEAM_DEMO.title}
            className="absolute inset-0 size-full"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
          />
        ) : (
          <div className="fx-demo-empty absolute inset-0 flex flex-col items-center justify-center gap-3 p-6 text-center">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={TEAM_DEMO.poster} alt="" className="absolute inset-0 size-full object-cover opacity-25 blur-[2px]" />
            <span className="fx-demo-play relative">
              <Clapperboard className="size-7" aria-hidden="true" />
            </span>
            <p className="relative font-display text-lg font-semibold text-white sm:text-xl">Demo video coming soon</p>
            <p className="relative max-w-md text-xs text-white/75 sm:text-sm">
              A walkthrough of the dashboard, Flame Lab, Mission Lab and Firewise AI will play here.
            </p>
          </div>
        )}
      </div>
      <div className="flex items-center justify-between gap-3 px-4 py-3" style={{ background: "var(--fx-panel)" }}>
        <p className="truncate text-sm font-medium" style={{ color: "var(--fx-ink)" }}>{TEAM_DEMO.title}</p>
        {TEAM_DEMO.duration ? <span className="fx-numeric text-xs" style={{ color: "var(--fx-ink-faint)" }}>{TEAM_DEMO.duration}</span> : null}
      </div>
    </div>
  );
}
