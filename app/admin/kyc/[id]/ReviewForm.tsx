// "use client";

// import { useState } from "react";
// import { useRouter } from "next/navigation";
// import { Button } from "@/components/ui/Button";
// import { reviewKyc } from "@/app/actions/admin-kyc";

// export function ReviewForm({ submissionId }: { submissionId: string }) {
//   const router = useRouter();
//   const [isLoading, setIsLoading] = useState(false);
//   const [showRejectInput, setShowRejectInput] = useState(false);
//   const [reason, setReason] = useState("");

//   async function handleAction(action: 'approve' | 'reject') {
//     if (action === 'reject' && !showRejectInput) {
//       setShowRejectInput(true);
//       return;
//     }

//     setIsLoading(true);
//     const finalReason = action === 'reject' ? reason : undefined;

//     const result = await reviewKyc(submissionId, action, finalReason);
    
//     if (result.success) {
//       router.push("/admin/kyc");
//       router.refresh();
//     } else {
//       alert(result.error);
//       setIsLoading(false);
//     }
//   }

//   return (
//     <div className="border-t border-surface-700 pt-6">
//       {showRejectInput && (
//         <div className="mb-4">
//           <label className="text-xs text-text-muted mb-1 block">Reason for rejection</label>
//           <textarea 
//             value={reason}
//             onChange={(e) => setReason(e.target.value)}
//             className="w-full bg-surface-900 border border-surface-700 rounded-lg p-3 text-text-primary focus:border-danger outline-none"
//             placeholder="Documents not clear..."
//             rows={2}
//           />
//         </div>
//       )}
      
//       <div className="flex gap-4">
//         <Button 
//           onClick={() => handleAction('reject')}
//           disabled={isLoading}
//           className="flex-1 bg-danger/10 text-danger hover:bg-danger/20 border border-danger/20"
//         >
//           {showRejectInput ? "Confirm Rejection" : "Reject Submission"}
//         </Button>
//         <Button 
//           onClick={() => handleAction('approve')}
//           disabled={isLoading}
//           className="flex-1 bg-success hover:bg-success/90 text-black font-bold"
//         >
//           {isLoading ? "Processing..." : "Approve & Upgrade Tier"}
//         </Button>
//       </div>
//     </div>
//   );
// }