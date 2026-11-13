// app/actions/admin-kyc.ts
"use server";

import { getServerSession } from "@/lib/session";
import connectDB from "@/lib/db";
import User from "@/lib/models/User";
import { KycSubmission } from "@/lib/models/Kyc";
import { revalidatePath } from "next/cache";
import { createSystemNotification } from "@/lib/models/Notification";

// 👇 Required by app/admin/kyc/page.tsx
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

// 👇 Required by KycActionButtons.tsx & ReviewForm.tsx
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

      await createSystemNotification(
        submission.userId.toString(),
        "system",
        "KYC Approved",
        `Congratulations! Your Tier ${submission.tierRequested} identity verification was approved.`,
        "/dashboard/profile"
      );

    } else {
      submission.status = "rejected";
      submission.rejectionReason = reason || "Documents not clear.";
      submission.reviewedAt = new Date();
      await submission.save();

      await createSystemNotification(
        submission.userId.toString(),
        "alert",
        "Action Required: KYC Rejected",
        `Your KYC verification was rejected. Reason: ${reason || "Documents not clear."}. Please resubmit.`,
        "/dashboard/kyc"
      );
    }

    revalidatePath("/admin/kyc");
    revalidatePath("/dashboard/kyc");
    
    return { success: true };
  } catch (error) {
    console.error("Review KYC error:", error);
    return { error: "Failed to process submission" };
  }
}

// 👇 Kept from the previous update
export async function approveKyc(userId: string) {
  const session = await getServerSession();
  if (!session || session.role !== "admin") return { error: "Unauthorized" };

  await connectDB();

  try {
    const submission = await KycSubmission.findOne({ userId });
    if (!submission) return { error: "KYC submission not found" };

    await KycSubmission.updateOne({ userId }, { $set: { status: "approved", reviewedAt: new Date() } });
    await User.findByIdAndUpdate(userId, { kycTier: submission.tierRequested });

    await createSystemNotification(
      userId,
      "system",
      "KYC Approved",
      `Congratulations! Your Tier ${submission.tierRequested} identity verification was approved.`,
      "/dashboard/profile"
    );

    revalidatePath("/admin/kyc");
    revalidatePath("/dashboard");
    return { success: true };
  } catch (error) {
    return { error: "Failed to approve KYC." };
  }
}

// 👇 Kept from the previous update
export async function rejectKyc(userId: string, reason: string) {
  const session = await getServerSession();
  if (!session || session.role !== "admin") return { error: "Unauthorized" };

  await connectDB();

  try {
    await KycSubmission.updateOne({ userId }, { $set: { status: "rejected", rejectionReason: reason, reviewedAt: new Date() } });

    await createSystemNotification(
      userId,
      "alert",
      "Action Required: KYC Rejected",
      `Your KYC verification was rejected. Reason: ${reason}. Please resubmit.`,
      "/dashboard/kyc"
    );

    revalidatePath("/admin/kyc");
    return { success: true };
  } catch (error) {
    return { error: "Failed to reject KYC." };
  }
}




// // app/actions/admin-kyc.ts
// "use server";

// import { getServerSession } from "@/lib/session";
// import connectDB from "@/lib/db";
// import User from "@/lib/models/User";
// import { KycSubmission } from "@/lib/models/Kyc";
// import { revalidatePath } from "next/cache";
// import { createSystemNotification } from "@/lib/models/Notification";

// // 👇 RESTORED: Required by app/admin/kyc/page.tsx
// export async function getPendingKycRequests() {
//   const session = await getServerSession();
//   if (!session || session.role !== "admin") return { error: "Unauthorized" };

//   await connectDB();

//   try {
//     const requests = await KycSubmission.find({ status: "pending" })
//       .populate("userId", "email displayName kycTier")
//       .sort({ createdAt: 1 })
//       .lean();

//     return { success: true, requests: JSON.parse(JSON.stringify(requests)) };
//   } catch (error) {
//     return { error: "Failed to fetch KYC requests" };
//   }
// }

// // 👇 RESTORED: Required by KycActionButtons.tsx & ReviewForm.tsx
// export async function reviewKycSubmission(
//   submissionId: string, 
//   action: "approve" | "reject", 
//   reason?: string
// ) {
//   const session = await getServerSession();
//   if (!session || session.role !== "admin") return { error: "Unauthorized" };

//   await connectDB();

//   try {
//     const submission = await KycSubmission.findById(submissionId);
//     if (!submission) return { error: "Submission not found" };

//     if (action === "approve") {
//       submission.status = "approved";
//       submission.reviewedAt = new Date();
//       await submission.save();

//       await User.findByIdAndUpdate(submission.userId, { 
//         kycTier: submission.tierRequested 
//       });

//       await createSystemNotification(
//         submission.userId.toString(),
//         "system",
//         "KYC Approved",
//         `Congratulations! Your Tier ${submission.tierRequested} identity verification was approved.`,
//         "/dashboard/profile"
//       );

//     } else {
//       submission.status = "rejected";
//       submission.rejectionReason = reason || "Documents not clear.";
//       submission.reviewedAt = new Date();
//       await submission.save();

//       await createSystemNotification(
//         submission.userId.toString(),
//         "alert",
//         "Action Required: KYC Rejected",
//         `Your KYC verification was rejected. Reason: ${reason || "Documents not clear."}. Please resubmit.`,
//         "/dashboard/kyc"
//       );
//     }

//     revalidatePath("/admin/kyc");
//     revalidatePath("/dashboard/kyc");
    
//     return { success: true };
//   } catch (error) {
//     console.error("Review KYC error:", error);
//     return { error: "Failed to process submission" };
//   }
// }

// // 👇 KEPT: From your previous update
// export async function approveKyc(userId: string) {
//   const session = await getServerSession();
//   if (!session || session.role !== "admin") return { error: "Unauthorized" };

//   await connectDB();

//   try {
//     const submission = await KycSubmission.findOne({ userId });
//     if (!submission) return { error: "KYC submission not found" };

//     await KycSubmission.updateOne({ userId }, { $set: { status: "approved", reviewedAt: new Date() } });
//     await User.findByIdAndUpdate(userId, { kycTier: submission.tierRequested });

//     await createSystemNotification(
//       userId,
//       "system",
//       "KYC Approved",
//       `Congratulations! Your Tier ${submission.tierRequested} identity verification was approved.`,
//       "/dashboard/profile"
//     );

//     revalidatePath("/admin/kyc");
//     revalidatePath("/dashboard");
//     return { success: true };
//   } catch (error) {
//     return { error: "Failed to approve KYC." };
//   }
// }

// // 👇 KEPT: From your previous update
// export async function rejectKyc(userId: string, reason: string) {
//   const session = await getServerSession();
//   if (!session || session.role !== "admin") return { error: "Unauthorized" };

//   await connectDB();

//   try {
//     await KycSubmission.updateOne({ userId }, { $set: { status: "rejected", rejectionReason: reason, reviewedAt: new Date() } });

//     await createSystemNotification(
//       userId,
//       "alert",
//       "Action Required: KYC Rejected",
//       `Your KYC verification was rejected. Reason: ${reason}. Please resubmit.`,
//       "/dashboard/kyc"
//     );

//     revalidatePath("/admin/kyc");
//     return { success: true };
//   } catch (error) {
//     return { error: "Failed to reject KYC." };
//   }
// }


// // app/actions/admin-kyc.ts
// "use server";

// import { getServerSession } from "@/lib/session";
// import connectDB from "@/lib/db";
// import User from "@/lib/models/User";
// import { KycSubmission } from "@/lib/models/Kyc";
// import { revalidatePath } from "next/cache";
// import { createSystemNotification } from "@/lib/models/Notification";

// export async function approveKyc(userId: string) {
//   const session = await getServerSession();
//   if (!session || session.role !== "admin") return { error: "Unauthorized" };

//   await connectDB();

//   try {
//     const submission = await KycSubmission.findOne({ userId });
//     if (!submission) return { error: "KYC submission not found" };

//     await KycSubmission.updateOne({ userId }, { $set: { status: "approved", reviewedAt: new Date() } });
//     await User.findByIdAndUpdate(userId, { kycTier: submission.tierRequested });

//     await createSystemNotification(
//       userId,
//       "system",
//       "KYC Approved",
//       `Congratulations! Your Tier ${submission.tierRequested} identity verification was approved.`,
//       "/dashboard/profile"
//     );

//     revalidatePath("/admin/kyc");
//     revalidatePath("/dashboard");
//     return { success: true };
//   } catch (error) {
//     return { error: "Failed to approve KYC." };
//   }
// }

// export async function rejectKyc(userId: string, reason: string) {
//   const session = await getServerSession();
//   if (!session || session.role !== "admin") return { error: "Unauthorized" };

//   await connectDB();

//   try {
//     await KycSubmission.updateOne({ userId }, { $set: { status: "rejected", rejectionReason: reason, reviewedAt: new Date() } });

//     await createSystemNotification(
//       userId,
//       "alert",
//       "Action Required: KYC Rejected",
//       `Your KYC verification was rejected. Reason: ${reason}. Please resubmit.`,
//       "/dashboard/kyc"
//     );

//     revalidatePath("/admin/kyc");
//     return { success: true };
//   } catch (error) {
//     return { error: "Failed to reject KYC." };
//   }
// }





// // app/actions/admin-kyc.ts
// "use server"; // 👈 MUST be the very first line

// import { getServerSession } from "@/lib/session";
// import connectDB from "@/lib/db";
// import User from "@/lib/models/User";
// import { KycSubmission } from "@/lib/models/Kyc";
// import { revalidatePath } from "next/cache";

// export async function getPendingKycRequests() {
//   const session = await getServerSession();
//   if (!session || session.role !== "admin") return { error: "Unauthorized" };

//   await connectDB();

//   try {
//     const requests = await KycSubmission.find({ status: "pending" })
//       .populate("userId", "email displayName kycTier")
//       .sort({ createdAt: 1 })
//       .lean();

//     return { success: true, requests: JSON.parse(JSON.stringify(requests)) };
//   } catch (error) {
//     return { error: "Failed to fetch KYC requests" };
//   }
// }

// // 👇 ENSURE THIS SAYS 'export'
// export async function reviewKycSubmission(
//   submissionId: string, 
//   action: "approve" | "reject", 
//   reason?: string
// ) {
//   const session = await getServerSession();
//   if (!session || session.role !== "admin") return { error: "Unauthorized" };

//   await connectDB();

//   try {
//     const submission = await KycSubmission.findById(submissionId);
//     if (!submission) return { error: "Submission not found" };

//     if (action === "approve") {
//       submission.status = "approved";
//       submission.reviewedAt = new Date();
//       await submission.save();

//       await User.findByIdAndUpdate(submission.userId, { 
//         kycTier: submission.tierRequested 
//       });
//     } else {
//       submission.status = "rejected";
//       submission.rejectionReason = reason || "Documents not clear.";
//       submission.reviewedAt = new Date();
//       await submission.save();
//     }

//     revalidatePath("/admin/kyc");
//     revalidatePath("/dashboard/kyc");
    
//     return { success: true };
//   } catch (error) {
//     return { error: "Failed to process submission" };
//   }
// }