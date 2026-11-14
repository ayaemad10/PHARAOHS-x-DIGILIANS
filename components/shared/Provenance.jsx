/**
 * What kind of thing the reader is looking at. Four kinds, used the same way on every page so a
 * visual animation is never mistaken for a validated simulation:
 *   observed      real experimental observations (sensor values, camera frames, published counts)
 *   replay        a replay of a recorded experiment on its real clock
 *   model         output of the app's model (Flame Lab), not a measurement
 *   illustration  a drawing of published behaviour or a hypothetical scenario
 */
const KINDS = {
  observed: { label: "Real observation", dot: "#4FD18B" },
  replay: { label: "Replay of recorded data", dot: "#4DA3FF" },
  model: { label: "Model output", dot: "#C58CFF" },
  illustration: { label: "Illustration", dot: "transparent" },
};

export default function Provenance({ kind, children, className = "" }) {
  const k = KINDS[kind] ?? KINDS.illustration;
  return (
    <span className={`fx-prov ${className}`} data-kind={kind} title={k.label}>
      <i style={{ "--d": k.dot }} aria-hidden="true" />
      {children ?? k.label}
    </span>
  );
}

export const PROVENANCE_KINDS = KINDS;
