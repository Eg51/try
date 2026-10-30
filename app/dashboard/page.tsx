// app/dashboard/page.tsx
import { getServerSession } from "@/lib/session";
import { connection } from 'next/server';
import connectDB from "@/lib/db";
import { KycSubmission } from "@/lib/models/Kyc";
import DashboardClient from "./DashboardClient";

export const instant = false;

export default async function DashboardPage() {
  await connection();
  
  const session = await getServerSession();
  if (!session) return null;

  // Fetch the user's KYC submission to get the avatar
  await connectDB();
  const submission = await KycSubmission.findOne({ userId: session.id }).lean();
  const userAvatar = submission?.documents?.selfieLivenessUrl || "";

  return (
    <DashboardClient 
      tier={session.tier || 0} 
      displayName={session.displayName || "Trader"} 
      userAvatar={userAvatar}
    />
  );
}