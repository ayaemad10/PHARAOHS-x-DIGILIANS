import MediaVideo from "./MediaVideo";
/** Research gaps from the loaded records, plus NASA media with credit and licence. */
export function GapsPanel({ gaps }) {
  return (
    <section className="rounded-md border p-5" style={{ background: "var(--fx-panel)", borderColor: "var(--fx-line)" }}>
      <p className="text-xs uppercase tracking-wider" style={{ color: "var(--fx-ink-faint)" }}>Calculated from the records</p>
      <h2 className="mb-4 text-lg font-semibold" style={{ color: "var(--fx-ink)" }}>What the records cannot answer</h2>
      <ul className="space-y-3">
        {gaps.map((g) => (
          <li key={g.id}>
            <p className="text-sm font-medium" style={{ color: "var(--fx-ink)" }}>{g.title}</p>
            <p className="text-xs" style={{ color: "var(--fx-ink-muted)" }}>{g.detail}</p>
          </li>
        ))}
      </ul>
    </section>
  );
}

/** Media the team ships with the app, keyed by catalogue slug. */
const LOCAL_MEDIA = {
  "saffire-v-ribs": { src: "/media/saffire-v.mp4", poster: "/media/saffire-v-poster.webp" },
};

export function MediaPanel({ media }) {
  return (
    <section className="rounded-md border p-5" style={{ background: "var(--fx-panel)", borderColor: "var(--fx-line)" }}>
      <p className="text-xs uppercase tracking-wider" style={{ color: "var(--fx-ink-faint)" }}>NASA media</p>
      <h2 className="mb-4 text-lg font-semibold" style={{ color: "var(--fx-ink)" }}>Imagery from the programmes</h2>
      <div className="grid gap-4 sm:grid-cols-2">
        {media.map((m) => (
          <figure key={m.slug} className="space-y-2">
            {m.kind === "image" ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={m.file_url} alt={m.title} loading="lazy" className="aspect-[3/2] w-full rounded object-cover" />
            ) : (
              /*
                Real players. A local copy is used where the team keeps one in /public/media so the
                demo still plays offline; otherwise the NASA-hosted file streams directly.
              */
              <MediaVideo
                local={LOCAL_MEDIA[m.slug]?.src}
                remote={m.file_url}
                poster={LOCAL_MEDIA[m.slug]?.poster}
                label={`Video · ${m.duration_s ? `${Math.round(m.duration_s)} s` : ""}`}
              />
            )}
            <figcaption className="text-xs" style={{ color: "var(--fx-ink-muted)" }}>
              <a href={m.page_url} target="_blank" rel="noopener noreferrer" className="underline" style={{ color: "var(--fx-brand)" }}>{m.title}</a>
              <span className="block" style={{ color: "var(--fx-ink-faint)" }}>{m.center} · {m.date_created} · Credit NASA</span>
            </figcaption>
          </figure>
        ))}
      </div>
    </section>
  );
}
