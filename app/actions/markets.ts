"use server";

import { revalidatePath } from "next/cache";
import { getServerSession } from "@/lib/session";
import connectDB from "@/lib/db";
import User from "@/lib/models/User";

export async function toggleFavorite(coinId: string) {
  try {
    const session = await getServerSession();
    if (!session) return { success: false, error: "Please log in to save favorites." };

    await connectDB();
    const user = await User.findById(session.id);
    if (!user) return { success: false, error: "User not found." };

    const isFavorited = user.favorites?.includes(coinId);
    
    if (isFavorited) {
      user.favorites = user.favorites.filter((id: string) => id !== coinId);
    } else {
      user.favorites = [...(user.favorites || []), coinId];
    }

    await user.save();
    revalidatePath("/markets");
    revalidatePath(`/markets/${coinId}`);
    
    return { success: true, isFavorited: !isFavorited };
  } catch (error) {
    console.error(error);
    return { success: false, error: "Failed to update favorite." };
  }
}