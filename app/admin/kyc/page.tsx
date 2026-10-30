// // app/dashboard/kyc/page.tsx
// import { getServerSession } from "@/lib/session";
// import connectDB from "@/lib/db";
// import { KycSubmission } from "@/lib/models/Kyc";
// import KycClient from "@/app/dashboard/kyc/KycClient";

// export const instant = false;

// export default async function KycPage() {
//   const session = await getServerSession();
//   if (!session) return null;

//   await connectDB();
//   const submission = await KycSubmission.findOne({ userId: session.id }).sort({ createdAt: -1 }).lean();

//   return (
//     <KycClient 
//       currentTier={session.tier || 0} 
//       submission={submission ? JSON.parse(JSON.stringify(submission)) : null} 
//     />
//   );
// }
// app/admin/kyc/page.tsx
// app/admin/kyc/page.tsx (and app/admin/kyc/[id]/page.tsx)
import { connection } from "next/server";

// 👇 Tells Next.js 16 this route is dynamic
export const instant = false;

export default async function AdminKycPlaceholder() {
  // 👇 Opts out of static prerendering
  await connection();

  return (
    <div className="p-8 text-center text-lime-500">
      <h1 className="text-2xl font-bold">Admin KYC Review</h1>
      <p className="mt-2 text-sm">This dashboard is under construction.</p>
    </div>
  );
}