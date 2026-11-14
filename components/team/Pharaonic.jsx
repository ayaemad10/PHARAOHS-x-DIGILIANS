/**
 * Pharaonic ornaments for the team identity.
 *
 * Every glyph here is drawn from simple strokes (ankh, eye, sun disc, pyramid, water, reed,
 * scarab) rather than copied from any artwork, and every piece is pure SVG/CSS so it follows the
 * active theme through the --fx-gold / --fx-brand tokens.
 */

const STROKE = { fill: "none", stroke: "currentColor", strokeWidth: 1.6, strokeLinecap: "round", strokeLinejoin: "round" };

export function Ankh({ className = "", size = 24 }) {
  return (
    <svg viewBox="0 0 24 24" width={size} height={size} className={className} aria-hidden="true">
      <g {...STROKE}>
        <ellipse cx="12" cy="6.5" rx="3.6" ry="4.5" />
        <path d="M5 12h14M12 11v11" />
      </g>
    </svg>
  );
}

export function EyeGlyph({ className = "", size = 24 }) {
  return (
    <svg viewBox="0 0 32 24" width={(size * 32) / 24} height={size} className={className} aria-hidden="true">
      <g {...STROKE}>
        <path d="M3 10c5-6 17-6 24 0-7 5-19 5-24 0z" />
        <circle cx="15" cy="9.6" r="2.6" fill="currentColor" />
        <path d="M5 6.5c5-3 15-3.5 22-.5M13 14.5l-1 6M17 14.5c0 3 3 5.5 6 4" />
      </g>
    </svg>
  );
}

export function SunDisc({ className = "", size = 24 }) {
  return (
    <svg viewBox="0 0 24 24" width={size} height={size} className={className} aria-hidden="true">
      <g {...STROKE}>
        <circle cx="12" cy="10" r="4.5" />
        <path d="M2 10c2.5-3 5-3.5 5.5-1M22 10c-2.5-3-5-3.5-5.5-1M9 16l-2 5M15 16l2 5M12 16v6" />
      </g>
    </svg>
  );
}

export function PyramidGlyph({ className = "", size = 24 }) {
  return (
    <svg viewBox="0 0 24 24" width={size} height={size} className={className} aria-hidden="true">
      <g {...STROKE}>
        <path d="M12 3 2 20h20L12 3z" />
        <path d="M12 3l3 17M7 11.5h10M5 15.8h14" opacity="0.6" />
      </g>
    </svg>
  );
}

export function WaterGlyph({ className = "", size = 24 }) {
  return (
    <svg viewBox="0 0 24 24" width={size} height={size} className={className} aria-hidden="true">
      <g {...STROKE}>
        <path d="M2 8l2.5-2 2.5 2 2.5-2 2.5 2 2.5-2 2.5 2 2.5-2 2.5 2M2 14l2.5-2 2.5 2 2.5-2 2.5 2 2.5-2 2.5 2 2.5-2 2.5 2" />
      </g>
    </svg>
  );
}

export function ReedGlyph({ className = "", size = 24 }) {
  return (
    <svg viewBox="0 0 24 24" width={size} height={size} className={className} aria-hidden="true">
      <g {...STROKE}>
        <path d="M12 22V9M12 9c-3-1-4-4-3.5-7 2.5 1 3.5 3.5 3.5 7zM12 9c3-1 4-4 3.5-7-2.5 1-3.5 3.5-3.5 7z" />
      </g>
    </svg>
  );
}

export function ScarabGlyph({ className = "", size = 24 }) {
  return (
    <svg viewBox="0 0 24 24" width={size} height={size} className={className} aria-hidden="true">
      <g {...STROKE}>
        <circle cx="12" cy="4.5" r="2" />
        <ellipse cx="12" cy="14" rx="5" ry="7" />
        <path d="M12 7v14M7 11 3 9M17 11l4-2M7 16l-4 2M17 16l4 2M7 8.5 4 5M17 8.5 20 5" />
      </g>
    </svg>
  );
}

const GLYPHS = [Ankh, EyeGlyph, SunDisc, PyramidGlyph, WaterGlyph, ReedGlyph, ScarabGlyph];

/**
 * A slowly scrolling frieze of glyphs between two gold rules, like a temple border band.
 * The row is rendered twice so the CSS marquee loops without a seam.
 */
export function HieroglyphFrieze({ className = "", size = 18 }) {
  const row = Array.from({ length: 14 }, (_, i) => GLYPHS[i % GLYPHS.length]);
  return (
    <div className={`fx-frieze ${className}`} aria-hidden="true">
      <div className="fx-frieze-track">
        {[...row, ...row].map((G, i) => (
          <G key={i} size={size} />
        ))}
      </div>
    </div>
  );
}

/**
 * The team name inside a royal cartouche: an oval frame closed by a tie bar, the classic way
 * pharaohs' names were written. The name itself is set in a moving gold gradient.
 */
export function Cartouche({ children, className = "", as: Tag = "h1", sub }) {
  return (
    <div className={`fx-cartouche ${className}`}>
      <span className="fx-cartouche-glyphs" aria-hidden="true">
        <Ankh size={16} />
        <EyeGlyph size={14} />
        <SunDisc size={16} />
      </span>
      <Tag className="fx-gold-text font-display font-bold tracking-[0.04em]">{children}</Tag>
      {sub ? <p className="fx-cartouche-sub">{sub}</p> : null}
    </div>
  );
}

/** Gold corner brackets for a photo frame, echoing the console's own bracket corners. */
export function GoldCorners() {
  return (
    <>
      <span className="fx-gold-corner left-2 top-2 border-l-2 border-t-2" aria-hidden="true" />
      <span className="fx-gold-corner right-2 top-2 border-r-2 border-t-2" aria-hidden="true" />
      <span className="fx-gold-corner bottom-2 left-2 border-b-2 border-l-2" aria-hidden="true" />
      <span className="fx-gold-corner bottom-2 right-2 border-b-2 border-r-2" aria-hidden="true" />
    </>
  );
}

/** A low skyline of pyramids under a sun disc, used as the hero horizon. */
export function PyramidHorizon({ className = "" }) {
  return (
    <svg viewBox="0 0 1200 200" preserveAspectRatio="xMidYMax slice" className={className} aria-hidden="true">
      <defs>
        <linearGradient id="fxPyrA" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="var(--fx-gold)" stopOpacity="0.55" />
          <stop offset="1" stopColor="var(--fx-gold)" stopOpacity="0.08" />
        </linearGradient>
        <linearGradient id="fxPyrB" x1="1" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="var(--fx-gold)" stopOpacity="0.28" />
          <stop offset="1" stopColor="var(--fx-gold)" stopOpacity="0.04" />
        </linearGradient>
        <radialGradient id="fxSun" cx="0.5" cy="0.5" r="0.5">
          <stop offset="0" stopColor="var(--fx-gold)" stopOpacity="0.9" />
          <stop offset="1" stopColor="var(--fx-gold)" stopOpacity="0" />
        </radialGradient>
      </defs>
      <circle cx="860" cy="70" r="70" fill="url(#fxSun)" className="fx-sun-pulse" />
      <path d="M560 200 760 40 960 200Z" fill="url(#fxPyrA)" />
      <path d="M760 40 960 200H800Z" fill="url(#fxPyrB)" />
      <path d="M880 200 1010 95 1140 200Z" fill="url(#fxPyrA)" opacity="0.8" />
      <path d="M1010 95 1140 200H1040Z" fill="url(#fxPyrB)" />
      <path d="M440 200 520 135 600 200Z" fill="url(#fxPyrA)" opacity="0.6" />
      <path d="M0 200h1200" stroke="var(--fx-gold)" strokeOpacity="0.35" />
    </svg>
  );
}
