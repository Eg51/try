// app/admin/page.tsx
import { getAdminDashboardStats } from "@/app/actions/admin";
import { Users, Activity, DollarSign, ArrowRight, ShieldCheck, PieChart } from "lucide-react";
import Link from "next/link";
import { connection } from "next/server";
import { getServerSession } from "@/lib/session";
import { getTimeGreeting } from "@/lib/time-greeting";

export const instant = false;

export default async function AdminDashboardPage() {
  await connection();
  const session = await getServerSession();
  const { success, stats, activity } = await getAdminDashboardStats();

  if (!success || !stats) return <div className="text-red-500">Failed to load admin metrics.</div>;

  const greeting = getTimeGreeting();

  return (
    <div className="max-w-6xl mx-auto space-y-6 sm:space-y-8 pb-10">
      
      {/* 1. Header & Greeting */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-[#f4fbf5]/90 dark:bg-[#0a0f0b]/90 backdrop-blur-2xl border border-lime-500/20 p-6 rounded-3xl shadow-[0_8px_32px_0_rgba(132,204,22,0.15)] dark:shadow-[0_8px_32px_0_rgba(0,0,0,0.5)]">
        <div>
          <h1 className="text-2xl font-extrabold tracking-tight text-lime-950 dark:text-white">
            {greeting}, {session?.displayName || "Admin"}
          </h1>
          <p className="text-lime-800/70 dark:text-lime-200/50 mt-1 font-medium text-sm">
            Welcome to the Command Center. Here is what happened while you were away.
          </p>
        </div>
        <div className="flex gap-2 text-xs font-mono">
          <span className="bg-lime-500/10 text-lime-600 dark:text-lime-400 px-3 py-1.5 rounded-full border border-lime-500/20 font-bold">
            {activity.length} recent system events
          </span>
        </div>
      </div>

      {/* 2. Key Metrics Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
        <MetricCard 
          title="Total Users" 
          value={stats.totalUsers.toLocaleString()} 
          icon={<Users size={20} />} 
          subtitle={`${stats.activeUsers} active`} 
        />
        <MetricCard 
          title="Platform Volume" 
          value={`$${stats.totalVolume.toLocaleString('en-US', { minimumFractionDigits: 2 })}`} 
          icon={<DollarSign size={20} />} 
          subtitle="All-time USD" 
          highlight 
        />
        <MetricCard 
          title="Pending Actions" 
          value="3" 
          icon={<ShieldCheck size={20} />} 
          subtitle="KYC reviews" 
        />
        <Link href="/admin/analytics" className="group">
          <div className="p-5 rounded-3xl border border-lime-500/20 bg-[#f4fbf5]/90 dark:bg-[#0a0f0b]/90 backdrop-blur-2xl hover:border-lime-500/50 transition-all h-full flex flex-col justify-between cursor-pointer shadow-lg">
            <div className="flex justify-between items-start mb-4">
              <h3 className="text-sm font-bold text-lime-800/70 dark:text-lime-200/50 group-hover:text-lime-600 transition-colors">Site Analytics</h3>
              <div className="p-2 rounded-xl bg-lime-500/10 text-lime-500 group-hover:bg-lime-500 group-hover:text-white transition-colors">
                <PieChart size={20} />
              </div>
            </div>
            <div className="space-y-1">
              <p className="text-sm font-bold text-lime-950 dark:text-white group-hover:text-lime-600 transition-colors flex items-center gap-1">
                View Reports <ArrowRight size={14} className="group-hover:translate-x-1 transition-transform" />
              </p>
              <p className="text-xs text-lime-800/60 dark:text-lime-200/40">Traffic & Volume</p>
            </div>
          </div>
        </Link>
      </div>

      {/* 3. Live Activity Feed */}
      <div className="bg-[#f4fbf5]/90 dark:bg-[#0a0f0b]/90 backdrop-blur-2xl border border-lime-500/20 rounded-3xl overflow-hidden shadow-xl">
        <div className="p-4 sm:p-5 border-b border-lime-500/10 flex justify-between items-center bg-white/50 dark:bg-[#121A14]/50">
          <h2 className="font-bold text-lime-950 dark:text-white flex items-center gap-2">
            <Activity size={18} className="text-lime-500" /> Live System Activity
          </h2>
          <Link href="/admin/ledger" className="text-xs font-bold text-lime-600 dark:text-lime-400 hover:text-lime-700 flex items-center gap-1">
            View Ledger <ArrowRight size={14} />
          </Link>
        </div>
        <div className="divide-y divide-lime-500/10 max-h-[400px] overflow-y-auto custom-scrollbar">
          {activity.length === 0 ? (
            <div className="p-8 text-center text-lime-800/50 dark:text-lime-200/40 text-sm font-medium">No recent activity found.</div>
          ) : (
            // 👇 FIXED: Corrected map syntax here
            activity.map((item: any) => (
              <div key={item.id} className="p-4 sm:p-5 flex items-center justify-between hover:bg-lime-500/5 transition-colors">
                <div className="flex items-center gap-4">
                  <div className="w-2.5 h-2.5 rounded-full bg-lime-500 shadow-[0_0_8px_rgba(132,204,22,0.6)]"></div>
                  <div>
                    <p className="text-sm font-bold text-lime-950 dark:text-white capitalize">
                      {item.kind.replace('_', ' ')} Executed
                    </p>
                    <p className="text-xs text-lime-800/50 dark:text-lime-200/40 font-mono mt-0.5">ID: {item.id.slice(-8)}</p>
                  </div>
                </div>
                <div className="text-right">
                  <span className="text-xs text-lime-800/60 dark:text-lime-200/40 font-mono font-medium">
                    {new Date(item.date).toLocaleTimeString()}
                  </span>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}

function MetricCard({ title, value, icon, subtitle, highlight = false }: { title: string, value: string, icon: React.ReactNode, subtitle: string, highlight?: boolean }) {
  return (
    <div className={`p-5 rounded-3xl border backdrop-blur-2xl transition-all shadow-lg ${
      highlight 
        ? 'border-lime-500/40 bg-lime-500/5 shadow-lime-500/10' 
        : 'border-lime-500/20 bg-[#f4fbf5]/90 dark:bg-[#0a0f0b]/90'
    }`}>
      <div className="flex justify-between items-start mb-4">
        <h3 className="text-sm font-bold text-lime-800/70 dark:text-lime-200/50">{title}</h3>
        <div className={`p-2 rounded-xl ${highlight ? 'bg-lime-500 text-white' : 'bg-lime-500/10 text-lime-500'}`}>
          {icon}
        </div>
      </div>
      <div className="space-y-1">
        <p className="text-2xl sm:text-3xl font-extrabold font-mono text-lime-950 dark:text-white">{value}</p>
        <p className="text-xs text-lime-800/60 dark:text-lime-200/40 font-medium">{subtitle}</p>
      </div>
    </div>
  );
}











// // app/admin/kyc/page.tsx
// import { getPendingKycRequests } from "@/app/actions/admin-kyc";
// import { connection } from "next/server";
// import { ShieldCheck, FileText, CheckCircle2, ArrowRight } from "lucide-react";
// import Link from "next/link";
// import KycActionButtons from "./KycActionButtons";

// export const instant = false;

// export default async function AdminKycPage() {
//   await connection();
  
//   const { success, requests } = await getPendingKycRequests();

//   if (!success || !requests) {
//     return <div className="p-8 text-center text-red-500">Failed to load KYC requests.</div>;
//   }

//   return (
//     <div className="max-w-6xl mx-auto space-y-6">
//       <div className="flex items-center justify-between">
//         <div>
//           <h1 className="text-2xl font-bold tracking-tight text-white flex items-center gap-2">
//             <ShieldCheck size={24} className="text-lime-500" /> KYC Review Queue
//           </h1>
//           <p className="text-gray-400 mt-1">Review and approve user identity verifications.</p>
//         </div>
//         <span className="bg-[#0a0f0b] border border-lime-500/20 px-4 py-2 rounded-lg text-sm font-mono text-lime-400">
//           {requests.length} Pending
//         </span>
//       </div>

//       {requests.length === 0 ? (
//         <div className="bg-[#0a0f0b] border border-lime-500/20 rounded-xl p-12 text-center">
//           <CheckCircle2 size={48} className="mx-auto text-green-500 mb-4" />
//           <h2 className="text-xl font-bold text-white">All Caught Up!</h2>
//           <p className="text-gray-400 mt-2">There are no pending KYC requests right now.</p>
//         </div>
//       ) : (
//         <div className="bg-[#0a0f0b] border border-lime-500/20 rounded-xl overflow-hidden">
//           <div className="overflow-x-auto">
//             <table className="w-full text-left text-sm text-gray-300">
//               <thead className="bg-white/5 border-b border-white/10 text-xs uppercase text-gray-400">
//                 <tr>
//                   <th className="p-4">User</th>
//                   <th className="p-4">Tier Requested</th>
//                   <th className="p-4">Documents</th>
//                   <th className="p-4 text-right">Actions</th>
//                 </tr>
//               </thead>
//               <tbody className="divide-y divide-white/5">
//                 {requests.map((req: any) => (
//                   <tr key={req._id} className="hover:bg-white/5 transition-colors">
//                     <td className="p-4">
//                       <p className="font-semibold text-white">{req.userId?.displayName || "Unknown"}</p>
//                       <p className="text-xs text-gray-500">{req.userId?.email}</p>
//                     </td>
//                     <td className="p-4">
//                       <span className="inline-flex items-center gap-1 px-2 py-1 rounded-md text-xs font-bold bg-lime-500/10 text-lime-400">
//                         Tier {req.tierRequested}
//                       </span>
//                     </td>
//                     <td className="p-4">
//                       <p className="text-xs text-gray-400">ID: <span className="text-white">{req.documents.idType}</span></p>
//                     </td>
//                     <td className="p-4 flex justify-end items-center gap-3">
//                       <Link 
//                         href={`/admin/kyc/${req._id}`} 
//                         className="text-xs font-bold text-lime-400 hover:text-lime-300 flex items-center gap-1 bg-lime-500/10 px-3 py-1.5 rounded-lg"
//                       >
//                         Review Details <ArrowRight size={12} />
//                       </Link>
//                       <KycActionButtons submissionId={req._id} />
//                     </td>
//                   </tr>
//                 ))}
//               </tbody>
//             </table>
//           </div>
//         </div>
//       )}
//     </div>
//   );
// }