"use client";

import { Ankh, HieroglyphFrieze } from "@/components/team/Pharaonic";

/**
 * Page title block.
 *
 * Two treatments, and the choice is about hierarchy rather than preference:
 *
 *   default      a ruled header. Dense data routes — Explore, Compare, Insights, Settings.
 *   variant="console"  corner brackets, display type, telemetry on a rail. Used where the page
 *                      is a station readout rather than a document.
 *   variant="compact"  the same ruled header at one step down: `text-xl` title, `text-xs`
 *                      description, tighter rule. For `/`, which is a count summary — a
 *                      `text-3xl` wordmark above six numbers competed with the numbers for
 *                      attention, and the brand lockup is already permanently in the console rail.
 *
 * `telemetry` is optional and additive either way: pages with a meaningful instrument readout
 * pass it in, pages without are unaffected. It renders under the title on narrow screens and to
 * the right of the actions on wide ones, so the heading never gets squeezed.
 */
export default function PageHeader({
  eyebrow,
  title,
  description,
  actions,
  telemetry,
  variant = "default",
  children,
}) {
  const isConsole = variant === "console";
  const isCompact = variant === "compact";

  return (
    <header className="fx-royal-header">
    <div
      className={
        isConsole
          ? "fx-frame flex flex-wrap items-start justify-between gap-x-8 gap-y-5 pb-5"
          : isCompact
            ? "flex flex-wrap items-start justify-between gap-x-6 gap-y-3 pb-3"
            : "flex flex-wrap items-start justify-between gap-x-6 gap-y-4 pb-4"
      }
    >
      <div className="min-w-0 max-w-2xl">
        {eyebrow ? (
          <p className="fx-label fx-royal-eyebrow mb-2">
            <Ankh size={13} />
            {eyebrow}
          </p>
        ) : null}
        <h1
          className={`fx-royal-title ${
            isConsole ? "text-hud-sm" : isCompact ? "text-xl sm:text-2xl" : "text-2xl sm:text-[2.1rem]"
          }`}
        >
          {title}
        </h1>
        {description ? (
          <p
            className={
              isConsole
                ? "mt-3 max-w-xl text-sm leading-relaxed text-ink-muted"
                : isCompact
                  ? "mt-1 max-w-2xl text-xs leading-relaxed text-ink-muted"
                  : "mt-2 text-sm leading-relaxed text-ink-muted"
            }
          >
            {description}
          </p>
        ) : null}
        {children}
      </div>

      <div className="flex flex-col items-start gap-3">
        {actions ? <div className="flex flex-wrap items-center gap-2">{actions}</div> : null}
        {telemetry ? (
          <div
            className={
              isConsole
                ? "flex flex-wrap items-center gap-x-5 gap-y-2 pl-4"
                : "flex flex-wrap items-center gap-x-4 gap-y-1.5"
            }
            style={isConsole ? { borderLeft: "1px solid var(--fx-hairline)" } : undefined}
          >
            {telemetry}
          </div>
        ) : null}
      </div>
    </div>
    <HieroglyphFrieze className="fx-royal-frieze" size={14} />
    </header>
  );
}
