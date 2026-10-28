// app/actions/gamification.ts
"use server";

import { getServerSession } from "@/lib/session";
import connectDB from "@/lib/db";
import User, { IUser } from "@/lib/models/User";
import { TASKS, TIER_THRESHOLDS, ALL_BADGES } from "@/lib/gamification";
import { revalidatePath } from "next/cache";

// Helper to handle Tier upgrades with strict typing
async function checkTierUpgrade(user: IUser) {
  let newTier = user.kycTier;
  
  if (user.xp >= TIER_THRESHOLDS[3]) newTier = 3;
  else if (user.xp >= TIER_THRESHOLDS[2]) newTier = 2;
  else if (user.xp >= TIER_THRESHOLDS[1]) newTier = 1;

  const tierUpgraded = newTier > user.kycTier;
  user.kycTier = newTier as 0 | 1 | 2 | 3;
  
  return tierUpgraded;
}

export async function claimTaskReward(taskId: string) {
  try {
    const session = await getServerSession();
    if (!session) throw new Error("Unauthorized");

    const task = TASKS.find(t => t.id === taskId);
    if (!task) return { error: "Task not found" };

    await connectDB();
    const user = await User.findById(session.id);
    if (!user) return { error: "User not found" };

    // Safety check in case completedTasks is undefined
    const completedTasks = user.completedTasks || [];
    if (completedTasks.includes(taskId)) {
      return { error: "Task already claimed" };
    }

    user.xp = (user.xp || 0) + task.xp;
    user.coins = (user.coins || 0) + task.coins;
    user.completedTasks = [...completedTasks, taskId];

    const tierUpgraded = await checkTierUpgrade(user);
    await user.save();

    revalidatePath("/dashboard");
    return { 
      success: true, 
      xpEarned: task.xp, 
      coinsEarned: task.coins, 
      tierUpgraded, 
      newTier: user.kycTier 
    };
  } catch (error) {
    console.error("Claim error:", error);
    return { error: "Failed to claim reward" };
  }
}

export async function claimBadgeReward(badgeId: string) {
  try {
    const session = await getServerSession();
    if (!session) throw new Error("Unauthorized");

    const badge = ALL_BADGES.find(b => b.id === badgeId);
    if (!badge) return { error: "Badge not found" };

    await connectDB();
    const user = await User.findById(session.id);
    if (!user) return { error: "User not found" };

    // Safety check in case claimedBadges is undefined
    const claimedBadges = user.claimedBadges || [];
    if (claimedBadges.includes(badgeId)) {
      return { error: "Badge already claimed" };
    }

    user.xp = (user.xp || 0) + badge.reward.xp;
    user.coins = (user.coins || 0) + badge.reward.coins;
    user.claimedBadges = [...claimedBadges, badgeId];

    const tierUpgraded = await checkTierUpgrade(user);
    await user.save();

    revalidatePath("/dashboard/rewards");
    return { 
      success: true, 
      xpEarned: badge.reward.xp, 
      coinsEarned: badge.reward.coins, 
      tierUpgraded, 
      newTier: user.kycTier 
    };
  } catch (error) {
    console.error("Claim badge error:", error);
    return { error: "Failed to claim badge" };
  }
}