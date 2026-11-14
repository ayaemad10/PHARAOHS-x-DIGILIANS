import Link from "next/link";
import { ArrowUpRight } from "lucide-react";

/** One crew card: portrait, name and role, the same for everyone. The whole card opens the profile, where the links are. */
export default function MemberCard({ member, index }) {
  return (
    <article className="fx-member-card group relative">
      <Link href={`/team/${member.slug}`} className="absolute inset-0 z-[1]" aria-label={`Open ${member.name}'s profile`} />
      <div className="relative overflow-hidden rounded-[calc(var(--radius-panel)-4px)]">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img data-member-photo
          src={member.photo}
          alt={member.name}
          loading="lazy"
          className="aspect-[3/4] w-full object-cover object-top transition-transform duration-500 group-hover:scale-[1.04]"
        />
        <span className="fx-member-index">{String(index + 1).padStart(2, "0")}</span>
        <span className="fx-member-open" aria-hidden="true">
          <ArrowUpRight className="size-4" />
        </span>
      </div>
      <div className="fx-member-foot">
        <h3 style={{ color: "var(--fx-ink)" }}>{member.name}</h3>
        <p data-lead={member.role === "Team Leader" ? "true" : undefined}>{member.role}</p>
      </div>
    </article>
  );
}
