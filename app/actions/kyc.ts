// app/actions/kyc.ts
"use server";

import { getServerSession } from "@/lib/session";
import connectDB from "@/lib/db";
import { KycSubmission } from "@/lib/models/Kyc";
import User from "@/lib/models/User";

export async function submitKyc(formData: FormData) {
  try {
    const session = await getServerSession();
    if (!session) return { error: "Unauthorized" };

    const idType = formData.get("idType") as string;
    const idNumber = formData.get("idNumber") as string;
    const tierRequested = Number(formData.get("tier")) as 1 | 2 | 3;

    if (!idType || !idNumber) return { error: "Please fill in all fields." };

    await connectDB();

    // Check if they already have a pending submission
    const existing = await KycSubmission.findOne({ userId: session.id, status: 'pending' });
    if (existing) return { error: "You already have a pending submission." };

    // Create the submission
    await KycSubmission.create({
      userId: session.id,
      tierRequested,
      documents: {
        idType,
        idNumber,
        proofOfAddressUrl: "https://mock-s3-url.com/file.pdf", // Mock URL
      },
    });

    // Update the user status (we can add a 'kycStatus' field to User, but for now we just leave tier as is until Admin approves)
    
    return { success: true };
  } catch (error) {
    console.error("KYC Error:", error);
    return { error: "Failed to submit KYC." };
  }
}