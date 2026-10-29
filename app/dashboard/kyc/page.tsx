// app/dashboard/kyc/page.tsx
import { getServerSession } from "@/lib/session";
import connectDB from "@/lib/db";
import { KycSubmission } from "@/lib/models/Kyc";
import KycClient from "./KycClient";
import { connection } from "next/server";

export const instant = false;

export default async function KycPage() {
  await connection(); 

  const session = await getServerSession();
  if (!session) return null;

  await connectDB();
  const submission = await KycSubmission.findOne({ userId: session.id }).sort({ createdAt: -1 }).lean();

  return (
    <KycClient 
      currentTier={session.tier || 0} 
      submission={submission ? JSON.parse(JSON.stringify(submission)) : null} 
      userName={session.displayName} 
      userEmail={session.email} // 👈 Pass the email down
    />
  );
}