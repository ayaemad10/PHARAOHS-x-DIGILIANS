import TeamMusic from "@/components/team/TeamMusic";

/** The Team pages share one music player, so the track keeps playing between the team page and each profile. */
export default function TeamLayout({ children }) {
  return (
    <>
      {children}
      <TeamMusic />
    </>
  );
}
