// app/actions/admin-kyc.ts
"use server"; // 👈 MUST be the very first line

import { getServerSession } from "@/lib/session";
import connectDB from "@/lib/db";
import User from "@/lib/models/User";
import { KycSubmission } from "@/lib/models/Kyc";
import { revalidatePath } from "next/cache";

export async function getPendingKycRequests() {
  const session = await getServerSession();
  if (!session || session.role !== "admin") return { error: "Unauthorized" };

  await connectDB();

  try {
    const requests = await KycSubmission.find({ status: "pending" })
      .populate("userId", "email displayName kycTier")
      .sort({ createdAt: 1 })
      .lean();

    return { success: true, requests: JSON.parse(JSON.stringify(requests)) };
  } catch (error) {
    return { error: "Failed to fetch KYC requests" };
  }
}

// 👇 ENSURE THIS SAYS 'export'
export async function reviewKycSubmission(
  submissionId: string, 
  action: "approve" | "reject", 
  reason?: string
) {
  const session = await getServerSession();
  if (!session || session.role !== "admin") return { error: "Unauthorized" };

  await connectDB();

  try {
    const submission = await KycSubmission.findById(submissionId);
    if (!submission) return { error: "Submission not found" };

    if (action === "approve") {
      submission.status = "approved";
      submission.reviewedAt = new Date();
      await submission.save();

      await User.findByIdAndUpdate(submission.userId, { 
        kycTier: submission.tierRequested 
      });
    } else {
      submission.status = "rejected";
      submission.rejectionReason = reason || "Documents not clear.";
      submission.reviewedAt = new Date();
      await submission.save();
    }

    revalidatePath("/admin/kyc");
    revalidatePath("/dashboard/kyc");
    
    return { success: true };
  } catch (error) {
    return { error: "Failed to process submission" };
  }
}