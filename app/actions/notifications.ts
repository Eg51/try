// app/actions/notifications.ts
"use server";

import connectDB from "@/lib/db";
import Notification from "@/lib/models/Notification";
import { getServerSession } from "@/lib/session";
import { revalidatePath } from "next/cache";

export async function getUserNotifications() {
  const session = await getServerSession();
  if (!session) return [];

  await connectDB();
  const notifications = await Notification.find({ userId: session.id })
    .sort({ createdAt: -1 })
    .limit(50)
    .lean();

  return JSON.parse(JSON.stringify(notifications));
}

export async function markNotificationRead(id: string) {
  const session = await getServerSession();
  if (!session) return { error: "Unauthorized" };

  await connectDB();
  await Notification.updateOne({ _id: id, userId: session.id }, { read: true });
  revalidatePath("/dashboard/notifications");
  return { success: true };
}

export async function markAllNotificationsRead() {
  const session = await getServerSession();
  if (!session) return { error: "Unauthorized" };

  await connectDB();
  await Notification.updateMany({ userId: session.id, read: false }, { read: true });
  revalidatePath("/dashboard/notifications");
  return { success: true };
}

export async function deleteNotification(id: string) {
  const session = await getServerSession();
  if (!session) return { error: "Unauthorized" };

  await connectDB();
  await Notification.deleteOne({ _id: id, userId: session.id });
  revalidatePath("/dashboard/notifications");
  return { success: true };
}
// // app/actions/notifications.ts
// "use server";

// import connectDB from "@/lib/db";
// import Notification from "@/lib/models/Notification";
// import { getServerSession } from "@/lib/session";
// import { revalidatePath } from "next/cache";

// export async function getUserNotifications() {
//   const session = await getServerSession();
//   if (!session) return [];

//   await connectDB();
//   const notifications = await Notification.find({ userId: session.id })
//     .sort({ createdAt: -1 })
//     .limit(50)
//     .lean();

//   // Serialize for client components (converts ObjectId and Date to strings)
//   return JSON.parse(JSON.stringify(notifications));
// }

// export async function markNotificationRead(id: string) {
//   const session = await getServerSession();
//   if (!session) return { error: "Unauthorized" };

//   await connectDB();
//   await Notification.updateOne({ _id: id, userId: session.id }, { read: true });
//   revalidatePath("/dashboard/notifications");
//   return { success: true };
// }

// export async function markAllNotificationsRead() {
//   const session = await getServerSession();
//   if (!session) return { error: "Unauthorized" };

//   await connectDB();
//   await Notification.updateMany({ userId: session.id, read: false }, { read: true });
//   revalidatePath("/dashboard/notifications");
//   return { success: true };
// }

// export async function deleteNotification(id: string) {
//   const session = await getServerSession();
//   if (!session) return { error: "Unauthorized" };

//   await connectDB();
//   await Notification.deleteOne({ _id: id, userId: session.id });
//   revalidatePath("/dashboard/notifications");
//   return { success: true };
// }
