/**
 * Team roster.
 *
 * ONE place to edit. The order of this array is the order the members appear on the Team page,
 * in the profile "previous / next" navigation and everywhere else — change the order here to
 * match the video and every page follows.
 *
 * Every member shows the same things: name and role on the card; title, LinkedIn and (where
 * there is one) GitHub on the profile. Keep it uniform: do not fill a field for one member only.
 *
 * Links: leave a value as "" and its button is simply not shown. Fill in any of
 *   email     "name@example.com"         (opens the mail app)
 *   linkedin  "https://www.linkedin.com/in/…"
 *   github    "https://github.com/…"
 *   website   "https://…"
 *   phone     "+20…"                     (opens WhatsApp)
 */
export const TEAM_MEMBERS = [
  {
    slug: "abdelrhman-khaled",
    name: "Abdelrhman Khaled",
    role: "Team Leader",
    focus: "AI Engineer & Data Analyst",
    bio: "",
    photo: "/team/abdelrhman-khaled.webp",
    links: { email: "", linkedin: "https://www.linkedin.com/in/abdelrhman-khaled-abdulmoneam-a95b663ab", github: "", website: "", phone: "" },
  },
  {
    slug: "abdelrahman-osman",
    name: "Abdelrahman Osman",
    role: "Member",
    focus: "Data Analyst & AI Engineer · Chemical Engineering Specialist",
    bio: "",
    photo: "/team/abdelrahman-osman.webp",
    links: { email: "", linkedin: "https://linkedin.com/in/abdelrahman-Ibrahim-ai-data", github: "https://github.com/abdelrahman1999osman-Da", website: "", phone: "" },
  },
  {
    slug: "aisha-alsadani",
    name: "Aisha Alsadani",
    role: "Member",
    focus: "Applied AI & Data Analysis · Business Intelligence · Machine Learning",
    bio: "",
    photo: "/team/aisha-alsadani.webp",
    links: { email: "", linkedin: "https://linkedin.com/in/aishaalsadani", github: "https://github.com/aishaalsadani", website: "", phone: "" },
  },
  {
    slug: "aya-emad",
    name: "Aya Emad",
    role: "Member",
    focus: "Data Analyst · AI Engineer",
    bio: "",
    photo: "/team/aya-emad.webp",
    links: { email: "", linkedin: "https://www.linkedin.com/in/ayaa-emad", github: "https://github.com/ayaemad10", website: "", phone: "" },
  },
  {
    slug: "marwa-baraka",
    name: "Marwa Baraka",
    role: "Member",
    focus: "Data Analyst · Applied AI Specialist",
    bio: "",
    photo: "/team/marwa-baraka.webp",
    links: { email: "", linkedin: "https://www.linkedin.com/in/marwa-barakaai-data", github: "https://github.com/marwaalaa254-wq", website: "", phone: "" },
  },
  {
    slug: "shahd-najeh",
    name: "Shahd Najeh",
    role: "Member",
    focus: "Data & Business Analytics · Program Coordination",
    bio: "",
    photo: "/team/shahd-najeh.webp",
    links: { email: "", linkedin: "https://www.linkedin.com/in/shahd-najeh", github: "https://github.com/shahdnajeh9", website: "", phone: "" },
  },
];

/**
 * Demo video. Put the file in /public/media (for example demo.mp4) and set `src` to
 * "/media/demo.mp4", or paste a YouTube link into `youtube`. Leave both empty and the page shows
 * a "coming soon" slot instead.
 */
export const TEAM_DEMO = {
  src: "/media/demo.mp4",
  youtube: "",
  poster: "/media/demo-poster.webp",
  title: "Flame in Freefall — product demo",
  duration: "0:30",
};

export function getMember(slug) {
  return TEAM_MEMBERS.find((m) => m.slug === slug) ?? null;
}

export function getNeighbours(slug) {
  const i = TEAM_MEMBERS.findIndex((m) => m.slug === slug);
  const n = TEAM_MEMBERS.length;
  return {
    index: i,
    prev: TEAM_MEMBERS[(i - 1 + n) % n],
    next: TEAM_MEMBERS[(i + 1) % n],
  };
}

/** Turns a YouTube watch/share link into an embeddable URL. */
export function youtubeEmbed(url) {
  if (!url) return "";
  const m = url.match(/(?:youtu\.be\/|v=|embed\/|shorts\/)([\w-]{11})/);
  return m ? `https://www.youtube-nocookie.com/embed/${m[1]}` : "";
}
