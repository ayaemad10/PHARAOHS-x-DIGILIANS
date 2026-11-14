import Link from "next/link";
import { TEAM_NAME } from "@/lib/constants";

const TITLE = "Flame in Freefall";

export const metadata = {
  title: { absolute: `Page not found · ${TITLE}` },
  description: `This page does not exist in ${TITLE} by ${TEAM_NAME}.`,
};

export default function NotFound() {
  return (
    <main className="fx-cabin-bg grid min-h-dvh place-items-center px-6 text-center">
      <div className="max-w-md space-y-4">
        <p className="fx-label">{TITLE} · 404</p>
        <h1 className="font-display text-3xl font-semibold text-ink">This page is not in the cabin</h1>
        <p className="text-sm text-ink-muted">The address may be mistyped, or the page moved. Every record and view can be reached from Home.</p>
        <Link href="/" className="fx-btn fx-btn-primary inline-flex">Back to Home</Link>
      </div>
    </main>
  );
}
