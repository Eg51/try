// app/actions/gamification.ts
"use server";

import { getServerSession } from "@/lib/session";
import connectDB from "@/lib/db";
import User from "@/lib/models/User";
import { TASKS, TIER_THRESHOLDS } from "@/lib/gamification";

export async function claimTaskReward(taskId: string) {
  try {
    const session = await getServerSession();
    if (!session) throw new Error("Unauthorized");

    const task = TASKS.find(t => t.id === taskId);
    if (!task) return { error: "Task not found" };

    await connectDB();
    const user = await User.findById(session.id);

    if (!user) return { error: "User not found" };
    if (user.completedTasks.includes(taskId)) return { error: "Task already claimed" };

    // 1. Add XP and Coins
    user.xp += task.xp;
    user.coins += task.coins;
    user.completedTasks.push(taskId);

    // 2. Check for Tier Upgrades
    let newTier = user.kycTier;
    if (user.xp >= TIER_THRESHOLDS[3]) newTier = 3;
    else if (user.xp >= TIER_THRESHOLDS[2]) newTier = 2;
    else if (user.xp >= TIER_THRESHOLDS[1]) newTier = 1;

    const tierUpgraded = newTier > user.kycTier;
    user.kycTier = newTier;

    await user.save();

    return { 
      success: true, 
      xpEarned: task.xp, 
      coinsEarned: task.coins,
      tierUpgraded,
      newTier
    };
  } catch (error) {
    console.error("Claim error:", error);
    return { error: "Failed to claim reward" };
  }
}