import { Code2, Globe, Mail, MessageCircle } from "lucide-react";

/** LinkedIn has no icon in this lucide build, so it gets a small typeset "in" mark. */
function InMark({ className }) {
  return (
    <span className={`${className} inline-flex items-center justify-center text-[11px] font-bold leading-none`} aria-hidden="true">
      in
    </span>
  );
}

const KINDS = [
  { key: "email", label: "Email", Icon: Mail, href: (v) => `mailto:${v}` },
  { key: "linkedin", label: "LinkedIn", Icon: InMark, href: (v) => v },
  { key: "github", label: "GitHub", Icon: Code2, href: (v) => v },
  { key: "website", label: "Website", Icon: Globe, href: (v) => v },
  { key: "phone", label: "WhatsApp", Icon: MessageCircle, href: (v) => `https://wa.me/${v.replace(/[^\d]/g, "")}` },
];

/**
 * Contact buttons for a member. Only the links that have been filled in (lib/team.js) are drawn,
 * so an empty profile never shows dead buttons.
 *
 * @param {{links: object, compact?: boolean}} props compact = icon-only (cards); otherwise labelled.
 */
export default function ContactLinks({ links = {}, compact = false }) {
  const items = KINDS.filter((k) => links[k.key]);
  if (!items.length) {
    return compact ? null : (
      <p className="text-sm" style={{ color: "var(--fx-ink-faint)" }}>Contact links coming soon.</p>
    );
  }
  return (
    <div className={`flex flex-wrap ${compact ? "gap-1.5" : "gap-2"}`}>
      {items.map(({ key, label, Icon, href }) => {
        const url = href(links[key]);
        const external = !url.startsWith("mailto:");
        return (
          <a
            key={key}
            href={url}
            target={external ? "_blank" : undefined}
            rel={external ? "noopener noreferrer" : undefined}
            aria-label={label}
            title={label}
            className={compact ? "fx-social-icon" : "fx-btn fx-btn-ghost text-sm"}
          >
            <Icon className="size-4" />
            {compact ? null : <span>{label}</span>}
          </a>
        );
      })}
    </div>
  );
}
