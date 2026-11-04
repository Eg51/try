// app/admin/kyc/[id]/ReviewForm.tsx
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { reviewKycSubmission } from "@/app/actions/admin-kyc";
import { Check, X, Loader2 } from "lucide-react";

export default function ReviewForm({ submissionId }: { submissionId: string }) {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState<"approve" | "reject" | null>(null);
  const [showRejectInput, setShowRejectInput] = useState(false);
  const [reason, setReason] = useState("");

  const handleAction = async (action: "approve" | "reject") => {
    // If rejecting, first show the reason input
    if (action === "reject" && !showRejectInput) {
      setShowRejectInput(true);
      return;
    }

    setIsLoading(action);
    const finalReason = action === "reject" ? reason : undefined;

    const res = await reviewKycSubmission(submissionId, action, finalReason);
    
    if (res.success) {
      router.push("/admin/kyc");
      router.refresh();
    } else {
      alert(res.error);
      setIsLoading(null);
    }
  };

  return (
    <div className="border-t border-white/10 pt-6 mt-6">
      {showRejectInput && (
        <div className="mb-4 animate-in fade-in slide-in-from-top-2">
          <label className="text-xs font-bold text-red-400 mb-2 block uppercase tracking-wider">
            Reason for rejection
          </label>
          <textarea 
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            className="w-full bg-[#050806] border border-red-500/30 rounded-xl p-3 text-white placeholder:text-gray-600 focus:outline-none focus:border-red-500 transition-colors"
            placeholder="e.g. Selfie is blurry, ID document is expired..."
            rows={3}
          />
        </div>
      )}
      
      <div className="flex gap-4">
        <button 
          onClick={() => handleAction("reject")}
          disabled={isLoading !== null}
          className="flex-1 py-3 rounded-xl bg-red-500/10 text-red-400 border border-red-500/20 hover:bg-red-500/20 font-bold transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
        >
          {isLoading === "reject" ? <Loader2 size={18} className="animate-spin" /> : <X size={18} />}
          {showRejectInput ? "Confirm Rejection" : "Reject"}
        </button>
        <button 
          onClick={() => handleAction("approve")}
          disabled={isLoading !== null}
          className="flex-1 py-3 rounded-xl bg-lime-600 text-white hover:bg-lime-700 font-bold transition-colors flex items-center justify-center gap-2 disabled:opacity-50 shadow-lg shadow-lime-600/20"
        >
          {isLoading === "approve" ? <Loader2 size={18} className="animate-spin" /> : <Check size={18} />}
          Approve & Upgrade
        </button>
      </div>
    </div>
  );
}