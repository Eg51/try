"use server";

import { getServerSession } from "@/lib/session";
import connectDB from "@/lib/db";
import { KycSubmission } from "@/lib/models/Kyc";
import User from "@/lib/models/User";
import { revalidatePath } from "next/cache";
import mongoose from "mongoose";

// Define the exact shape of the data we send to the client
export type PendingKycItem = {
  id: string;
  userName: string;
  userEmail: string;
  tierRequested: number;
  idType: string;
  idNumber: string;
  proofUrl: string;
  submittedAt: Date;
};

export async function getPendingKyc(): Promise<PendingKycItem[]> {
  const session = await getServerSession();
  if (!session) throw new Error("Unauthorized"); 

  await connectDB();
  
  const submissions = await KycSubmission.find({ status: 'pending' })
    .populate('userId', 'displayName email')
    .sort({ submittedAt: 1 })
    .lean();

  return submissions.map((sub) => {
    // Cast the populated user ID to access its properties safely
    const user = sub.userId as unknown as { displayName: string; email: string };
    
    return {
      id: (sub._id as mongoose.Types.ObjectId).toString(),
      userName: user?.displayName || 'Unknown User',
      userEmail: user?.email || 'No Email',
      tierRequested: sub.tierRequested,
      idType: sub.documents.idType,
      idNumber: sub.documents.idNumber,
      proofUrl: sub.documents.proofOfAddressUrl,
      submittedAt: sub.submittedAt,
    };
  });
}

export async function reviewKyc(submissionId: string, action: 'approve' | 'reject', reason?: string) {
  const session = await getServerSession();
  if (!session) return { error: "Unauthorized" };

  await connectDB();

  const submission = await KycSubmission.findById(submissionId);
  if (!submission) return { error: "Submission not found" };

  if (action === 'approve') {
    submission.status = 'approved';
    submission.reviewedAt = new Date();
    await submission.save();

    await User.findByIdAndUpdate(submission.userId, {
      kycTier: submission.tierRequested
    });
  } else {
    submission.status = 'rejected';
    submission.rejectionReason = reason || "Documents not clear. Please resubmit.";
    submission.reviewedAt = new Date();
    await submission.save();
  }

  revalidatePath('/admin/kyc');
  return { success: true };
}