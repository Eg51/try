// app/actions/admin-notifications.ts
"use server";

import { getServerSession } from "@/lib/session";
import connectDB from "@/lib/db";
import User from "@/lib/models/User";
import Notification from "@/lib/models/Notification";
import { revalidatePath } from "next/cache";
import mongoose from "mongoose"; 

export async function broadcastNotification(data: {
  title: string;
  message: string;
  type: "system" | "promo" | "alert";
  targetTier?: number | "all";
}) {
  const session = await getServerSession();
  if (!session || session.role !== "admin") return { error: "Unauthorized" };

  await connectDB();

  try {
    // 1. Find target users
    // 👇 Using Record<string, any> avoids Mongoose FilterQuery type bugs entirely
    const query: Record<string, any> = 
      data.targetTier === "all" ? {} : { kycTier: data.targetTier };

    // 👇 Cast the lean result so TS knows _id exists
    const users = await User.find(query)
      .select("_id")
      .lean<{ _id: mongoose.Types.ObjectId }[]>();

    if (!users || users.length === 0) {
      return { error: "No users found for this target." };
    }

    // 2. Create notifications for everyone
    const notifications = users.map((user) => ({
      userId: user._id, 
      type: data.type,
      title: data.title,
      message: data.message,
      href: "/dashboard/notifications",
    }));

    await Notification.insertMany(notifications);

    revalidatePath("/admin/notifications");
    return { success: true, count: users.length };
  } catch (error) {
    console.error("Broadcast error:", error);
    return { error: "Failed to send broadcast." };
  }
}