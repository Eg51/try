// app/dashboard/profile/page.tsx
import { getServerSession } from "@/lib/session";
import { redirect } from "next/navigation";
import { connection } from "next/server";
import connectDB from "@/lib/db";
import { KycSubmission } from "@/lib/models/Kyc";
import ProfileClient from "./ProfileClient";

export const instant = false;

export default async function ProfilePage() {
  await connection();
  
  const session = await getServerSession();
  if (!session) redirect("/login");

  await connectDB();

  // Fetch the user's KYC submission to get the avatar
  const submission = await KycSubmission.findOne({ userId: session.id }).lean();
  const userAvatar = submission?.documents?.selfieLivenessUrl || "";

  return <ProfileClient session={session} userAvatar={userAvatar} />;
}