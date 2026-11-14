import Link from "next/link";
import { ArrowLeft, ArrowRight, Users } from "lucide-react";
import { TEAM } from "@/lib/constants";
import { TEAM_MEMBERS, getNeighbours } from "@/lib/team";
import { Cartouche, GoldCorners, HieroglyphFrieze, PyramidHorizon } from "./Pharaonic";
import ContactLinks from "./ContactLinks";

/** A member's personal profile page: portrait, name cartouche, bio, skills and contact links. */
export default function MemberProfile({ member }) {
  const { index, prev, next } = getNeighbours(member.slug);

  return (
    <div className="mx-auto max-w-5xl space-y-6 pb-10">
      <nav className="flex items-center justify-between gap-3 text-sm">
        <Link href="/team#crew" className="fx-btn fx-btn-ghost">
          <ArrowLeft className="size-4" aria-hidden="true" /> Team
        </Link>
        <span className="fx-numeric text-xs" style={{ color: "var(--fx-ink-faint)" }}>
          {String(index + 1).padStart(2, "0")} / {String(TEAM_MEMBERS.length).padStart(2, "0")}
        </span>
      </nav>

      <article className="fx-team-hero relative overflow-hidden rounded-[var(--radius-panel)] border">
        <PyramidHorizon className="pointer-events-none absolute inset-x-0 bottom-0 h-24 w-full opacity-70 sm:h-32" />
        <div className="relative grid gap-6 p-5 sm:p-8 md:grid-cols-[minmax(220px,320px)_1fr] md:gap-10">
          <div className="fx-portrait relative mx-auto w-full max-w-[240px] sm:max-w-[300px] md:max-w-[320px]">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img data-member-photo src={member.photo} alt={member.name} className="aspect-[3/4] w-full rounded-[var(--radius-panel)] object-cover" />
            <GoldCorners />
          </div>

          <div className="flex flex-col gap-5">
            <div className="space-y-3">
              <span className="fx-chip-gold">{member.role}</span>
              <Cartouche className="text-[clamp(1.5rem,4.5vw,2.5rem)]" sub={member.focus}>
                {member.name}
              </Cartouche>
            </div>

            {member.bio ? <p className="max-w-prose leading-relaxed" style={{ color: "var(--fx-ink-muted)" }}>{member.bio}</p> : null}

            <div>
              <p className="fx-label mb-2">Get in touch</p>
              <ContactLinks links={member.links} />
            </div>

            <p className="mt-auto flex items-center gap-2 text-xs" style={{ color: "var(--fx-ink-faint)" }}>
              <Users className="size-3.5" aria-hidden="true" /> {TEAM.name} · {TEAM.challenge}
            </p>
          </div>
        </div>
        <HieroglyphFrieze className="relative border-t" />
      </article>

      {/* Previous / next member */}
      <div className="grid gap-3 sm:grid-cols-2">
        {[{ m: prev, dir: "Previous", Icon: ArrowLeft }, { m: next, dir: "Next", Icon: ArrowRight }].map(({ m, dir, Icon }) => (
          <Link
            key={dir}
            href={`/team/${m.slug}`}
            className={`fx-member-nav flex items-center gap-3 rounded-[var(--radius-panel)] border p-3 ${dir === "Next" ? "sm:flex-row-reverse sm:text-right" : ""}`}
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img data-member-photo src={m.photo} alt="" className="size-12 rounded-full object-cover object-top" />
            <div className="min-w-0 flex-1">
              <p className="flex items-center gap-1 text-xs sm:inline-flex" style={{ color: "var(--fx-ink-faint)" }}>
                {dir === "Previous" ? <Icon className="size-3" aria-hidden="true" /> : null}
                {dir}
                {dir === "Next" ? <Icon className="size-3" aria-hidden="true" /> : null}
              </p>
              <p className="truncate text-sm font-semibold" style={{ color: "var(--fx-ink)" }}>{m.name}</p>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
