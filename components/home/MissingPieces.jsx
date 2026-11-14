/** The gaps as missing pieces: dashed, empty tiles where evidence should be. Same title and detail for each gap. */
export default function MissingPieces({ gaps }) {
  return (
    <section className="fx-panel p-5" aria-labelledby="gaps-title">
      <p className="fx-label">Calculated from the records</p>
      <h2 id="gaps-title" className="mb-4 font-display text-lg font-semibold text-ink">What the records cannot answer</h2>
      <ul className="fx-pieces">
        {gaps.map((g, k) => (
          <li key={g.id} className={`fx-piece ${g.severity === "High" ? "high" : ""}`} style={{ "--k": k }}>
            <span className="fx-piece-q" aria-hidden="true">?</span>
            {g.severity ? <span className="fx-piece-sev">{g.severity}</span> : null}
            <p className="text-sm font-medium text-ink">{g.title}</p>
            <p className="mt-1 text-xs leading-relaxed text-ink-muted">{g.detail}</p>
          </li>
        ))}
      </ul>
    </section>
  );
}
