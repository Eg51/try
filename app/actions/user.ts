// app/actions/user.ts
"use server";

import { getServerSession } from "@/lib/session";
import connectDB from "@/lib/db";
import User from "@/lib/models/User";

export async function updateUserSettingsAction(data: { currency: string; language: string }) {
  try {
    const session = await getServerSession();
    if (!session) return { error: "Unauthorized" };

    await connectDB();

    // Update the user in MongoDB
    await User.findByIdAndUpdate(session.id, {
      "displayCurrency.assetId": data.currency,
      "preferences.language": data.language, // Assuming you add this to your schema
    });

    // Revalidate the path so the terminal gets the new currency symbol immediately
    // revalidatePath("/dashboard"); 

    return { success: true };
  } catch (error) {
    console.error("Failed to save settings:", error);
    return { error: "Failed to update settings." };
  }
}