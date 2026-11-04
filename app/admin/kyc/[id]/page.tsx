// app/admin/kyc/[id]/page.tsx
import connectDB from "@/lib/db";
import { KycSubmission } from "@/lib/models/Kyc";
import { ArrowLeft, ExternalLink, ShieldCheck, Mail, FileText, CheckCircle2, XCircle } from "lucide-react";
import Link from "next/link";
import ReviewForm from "./ReviewForm";
import mongoose from "mongoose";

export const instant = false;

export default async function KycReviewDetail({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  
  await connectDB();
  
  // Fetch submission and populate user details safely
  const sub = await KycSubmission.findById(id).populate<{ userId: { displayName: string; email: string } | null }>('userId', 'displayName email');
  
  if (!sub) {
    return (
      <div className="flex flex-col items-center justify-center h-[50vh] text-gray-400">
        <XCircle size={48} className="text-red-500 mb-4" />
        <h2 className="text-xl font-bold text-white">Submission not found</h2>
        <p className="mt-2 text-sm">This KYC record may have been deleted.</p>
        <Link href="/admin/kyc" className="mt-6 text-lime-500 hover:underline">Back to Queue</Link>
      </div>
    );
  }

  // Handle deleted users
  const user = sub.userId;
  if (!user) {
    return (
      <div className="flex flex-col items-center justify-center h-[50vh] text-red-500">
        <XCircle size={48} className="mb-4" />
        <h2 className="text-xl font-bold text-white">User Error</h2>
        <p className="mt-2 text-sm text-gray-400">The user associated with this KYC submission no longer exists.</p>
        <Link href="/admin/kyc" className="mt-6 text-lime-500 hover:underline">Back to Queue</Link>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6 pb-12">
      <Link href="/admin/kyc" className="text-sm text-gray-400 hover:text-lime-400 flex items-center gap-2 transition-colors">
        <ArrowLeft size={16} /> Back to Review Queue
      </Link>

      <div className="bg-[#0a0f0b] border border-lime-500/20 rounded-3xl p-6 sm:p-8 shadow-2xl relative overflow-hidden">
        
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-white/10 pb-6 mb-6">
          <div>
            <h1 className="text-2xl font-extrabold text-white">Reviewing: {user.displayName}</h1>
            <p className="text-sm text-gray-400 flex items-center gap-2 mt-1">
              <Mail size={14} /> {user.email}
            </p>
          </div>
          <div className="px-4 py-2 bg-lime-500/10 border border-lime-500/30 rounded-xl flex items-center gap-2 text-lime-400 font-bold">
            <ShieldCheck size={18} /> Tier {sub.tierRequested} Verification
          </div>
        </div>
        
        {/* Personal Details */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          <div className="space-y-1 p-4 bg-white/5 rounded-xl border border-white/5">
            <p className="text-[10px] text-gray-500 uppercase tracking-widest font-bold">Legal Name</p>
            <p className="font-medium text-white">{sub.personalDetails?.legalName || user.displayName}</p>
          </div>
          <div className="space-y-1 p-4 bg-white/5 rounded-xl border border-white/5">
            <p className="text-[10px] text-gray-500 uppercase tracking-widest font-bold">Date of Birth</p>
            <p className="font-medium text-white">{sub.personalDetails?.dob || "N/A"}</p>
          </div>
          <div className="space-y-1 p-4 bg-white/5 rounded-xl border border-white/5">
            <p className="text-[10px] text-gray-500 uppercase tracking-widest font-bold">Phone Number</p>
            <p className="font-medium text-white">{sub.personalDetails?.phone || "N/A"}</p>
          </div>
          <div className="space-y-1 p-4 bg-white/5 rounded-xl border border-white/5">
            <p className="text-[10px] text-gray-500 uppercase tracking-widest font-bold">Address</p>
            <p className="font-medium text-white text-sm">
              {sub.personalDetails?.street}, {sub.personalDetails?.city}, {sub.personalDetails?.state}, {sub.personalDetails?.country}
            </p>
          </div>
        </div>

        {/* Document Details */}
        <div className="space-y-4 mb-8">
          <h3 className="text-lg font-bold text-white flex items-center gap-2 mb-4">
            <FileText size={18} className="text-lime-500" /> Provided Documents
          </h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="p-4 border border-white/10 rounded-xl bg-black/20">
              <p className="text-[10px] text-gray-500 uppercase tracking-widest font-bold mb-1">ID Type</p>
              <p className="font-medium text-white mb-3">{sub.documents.idType}</p>
              <p className="text-[10px] text-gray-500 uppercase tracking-widest font-bold mb-1">ID Number</p>
              <p className="font-mono text-white">{sub.documents.idNumber || "N/A"}</p>
            </div>

            <div className="grid grid-cols-2 gap-2">
              {sub.documents.idDocumentUrl && (
                <a href={sub.documents.idDocumentUrl} target="_blank" rel="noreferrer" className="flex flex-col items-center justify-center p-3 border border-white/10 rounded-xl bg-white/5 hover:border-lime-500/50 transition-colors text-xs text-gray-400 group">
                  <ExternalLink size={20} className="mb-2 group-hover:text-lime-400" /> View ID
                </a>
              )}
              {sub.documents.selfieLivenessUrl && (
                <a href={sub.documents.selfieLivenessUrl} target="_blank" rel="noreferrer" className="flex flex-col items-center justify-center p-3 border border-white/10 rounded-xl bg-white/5 hover:border-lime-500/50 transition-colors text-xs text-gray-400 group">
                  <ExternalLink size={20} className="mb-2 group-hover:text-lime-400" /> View Selfie
                </a>
              )}
              {sub.documents.proofOfAddressUrl && (
                <a href={sub.documents.proofOfAddressUrl} target="_blank" rel="noreferrer" className="flex flex-col items-center justify-center p-3 border border-white/10 rounded-xl bg-white/5 hover:border-lime-500/50 transition-colors text-xs text-gray-400 group">
                  <ExternalLink size={20} className="mb-2 group-hover:text-lime-400" /> View Address
                </a>
              )}
            </div>
          </div>
        </div>

        {/* Review Action Form */}
        <ReviewForm submissionId={(sub._id as mongoose.Types.ObjectId).toString()} />

      </div>
    </div>
  );
}