import Link from "next/link";
import { ArrowRight, MonitorPlay } from "lucide-react";
import { TEAM } from "@/lib/constants";
import { TEAM_MEMBERS } from "@/lib/team";
import { Cartouche, HieroglyphFrieze, PyramidHorizon } from "./Pharaonic";
import MemberCard from "./MemberCard";

/**
 * Team identity page: a pharaonic hero with the team name in a cartouche, the crew grid (each
 * card opens that member's profile), the demo slot and the team QR.
 */
export default function TeamPage() {
  return (
    <div className="mx-auto max-w-6xl space-y-10 pb-10">
      {/* Hero */}
      <header className="fx-team-hero relative overflow-hidden rounded-[var(--radius-panel)] border">
        <PyramidHorizon className="pointer-events-none absolute inset-x-0 bottom-0 h-28 w-full sm:h-40" />
        <div className="relative grid items-center gap-6 p-5 sm:p-8 lg:grid-cols-[1.1fr_1fr] lg:gap-10">
          <div className="order-2 space-y-4 lg:order-1">
            <span className="fx-chip-gold">Our Team · NASA Space Apps 2026</span>
            <Cartouche className="text-[clamp(1.6rem,5vw,2.9rem)]" sub="Space exploration unit">
              {TEAM.name}
            </Cartouche>
            <p className="max-w-prose text-sm leading-relaxed sm:text-base" style={{ color: "var(--fx-ink-muted)" }}>
              {TEAM.summary}
            </p>
            <div className="flex flex-wrap gap-3 pt-1">
              <a href="#crew" className="fx-btn fx-btn-primary text-sm">
                Meet the crew <ArrowRight className="size-4" aria-hidden="true" />
              </a>
              <Link href="/demo" className="fx-btn fx-btn-ghost text-sm">
                <MonitorPlay className="size-4" aria-hidden="true" /> Watch the demo
              </Link>
            </div>
          </div>
          <div className="order-1 lg:order-2">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="/brand/logo-hero.webp"
              alt={`${TEAM.name} logo`}
              className="fx-logo-float mx-auto w-full max-w-[520px] rounded-[var(--radius-panel)] border"
              style={{ borderColor: "var(--fx-line)" }}
            />
          </div>
        </div>
        <HieroglyphFrieze className="relative border-t" />
      </header>

      {/* Crew */}
      <section id="crew" className="scroll-mt-6 space-y-6">
        <div className="text-center">
          <p className="fx-label" style={{ color: "var(--fx-gold)" }}>The crew</p>
          <h2 className="font-display text-2xl font-semibold sm:text-3xl" style={{ color: "var(--fx-ink)" }}>
            Meet the team behind {TEAM.project.split(":")[0]}
          </h2>
          <p className="mx-auto mt-2 max-w-2xl text-sm" style={{ color: "var(--fx-ink-muted)" }}>
            Six minds, one mission. Tap a card to open that member&apos;s profile and contact links.
          </p>
        </div>
        <ul className="fx-crew-grid">
          {TEAM_MEMBERS.map((m, i) => (
            <li key={m.slug} style={{ "--i": i }}>
              <MemberCard member={m} index={i} />
            </li>
          ))}
        </ul>
      </section>

      {/* Project + QR */}
      <section className="grid gap-6 md:grid-cols-[1fr_220px]">
        <div className="space-y-4 rounded-[var(--radius-panel)] border p-5" style={{ background: "var(--fx-panel)", borderColor: "var(--fx-line)" }}>
          <div>
            <div className="text-xs uppercase tracking-wider" style={{ color: "var(--fx-ink-faint)" }}>Project</div>
            <p className="mt-1" style={{ color: "var(--fx-ink)" }}>{TEAM.project}</p>
          </div>
          <div>
            <div className="text-xs uppercase tracking-wider" style={{ color: "var(--fx-ink-faint)" }}>Challenge</div>
            <p className="mt-1 text-sm" style={{ color: "var(--fx-ink-muted)" }}>{TEAM.challenge}</p>
          </div>
          <div className="text-xs" style={{ color: "var(--fx-ink-faint)" }}>
            Independent challenge entry. Not affiliated with or endorsed by NASA.
          </div>
        </div>
        <aside className="flex flex-col items-center gap-3 rounded-[var(--radius-panel)] border p-4" style={{ background: "var(--fx-panel)", borderColor: "var(--fx-line)" }}>
          <div className="rounded bg-white p-2">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={TEAM.qrImage} alt="QR code linking to team information" className="size-40" />
          </div>
          <a href={TEAM.infoUrl} target="_blank" rel="noopener noreferrer" className="text-xs underline" style={{ color: "var(--fx-brand)" }}>
            Team information link
          </a>
        </aside>
      </section>
    </div>
  );
}
