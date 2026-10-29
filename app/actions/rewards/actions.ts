// app/dashboard/rewards/actions.ts
"use server";

import { claimBadgeReward } from "@/app/actions/gamification";

export async function handleClaimBadge(badgeId: string) {
  return await claimBadgeReward(badgeId);
}