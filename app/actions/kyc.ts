// app/actions/kyc.ts
"use server";

import { getServerSession } from "@/lib/session";
import connectDB from "@/lib/db";
import User from "@/lib/models/User";
import { KycSubmission } from "@/lib/models/Kyc";
import { revalidatePath } from "next/cache";

export async function submitKyc(tier: 1 | 2 | 3, formData: any) {
  const session = await getServerSession();
  if (!session) return { error: "Unauthorized" };

  await connectDB();

  try {
    await KycSubmission.create({
      userId: session.id,
      status: 'pending',
      tierRequested: tier, 
      documents: {
        idType: formData.idType || "N/A",
        idNumber: formData.idNumber || "N/A",
        proofOfAddressUrl: formData.proofOfAddressUrl || "",
        sourceOfWealthUrl: formData.sourceOfWealthUrl || "",
        selfieLivenessUrl: formData.selfieLivenessUrl || "",
      }
    });

    await User.findByIdAndUpdate(session.id, { kycTier: tier });
    
    revalidatePath("/dashboard");
    revalidatePath("/dashboard/kyc");
    
    return { success: true };
  } catch (error) {
    console.error(error);
    return { error: "Failed to submit KYC." };
  }
}

// 👇 ENSURE THIS FUNCTION IS EXPORTED 👇
export async function deleteKyc() {
  const session = await getServerSession();
  if (!session) return { error: "Unauthorized" };

  await connectDB();

  try {
    // Delete all submissions for this user
    await KycSubmission.deleteMany({ userId: session.id });
    
    // Reset their tier to 0
    await User.findByIdAndUpdate(session.id, { kycTier: 0 });

    revalidatePath("/dashboard");
    revalidatePath("/dashboard/kyc");
    revalidatePath("/dashboard/profile");

    return { success: true };
  } catch (error) {
    console.error(error);
    return { error: "Failed to delete KYC data." };
  }
}