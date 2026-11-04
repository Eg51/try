// app/admin/settings/page.tsx
import { getPlatformSettings } from "@/app/actions/admin-settings";
import SettingsForm from "./SettingsForm";
import { Settings } from "lucide-react";
import { connection } from "next/server";

export const instant = false;

export default async function AdminSettingsPage() {
  await connection();
  const { settings } = await getPlatformSettings();

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white tracking-tight flex items-center gap-2">
          <Settings size={24} className="text-lime-500" /> Platform Settings
        </h1>
        <p className="text-gray-400 text-sm mt-1">Global configuration for the exchange.</p>
      </div>
      <SettingsForm initialSettings={settings} />
    </div>
  );
}