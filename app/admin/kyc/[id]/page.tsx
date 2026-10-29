// // app/admin/kyc/[id]/page.tsx
// import connectDB from "@/lib/db";
// import { KycSubmission } from "@/lib/models/Kyc";
// import { ArrowLeft } from "lucide-react";
// import Link from "next/link";
// import { ReviewForm } from "./ReviewForm";
// import mongoose from "mongoose";
// export const instant = false;
// export default async function KycReviewDetail({ params }: { params: Promise<{ id: string }> }) {
//   const { id } = await params;
  
//   await connectDB();
  
//   // FIX: We tell TS the populated user might be null
//   const sub = await KycSubmission.findById(id).populate<{ userId: { displayName: string; email: string } | null }>('userId', 'displayName email');
  
//   if (!sub) return <div className="p-8 text-center text-text-muted">Submission not found.</div>;

//   // LOGIC CHECK: Handle deleted users
//   const user = sub.userId;
//   if (!user) {
//     return (
//       <div className="p-8 text-center text-danger">
//         Error: The user associated with this KYC submission no longer exists.
//       </div>
//     );
//   }

//   return (
//     <div className="max-w-3xl mx-auto space-y-6">
//       <Link href="/admin/kyc" className="text-sm text-text-muted hover:text-brand-500 flex items-center gap-2">
//         <ArrowLeft size={16} /> Back to Queue
//       </Link>

//       <div className="bg-surface-800 border border-surface-700 rounded-xl p-6">
//         <h1 className="text-xl font-bold text-text-primary mb-6">Reviewing: {user.displayName}</h1>
        
//         <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
//           <div className="space-y-1">
//             <p className="text-xs text-text-muted uppercase tracking-wider">User Email</p>
//             <p className="font-medium">{user.email}</p>
//           </div>
//           <div className="space-y-1">
//             <p className="text-xs text-text-muted uppercase tracking-wider">Tier Requested</p>
//             <p className="font-medium text-brand-500">Tier {sub.tierRequested}</p>
//           </div>
//           <div className="space-y-1">
//             <p className="text-xs text-text-muted uppercase tracking-wider">ID Type</p>
//             <p className="font-medium">{sub.documents.idType}</p>
//           </div>
//           <div className="space-y-1">
//             <p className="text-xs text-text-muted uppercase tracking-wider">ID Number</p>
//             <p className="font-mono">{sub.documents.idNumber}</p>
//           </div>
//         </div>

//         <div className="mb-8">
//           <p className="text-xs text-text-muted uppercase tracking-wider mb-2">Proof of Address</p>
//           <a 
//             href={sub.documents.proofOfAddressUrl} 
//             target="_blank" 
//             rel="noreferrer"
//             className="inline-block bg-surface-900 border border-surface-700 text-brand-500 px-4 py-2 rounded-lg text-sm hover:border-brand-500 transition-colors"
//           >
//             View Document (Mock URL)
//           </a>
//         </div>

//         <ReviewForm submissionId={(sub._id as mongoose.Types.ObjectId).toString()} />
//       </div>
//     </div>
//   );
// }