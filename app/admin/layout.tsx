// app/admin/layout.tsx
import { getServerSession } from "@/lib/session";
import { redirect } from "next/navigation";
import { connection } from "next/server";
import AdminSidebar from "@/components/admin/AdminSidebar";
import HeaderActions from "@/components/HeaderActions"; // 👈 IMPORTED
import { useDevModal } from "@/components/providers/DevModalProvider"; // Necessary if HeaderActions needs it in this context, but since it's a server component, HeaderActions handles it internally.

export const instant = false;

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  await connection();
  const session = await getServerSession();

  if (!session || session.role !== 'admin') redirect("/dashboard");

  // Fallback name if it's a long ID
  const adminName = session.displayName && session.displayName.length > 30 
    ? "Admin" 
    : session.displayName || "Admin";

  return (
    <div className="flex h-screen bg-[#050806] text-white font-sans overflow-hidden selection:bg-lime-500/30">
      
      <AdminSidebar session={session} />

      <main className="flex-1 flex flex-col min-w-0 overflow-hidden relative">
        {/* Decorative Background Orbs */}
        <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-lime-500/5 rounded-full blur-[120px] pointer-events-none"></div>

        <header className="h-16 border-b border-lime-500/20 bg-[#0a0f0b]/80 backdrop-blur-xl flex items-center justify-between px-6 shrink-0 z-50 pl-16 md:pl-6">
          <div className="text-xs font-mono text-lime-200/50 flex items-center gap-2">
            Status: <span className="text-lime-500 font-bold animate-pulse">ONLINE</span>
          </div>
          
          <div className="flex items-center gap-3 sm:gap-4 text-xs text-lime-200/50">
            <div className="text-right hidden sm:block">
              <p className="text-white font-bold truncate max-w-[150px]">
                {adminName}
              </p>
              <p className="text-[10px] text-lime-500/70 uppercase tracking-widest font-bold">Administrator</p>
            </div>
            
            {/* 👇 ADDED THEME TOGGLE & HEADER ACTIONS HERE */}
            <div className="flex items-center gap-2 border-l border-lime-500/20 pl-3 sm:pl-4">
              <HeaderActions 
                hideNotifications={true} 
                kycTier={3} // Admin is effectively Tier 3
              />
            </div>

            <div className="w-9 h-9 rounded-xl bg-lime-500/20 border border-lime-500/30 text-lime-400 flex items-center justify-center font-bold shadow-[0_0_15px_rgba(132,204,22,0.2)]">
              {adminName.charAt(0).toUpperCase()}
            </div>
          </div>
        </header>
        
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 custom-scrollbar relative z-10">
          <div className="max-w-7xl mx-auto">
            {children}
          </div>
        </div>
      </main>
    </div>
  );
}


// // app/admin/layout.tsx
// import { getServerSession } from "@/lib/session";
// import { redirect } from "next/navigation";
// import { connection } from "next/server";
// import AdminSidebar from "@/components/admin/AdminSidebar";

// export const instant = false;

// export default async function AdminLayout({ children }: { children: React.ReactNode }) {
//   await connection();
//   const session = await getServerSession();

//   if (!session || session.role !== 'admin') redirect("/dashboard");

//   return (
//     <div className="flex h-screen bg-[#050806] text-white font-sans overflow-hidden selection:bg-lime-500/30">
      
//       <AdminSidebar session={session} />

//       <main className="flex-1 flex flex-col min-w-0 overflow-hidden relative">
//         {/* Decorative Background Orbs */}
//         <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-lime-500/5 rounded-full blur-[120px] pointer-events-none"></div>

//         <header className="h-16 border-b border-lime-500/20 bg-[#0a0f0b]/80 backdrop-blur-xl flex items-center justify-between px-6 shrink-0 z-30 pl-16 md:pl-6">
//           <div className="text-xs font-mono text-lime-200/50 flex items-center gap-2">
//             Status: <span className="text-lime-500 font-bold animate-pulse">ONLINE</span>
//           </div>
//           <div className="flex items-center gap-3 text-xs text-lime-200/50">
//             <div className="text-right hidden sm:block">
//               <p className="text-white font-bold truncate max-w-[150px]">
//                 {session.displayName.length > 25 ? "Admin" : session.displayName}
//               </p>
//               <p className="text-[10px] text-lime-500/70 uppercase tracking-widest font-bold">Administrator</p>
//             </div>
//             <div className="w-9 h-9 rounded-xl bg-lime-500/20 border border-lime-500/30 text-lime-400 flex items-center justify-center font-bold shadow-[0_0_15px_rgba(132,204,22,0.2)]">
//               {session.displayName.charAt(0).toUpperCase()}
//             </div>
//           </div>
//         </header>
//         <div className="flex-1 overflow-y-auto p-4 sm:p-6 custom-scrollbar relative z-10">
//           <div className="max-w-7xl mx-auto">
//             {children}
//           </div>
//         </div>
//       </main>
//     </div>
//   );
// }
















// // app/admin/layout.tsx
// import { getServerSession } from "@/lib/session";
// import { redirect } from "next/navigation";
// import { connection } from "next/server";
// import AdminSidebar from "@/components/admin/AdminSidebar";
// import { getTimeGreeting } from "@/lib/time-greeting";

// export const instant = false;

// export default async function AdminLayout({ children }: { children: React.ReactNode }) {
//   await connection();
//   const session = await getServerSession();

//   if (!session || session.role !== 'admin') redirect("/dashboard");

//   return (
//     <div className="flex h-screen bg-[#050806] text-gray-100 font-sans overflow-hidden">
      
//       <AdminSidebar session={session} />

//       <main className="flex-1 flex flex-col min-w-0 overflow-hidden">
//         <header className="h-16 border-b border-lime-500/20 bg-[#0a0f0b]/80 backdrop-blur-xl flex items-center justify-between px-6 shrink-0 z-30 pl-16 md:pl-6">
//           <div className="text-xs font-mono text-gray-400">
//             Status: <span className="text-lime-500 animate-pulse">Online</span>
//           </div>
//           <div className="flex items-center gap-3 text-xs text-gray-400">
//             <div className="text-right hidden sm:block">
//               <p className="text-white font-bold">{session.displayName}</p>
//               <p className="text-[10px] text-lime-500/70">Administrator</p>
//             </div>
//             <div className="w-9 h-9 rounded-xl bg-lime-500/20 border border-lime-500/30 text-lime-400 flex items-center justify-center font-bold shadow-[0_0_15px_rgba(132,204,22,0.2)]">
//               {session.displayName.charAt(0).toUpperCase()}
//             </div>
//           </div>
//         </header>
//         <div className="flex-1 overflow-y-auto p-4 sm:p-6 custom-scrollbar relative">
//           <div className="absolute inset-0 pointer-events-none bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-lime-500/5 via-transparent to-transparent"></div>
//           <div className="relative z-10 max-w-7xl mx-auto">
//             {children}
//           </div>
//         </div>
//       </main>
//     </div>
//   );
// }
















// // app/admin/layout.tsx
// import { getServerSession } from "@/lib/session";
// import { redirect } from "next/navigation";
// import Link from "next/link";
// import { 
//   ShieldAlert, 
//   LayoutDashboard, 
//   Users, 
//   FileText, 
//   ArrowRightLeft, 
//   Settings, 
//   LogOut, 
//   ArrowLeft,
//   Megaphone, 
//   Coins,
//   Activity
// } from "lucide-react";
// import { logout } from "@/app/actions/auth";

// export default async function AdminLayout({ children }: { children: React.ReactNode }) {
//   const session = await getServerSession();

//   if (!session || session.role !== 'admin') redirect("/dashboard");

//   return (
//     <div className="flex h-screen bg-[#050505] text-gray-100 font-sans">
//       <aside className="w-64 border-r border-white/10 bg-[#0a0f0b] flex-col hidden md:flex">
//         <div className="h-16 flex items-center px-6 border-b border-white/10 gap-3">
//           <ShieldAlert className="text-lime-500" size={24} />
//           <span className="font-bold tracking-wider text-white">ADMIN OS</span>
//         </div>
        
//         <nav className="flex-1 p-4 space-y-2">
//           <NavItem href="/admin" icon={<LayoutDashboard size={18} />} label="Overview" />
//           <NavItem href="/admin/users" icon={<Users size={18} />} label="Users" />
//           <NavItem href="/admin/kyc" icon={<FileText size={18} />} label="KYC Queue" />
//           <NavItem href="/admin/ledger" icon={<ArrowRightLeft size={18} />} label="Ledger" />
//           <NavItem href="/admin/notifications" icon={<Megaphone size={18} />} label="Broadcasts" />
//           <NavItem href="/admin/assets" icon={<Coins size={18} />} label="Assets" />
//           <NavItem href="/admin/market-control" icon={<Activity size={18} />} label="Market Control" />
//           <NavItem href="/admin/settings" icon={<Settings size={18} />} label="Settings" />
//         </nav>

//         <div className="p-4 border-t border-white/10 space-y-2">
//           <Link href="/dashboard" className="flex items-center gap-3 px-3 py-2 rounded-lg text-sm text-gray-400 hover:text-white transition-colors">
//             <ArrowLeft size={16} /> Exit Admin
//           </Link>
//           <form action={logout}>
//             <button type="submit" className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm text-red-500 hover:bg-red-500/10 font-bold transition-colors">
//               <LogOut size={16} /> Sign Out
//             </button>
//           </form>
//         </div>
//       </aside>

//       <main className="flex-1 flex flex-col min-w-0 overflow-hidden">
//         <header className="h-16 border-b border-white/10 bg-[#0a0f0b]/50 flex items-center justify-between px-6 shrink-0">
//           <div className="text-xs font-mono text-gray-400">Status: <span className="text-lime-500">Online</span></div>
//           <div className="flex items-center gap-2 text-xs text-gray-400">
//             <span>Admin: {session.displayName}</span>
//             <div className="w-8 h-8 rounded-full bg-lime-500/20 text-lime-500 flex items-center justify-center font-bold">
//               {session.displayName.charAt(0).toUpperCase()}
//             </div>
//           </div>
//         </header>
//         <div className="flex-1 overflow-y-auto p-6">{children}</div>
//       </main>
//     </div>
//   );
// }

// function NavItem({ href, icon, label }: { href: string; icon: React.ReactNode; label: string }) {
//   return (
//     <Link href={href} className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-gray-400 hover:text-lime-400 hover:bg-white/5 transition-all">
//       {icon} <span className="text-sm font-semibold">{label}</span>
//     </Link>
//   );
// }