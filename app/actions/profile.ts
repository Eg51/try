// app/actions/profile.ts
"use server";

import { getServerSession } from "@/lib/session";
import connectDB from "@/lib/db";
import { KycSubmission } from "@/lib/models/Kyc";
import { revalidatePath } from "next/cache";
import { createSystemNotification } from "@/lib/models/Notification"; // 👈 Imported Helper

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

    // 👇 NOTIFICATION: Avatar Updated
    await createSystemNotification(
      session.id,
      "system",
      "Profile Picture Updated",
      "Your profile image has been successfully updated",
      "/dashboard/profile"
    );

    revalidatePath("/dashboard");
    return { success: true };
  } catch (error) {
    console.error(error);
    return { error: "Failed to update profile image" };
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

    // 👇 NOTIFICATION: Avatar Removed
    await createSystemNotification(
      session.id,
      "alert",
      "Profile Picture Removed",
      "Your profile image has been removed from your account",
      "/dashboard/profile"
    );

    revalidatePath("/dashboard");
    return { success: true };
  } catch (error) {
    console.error(error);
    return { error: "Failed to delete profile image" };
  }
}




// // app/actions/profile.ts
// "use server";

// import { getServerSession } from "@/lib/session";
// import connectDB from "@/lib/db";
// import { KycSubmission } from "@/lib/models/Kyc";
// import { revalidatePath } from "next/cache";

// export async function updateUserAvatar(base64Image: string) {
//   const session = await getServerSession();
//   if (!session) return { error: "Unauthorized" };

//   await connectDB();

//   try {
//     await KycSubmission.findOneAndUpdate(
//       { userId: session.id },
//       { $set: { "documents.selfieLivenessUrl": base64Image } },
//       { upsert: true }
//     );

//     revalidatePath("/dashboard");
//     return { success: true };
//   } catch (error) {
//     console.error(error);
//     return { error: "Failed to update avatar." };
//   }
// }

// export async function deleteUserAvatar() {
//   const session = await getServerSession();
//   if (!session) return { error: "Unauthorized" };

//   await connectDB();

//   try {
//     await KycSubmission.findOneAndUpdate(
//       { userId: session.id },
//       { $set: { "documents.selfieLivenessUrl": "" } }
//     );

//     revalidatePath("/dashboard");
//     return { success: true };
//   } catch (error) {
//     console.error(error);
//     return { error: "Failed to delete avatar." };
//   }
// }