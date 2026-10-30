// app/actions/profile.ts
"use server";

import { getServerSession } from "@/lib/session";
import connectDB from "@/lib/db";
import { KycSubmission } from "@/lib/models/Kyc";
import { revalidatePath } from "next/cache";

export async function updateUserAvatar(base64Image: string) {
  const session = await getServerSession();
  if (!session) return { error: "Unauthorized" };

  await connectDB();

  try {
    await KycSubmission.findOneAndUpdate(
      { userId: session.id },
      { $set: { "documents.selfieLivenessUrl": base64Image } },
      { upsert: true }
    );

    revalidatePath("/dashboard");
    return { success: true };
  } catch (error) {
    console.error(error);
    return { error: "Failed to update avatar." };
  }
}

export async function deleteUserAvatar() {
  const session = await getServerSession();
  if (!session) return { error: "Unauthorized" };

  await connectDB();

  try {
    await KycSubmission.findOneAndUpdate(
      { userId: session.id },
      { $set: { "documents.selfieLivenessUrl": "" } }
    );

    revalidatePath("/dashboard");
    return { success: true };
  } catch (error) {
    console.error(error);
    return { error: "Failed to delete avatar." };
  }
}