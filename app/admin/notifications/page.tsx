// app/admin/notifications/page.tsx
import BroadcastForm from "./BroadcastForm";
import { Megaphone } from "lucide-react";
import { connection } from "next/server";

export const instant = false;

export default async function AdminNotificationsPage() {
  await connection();

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white tracking-tight flex items-center gap-2">
          <Megaphone size={24} className="text-lime-500" /> Broadcast Center
        </h1>
        <p className="text-gray-400 text-sm mt-1">Send system-wide alerts and announcements to users.</p>
      </div>
      <BroadcastForm />
    </div>
  );
}