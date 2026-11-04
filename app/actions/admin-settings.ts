// app/actions/admin-settings.ts
"use server";

import { getServerSession } from "@/lib/session";
import connectDB from "@/lib/db";
import Settings from "@/lib/models/Settings";
import { revalidatePath } from "next/cache";

async function requireAdmin() {
  const session = await getServerSession();
  if (!session || session.role !== "admin") throw new Error("Unauthorized");
}

export async function getPlatformSettings() {
  await requireAdmin();
  await connectDB();
  
  let settings = await Settings.findOne().lean();
  if (!settings) {
    settings = await Settings.create({});
    settings = settings.toObject();
  }
  return { success: true, settings: JSON.parse(JSON.stringify(settings)) };
}

export async function updatePlatformSettings(data: { maintenanceMode: boolean, allowRegistration: boolean, platformFeePercent: number }) {
  await requireAdmin();
  await connectDB();

  await Settings.findOneAndUpdate({}, data, { upsert: true });
  revalidatePath("/admin/settings");
  return { success: true };
}