"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import PharaohA from "./PharaohA";
import ThemeToggle from "./ThemeToggle";
import Tray from "./Tray";
import { NAV_PRIMARY, NAV_SECONDARY, isRouteActive } from "@/lib/navigation";
import { useCompare } from "@/lib/context/CompareProvider";
import { TEAM_NAME } from "@/lib/constants";
import useScrollHint from "@/lib/useScrollHint";

/**
 * Dashboard navigation, one horizontal bar.
 *
 * Same page names and destinations as the old side rail (lib/navigation.js is still the single
 * source). Home is one of the pages, first in the row. On narrow screens the page row scrolls sideways inside its
 * own track instead of collapsing into a drawer, so every page stays one tap away.
 */
export default function TopNav() {
  const pathname = usePathname();
  const { count } = useCompare();
  const items = [...NAV_PRIMARY, ...NAV_SECONDARY];
  const navRef = useScrollHint(pathname);

  return (
    <header className="tn">
      <div className="tn-row">
        <Link href="/" className="tn-site" title="Flame in Freefall · Home">
          <PharaohA size={26} />
          <span className="tn-site-text">
            <b>Flame in Freefall</b>
            <small>{TEAM_NAME}</small>
          </span>
        </Link>

        <nav ref={navRef} className="tn-nav fx-scrollhint" aria-label="Dashboard pages">
          {items.map((item) => {
            const active = isRouteActive(pathname, item.href);
            const Icon = item.icon;
            return (
              <Link key={item.id} href={item.href} className="tn-link" aria-current={active ? "page" : undefined} title={item.hint}>
                <Icon className="size-3.5 shrink-0" aria-hidden="true" />
                <span>{item.label}</span>
                {item.id === "compare" && count ? <em className="tn-count">{count}</em> : null}
              </Link>
            );
          })}
        </nav>

        <div className="tn-tools">
          <ThemeToggle />
          <Tray />
        </div>
      </div>
    </header>
  );
}
