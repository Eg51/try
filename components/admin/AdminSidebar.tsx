// components/admin/AdminSidebar.tsx
"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { 
  ShieldAlert, LayoutDashboard, Users, FileText, ArrowRightLeft, 
  Settings, LogOut, ArrowLeft, Megaphone, Coins, Activity, PieChart, Menu, X
} from "lucide-react";
import { logout } from "@/app/actions/auth";

export default function AdminSidebar({ session }: { session: any }) {
  const [isOpen, setIsOpen] = useState(false);
  const pathname = usePathname();

  const navItems = [
    { href: "/admin", icon: <LayoutDashboard size={18} />, label: "Overview" },
    { href: "/admin/analytics", icon: <PieChart size={18} />, label: "Analytics" },
    { href: "/admin/users", icon: <Users size={18} />, label: "Users" },
    { href: "/admin/kyc", icon: <FileText size={18} />, label: "KYC Queue" },
    { href: "/admin/ledger", icon: <ArrowRightLeft size={18} />, label: "Ledger" },
    { href: "/admin/notifications", icon: <Megaphone size={18} />, label: "Broadcasts" },
    { href: "/admin/assets", icon: <Coins size={18} />, label: "Assets" },
    { href: "/admin/market-control", icon: <Activity size={18} />, label: "Market Control" },
    { href: "/admin/settings", icon: <Settings size={18} />, label: "Settings" },
  ];

  const SidebarContent = () => (
    <>
      <div className="h-16 flex items-center justify-between px-6 border-b border-lime-500/20 shrink-0 bg-[#050806]/50">
        <div className="flex items-center gap-3">
          <ShieldAlert className="text-lime-500" size={24} />
          <span className="font-bold tracking-widest text-white text-sm">ADMIN OS</span>
        </div>
        <button onClick={() => setIsOpen(false)} className="md:hidden text-gray-400 hover:text-white transition-colors">
          <X size={20} />
        </button>
      </div>
      
      <nav className="flex-1 p-4 space-y-1.5 overflow-y-auto custom-scrollbar">
        {navItems.map((item) => {
          const isActive = pathname === item.href;
          return (
            <Link 
              key={item.href}
              href={item.href} 
              onClick={() => setIsOpen(false)}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all ${
                isActive 
                  ? "bg-lime-500/15 text-lime-400 font-bold border border-lime-500/30 shadow-[inset_0_1px_0_rgba(255,255,255,0.1)]" 
                  : "text-lime-200/60 hover:text-white hover:bg-white/5 font-semibold border border-transparent"
              }`}
            >
              <div className={isActive ? "text-lime-500" : "text-lime-200/40"}>
                {item.icon} 
              </div>
              <span className="text-sm">{item.label}</span>
            </Link>
          );
        })}
      </nav>

      <div className="p-4 border-t border-lime-500/20 space-y-2 shrink-0 bg-[#050806]/50">
        <Link href="/dashboard" className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm text-lime-200/50 hover:text-white hover:bg-white/5 transition-colors font-medium">
          <ArrowLeft size={16} /> Exit Admin
        </Link>
        <form action={logout}>
          <button type="submit" className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm text-red-400 hover:bg-red-500/10 hover:text-red-300 font-bold transition-colors">
            <LogOut size={16} /> Sign Out
          </button>
        </form>
      </div>
    </>
  );

  return (
    <>
      {/* Mobile Hamburger Button */}
      <button 
        onClick={() => setIsOpen(true)}
        className="md:hidden fixed top-3 left-4 z-50 p-2.5 bg-[#0a0f0b]/90 backdrop-blur-xl border border-lime-500/30 rounded-xl text-lime-400 shadow-lg"
      >
        <Menu size={20} />
      </button>

      {/* Desktop Sidebar */}
      <aside className="w-64 border-r border-lime-500/20 bg-[#0a0f0b] flex-col hidden md:flex relative z-40 shadow-[4px_0_24px_rgba(0,0,0,0.5)]">
        <SidebarContent />
      </aside>

      {/* Mobile Drawer */}
      <AnimatePresence>
        {isOpen && (
          <>
            <motion.div 
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              onClick={() => setIsOpen(false)}
              className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[100] md:hidden"
            />
            <motion.aside
              initial={{ x: "-100%" }} animate={{ x: 0 }} exit={{ x: "-100%" }}
              transition={{ type: "spring", damping: 25, stiffness: 200 }}
              className="fixed inset-y-0 left-0 w-64 bg-[#0a0f0b] border-r border-lime-500/20 flex flex-col z-[101] md:hidden shadow-2xl"
            >
              <SidebarContent />
            </motion.aside>
          </>
        )}
      </AnimatePresence>
    </>
  );
}














// // components/admin/AdminSidebar.tsx
// "use client";

// import { useState } from "react";
// import Link from "next/link";
// import { usePathname } from "next/navigation";
// import { motion, AnimatePresence } from "framer-motion";
// import { 
//   ShieldAlert, LayoutDashboard, Users, FileText, ArrowRightLeft, 
//   Settings, LogOut, ArrowLeft, Megaphone, Coins, Activity, PieChart, Menu, X
// } from "lucide-react";
// import { logout } from "@/app/actions/auth";

// export default function AdminSidebar({ session }: { session: any }) {
//   const [isOpen, setIsOpen] = useState(false);
//   const pathname = usePathname();

//   const navItems = [
//     { href: "/admin", icon: <LayoutDashboard size={18} />, label: "Overview" },
//     { href: "/admin/analytics", icon: <PieChart size={18} />, label: "Analytics" }, // 👈 NEW
//     { href: "/admin/users", icon: <Users size={18} />, label: "Users" },
//     { href: "/admin/kyc", icon: <FileText size={18} />, label: "KYC Queue" },
//     { href: "/admin/ledger", icon: <ArrowRightLeft size={18} />, label: "Ledger" },
//     { href: "/admin/notifications", icon: <Megaphone size={18} />, label: "Broadcasts" },
//     { href: "/admin/assets", icon: <Coins size={18} />, label: "Assets" },
//     { href: "/admin/market-control", icon: <Activity size={18} />, label: "Market Control" },
//     { href: "/admin/settings", icon: <Settings size={18} />, label: "Settings" },
//   ];

//   const SidebarContent = () => (
//     <>
//       <div className="h-16 flex items-center justify-between px-6 border-b border-lime-500/20 shrink-0">
//         <div className="flex items-center gap-3">
//           <ShieldAlert className="text-lime-500" size={24} />
//           <span className="font-bold tracking-wider text-white">ADMIN OS</span>
//         </div>
//         <button onClick={() => setIsOpen(false)} className="md:hidden text-gray-400 hover:text-white">
//           <X size={20} />
//         </button>
//       </div>
      
//       <nav className="flex-1 p-4 space-y-1 overflow-y-auto custom-scrollbar">
//         {navItems.map((item) => (
//           <Link 
//             key={item.href}
//             href={item.href} 
//             onClick={() => setIsOpen(false)}
//             className={`flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all ${
//               pathname === item.href 
//                 ? "bg-lime-500/20 text-lime-400 font-bold border border-lime-500/30" 
//                 : "text-gray-400 hover:text-lime-400 hover:bg-white/5 font-semibold"
//             }`}
//           >
//             {item.icon} <span className="text-sm">{item.label}</span>
//           </Link>
//         ))}
//       </nav>

//       <div className="p-4 border-t border-lime-500/20 space-y-2 shrink-0">
//         <Link href="/dashboard" className="flex items-center gap-3 px-3 py-2 rounded-xl text-sm text-gray-400 hover:text-white transition-colors">
//           <ArrowLeft size={16} /> Exit Admin
//         </Link>
//         <form action={logout}>
//           <button type="submit" className="w-full flex items-center gap-3 px-3 py-2 rounded-xl text-sm text-red-500 hover:bg-red-500/10 font-bold transition-colors">
//             <LogOut size={16} /> Sign Out
//           </button>
//         </form>
//       </div>
//     </>
//   );

//   return (
//     <>
//       {/* Mobile Hamburger Button */}
//       <button 
//         onClick={() => setIsOpen(true)}
//         className="md:hidden fixed top-3 left-4 z-50 p-2 bg-[#0a0f0b]/90 backdrop-blur-xl border border-lime-500/30 rounded-xl text-lime-400 shadow-lg"
//       >
//         <Menu size={20} />
//       </button>

//       {/* Desktop Sidebar */}
//       <aside className="w-64 border-r border-lime-500/20 bg-[#0a0f0b] flex-col hidden md:flex relative z-40 shadow-[4px_0_24px_rgba(0,0,0,0.5)]">
//         <SidebarContent />
//       </aside>

//       {/* Mobile Drawer */}
//       <AnimatePresence>
//         {isOpen && (
//           <>
//             <motion.div 
//               initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
//               onClick={() => setIsOpen(false)}
//               className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[100] md:hidden"
//             />
//             <motion.aside
//               initial={{ x: "-100%" }} animate={{ x: 0 }} exit={{ x: "-100%" }}
//               transition={{ type: "spring", damping: 25, stiffness: 200 }}
//               className="fixed inset-y-0 left-0 w-64 bg-[#0a0f0b] border-r border-lime-500/20 flex flex-col z-[101] md:hidden shadow-2xl"
//             >
//               <SidebarContent />
//             </motion.aside>
//           </>
//         )}
//       </AnimatePresence>
//     </>
//   );
// }