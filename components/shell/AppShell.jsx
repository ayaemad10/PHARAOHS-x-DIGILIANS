"use client";

import { usePathname } from "next/navigation";
import TopNav from "./TopNav";
import FirewiseRail from "./FirewiseRail";
import { RAIL_DOCKED_ROUTES } from "@/lib/navigation";
import { STORAGE_KEYS } from "@/lib/storage";
import usePersistentState from "@/lib/usePersistentState";

/**
 * The dashboard shell: a horizontal page bar on top and the page underneath.
 *
 * The starfield and the 3D Earth that used to sit behind every page are gone. The subject of this
 * product is the cabin and the flame, so the background is a quiet module-wall pattern (.fx-cabin-bg)
 * that never competes with the data. Home ("/") is one of the pages and uses the same shell.
 */
export default function AppShell({ children }) {
  const pathname = usePathname();
  const [railDocked, setRailDocked] = usePersistentState(STORAGE_KEYS.railDocked, true);
  const docked = RAIL_DOCKED_ROUTES.includes(pathname) && railDocked;

  return (
    <div className="fx-cabin-bg flex h-dvh w-full flex-col overflow-hidden">
      <a href="#main-content" className="fx-btn-primary sr-only focus:not-sr-only focus:fixed focus:left-3 focus:top-3 focus:z-[90]">
        Skip to main content
      </a>
      <TopNav />
      <div className="relative flex min-h-0 flex-1">
        {/* Home fills the screen and never scrolls; every other page scrolls inside a centred column. */}
        {pathname === "/" ? (
          <main id="main-content" tabIndex={-1} className="hs-main relative min-w-0 flex-1">{children}</main>
        ) : (
          <main id="main-content" tabIndex={-1} className="fx-scrollbar min-w-0 flex-1 overflow-y-auto">
            <div className="mx-auto w-full max-w-[1600px] px-4 py-6 sm:px-6 lg:px-8">{children}</div>
          </main>
        )}
        {/* Home is one full screen; Firewise AI is one click away in the top bar, so its floating panel stays off there */}
        {pathname === "/" ? null : <FirewiseRail docked={docked} onToggle={() => setRailDocked((v) => !v)} />}
      </div>
    </div>
  );
}
