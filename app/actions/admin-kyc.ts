// app/actions/kyc.ts
"use server";

import { getServerSession } from "@/lib/session";
import connectDB from "@/lib/db";
import User from "@/lib/models/User";
import { KycSubmission } from "@/lib/models/Kyc";
import { revalidatePath } from "next/cache";

// 👇 Your signature remains exactly the same
export async function submitKyc(tier: number, formData: any) {
  const session = await getServerSession();
  if (!session) return { error: "Unauthorized" };

  await connectDB();

  try {
    // 👇 We cast it to 1 | 2 | 3 to satisfy Mongoose/TypeScript
    const validTier = Math.min(Math.max(tier, 1), 3) as 1 | 2 | 3;

    await KycSubmission.create({
      userId: session.id,
      status: 'pending', 
      tierRequested: validTier, // 👈 Using the casted variable
      documents: {
        idType: formData.idType || "N/A",
        idNumber: formData.idNumber || "N/A",
        proofOfAddressUrl: formData.proofOfAddressUrl || "",
        sourceOfWealthUrl: formData.sourceOfWealthUrl || "",
        selfieLivenessUrl: formData.selfieLivenessUrl || "",
      }
    });

    await User.findByIdAndUpdate(session.id, { kycTier: validTier });
    
    revalidatePath("/dashboard");
    revalidatePath("/dashboard/kyc");
    
    return { success: true };
  } catch (error) {
    console.error(error);
    return { error: "Failed to submit KYC." };
  }
}