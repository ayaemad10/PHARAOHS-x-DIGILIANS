/**
 * The letter A as the app's own mark.
 *
 * A black disc with a gold, pyramid-shaped A: the letter's triangle with a counter, a cyan uraeus
 * at the apex and papyrus-style baselines. Pure SVG, so it scales cleanly in the rail.
 */
import { useId } from "react";

export default function PharaohA({ size = 32, className = "" }) {
  // Unique per instance: a shared id breaks when another copy sits inside a hidden (display:none) rail.
  const gid = `pharaoh-a-gold-${useId().replace(/:/g, "")}`;
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 64 64"
      role="img"
      aria-label="A"
      className={className}
    >
      <defs>
        <linearGradient id={gid} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#E8C766" />
          <stop offset="1" stopColor="#B8891C" />
        </linearGradient>
      </defs>
      <circle cx="32" cy="32" r="31" fill="#050505" stroke="#C9A227" strokeWidth="1.2" />
      <circle cx="32" cy="32" r="27.5" fill="none" stroke="#00E5FF" strokeOpacity="0.35" strokeWidth="0.8" />
      <path
        fill={`url(#${gid})`}
        fillRule="evenodd"
        d="M32 13 L51 50 L43 50 L39 42 L25 42 L21 50 L13 50 Z M32 24.5 L35.6 33.5 L28.4 33.5 Z"
      />
      <path d="M32 9.2 L33.4 11.6 L30.6 11.6 Z" fill="#00E5FF" />
      <path d="M16 54 H48" stroke="#C9A227" strokeWidth="1" strokeLinecap="round" />
      <path d="M20 57 H44" stroke="#00E5FF" strokeOpacity="0.6" strokeWidth="0.8" strokeLinecap="round" />
    </svg>
  );
}
