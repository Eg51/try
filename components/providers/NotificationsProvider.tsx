// components/providers/NotificationsProvider.tsx
"use client";

import { createContext, useContext, useState, useMemo } from "react";
import type { AppNotification } from "@/app/dashboard/notifications/NotificationsClient";

export type BadgeType = "urgent" | "task" | "admin" | "none";

interface NotificationsCtx {
  notifications: AppNotification[];
  unreadCount: number;
  badgeType: BadgeType;
  setNotifications: React.Dispatch<React.SetStateAction<AppNotification[]>>;
  markOneRead: (id: string) => void;
  markAllRead: () => void;
  removeOne: (id: string) => void;
  addNotification: (notification: Omit<AppNotification, "id" | "timestamp" | "read">) => void; // 👈 Added this
}

const noop = () => {};
const noopSet: React.Dispatch<React.SetStateAction<AppNotification[]>> = noop as never;

// Safe fallback — bell renders fine outside provider, just shows no badge
const FALLBACK: NotificationsCtx = {
  notifications: [],
  unreadCount: 0,
  badgeType: "none",
  setNotifications: noopSet,
  markOneRead: noop,
  markAllRead: noop,
  removeOne: noop,
  addNotification: noop, // 👈 Added to fallback
};

const Ctx = createContext<NotificationsCtx>(FALLBACK);

function deriveBadge(notifications: AppNotification[]): BadgeType {
  const unread = notifications.filter((n) => !n.read);
  if (unread.some((n) => n.type === "alert")) return "urgent";
  if (unread.some((n) => n.type === "system")) return "admin";
  if (unread.some((n) => n.type === "promo")) return "task";
  return "none";
}

export function NotificationsProvider({
  initial,
  children,
}: {
  initial: AppNotification[];
  children: React.ReactNode;
}) {
  const [notifications, setNotifications] = useState<AppNotification[]>(initial);

  const unreadCount = useMemo(
    () => notifications.filter((n) => !n.read).length,
    [notifications]
  );
  const badgeType = useMemo(() => deriveBadge(notifications), [notifications]);

  const markOneRead = (id: string) =>
    setNotifications((p) => p.map((n) => (n.id === id ? { ...n, read: true } : n)));
  const markAllRead = () =>
    setNotifications((p) => p.map((n) => ({ ...n, read: true })));
  const removeOne = (id: string) =>
    setNotifications((p) => p.filter((n) => n.id !== id));

  // 👇 Added this function to inject new notifications dynamically
  const addNotification = (notif: Omit<AppNotification, "id" | "timestamp" | "read">) => {
    const newNotif: AppNotification = {
      ...notif,
      id: Math.random().toString(36).substring(7),
      timestamp: new Date().toISOString(),
      read: false,
    };
    setNotifications((prev) => [newNotif, ...prev]);
  };

  return (
    <Ctx.Provider
      value={{
        notifications,
        unreadCount,
        badgeType,
        setNotifications,
        markOneRead,
        markAllRead,
        removeOne,
        addNotification, // 👈 Exposed in the context
      }}
    >
      {children}
    </Ctx.Provider>
  );
}

// ✅ Never throws — returns fallback when no provider is present
export function useNotifications(): NotificationsCtx {
  return useContext(Ctx);
}
// // components/providers/NotificationsProvider.tsx
// "use client";

// import { createContext, useContext, useState, useMemo } from "react";
// import type { AppNotification } from "@/app/dashboard/notifications/NotificationsClient";

// export type BadgeType = "urgent" | "task" | "admin" | "none";

// interface NotificationsCtx {
//   notifications: AppNotification[];
//   unreadCount: number;
//   badgeType: BadgeType;
//   setNotifications: React.Dispatch<React.SetStateAction<AppNotification[]>>;
//   markOneRead: (id: string) => void;
//   markAllRead: () => void;
//   removeOne: (id: string) => void;
// }

// const noop = () => {};
// const noopSet: React.Dispatch<React.SetStateAction<AppNotification[]>> = noop as never;

// // Safe fallback — bell renders fine outside provider, just shows no badge
// const FALLBACK: NotificationsCtx = {
//   notifications: [],
//   unreadCount: 0,
//   badgeType: "none",
//   setNotifications: noopSet,
//   markOneRead: noop,
//   markAllRead: noop,
//   removeOne: noop,
// };

// const Ctx = createContext<NotificationsCtx>(FALLBACK);

// function deriveBadge(notifications: AppNotification[]): BadgeType {
//   const unread = notifications.filter((n) => !n.read);
//   if (unread.some((n) => n.type === "alert")) return "urgent";
//   if (unread.some((n) => n.type === "system")) return "admin";
//   if (unread.some((n) => n.type === "promo")) return "task";
//   return "none";
// }

// export function NotificationsProvider({
//   initial,
//   children,
// }: {
//   initial: AppNotification[];
//   children: React.ReactNode;
// }) {
//   const [notifications, setNotifications] = useState<AppNotification[]>(initial);

//   const unreadCount = useMemo(
//     () => notifications.filter((n) => !n.read).length,
//     [notifications]
//   );
//   const badgeType = useMemo(() => deriveBadge(notifications), [notifications]);

//   const markOneRead = (id: string) =>
//     setNotifications((p) => p.map((n) => (n.id === id ? { ...n, read: true } : n)));
//   const markAllRead = () =>
//     setNotifications((p) => p.map((n) => ({ ...n, read: true })));
//   const removeOne = (id: string) =>
//     setNotifications((p) => p.filter((n) => n.id !== id));

//   return (
//     <Ctx.Provider
//       value={{
//         notifications,
//         unreadCount,
//         badgeType,
//         setNotifications,
//         markOneRead,
//         markAllRead,
//         removeOne,
//       }}
//     >
//       {children}
//     </Ctx.Provider>
//   );
// }

// // ✅ Never throws — returns fallback when no provider is present
// export function useNotifications(): NotificationsCtx {
//   return useContext(Ctx);
// }