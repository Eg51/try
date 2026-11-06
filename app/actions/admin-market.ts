// app/actions/admin-market.ts
"use server";

import { getServerSession } from "@/lib/session";
import connectDB from "@/lib/db";
import MarketSettings from "@/lib/models/MarketSettings";
import { revalidatePath } from "next/cache";

export async function getMarketSettings() {
  await connectDB();
  let settings = await MarketSettings.findOne().lean();
  
  if (!settings) {
    // Create default if it doesn't exist
    const newSettings = await MarketSettings.create({});
    settings = newSettings.toObject();
  }
  
  return JSON.parse(JSON.stringify(settings));
}

export async function updateMarketSettings(data: any) {
  const session = await getServerSession();
  if (!session || session.role !== "admin") return { error: "Unauthorized" };

  await connectDB();

  try {
    const settings = await MarketSettings.findOne();
    if (!settings) {
      await MarketSettings.create(data);
    } else {
      settings.block1 = data.block1;
      settings.block2 = data.block2;
      settings.block3 = data.block3;
      settings.block4 = data.block4;
      await settings.save();
    }
    
    revalidatePath("/admin/market-control");
    return { success: true };
  } catch (error) {
    console.error("Market Settings Error:", error);
    return { error: "Failed to update market settings." };
  }
}