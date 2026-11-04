// components/dashboard/NotificationButton.tsx
"use client";

import { motion } from "framer-motion";
import { Bell } from "lucide-react";
import Link from "next/link";
import {
  useNotifications,
  type BadgeType,
} from "@/components/providers/NotificationsProvider";

const BADGE_COLORS: Record<BadgeType, string> = {
  urgent: "bg-red-500 shadow-[0_0_10px_rgba(239,68,68,0.6)]",
  task:   "bg-green-500 shadow-[0_0_10px_rgba(34,197,94,0.6)]",
  admin:  "bg-amber-500 shadow-[0_0_10px_rgba(245,158,11,0.6)]",
  none:   "hidden",
};

export default function NotificationButton({ type }: { type?: BadgeType } = {}) {
  const { badgeType } = useNotifications();
  const effectiveType: BadgeType = type ?? badgeType;

  return (
    <Link
      href="/dashboard/notifications"
      className="relative flex items-center justify-center p-2 group"
      aria-label="Notifications"
    >
      <motion.div
        whileHover={{ rotate: [0, -15, 15, -15, 15, 0] }}
        transition={{ duration: 0.5 }}
        className="relative text-lime-800 dark:text-lime-200 group-hover:text-lime-600 dark:group-hover:text-lime-400 transition-colors"
      >
        <Bell size={22} strokeWidth={2.5} fill="currentColor" fillOpacity={0.2} />

        {effectiveType !== "none" && (
          <motion.span
            animate={{ y: [0, -4, 0], scale: [1, 1.1, 1] }}
            transition={{ repeat: Infinity, duration: 2, ease: "easeInOut" }}
            className={`absolute -top-1 -right-1 w-3 h-3 rounded-full border-2 border-[#f4fbf5] dark:border-[#0a0f0b] ${BADGE_COLORS[effectiveType]}`}
          />
        )}
      </motion.div>
    </Link>
  );
}