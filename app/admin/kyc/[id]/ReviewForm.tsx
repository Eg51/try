// app/admin/kyc/[id]/ReviewForm.tsx
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/Button";
import { reviewKyc } from "@/app/actions/admin-kyc";

export function ReviewForm({ submissionId }: { submissionId: string }) {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);

  async function handleAction(action: 'approve' | 'reject') {
    setIsLoading(true);
    
    let reason = "";
    if (action === 'reject') {
      reason = prompt("Please enter a reason for rejection:") || "Documents not clear.";
    }

    const result = await reviewKyc(submissionId, action, reason);
    
    if (result.success) {
      router.push("/admin/kyc");
      router.refresh();
    } else {
      alert(result.error);
      setIsLoading(false);
    }
  }

  return (
    <div className="flex gap-4 border-t border-surface-700 pt-6">
      <Button 
        onClick={() => handleAction('reject')}
        disabled={isLoading}
        className="flex-1 bg-danger/10 text-danger hover:bg-danger/20 border border-danger/20"
      >
        Reject Submission
      </Button>
      <Button 
        onClick={() => handleAction('approve')}
        disabled={isLoading}
        className="flex-1 bg-success hover:bg-success/90 text-black font-bold"
      >
        {isLoading ? "Processing..." : "Approve & Upgrade Tier"}
      </Button>
    </div>
  );
}