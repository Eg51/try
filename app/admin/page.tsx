// app/admin/page.tsx
import { getAdminDashboardStats } from "@/app/actions/admin";
import { Users, Activity, DollarSign, ArrowRight, ShieldCheck, PieChart, TrendingUp, Clock } from "lucide-react";
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
  
  // 👇 FIX: If the display name is an ID (long string), fallback to "Admin"
  const adminName = session?.displayName && session.displayName.length > 30 
    ? "Admin" 
    : session?.displayName || "Admin";

  return (
    <div className="max-w-7xl mx-auto space-y-6 sm:space-y-8 pb-10">
      
      {/* 1. Header & Greeting */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-[#0a0f0b]/90 backdrop-blur-2xl border border-lime-500/20 p-6 rounded-3xl shadow-[0_8px_32px_0_rgba(0,0,0,0.5)]">
        <div className="min-w-0 flex-1">
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-white truncate">
            {greeting}, <span className="text-lime-500">{adminName}</span>
          </h1>
          <p className="text-lime-200/50 mt-2 font-medium text-sm sm:text-base">
            Welcome to the Command Center. Here is what happened while you were away.
          </p>
        </div>
        <div className="flex gap-2 text-xs font-mono shrink-0">
          <span className="bg-lime-500/10 text-lime-400 px-4 py-2 rounded-xl border border-lime-500/20 font-bold flex items-center gap-2">
            <Activity size={14} /> {activity.length} recent system events
          </span>
        </div>
      </div>

      {/* 2. Key Metrics Grid (Responsive) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
        <MetricCard 
          title="Total Users" 
          value={stats.totalUsers.toLocaleString()} 
          icon={<Users size={22} />} 
          subtitle={`${stats.activeUsers} active accounts`} 
        />
        <MetricCard 
          title="Platform Volume" 
          value={`$${stats.totalVolume.toLocaleString('en-US', { minimumFractionDigits: 2 })}`} 
          icon={<DollarSign size={22} />} 
          subtitle="All-time USD volume" 
          highlight 
        />
        <MetricCard 
          title="Pending Actions" 
          value="3" 
          icon={<ShieldCheck size={22} />} 
          subtitle="KYC reviews required" 
        />
        
        {/* Analytics Quick Link Card */}
        <Link href="/admin/analytics" className="group h-full">
          <div className="p-5 sm:p-6 rounded-3xl border border-lime-500/20 bg-[#0a0f0b]/90 backdrop-blur-2xl hover:border-lime-500/50 hover:bg-[#0a0f0b] transition-all h-full flex flex-col justify-between cursor-pointer shadow-lg">
            <div className="flex justify-between items-start mb-4">
              <h3 className="text-sm font-bold text-lime-200/50 group-hover:text-lime-400 transition-colors">Site Analytics</h3>
              <div className="p-2.5 rounded-xl bg-lime-500/10 text-lime-500 group-hover:bg-lime-500 group-hover:text-[#050806] transition-colors">
                <PieChart size={20} />
              </div>
            </div>
            <div className="space-y-1 mt-auto">
              <p className="text-sm font-bold text-white group-hover:text-lime-400 transition-colors flex items-center gap-1">
                View Reports <ArrowRight size={14} className="group-hover:translate-x-1 transition-transform" />
              </p>
              <p className="text-xs text-lime-200/40">Traffic & Volume charts</p>
            </div>
          </div>
        </Link>
      </div>

      {/* 3. Live Activity Feed */}
      <div className="bg-[#0a0f0b]/90 backdrop-blur-2xl border border-lime-500/20 rounded-3xl overflow-hidden shadow-[0_8px_32px_0_rgba(0,0,0,0.5)]">
        <div className="p-5 sm:p-6 border-b border-lime-500/10 flex justify-between items-center bg-white/5">
          <h2 className="font-bold text-white flex items-center gap-2 text-sm sm:text-base">
            <Activity size={18} className="text-lime-500" /> Live System Activity
          </h2>
          <Link href="/admin/ledger" className="text-xs font-bold text-lime-400 hover:text-lime-300 flex items-center gap-1 bg-lime-500/10 px-3 py-1.5 rounded-lg transition-colors">
            View Ledger <ArrowRight size={14} />
          </Link>
        </div>
        <div className="divide-y divide-lime-500/10 max-h-[400px] overflow-y-auto custom-scrollbar">
          {activity.length === 0 ? (
            <div className="p-10 text-center text-lime-200/40 text-sm font-medium">No recent activity found.</div>
          ) : (
            activity.map((item: any) => (
              <div key={item.id} className="p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:bg-lime-500/5 transition-colors">
                <div className="flex items-center gap-4">
                  <div className="w-2.5 h-2.5 rounded-full bg-lime-500 shadow-[0_0_8px_rgba(132,204,22,0.6)] shrink-0"></div>
                  <div className="min-w-0">
                    <p className="text-sm font-bold text-white capitalize truncate">
                      {item.kind.replace('_', ' ')} Executed
                    </p>
                    <p className="text-xs text-lime-200/40 font-mono mt-0.5">ID: {item.id.slice(-8)}</p>
                  </div>
                </div>
                <div className="text-left sm:text-right shrink-0">
                  <span className="text-xs text-lime-200/50 font-mono font-medium bg-black/20 px-2 py-1 rounded-md">
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
    <div className={`p-5 sm:p-6 rounded-3xl border backdrop-blur-2xl transition-all shadow-lg flex flex-col justify-between h-full ${
      highlight 
        ? 'border-lime-500/40 bg-gradient-to-br from-[#0a0f0b]/90 to-lime-900/20 shadow-lime-500/10' 
        : 'border-lime-500/20 bg-[#0a0f0b]/90'
    }`}>
      <div className="flex justify-between items-start mb-6">
        <h3 className="text-sm font-bold text-lime-200/50">{title}</h3>
        <div className={`p-2.5 rounded-xl ${highlight ? 'bg-lime-500 text-[#050806]' : 'bg-lime-500/10 text-lime-500'}`}>
          {icon}
        </div>
      </div>
      <div className="space-y-1">
        <p className="text-3xl font-extrabold font-mono text-white truncate">{value}</p>
        <p className="text-xs text-lime-200/40 font-medium">{subtitle}</p>
      </div>
    </div>
  );
}






















// // app/admin/page.tsx
// import { getAdminDashboardStats } from "@/app/actions/admin";
// import { Users, Activity, DollarSign, ArrowRight, ShieldCheck, PieChart } from "lucide-react";
// import Link from "next/link";
// import { connection } from "next/server";
// import { getServerSession } from "@/lib/session";
// import { getTimeGreeting } from "@/lib/time-greeting";

// export const instant = false;

// export default async function AdminDashboardPage() {
//   await connection();
//   const session = await getServerSession();
//   const { success, stats, activity } = await getAdminDashboardStats();

//   if (!success || !stats) return <div className="text-red-500">Failed to load admin metrics.</div>;

//   const greeting = getTimeGreeting();

//   return (
//     <div className="max-w-6xl mx-auto space-y-6 sm:space-y-8 pb-10">
      
//       {/* 1. Header & Greeting */}
//       <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-[#f4fbf5]/90 dark:bg-[#0a0f0b]/90 backdrop-blur-2xl border border-lime-500/20 p-6 rounded-3xl shadow-[0_8px_32px_0_rgba(132,204,22,0.15)] dark:shadow-[0_8px_32px_0_rgba(0,0,0,0.5)]">
//         <div>
//           <h1 className="text-2xl font-extrabold tracking-tight text-lime-950 dark:text-white">
//             {greeting}, {session?.displayName || "Admin"}
//           </h1>
//           <p className="text-lime-800/70 dark:text-lime-200/50 mt-1 font-medium text-sm">
//             Welcome to the Command Center. Here is what happened while you were away.
//           </p>
//         </div>
//         <div className="flex gap-2 text-xs font-mono">
//           <span className="bg-lime-500/10 text-lime-600 dark:text-lime-400 px-3 py-1.5 rounded-full border border-lime-500/20 font-bold">
//             {activity.length} recent system events
//           </span>
//         </div>
//       </div>

//       {/* 2. Key Metrics Grid */}
//       <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
//         <MetricCard 
//           title="Total Users" 
//           value={stats.totalUsers.toLocaleString()} 
//           icon={<Users size={20} />} 
//           subtitle={`${stats.activeUsers} active`} 
//         />
//         <MetricCard 
//           title="Platform Volume" 
//           value={`$${stats.totalVolume.toLocaleString('en-US', { minimumFractionDigits: 2 })}`} 
//           icon={<DollarSign size={20} />} 
//           subtitle="All-time USD" 
//           highlight 
//         />
//         <MetricCard 
//           title="Pending Actions" 
//           value="3" 
//           icon={<ShieldCheck size={20} />} 
//           subtitle="KYC reviews" 
//         />
//         {/* 👇 NEW ANALYTICS QUICK WIDGET */}
//         <Link href="/admin/analytics" className="group">
//           <div className="p-5 rounded-3xl border border-lime-500/20 bg-[#f4fbf5]/90 dark:bg-[#0a0f0b]/90 backdrop-blur-2xl hover:border-lime-500/50 transition-all h-full flex flex-col justify-between cursor-pointer shadow-lg">
//             <div className="flex justify-between items-start mb-4">
//               <h3 className="text-sm font-bold text-lime-800/70 dark:text-lime-200/50 group-hover:text-lime-600 transition-colors">Site Analytics</h3>
//               <div className="p-2 rounded-xl bg-lime-500/10 text-lime-500 group-hover:bg-lime-500 group-hover:text-white transition-colors">
//                 <PieChart size={20} />
//               </div>
//             </div>
//             <div className="space-y-1">
//               <p className="text-sm font-bold text-lime-950 dark:text-white group-hover:text-lime-600 transition-colors flex items-center gap-1">
//                 View Reports <ArrowRight size={14} className="group-hover:translate-x-1 transition-transform" />
//               </p>
//               <p className="text-xs text-lime-800/60 dark:text-lime-200/40">Traffic & Volume</p>
//             </div>
//           </div>
//         </Link>
//       </div>

//       {/* 3. Live Activity Feed */}
//       <div className="bg-[#f4fbf5]/90 dark:bg-[#0a0f0b]/90 backdrop-blur-2xl border border-lime-500/20 rounded-3xl overflow-hidden shadow-xl">
//         <div className="p-4 sm:p-5 border-b border-lime-500/10 flex justify-between items-center bg-white/50 dark:bg-[#121A14]/50">
//           <h2 className="font-bold text-lime-950 dark:text-white flex items-center gap-2">
//             <Activity size={18} className="text-lime-500" /> Live System Activity
//           </h2>
//           <Link href="/admin/ledger" className="text-xs font-bold text-lime-600 dark:text-lime-400 hover:text-lime-700 flex items-center gap-1">
//             View Ledger <ArrowRight size={14} />
//           </Link>
//         </div>
//         <div className="divide-y divide-lime-500/10 max-h-[400px] overflow-y-auto custom-scrollbar">
//           {activity.length === 0 ? (
//             <div className="p-8 text-center text-lime-800/50 dark:text-lime-200/40 text-sm font-medium">No recent activity found.</div>
//           ) : (
//             activity.map((item) => (
//               <div key={item.id} className="p-4 sm:p-5 flex items-center justify-between hover:bg-lime-500/5 transition-colors">
//                 <div className="flex items-center gap-4">
//                   <div className="w-2.5 h-2.5 rounded-full bg-lime-500 shadow-[0_0_8px_rgba(132,204,22,0.6)]"></div>
//                   <div>
//                     <p className="text-sm font-bold text-lime-950 dark:text-white capitalize">
//                       {item.kind.replace('_', ' ')} Executed
//                     </p>
//                     <p className="text-xs text-lime-800/50 dark:text-lime-200/40 font-mono mt-0.5">ID: {item.id.slice(-8)}</p>
//                   </div>
//                 </div>
//                 <div className="text-right">
//                   <span className="text-xs text-lime-800/60 dark:text-lime-200/40 font-mono font-medium">
//                     {new Date(item.date).toLocaleTimeString()}
//                   </span>
//                 </div>
//               </div>
//             ))
//           )}
//         </div>
//       </div>
//     </div>
//   );
// }

// function MetricCard({ title, value, icon, subtitle, highlight = false }: { title: string, value: string, icon: React.ReactNode, subtitle: string, highlight?: boolean }) {
//   return (
//     <div className={`p-5 rounded-3xl border backdrop-blur-2xl transition-all shadow-lg ${
//       highlight 
//         ? 'border-lime-500/40 bg-lime-500/5 shadow-lime-500/10' 
//         : 'border-lime-500/20 bg-[#f4fbf5]/90 dark:bg-[#0a0f0b]/90'
//     }`}>
//       <div className="flex justify-between items-start mb-4">
//         <h3 className="text-sm font-bold text-lime-800/70 dark:text-lime-200/50">{title}</h3>
//         <div className={`p-2 rounded-xl ${highlight ? 'bg-lime-500 text-white' : 'bg-lime-500/10 text-lime-500'}`}>
//           {icon}
//         </div>
//       </div>
//       <div className="space-y-1">
//         <p className="text-2xl sm:text-3xl font-extrabold font-mono text-lime-950 dark:text-white">{value}</p>
//         <p className="text-xs text-lime-800/60 dark:text-lime-200/40 font-medium">{subtitle}</p>
//       </div>
//     </div>
//   );
// }


















// // app/admin/page.tsx
// import { getAdminDashboardStats } from "@/app/actions/admin";
// import { Users, Activity, DollarSign, ArrowRight, ShieldCheck } from "lucide-react";
// import Link from "next/link";
// import { connection } from "next/server"; // <--- IMPORT ADDED


// export const instant = false;
// export default async function AdminDashboardPage() {
//   // FIX: Opt out of static prerendering for this dynamic admin page
//   await connection();

//   const { success, stats, activity } = await getAdminDashboardStats();

//   if (!success || !stats) {
//     return <div className="text-danger">Failed to load admin metrics.</div>;
//   }

//   return (
//     <div className="max-w-6xl mx-auto space-y-8">
      
//       {/* 1. Header & "While You Were Away" */}
//       <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-gradient-to-r from-surface-800 to-surface-900 border border-surface-700 p-6 rounded-2xl">
//         <div>
//           <h1 className="text-2xl font-bold tracking-tight text-text-primary">Command Center</h1>
//           <p className="text-text-secondary mt-1">Welcome back. Here is what happened while you were away.</p>
//         </div>
//         <div className="flex gap-2 text-xs font-mono">
//           <span className="bg-brand-500/10 text-brand-500 px-3 py-1.5 rounded-full border border-brand-500/20">
//             {activity.length} recent system events
//           </span>
//         </div>
//       </div>

//       {/* 2. Key Metrics Grid */}
//       <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
//         <MetricCard 
//           title="Total Users" 
//           value={stats.totalUsers.toLocaleString()} 
//           icon={<Users size={20} />} 
//           subtitle={`${stats.activeUsers} active`} 
//         />
//         <MetricCard 
//           title="Total Platform Volume" 
//           value={`$${stats.totalVolume.toLocaleString('en-US', { minimumFractionDigits: 2 })}`} 
//           icon={<DollarSign size={20} />} 
//           subtitle="All-time USD volume" 
//           highlight 
//         />
//         <MetricCard 
//           title="Pending Actions" 
//           value="3" 
//           icon={<ShieldCheck size={20} />} 
//           subtitle="KYC reviews required" 
//         />
//       </div>

//       {/* 3. Live Activity Feed */}
//       <div className="bg-surface-800 border border-surface-700 rounded-xl overflow-hidden">
//         <div className="p-4 border-b border-surface-700 flex justify-between items-center bg-surface-900/50">
//           <h2 className="font-semibold text-text-primary flex items-center gap-2">
//             <Activity size={18} className="text-brand-500" /> Live System Activity
//           </h2>
//           <Link href="/admin/ledger" className="text-xs text-brand-500 hover:text-brand-400 font-medium flex items-center gap-1">
//             View Full Ledger <ArrowRight size={14} />
//           </Link>
//         </div>
//         <div className="divide-y divide-surface-700/50 max-h-[400px] overflow-y-auto">
//           {activity.length === 0 ? (
//             <div className="p-8 text-center text-text-muted text-sm">No recent activity found.</div>
//           ) : (
//             activity.map((item) => (
//               <div key={item.id} className="p-4 flex items-center justify-between hover:bg-surface-700/30 transition-colors">
//                 <div className="flex items-center gap-4">
//                   <div className="w-2 h-2 rounded-full bg-brand-500 shadow-[0_0_8px_rgba(232,181,75,0.6)]"></div>
//                   <div>
//                     <p className="text-sm font-medium text-text-primary capitalize">
//                       {item.kind.replace('_', ' ')} Executed
//                     </p>
//                     <p className="text-xs text-text-muted font-mono">ID: {item.id.slice(-8)}</p>
//                   </div>
//                 </div>
//                 <div className="text-right">
//                   <span className="text-xs text-text-muted font-mono">
//                     {new Date(item.date).toLocaleTimeString()}
//                   </span>
//                 </div>
//               </div>
//             ))
//           )}
//         </div>
//       </div>
      
//     </div>
//   );
// }

// // Simple reusable metric card component
// function MetricCard({ title, value, icon, subtitle, highlight = false }: { title: string, value: string, icon: React.ReactNode, subtitle: string, highlight?: boolean }) {
//   return (
//     <div className={`p-5 rounded-xl border ${highlight ? 'border-brand-500/30 bg-brand-500/5' : 'border-surface-700 bg-surface-800'}`}>
//       <div className="flex justify-between items-start mb-4">
//         <h3 className="text-sm font-medium text-text-secondary">{title}</h3>
//         <div className={`p-2 rounded-lg ${highlight ? 'bg-brand-500/20 text-brand-500' : 'bg-surface-900 text-text-muted'}`}>
//           {icon}
//         </div>
//       </div>
//       <div className="space-y-1">
//         <p className="text-3xl font-bold font-mono text-text-primary">{value}</p>
//         <p className="text-xs text-text-muted">{subtitle}</p>
//       </div>
//     </div>
//   );
// }