// app/dashboard/notifications/NotificationsClient.tsx
"use client";

import { useState, useMemo, useEffect } from "react";
import { useRouter } from "next/navigation"; // 👈 Imported Router
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";
import {
  Bell, BellOff, Check, CheckCheck, Trash2, ChevronRight,
  TrendingUp, ShieldCheck, Gift, AlertTriangle, Wallet,
} from "lucide-react";
import { useDevModal } from "@/components/providers/DevModalProvider";
import {
  useNotifications,
  NotificationsProvider,
} from "@/components/providers/NotificationsProvider";
import { useTour } from "@/components/providers/TourProvider"; 
import { 
  markNotificationRead, 
  markAllNotificationsRead, 
  deleteNotification 
} from "@/app/actions/notifications"; // 👈 Imported Server Actions

export type NotificationType = "trade" | "system" | "promo" | "alert" | "wallet";

export interface AppNotification {
  id: string;
  type: NotificationType;
  title: string;
  message: string;
  timestamp: string;
  read: boolean;
  href?: string;
  meta?: { label: string; value: string; tone?: "up" | "down" | "neutral" }[];
}

const TYPE_META: Record<
  NotificationType,
  { icon: React.ElementType; color: string; bg: string; label: string }
> = {
  trade:  { icon: TrendingUp,    color: "text-green-500",  bg: "bg-green-500/10",  label: "Trade"  },
  system: { icon: ShieldCheck,   color: "text-blue-500",   bg: "bg-blue-500/10",   label: "System" },
  promo:  { icon: Gift,          color: "text-purple-500", bg: "bg-purple-500/10", label: "Reward" },
  alert:  { icon: AlertTriangle, color: "text-amber-500",  bg: "bg-amber-500/10",  label: "Alert"  },
  wallet: { icon: Wallet,        color: "text-lime-600",   bg: "bg-lime-500/10",   label: "Wallet" },
};

const FILTERS = [
  { id: "all",    label: "All" },
  { id: "unread", label: "Unread" },
  { id: "trade",  label: "Trades" },
  { id: "wallet", label: "Wallet" },
  { id: "system", label: "System" },
  { id: "promo",  label: "Rewards" },
  { id: "alert",  label: "Alerts" },
] as const;

type FilterId = (typeof FILTERS)[number]["id"];

function relativeTime(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "Just now";
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  if (days < 7) return `${days}d ago`;
  return new Date(iso).toLocaleDateString(undefined, { month: "short", day: "numeric" });
}

function getDateBucket(iso: string): "Today" | "Yesterday" | "Earlier" {
  const d = new Date(iso);
  const now = new Date();
  const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const startOfYesterday = new Date(startOfToday);
  startOfYesterday.setDate(startOfYesterday.getDate() - 1);
  if (d >= startOfToday) return "Today";
  if (d >= startOfYesterday) return "Yesterday";
  return "Earlier";
}

export default function NotificationsClient({
  initialNotifications,
}: {
  initialNotifications: AppNotification[];
}) {
  return (
    <NotificationsProvider initial={initialNotifications}>
      <NotificationsInner />
    </NotificationsProvider>
  );
}

function NotificationsInner() {
  const { notifications, unreadCount, markOneRead, markAllRead, removeOne } =
    useNotifications();
  const router = useRouter(); // 👈 Initialize router
  const [activeFilter, setActiveFilter] = useState<FilterId>("all");
  const { openModal } = useDevModal();
  const { setSteps } = useTour(); 

  useEffect(() => {
    setSteps([
      { id: "tour-notifications-header", title: "Notification Center", text: "Stay updated on your trades, wallet activity, and platform announcements here." },
      { id: "tour-notifications-mark-all", title: "Clear Your Badges", text: "Quickly mark all unread alerts as read with one click." },
      { id: "tour-notifications-filters", title: "Filter by Category", text: "Use these tabs to focus on specific types of notifications, like Trades or Wallet updates." },
      { id: "tour-notifications-list", title: "Actionable Alerts", text: "Click any notification to view details. You can also mark them as read or delete them using the icons on hover." },
    ]);
  }, [setSteps]);

  const filterCounts = useMemo(() => {
    const counts: Record<FilterId, number> = {
      all: notifications.length,
      unread: unreadCount,
      trade: 0, wallet: 0, system: 0, promo: 0, alert: 0,
    };
    notifications.forEach((n) => { counts[n.type] += 1; });
    return counts;
  }, [notifications, unreadCount]);

  const filtered = useMemo(() => {
    if (activeFilter === "all") return notifications;
    if (activeFilter === "unread") return notifications.filter((n) => !n.read);
    return notifications.filter((n) => n.type === activeFilter);
  }, [notifications, activeFilter]);

  const grouped = useMemo(() => {
    const groups: { label: string; items: AppNotification[] }[] = [];
    for (const n of filtered) {
      const bucket = getDateBucket(n.timestamp);
      const last = groups[groups.length - 1];
      if (last && last.label === bucket) last.items.push(n);
      else groups.push({ label: bucket, items: [n] });
    }
    return groups;
  }, [filtered]);

  const handleMarkAll = async () => {
    if (unreadCount === 0) return;
    
    markAllRead(); // Optimistic UI update
    await markAllNotificationsRead(); // Server update
    openModal("All caught up", "You've marked all notifications as read.", "success");
    router.refresh(); // Refresh global header badge
  };

  const handleMarkRead = async (id: string) => {
    markOneRead(id); // Optimistic UI update
    await markNotificationRead(id); // Server update
    router.refresh(); // Refresh global header badge
  };

  const handleDelete = async (id: string) => {
    removeOne(id); // Optimistic UI update
    await deleteNotification(id); // Server update
    router.refresh(); // Refresh global header badge
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6 pb-12 pt-4 sm:pt-8">
      {/* HEADER CARD */}
      <motion.div
        id="tour-notifications-header"
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative bg-white/60 dark:bg-[#0a0f0b]/60 backdrop-blur-xl border border-lime-500/20 p-5 sm:p-6 rounded-3xl shadow-[0_8px_32px_0_rgba(132,204,22,0.15)] dark:shadow-[0_8px_32px_0_rgba(0,0,0,0.5)] overflow-hidden"
      >
        <div className="absolute inset-0 pointer-events-none flex items-center justify-end pr-8 opacity-[0.03] dark:opacity-[0.02]">
          <Bell size={200} strokeWidth={1} />
        </div>

        <div className="relative z-10 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-lime-500/20 rounded-2xl text-lime-600 dark:text-lime-400">
              <Bell size={24} />
            </div>
            <div>
              <h1 className="text-xl sm:text-2xl font-extrabold text-lime-950 dark:text-white tracking-tight">
                Notifications
              </h1>
              <p className="text-xs sm:text-sm font-medium text-lime-800/60 dark:text-lime-200/50">
                {unreadCount > 0
                  ? `You have ${unreadCount} unread notification${unreadCount === 1 ? "" : "s"}`
                  : "You're all caught up"}
              </p>
            </div>
          </div>

          <button
            id="tour-notifications-mark-all"
            onClick={handleMarkAll}
            disabled={unreadCount === 0}
            className="flex items-center justify-center gap-2 px-4 py-2.5 bg-[#5d9e17] text-white rounded-xl text-sm font-bold hover:bg-[#4a7e12] transition-colors shadow-lg shadow-lime-600/20 disabled:opacity-50 disabled:cursor-not-allowed disabled:shadow-none"
          >
            <CheckCheck size={16} /> Mark all as read
          </button>
        </div>
      </motion.div>

      {/* FILTER TABS */}
      <motion.div
        id="tour-notifications-filters"
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.05 }}
        className="flex gap-2 overflow-x-auto pb-1 -mx-1 px-1 scrollbar-hide"
      >
        {FILTERS.map((f) => {
          const active = activeFilter === f.id;
          const count = filterCounts[f.id];
          return (
            <button
              key={f.id}
              onClick={() => setActiveFilter(f.id)}
              className={`shrink-0 flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition-colors border ${
                active
                  ? "bg-lime-500 text-white border-lime-500 shadow-md shadow-lime-500/30"
                  : "bg-white/60 dark:bg-[#0a0f0b]/60 text-lime-800 dark:text-lime-200 border-lime-500/20 hover:bg-lime-500/10"
              }`}
            >
              {f.label}
              {count > 0 && (
                <span
                  className={`text-[10px] px-1.5 py-0.5 rounded-full ${
                    active
                      ? "bg-white/25 text-white"
                      : "bg-lime-500/20 text-lime-700 dark:text-lime-300"
                  }`}
                >
                  {count}
                </span>
              )}
            </button>
          );
        })}
      </motion.div>

      {/* LIST */}
      {filtered.length === 0 ? (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="bg-[#f4fbf5]/90 dark:bg-[#0a0f0b]/90 backdrop-blur-xl border border-lime-500/20 rounded-3xl p-12 shadow-xl flex flex-col items-center text-center"
        >
          <div className="p-4 bg-lime-500/10 rounded-full text-lime-500 mb-4">
            <BellOff size={32} />
          </div>
          <h3 className="font-bold text-lime-950 dark:text-white mb-1">
            No notifications here
          </h3>
          <p className="text-sm text-lime-800/60 dark:text-lime-200/50 max-w-xs">
            {activeFilter === "all"
              ? "When you get trade updates, alerts, or rewards, they'll show up here."
              : "There's nothing in this category right now."}
          </p>
        </motion.div>
      ) : (
        <div id="tour-notifications-list" className="space-y-6">
          {grouped.map((group) => (
            <div key={group.label} className="space-y-2">
              <h2 className="text-[10px] sm:text-xs font-bold text-lime-800/60 dark:text-lime-200/50 uppercase tracking-widest px-2">
                {group.label}
              </h2>
              <div className="space-y-2">
                <AnimatePresence initial={false}>
                  {group.items.map((n) => (
                    <NotificationRow
                      key={n.id}
                      notification={n}
                      onRead={() => handleMarkRead(n.id)}
                      onDelete={() => handleDelete(n.id)}
                    />
                  ))}
                </AnimatePresence>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function NotificationRow({
  notification,
  onRead,
  onDelete,
}: {
  notification: AppNotification;
  onRead: () => void;
  onDelete: () => void;
}) {
  const meta = TYPE_META[notification.type];
  const Icon = meta.icon;

  const inner = (
    <div
      className={`group relative flex items-start gap-3 sm:gap-4 p-3.5 sm:p-4 rounded-2xl border transition-colors ${
        notification.read
          ? "bg-[#f4fbf5]/90 dark:bg-[#0a0f0b]/90 border-lime-500/10 hover:border-lime-500/30"
          : "bg-white/70 dark:bg-[#121A14]/70 border-lime-500/30 hover:border-lime-500/50 shadow-md shadow-lime-500/5"
      } backdrop-blur-xl`}
    >
      {!notification.read && (
        <span className="absolute top-4 right-4 sm:static sm:mt-2 w-2 h-2 rounded-full bg-lime-500 shadow-[0_0_8px_rgba(132,204,22,0.9)] shrink-0" />
      )}

      <div
        className={`shrink-0 w-10 h-10 sm:w-11 sm:h-11 rounded-xl flex items-center justify-center ${meta.bg} ${meta.color}`}
      >
        <Icon size={20} />
      </div>

      <div className="flex-1 min-w-0">
        <div className="flex items-start justify-between gap-2">
          <div className="flex items-center gap-2 flex-wrap">
            <span
              className={`text-[9px] font-bold uppercase tracking-widest px-1.5 py-0.5 rounded ${meta.bg} ${meta.color}`}
            >
              {meta.label}
            </span>
            <h3
              className={`text-sm font-bold truncate ${
                notification.read
                  ? "text-lime-950/80 dark:text-white/70"
                  : "text-lime-950 dark:text-white"
              }`}
            >
              {notification.title}
            </h3>
          </div>
          <span className="text-[10px] sm:text-xs font-medium text-lime-800/50 dark:text-lime-200/40 whitespace-nowrap shrink-0">
            {relativeTime(notification.timestamp)}
          </span>
        </div>

        <p className="text-xs sm:text-sm text-lime-800/70 dark:text-lime-200/60 mt-1 leading-snug">
          {notification.message}
        </p>

        {notification.meta && notification.meta.length > 0 && (
          <div className="flex flex-wrap items-center gap-2 mt-2">
            {notification.meta.map((m, i) => (
              <div
                key={i}
                className="text-[10px] sm:text-xs font-bold px-2 py-1 rounded-lg bg-lime-500/5 dark:bg-white/5 border border-lime-500/10"
              >
                <span className="text-lime-800/60 dark:text-lime-200/50 font-medium mr-1">
                  {m.label}
                </span>
                <span
                  className={
                    m.tone === "up"
                      ? "text-green-500"
                      : m.tone === "down"
                      ? "text-red-500"
                      : "text-lime-950 dark:text-white"
                  }
                >
                  {m.value}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="absolute right-3 top-3 flex items-center gap-1 opacity-0 group-hover:opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity">
        {!notification.read && (
          <button
            onClick={(e) => { e.preventDefault(); e.stopPropagation(); onRead(); }}
            className="p-1.5 rounded-lg bg-white dark:bg-[#121A14] border border-lime-500/20 text-lime-600 dark:text-lime-400 hover:bg-lime-500/10 transition-colors"
            title="Mark as read"
          >
            <Check size={14} />
          </button>
        )}
        <button
          onClick={(e) => { e.preventDefault(); e.stopPropagation(); onDelete(); }}
          className="p-1.5 rounded-lg bg-white dark:bg-[#121A14] border border-red-500/20 text-red-500 hover:bg-red-500/10 transition-colors"
          title="Delete"
        >
          <Trash2 size={14} />
        </button>
      </div>

      {notification.href && (
        <ChevronRight
          size={16}
          className="shrink-0 mt-1 text-lime-800/30 dark:text-lime-200/20 group-hover:text-lime-600 dark:group-hover:text-lime-400 transition-colors"
        />
      )}
    </div>
  );

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, x: -20, height: 0, marginTop: 0 }}
      transition={{ duration: 0.18 }}
      className="relative"
    >
      {notification.href ? (
        <Link
          href={notification.href}
          onClick={() => !notification.read && onRead()}
          className="block"
        >
          {inner}
        </Link>
      ) : (
        <button
          onClick={() => !notification.read && onRead()}
          className="block w-full text-left"
        >
          {inner}
        </button>
      )}
    </motion.div>
  );
}
// // app/dashboard/notifications/NotificationsClient.tsx
// "use client";

// import { useState, useMemo, useEffect } from "react";
// import { motion, AnimatePresence } from "framer-motion";
// import Link from "next/link";
// import {
//   Bell, BellOff, Check, CheckCheck, Trash2, ChevronRight,
//   TrendingUp, ShieldCheck, Gift, AlertTriangle, Wallet,
// } from "lucide-react";
// import { useDevModal } from "@/components/providers/DevModalProvider";
// import {
//   useNotifications,
//   NotificationsProvider,
// } from "@/components/providers/NotificationsProvider";
// import { useTour } from "@/components/providers/TourProvider"; // 👈 Imported Tour Hook

// export type NotificationType = "trade" | "system" | "promo" | "alert" | "wallet";

// export interface AppNotification {
//   id: string;
//   type: NotificationType;
//   title: string;
//   message: string;
//   timestamp: string;
//   read: boolean;
//   href?: string;
//   meta?: { label: string; value: string; tone?: "up" | "down" | "neutral" }[];
// }

// const TYPE_META: Record<
//   NotificationType,
//   { icon: React.ElementType; color: string; bg: string; label: string }
// > = {
//   trade:  { icon: TrendingUp,    color: "text-green-500",  bg: "bg-green-500/10",  label: "Trade"  },
//   system: { icon: ShieldCheck,   color: "text-blue-500",   bg: "bg-blue-500/10",   label: "System" },
//   promo:  { icon: Gift,          color: "text-purple-500", bg: "bg-purple-500/10", label: "Reward" },
//   alert:  { icon: AlertTriangle, color: "text-amber-500",  bg: "bg-amber-500/10",  label: "Alert"  },
//   wallet: { icon: Wallet,        color: "text-lime-600",   bg: "bg-lime-500/10",   label: "Wallet" },
// };

// const FILTERS = [
//   { id: "all",    label: "All" },
//   { id: "unread", label: "Unread" },
//   { id: "trade",  label: "Trades" },
//   { id: "wallet", label: "Wallet" },
//   { id: "system", label: "System" },
//   { id: "promo",  label: "Rewards" },
//   { id: "alert",  label: "Alerts" },
// ] as const;

// type FilterId = (typeof FILTERS)[number]["id"];

// function relativeTime(iso: string): string {
//   const diff = Date.now() - new Date(iso).getTime();
//   const mins = Math.floor(diff / 60000);
//   if (mins < 1) return "Just now";
//   if (mins < 60) return `${mins}m ago`;
//   const hrs = Math.floor(mins / 60);
//   if (hrs < 24) return `${hrs}h ago`;
//   const days = Math.floor(hrs / 24);
//   if (days < 7) return `${days}d ago`;
//   return new Date(iso).toLocaleDateString(undefined, { month: "short", day: "numeric" });
// }

// function getDateBucket(iso: string): "Today" | "Yesterday" | "Earlier" {
//   const d = new Date(iso);
//   const now = new Date();
//   const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
//   const startOfYesterday = new Date(startOfToday);
//   startOfYesterday.setDate(startOfYesterday.getDate() - 1);
//   if (d >= startOfToday) return "Today";
//   if (d >= startOfYesterday) return "Yesterday";
//   return "Earlier";
// }

// export default function NotificationsClient({
//   initialNotifications,
// }: {
//   initialNotifications: AppNotification[];
// }) {
//   return (
//     <NotificationsProvider initial={initialNotifications}>
//       <NotificationsInner />
//     </NotificationsProvider>
//   );
// }

// function NotificationsInner() {
//   const { notifications, unreadCount, markOneRead, markAllRead, removeOne } =
//     useNotifications();
//   const [activeFilter, setActiveFilter] = useState<FilterId>("all");
//   const { openModal } = useDevModal();
//   const { setSteps } = useTour(); // 👈 Get setSteps from TourProvider

//   // 👇 1. CONFIGURE TOUR STEPS
//   useEffect(() => {
//     setSteps([
//       { id: "tour-notifications-header", title: "Notification Center", text: "Stay updated on your trades, wallet activity, and platform announcements here." },
//       { id: "tour-notifications-mark-all", title: "Clear Your Badges", text: "Quickly mark all unread alerts as read with one click." },
//       { id: "tour-notifications-filters", title: "Filter by Category", text: "Use these tabs to focus on specific types of notifications, like Trades or Wallet updates." },
//       { id: "tour-notifications-list", title: "Actionable Alerts", text: "Click any notification to view details. You can also mark them as read or delete them using the icons on hover." },
//     ]);
//   }, [setSteps]);

//   const filterCounts = useMemo(() => {
//     const counts: Record<FilterId, number> = {
//       all: notifications.length,
//       unread: unreadCount,
//       trade: 0, wallet: 0, system: 0, promo: 0, alert: 0,
//     };
//     notifications.forEach((n) => { counts[n.type] += 1; });
//     return counts;
//   }, [notifications, unreadCount]);

//   const filtered = useMemo(() => {
//     if (activeFilter === "all") return notifications;
//     if (activeFilter === "unread") return notifications.filter((n) => !n.read);
//     return notifications.filter((n) => n.type === activeFilter);
//   }, [notifications, activeFilter]);

//   const grouped = useMemo(() => {
//     const groups: { label: string; items: AppNotification[] }[] = [];
//     for (const n of filtered) {
//       const bucket = getDateBucket(n.timestamp);
//       const last = groups[groups.length - 1];
//       if (last && last.label === bucket) last.items.push(n);
//       else groups.push({ label: bucket, items: [n] });
//     }
//     return groups;
//   }, [filtered]);

//   const handleMarkAll = () => {
//     if (unreadCount === 0) return;
//     markAllRead();
//     openModal("All caught up", "You've marked all notifications as read.", "success");
//   };

//   return (
//     <div className="max-w-4xl mx-auto space-y-6 pb-12 pt-4 sm:pt-8">
//       {/* HEADER CARD */}
//       <motion.div
//         id="tour-notifications-header" // 👈 Added Tour ID
//         initial={{ opacity: 0, y: -20 }}
//         animate={{ opacity: 1, y: 0 }}
//         className="relative bg-white/60 dark:bg-[#0a0f0b]/60 backdrop-blur-xl border border-lime-500/20 p-5 sm:p-6 rounded-3xl shadow-[0_8px_32px_0_rgba(132,204,22,0.15)] dark:shadow-[0_8px_32px_0_rgba(0,0,0,0.5)] overflow-hidden"
//       >
//         <div className="absolute inset-0 pointer-events-none flex items-center justify-end pr-8 opacity-[0.03] dark:opacity-[0.02]">
//           <Bell size={200} strokeWidth={1} />
//         </div>

//         <div className="relative z-10 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
//           <div className="flex items-center gap-3">
//             <div className="p-3 bg-lime-500/20 rounded-2xl text-lime-600 dark:text-lime-400">
//               <Bell size={24} />
//             </div>
//             <div>
//               <h1 className="text-xl sm:text-2xl font-extrabold text-lime-950 dark:text-white tracking-tight">
//                 Notifications
//               </h1>
//               <p className="text-xs sm:text-sm font-medium text-lime-800/60 dark:text-lime-200/50">
//                 {unreadCount > 0
//                   ? `You have ${unreadCount} unread notification${unreadCount === 1 ? "" : "s"}`
//                   : "You're all caught up"}
//               </p>
//             </div>
//           </div>

//           <button
//             id="tour-notifications-mark-all" // 👈 Added Tour ID
//             onClick={handleMarkAll}
//             disabled={unreadCount === 0}
//             className="flex items-center justify-center gap-2 px-4 py-2.5 bg-[#5d9e17] text-white rounded-xl text-sm font-bold hover:bg-[#4a7e12] transition-colors shadow-lg shadow-lime-600/20 disabled:opacity-50 disabled:cursor-not-allowed disabled:shadow-none"
//           >
//             <CheckCheck size={16} /> Mark all as read
//           </button>
//         </div>
//       </motion.div>

//       {/* FILTER TABS */}
//       <motion.div
//         id="tour-notifications-filters" // 👈 Added Tour ID
//         initial={{ opacity: 0, y: 10 }}
//         animate={{ opacity: 1, y: 0 }}
//         transition={{ delay: 0.05 }}
//         className="flex gap-2 overflow-x-auto pb-1 -mx-1 px-1 scrollbar-hide"
//       >
//         {FILTERS.map((f) => {
//           const active = activeFilter === f.id;
//           const count = filterCounts[f.id];
//           return (
//             <button
//               key={f.id}
//               onClick={() => setActiveFilter(f.id)}
//               className={`shrink-0 flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition-colors border ${
//                 active
//                   ? "bg-lime-500 text-white border-lime-500 shadow-md shadow-lime-500/30"
//                   : "bg-white/60 dark:bg-[#0a0f0b]/60 text-lime-800 dark:text-lime-200 border-lime-500/20 hover:bg-lime-500/10"
//               }`}
//             >
//               {f.label}
//               {count > 0 && (
//                 <span
//                   className={`text-[10px] px-1.5 py-0.5 rounded-full ${
//                     active
//                       ? "bg-white/25 text-white"
//                       : "bg-lime-500/20 text-lime-700 dark:text-lime-300"
//                   }`}
//                 >
//                   {count}
//                 </span>
//               )}
//             </button>
//           );
//         })}
//       </motion.div>

//       {/* LIST */}
//       {filtered.length === 0 ? (
//         <motion.div
//           initial={{ opacity: 0 }}
//           animate={{ opacity: 1 }}
//           className="bg-[#f4fbf5]/90 dark:bg-[#0a0f0b]/90 backdrop-blur-xl border border-lime-500/20 rounded-3xl p-12 shadow-xl flex flex-col items-center text-center"
//         >
//           <div className="p-4 bg-lime-500/10 rounded-full text-lime-500 mb-4">
//             <BellOff size={32} />
//           </div>
//           <h3 className="font-bold text-lime-950 dark:text-white mb-1">
//             No notifications here
//           </h3>
//           <p className="text-sm text-lime-800/60 dark:text-lime-200/50 max-w-xs">
//             {activeFilter === "all"
//               ? "When you get trade updates, alerts, or rewards, they'll show up here."
//               : "There's nothing in this category right now."}
//           </p>
//         </motion.div>
//       ) : (
//         <div id="tour-notifications-list" className="space-y-6"> {/* 👈 Added Tour ID */}
//           {grouped.map((group) => (
//             <div key={group.label} className="space-y-2">
//               <h2 className="text-[10px] sm:text-xs font-bold text-lime-800/60 dark:text-lime-200/50 uppercase tracking-widest px-2">
//                 {group.label}
//               </h2>
//               <div className="space-y-2">
//                 <AnimatePresence initial={false}>
//                   {group.items.map((n) => (
//                     <NotificationRow
//                       key={n.id}
//                       notification={n}
//                       onRead={() => {
//                         markOneRead(n.id);
//                       }}
//                       onDelete={() => {
//                         removeOne(n.id);
//                       }}
//                     />
//                   ))}
//                 </AnimatePresence>
//               </div>
//             </div>
//           ))}
//         </div>
//       )}
//     </div>
//   );
// }

// function NotificationRow({
//   notification,
//   onRead,
//   onDelete,
// }: {
//   notification: AppNotification;
//   onRead: () => void;
//   onDelete: () => void;
// }) {
//   const meta = TYPE_META[notification.type];
//   const Icon = meta.icon;

//   const inner = (
//     <div
//       className={`group relative flex items-start gap-3 sm:gap-4 p-3.5 sm:p-4 rounded-2xl border transition-colors ${
//         notification.read
//           ? "bg-[#f4fbf5]/90 dark:bg-[#0a0f0b]/90 border-lime-500/10 hover:border-lime-500/30"
//           : "bg-white/70 dark:bg-[#121A14]/70 border-lime-500/30 hover:border-lime-500/50 shadow-md shadow-lime-500/5"
//       } backdrop-blur-xl`}
//     >
//       {!notification.read && (
//         <span className="absolute top-4 right-4 sm:static sm:mt-2 w-2 h-2 rounded-full bg-lime-500 shadow-[0_0_8px_rgba(132,204,22,0.9)] shrink-0" />
//       )}

//       <div
//         className={`shrink-0 w-10 h-10 sm:w-11 sm:h-11 rounded-xl flex items-center justify-center ${meta.bg} ${meta.color}`}
//       >
//         <Icon size={20} />
//       </div>

//       <div className="flex-1 min-w-0">
//         <div className="flex items-start justify-between gap-2">
//           <div className="flex items-center gap-2 flex-wrap">
//             <span
//               className={`text-[9px] font-bold uppercase tracking-widest px-1.5 py-0.5 rounded ${meta.bg} ${meta.color}`}
//             >
//               {meta.label}
//             </span>
//             <h3
//               className={`text-sm font-bold truncate ${
//                 notification.read
//                   ? "text-lime-950/80 dark:text-white/70"
//                   : "text-lime-950 dark:text-white"
//               }`}
//             >
//               {notification.title}
//             </h3>
//           </div>
//           <span className="text-[10px] sm:text-xs font-medium text-lime-800/50 dark:text-lime-200/40 whitespace-nowrap shrink-0">
//             {relativeTime(notification.timestamp)}
//           </span>
//         </div>

//         <p className="text-xs sm:text-sm text-lime-800/70 dark:text-lime-200/60 mt-1 leading-snug">
//           {notification.message}
//         </p>

//         {notification.meta && notification.meta.length > 0 && (
//           <div className="flex flex-wrap items-center gap-2 mt-2">
//             {notification.meta.map((m, i) => (
//               <div
//                 key={i}
//                 className="text-[10px] sm:text-xs font-bold px-2 py-1 rounded-lg bg-lime-500/5 dark:bg-white/5 border border-lime-500/10"
//               >
//                 <span className="text-lime-800/60 dark:text-lime-200/50 font-medium mr-1">
//                   {m.label}
//                 </span>
//                 <span
//                   className={
//                     m.tone === "up"
//                       ? "text-green-500"
//                       : m.tone === "down"
//                       ? "text-red-500"
//                       : "text-lime-950 dark:text-white"
//                   }
//                 >
//                   {m.value}
//                 </span>
//               </div>
//             ))}
//           </div>
//         )}
//       </div>

//       <div className="absolute right-3 top-3 flex items-center gap-1 opacity-0 group-hover:opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity">
//         {!notification.read && (
//           <button
//             onClick={(e) => { e.preventDefault(); e.stopPropagation(); onRead(); }}
//             className="p-1.5 rounded-lg bg-white dark:bg-[#121A14] border border-lime-500/20 text-lime-600 dark:text-lime-400 hover:bg-lime-500/10 transition-colors"
//             title="Mark as read"
//           >
//             <Check size={14} />
//           </button>
//         )}
//         <button
//           onClick={(e) => { e.preventDefault(); e.stopPropagation(); onDelete(); }}
//           className="p-1.5 rounded-lg bg-white dark:bg-[#121A14] border border-red-500/20 text-red-500 hover:bg-red-500/10 transition-colors"
//           title="Delete"
//         >
//           <Trash2 size={14} />
//         </button>
//       </div>

//       {notification.href && (
//         <ChevronRight
//           size={16}
//           className="shrink-0 mt-1 text-lime-800/30 dark:text-lime-200/20 group-hover:text-lime-600 dark:group-hover:text-lime-400 transition-colors"
//         />
//       )}
//     </div>
//   );

//   return (
//     <motion.div
//       layout
//       initial={{ opacity: 0, y: 8 }}
//       animate={{ opacity: 1, y: 0 }}
//       exit={{ opacity: 0, x: -20, height: 0, marginTop: 0 }}
//       transition={{ duration: 0.18 }}
//       className="relative"
//     >
//       {notification.href ? (
//         <Link
//           href={notification.href}
//           onClick={() => !notification.read && onRead()}
//           className="block"
//         >
//           {inner}
//         </Link>
//       ) : (
//         <button
//           onClick={() => !notification.read && onRead()}
//           className="block w-full text-left"
//         >
//           {inner}
//         </button>
//       )}
//     </motion.div>
//   );
// }