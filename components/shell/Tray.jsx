"use client";

import { useState } from "react";
import Link from "next/link";
import { Archive, ArrowUpRight, Trash2 } from "lucide-react";
import Drawer from "@/components/shared/Drawer";
import { Toggle } from "@/components/shared/Form";
import { useSaved } from "@/lib/context/SavedProvider";
import { useSettings } from "@/lib/context/SettingsProvider";
import ThemeToggle from "./ThemeToggle";

const BUCKETS = [
  { id: "experiments", label: "Experiments", href: (i) => `/experiments/${i.id}` },
  { id: "insights", label: "Insights", href: () => "/insights" },
  { id: "comparisons", label: "Comparisons", href: () => "/compare" },
  { id: "answers", label: "Firewise answers", href: () => "/firewise" },
];

/**
 * The Tray: Saved and Settings in one drawer that opens from the top bar on every page.
 * It shows the same saved items and the same settings as the /saved and /settings pages —
 * those pages still exist for the full view.
 */
export default function Tray() {
  const [open, setOpen] = useState(false);
  const { saved, remove } = useSaved();
  const { settings, update } = useSettings();
  const total = BUCKETS.reduce((n, b) => n + (saved[b.id]?.length || 0), 0);

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="fx-tray-btn"
        aria-label={`Open tray, ${total} saved`}
      >
        <Archive className="size-4" aria-hidden="true" />
        <span className="hidden sm:inline">Tray</span>
        <b className="fx-numeric">{total}</b>
      </button>

      <Drawer
        open={open}
        onClose={() => setOpen(false)}
        title="Tray"
        description="Your saved items and settings, from any page."
      >
        <div className="space-y-6 p-4">
          <section className="space-y-3">
            <div className="flex items-center justify-between">
              <p className="fx-label">Saved · {total}</p>
              <Link href="/saved" onClick={() => setOpen(false)} className="text-xs text-brand underline">
                Open all
              </Link>
            </div>
            {total === 0 ? (
              <p className="text-xs leading-relaxed text-ink-faint">
                Nothing saved yet. Save an experiment, insight or answer while browsing and it collects here.
              </p>
            ) : (
              BUCKETS.filter((b) => saved[b.id]?.length).map((b) => (
                <div key={b.id} className="space-y-1.5">
                  <p className="text-[11px] font-semibold text-ink-muted">{b.label}</p>
                  <ul className="space-y-1">
                    {saved[b.id].slice(0, 6).map((item) => (
                      <li key={item.id} className="fx-tray-item">
                        <Link href={b.href(item)} onClick={() => setOpen(false)} className="min-w-0 flex-1 truncate">
                          {item.title || item.question || item.id}
                        </Link>
                        <ArrowUpRight className="size-3.5 shrink-0 text-ink-faint" aria-hidden="true" />
                        <button
                          type="button"
                          onClick={() => remove(b.id, item.id)}
                          aria-label={`Remove ${item.title || item.id}`}
                          className="text-ink-faint hover:text-alert"
                        >
                          <Trash2 className="size-3.5" />
                        </button>
                      </li>
                    ))}
                  </ul>
                </div>
              ))
            )}
          </section>

          <section className="space-y-3 border-t border-line pt-5">
            <div className="flex items-center justify-between">
              <p className="fx-label">Settings</p>
              <Link href="/settings" onClick={() => setOpen(false)} className="text-xs text-brand underline">
                All settings
              </Link>
            </div>
            <div className="flex items-center justify-between gap-3">
              <span className="text-sm text-ink">Theme</span>
              <ThemeToggle />
            </div>
            <Toggle
              label="Reduce flame motion"
              checked={settings.reduceFlameMotion}
              onChange={(v) => update({ reduceFlameMotion: v })}
            />
            <Toggle label="Compact mode" checked={settings.compactMode} onChange={(v) => update({ compactMode: v })} />
            <Toggle
              label="Show evidence labels"
              checked={settings.showPrototypeLabels}
              onChange={(v) => update({ showPrototypeLabels: v })}
            />
          </section>
        </div>
      </Drawer>
    </>
  );
}
