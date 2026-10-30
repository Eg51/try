// // app/dashboard/kyc/KycForm.tsx
// "use client";

// import { useState } from "react";
// import { useRouter } from "next/navigation";
// import { Button } from "@/components/ui/Button";
// import { submitKyc } from "@/app/actions/kyc";
// import { UploadCloud } from "lucide-react";

// export function KycForm({ currentTier }: { currentTier: number }) {
//   const router = useRouter();
//   const [isLoading, setIsLoading] = useState(false);
//   const [error, setError] = useState<string | null>(null);

//   const nextTier = Math.min(currentTier + 1, 3);

//   async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
//     e.preventDefault();
//     setIsLoading(true);
//     setError(null);

//     const formData = new FormData(e.currentTarget);
//     // Add the tier they are trying to reach
//     formData.append("tier", nextTier.toString());

//     const result = await submitKyc(formData);

//     if (result.error) {
//       setError(result.error);
//       setIsLoading(false);
//     } else {
//       router.refresh(); // Refresh to show the "Pending" state
//     }
//   }

//   return (
//     <form onSubmit={handleSubmit} className="space-y-6">
//       <div className="flex items-center justify-between border-b border-surface-700 pb-4">
//         <div>
//           <h3 className="font-semibold text-lg text-text-primary">Upgrade to Tier {nextTier}</h3>
//           <p className="text-sm text-text-muted">Provide the required documents to complete verification.</p>
//         </div>
//         <span className="bg-brand-500/10 text-brand-500 px-3 py-1 rounded-full text-xs font-bold font-mono">
//           Tier {nextTier} Required
//         </span>
//       </div>

//       {error && <div className="p-3 text-sm text-danger bg-danger/10 rounded-lg">{error}</div>}

//       <div className="space-y-4">
//         <div>
//           <label className="block text-sm font-medium text-text-secondary mb-1">ID Document Type</label>
//           <select name="idType" required className="w-full bg-surface-900 border border-surface-700 rounded-lg p-3 text-text-primary focus:border-brand-500 outline-none">
//             <option value="National ID">National ID Card</option>
//             <option value="Passport">International Passport</option>
//             <option value="Drivers License">Driver's License</option>
//           </select>
//         </div>

//         <div>
//           <label className="block text-sm font-medium text-text-secondary mb-1">ID Number</label>
//           <input 
//             name="idNumber" 
//             type="text" 
//             required 
//             placeholder="Enter your document number"
//             className="w-full bg-surface-900 border border-surface-700 rounded-lg p-3 text-text-primary focus:border-brand-500 outline-none font-mono" 
//           />
//         </div>

//         <div>
//           <label className="block text-sm font-medium text-text-secondary mb-1">Proof of Address (Utility Bill)</label>
//           <div className="border-2 border-dashed border-surface-700 rounded-lg p-8 text-center hover:bg-surface-900/50 transition-colors cursor-pointer">
//             <UploadCloud className="mx-auto text-text-muted mb-2" size={24} />
//             <p className="text-sm text-text-secondary">Click to upload or drag and drop</p>
//             <p className="text-xs text-text-muted mt-1">PDF, JPG, or PNG (max 5MB)</p>
//           </div>
//         </div>
//       </div>

//       <Button type="submit" disabled={isLoading} className="w-full bg-brand-500 text-black hover:bg-brand-400 font-bold">
//         {isLoading ? "Submitting..." : "Submit for Review"}
//       </Button>
//     </form>
//   );
// }