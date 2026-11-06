// app/admin/notifications/BroadcastForm.tsx
"use client";

import { useState } from "react";
import { broadcastNotification } from "@/app/actions/admin-notifications";
import { Send, Loader2, CheckCircle2, AlertTriangle } from "lucide-react";

export default function BroadcastForm() {
  const [isLoading, setIsLoading] = useState(false);
  const [success, setSuccess] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);
    setSuccess(null);

    const formData = new FormData(e.currentTarget);
    const title = formData.get("title") as string;
    const message = formData.get("message") as string;
    const type = formData.get("type") as "system" | "promo" | "alert";
    const targetTier = formData.get("target") === "all" ? "all" : Number(formData.get("target"));

    const res = await broadcastNotification({ title, message, type, targetTier });

    setIsLoading(false);
    if (res.error) {
      setError(res.error);
    } else {
      setSuccess(`Successfully sent to ${res.count} users!`);
      (e.target as HTMLFormElement).reset();
    }
  };

  return (
    <form onSubmit={handleSubmit} className="bg-[#0a0f0b] border border-white/10 rounded-2xl p-6 space-y-6">
      {success && (
        <div className="p-4 bg-green-500/10 border border-green-500/20 text-green-400 rounded-xl flex items-center gap-2">
          <CheckCircle2 size={18} /> {success}
        </div>
      )}
      {error && (
        <div className="p-4 bg-red-500/10 border border-red-500/20 text-red-400 rounded-xl flex items-center gap-2">
          <AlertTriangle size={18} /> {error}
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <label className="text-xs font-bold text-gray-400 uppercase block mb-2">Notification Type</label>
          <select name="type" className="w-full bg-black border border-white/10 rounded-xl p-3 text-white outline-none focus:border-lime-500">
            <option value="system">System Update (Blue)</option>
            <option value="promo">Promotion / Reward (Purple)</option>
            <option value="alert">Urgent Alert (Red)</option>
          </select>
        </div>
        <div>
          <label className="text-xs font-bold text-gray-400 uppercase block mb-2">Target Audience</label>
          <select name="target" className="w-full bg-black border border-white/10 rounded-xl p-3 text-white outline-none focus:border-lime-500">
            <option value="all">All Users</option>
            <option value="0">Tier 0 (Unverified)</option>
            <option value="1">Tier 1</option>
            <option value="2">Tier 2</option>
            <option value="3">Tier 3</option>
          </select>
        </div>
      </div>

      <div>
        <label className="text-xs font-bold text-gray-400 uppercase block mb-2">Title</label>
        <input name="title" required placeholder="e.g., Scheduled Maintenance" className="w-full bg-black border border-white/10 rounded-xl p-3 text-white outline-none focus:border-lime-500" />
      </div>

      <div>
        <label className="text-xs font-bold text-gray-400 uppercase block mb-2">Message</label>
        <textarea name="message" required rows={4} placeholder="Type your message here..." className="w-full bg-black border border-white/10 rounded-xl p-3 text-white outline-none focus:border-lime-500 resize-none" />
      </div>

      <button type="submit" disabled={isLoading} className="w-full py-3 bg-lime-600 text-white rounded-xl font-bold hover:bg-lime-700 transition-colors flex items-center justify-center gap-2">
        {isLoading ? <Loader2 className="animate-spin" size={18} /> : <Send size={18} />}
        {isLoading ? "Broadcasting..." : "Send Broadcast"}
      </button>
    </form>
  );
}