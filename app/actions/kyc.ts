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
    const updateData: any = {
      status: 'pending',
      tierRequested: tier,
      submittedAt: new Date(),
      reviewedAt: null,
      rejectionReason: null,
    };

    // 👇 ONLY UPDATE THE FIELDS RELEVANT TO THE TIER
    if (tier === 1) {
      updateData.personalDetails = {
        legalName: formData.legalName,
        dob: formData.dob,
        phone: formData.phone,
        email: formData.email,
        street: formData.street,
        city: formData.city,
        state: formData.state,
        country: formData.country,
      };
      updateData["documents.idType"] = formData.idType;
      updateData["documents.idNumber"] = formData.idNumber || "";
      updateData["documents.selfieLivenessUrl"] = formData.selfieLivenessUrl || "";
      updateData["documents.idDocumentUrl"] = formData.idDocumentUrl || "";
    } else if (tier === 2) {
      updateData["documents.proofOfAddressUrl"] = formData.proofOfAddressUrl;
    } else if (tier === 3) {
      updateData["documents.sourceOfWealthUrl"] = formData.sourceOfWealthUrl;
    }

    await KycSubmission.findOneAndUpdate(
      { userId: session.id },
      { $set: updateData },
      { upsert: true, new: true }
    );

    await User.findByIdAndUpdate(session.id, { kycTier: tier });
    
    revalidatePath("/dashboard");
    revalidatePath("/dashboard/kyc");
    
    return { success: true };
  } catch (error) {
    console.error(error);
    return { error: "Failed to submit KYC." };
  }
}

export async function deleteKyc() {
  const session = await getServerSession();
  if (!session) return { error: "Unauthorized" };

  await connectDB();

  try {
    await KycSubmission.deleteMany({ userId: session.id });
    await User.findByIdAndUpdate(session.id, { kycTier: 0 });

    revalidatePath("/dashboard");
    revalidatePath("/dashboard/kyc");
    revalidatePath("/dashboard/profile");

    return { success: true };
  } catch (error) {
    console.error(error);
    return { error: "Failed to delete" };
  }
}
// // app/actions/kyc.ts
// "use server";

// import { getServerSession } from "@/lib/session";
// import connectDB from "@/lib/db";
// import User from "@/lib/models/User";
// import { KycSubmission } from "@/lib/models/Kyc";
// import { revalidatePath } from "next/cache";

// export async function submitKyc(tier: 1 | 2 | 3, formData: any) {
//   const session = await getServerSession();
//   if (!session) return { error: "Unauthorized" };

//   await connectDB();

//   try {
//     // 👇 OVERWRITE PREVIOUS SUBMISSION IF IT EXISTS
//     await KycSubmission.findOneAndUpdate(
//       { userId: session.id },
//       {
//         $set: {
//           status: 'pending', 
//           tierRequested: tier,
//           personalDetails: {
//             legalName: formData.legalName,
//             dob: formData.dob,
//             phone: formData.phone,
//             email: formData.email,
//             street: formData.street,
//             city: formData.city,
//             state: formData.state,
//             country: formData.country,
//           },
//           documents: {
//             idType: formData.idType || "N/A",
//             idNumber: formData.idNumber || "",
//             proofOfAddressUrl: formData.proofOfAddressUrl || "",
//             sourceOfWealthUrl: formData.sourceOfWealthUrl || "",
//             selfieLivenessUrl: formData.selfieLivenessUrl || "",
//             idDocumentUrl: formData.idDocumentUrl || "", 
//           },
//           submittedAt: new Date(), 
//           reviewedAt: null,
//           rejectionReason: null,
//         }
//       },
//       { upsert: true, new: true } // 👈 Creates if new, Updates if exists
//     );

//     await User.findByIdAndUpdate(session.id, { kycTier: tier });
    
//     revalidatePath("/dashboard");
//     revalidatePath("/dashboard/kyc");
    
//     return { success: true };
//   } catch (error) {
//     console.error(error);
//     return { error: "Failed to submit KYC." };
//   }
// }

// export async function deleteKyc() {
//   const session = await getServerSession();
//   if (!session) return { error: "Unauthorized" };

//   await connectDB();

//   try {
//     await KycSubmission.deleteMany({ userId: session.id });
//     await User.findByIdAndUpdate(session.id, { kycTier: 0 });

//     revalidatePath("/dashboard");
//     revalidatePath("/dashboard/kyc");
//     revalidatePath("/dashboard/profile");

//     return { success: true };
//   } catch (error) {
//     console.error(error);
//     return { error: "Failed to delete" };
//   }
// }