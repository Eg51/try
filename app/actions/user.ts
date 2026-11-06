// app/actions/user.ts
"use server";

import { getServerSession } from "@/lib/session";
import connectDB from "@/lib/db";
import User from "@/lib/models/User";
import { revalidatePath } from "next/cache";

export async function updateUserSettingsAction(data: { currency: string; language: string }) {
  try {
    const session = await getServerSession();
    if (!session) return { error: "Unauthorized" };

    if (!data.currency || !data.language) {
      return { error: "Missing required fields." };
    }

    await connectDB();

    // Update the user in MongoDB
    const updatedUser = await User.findByIdAndUpdate(
      session.id, 
      {
        "displayCurrency.assetId": data.currency,
        "preferences.language": data.language,
      },
      { new: true }
    );

    if (!updatedUser) return { error: "User not found." };

    // Revalidate the paths so the UI updates instantly
    revalidatePath("/dashboard");
    revalidatePath("/terminal");
    revalidatePath("/markets");
    revalidatePath("/dashboard/settings");

    return { success: true };
  } catch (error) {
    console.error("Failed to save settings:", error);
    return { error: "Failed to update settings." };
  }
}

// 👇 NEW ACTION FOR PROFILE NAME UPDATE
export async function updateProfileNameAction(displayName: string) {
  try {
    const session = await getServerSession();
    if (!session) return { error: "Unauthorized" };

    if (!displayName || displayName.trim().length < 2) {
      return { error: "Display name must be at least 2 characters." };
    }

    await connectDB();

    const updatedUser = await User.findByIdAndUpdate(
      session.id, 
      { displayName: displayName.trim() },
      { new: true }
    );

    if (!updatedUser) return { error: "User not found." };

    revalidatePath("/dashboard");
    revalidatePath("/dashboard/profile");

    return { success: true };
  } catch (error) {
    console.error("Failed to update profile name:", error);
    return { error: "Failed to update profile." };
  }
}

// // app/actions/user.ts
// "use server";

// import { getServerSession } from "@/lib/session";
// import connectDB from "@/lib/db";
// import User from "@/lib/models/User";
// import { revalidatePath } from "next/cache"; // 👈 Imported revalidatePath

// export async function updateUserSettingsAction(data: { currency: string; language: string }) {
//   try {
//     const session = await getServerSession();
//     if (!session) return { error: "Unauthorized" };

//     if (!data.currency || !data.language) {
//       return { error: "Missing required fields." };
//     }

//     await connectDB();

//     // Update the user in MongoDB
//     const updatedUser = await User.findByIdAndUpdate(
//       session.id, 
//       {
//         "displayCurrency.assetId": data.currency,
//         "preferences.language": data.language,
//       },
//       { new: true }
//     );

//     if (!updatedUser) return { error: "User not found." };

//     // 👇 Revalidate the paths so the UI updates instantly
//     revalidatePath("/dashboard");
//     revalidatePath("/terminal");
//     revalidatePath("/markets");
//     revalidatePath("/dashboard/settings");

//     return { success: true };
//   } catch (error) {
//     console.error("Failed to save settings:", error);
//     return { error: "Failed to update settings." };
//   }
// }

// // app/actions/user.ts
// "use server";

// import { getServerSession } from "@/lib/session";
// import connectDB from "@/lib/db";
// import User from "@/lib/models/User";

// export async function updateUserSettingsAction(data: { currency: string; language: string }) {
//   try {
//     const session = await getServerSession();
//     if (!session) return { error: "Unauthorized" };

//     await connectDB();

//     // Update the user in MongoDB
//     await User.findByIdAndUpdate(session.id, {
//       "displayCurrency.assetId": data.currency,
//       "preferences.language": data.language, // Assuming you add this to your schema
//     });

//     // Revalidate the path so the terminal gets the new currency symbol immediately
//     // revalidatePath("/dashboard"); 

//     return { success: true };
//   } catch (error) {
//     console.error("Failed to save settings:", error);
//     return { error: "Failed to update settings." };
//   }
// }