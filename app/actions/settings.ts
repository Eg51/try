// app/actions/settings.ts
"use server";

import { getServerSession } from "@/lib/session";
import connectDB from "@/lib/db";
import User from "@/lib/models/User";
import { revalidatePath } from "next/cache";
import { z } from "zod";

const currencySchema = z.object({
  assetId: z.string().min(2).max(10),
});

export async function updateDisplayCurrency(rawData: unknown) {
  try {
    const session = await getServerSession();
    if (!session) return { error: "Unauthorized" };

    const parsed = currencySchema.safeParse(rawData);
    if (!parsed.success) return { error: "Invalid currency selected." };

    await connectDB();
    
    await User.findByIdAndUpdate(session.id, {
      "displayCurrency.assetId": parsed.data.assetId,
      "displayCurrency.selectedAt": new Date(),
    });

    revalidatePath("/dashboard"); // Refresh the layout so the header balance updates
    return { success: true };
  } catch (error) {
    console.error("Currency update error:", error);
    return { error: "Failed to update currency." };
  }
}