import PageHeader from "@/components/shell/PageHeader";
import SettingsContent from "@/components/settings/SettingsContent";

export const metadata = {
  title: "Settings",
  description: "Motion, display and data preferences for PHARAOHS x DIGILIANS.",
};

export default function SettingsPage() {
  return (
    <div className="space-y-6">
      <PageHeader
          variant="compact"
        eyebrow="Configuration"
        title="Settings"
        description="Motion, display and data preferences. Theme (dark or light) and performance options live here too."
      />
      <SettingsContent />
    </div>
  );
}