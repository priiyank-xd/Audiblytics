import { SettingsHubLayout } from '@/features/settings/settings-hub-layout';

export default function SettingsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <SettingsHubLayout>{children}</SettingsHubLayout>;
}
