"use client";

import { usePauseWhenHidden } from "@/components/team/DemoPlayer";

/** A NASA media clip. The local copy downloads in full once the Demo & media view opens; it pauses when the view closes or the tab is hidden. */
export default function MediaVideo({ local, remote, poster, label }) {
  const ref = usePauseWhenHidden();
  return (
    <video
      ref={ref}
      controls
      playsInline
      muted
      loop
      preload={local ? "auto" : "metadata"}
      poster={poster}
      className="aspect-[3/2] w-full rounded border bg-black object-contain"
      style={{ borderColor: "var(--fx-line)" }}
    >
      <source src={local ?? remote} type="video/mp4" />
      {local ? <source src={remote} type="video/mp4" /> : null}
      {label}
    </video>
  );
}
