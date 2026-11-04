// app/actions/notifications.ts
"use server";

import type { AppNotification } from "@/app/dashboard/notifications/NotificationsClient";

// 👇 Replace with your DB query. Shape must match AppNotification.
export async function getNotifications(): Promise<AppNotification[]> {
  // TODO: return db.notification.findMany({ where: { userId: session.user.id }, orderBy: { createdAt: "desc" } })
  return [];
}

export async function markNotificationRead(id: string) {
  // TODO: await db.notification.update({ where: { id, userId: session.user.id }, data: { read: true } })
  return { success: true, id };
}

export async function markAllNotificationsRead() {
  // TODO: await db.notification.updateMany({ where: { userId: session.user.id, read: false }, data: { read: true } })
  return { success: true };
}

export async function deleteNotification(id: string) {
  // TODO: await db.notification.delete({ where: { id, userId: session.user.id } })
  return { success: true, id };
}