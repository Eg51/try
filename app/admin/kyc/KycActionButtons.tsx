// app/admin/kyc/KycActionButtons.tsx
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { reviewKycSubmission } from "@/app/actions/admin-kyc";
import { Check, X, Loader2 } from "lucide-react";

export default function KycActionButtons({ submissionId }: { submissionId: string }) {
  const [isLoading, setIsLoading] = useState<"approve" | "reject" | null>(null);
  const router = useRouter();

  const handleAction = async (action: "approve" | "reject") => {
    let reason = "";
    if (action === "reject") {
      const input = prompt("Please enter the reason for rejection:");
      if (input === null) return; // User cancelled
      reason = input;
    }

    setIsLoading(action);
    const res = await reviewKycSubmission(submissionId, action, reason);
    setIsLoading(null);

    if (res.success) {
      router.refresh();
    } else {
      alert(res.error);
    }
  };

  return (
    <div className="flex items-center justify-end gap-2">
      <button
        onClick={() => handleAction("reject")}
        disabled={isLoading !== null}
        className="p-2 rounded-lg bg-surface-900 border border-surface-700 text-text-muted hover:text-danger hover:border-danger transition-colors"
        title="Reject"
      >
        {isLoading === "reject" ? <Loader2 size={16} className="animate-spin" /> : <X size={16} />}
      </button>
      <button
        onClick={() => handleAction("approve")}
        disabled={isLoading !== null}
        className="p-2 rounded-lg bg-surface-900 border border-surface-700 text-text-muted hover:text-success hover:border-success transition-colors"
        title="Approve"
      >
        {isLoading === "approve" ? <Loader2 size={16} className="animate-spin" /> : <Check size={16} />}
      </button>
    </div>
  );
}