"use client";

import { PanelRightOpen } from "lucide-react";
import IconButton from "@/components/shared/IconButton";
import FirewisePanel from "@/components/firewise/FirewisePanel";

/**
 * The Firewise rail.
 *
 * Docked as a third column at >=1536px on routes listed in RAIL_DOCKED_ROUTES, and only there.
 * Everywhere else Firewise AI is reached from the top bar; the old floating button is gone.
 */
export default function FirewiseRail({ docked, onToggle }) {
  if (docked) {
    return (
      <aside className="fx-panel fx-glass hidden w-[400px] shrink-0 flex-col border-l border-line 2xl:flex">
        <FirewisePanel
          docked
          headerAccessory={
            <IconButton
              icon={PanelRightOpen}
              label="Undock Firewise assistant"
              onClick={onToggle}
              size="sm"
            />
          }
        />
      </aside>
    );
  }

  // No floating button: it covered card content on every inner page, and Firewise AI is already in the top bar.
  return null;
}
