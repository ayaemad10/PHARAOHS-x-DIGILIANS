import { notFound } from "next/navigation";
import MemberProfile from "@/components/team/MemberProfile";
import { TEAM_MEMBERS, getMember } from "@/lib/team";

export function generateStaticParams() {
  return TEAM_MEMBERS.map((m) => ({ slug: m.slug }));
}

export async function generateMetadata({ params }) {
  const { slug } = await params;
  const member = getMember(slug);
  return member
    ? { title: member.name, description: `${member.name} — ${member.role}, PHARAOHS x DIGILIANS.` }
    : { title: "Team member" };
}

export default async function Page({ params }) {
  const { slug } = await params;
  const member = getMember(slug);
  if (!member) notFound();
  return <MemberProfile member={member} />;
}
