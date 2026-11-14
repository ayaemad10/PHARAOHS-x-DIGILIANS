import AppShell from "@/components/shell/AppShell";

/** The interactive dashboard: every analytical page shares this shell. The public site at "/" does not. */
export default function DashboardLayout({ children }) {
  return <AppShell>{children}</AppShell>;
}
