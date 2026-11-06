// app/terminal/layout.tsx
import { getServerSession } from "@/lib/session";
import { redirect } from "next/navigation";
import { connection } from "next/server";
import HeaderActions from "@/components/HeaderActions";
import NotificationButton from "@/app/dashboard/notifications/NotificationButton";
import AnimatedSearch from "@/app/dashboard/AnimatedSearch";
import WatermarkBackground from "@/components/WatermarkBackground";
import connectDB from "@/lib/db"; 
import User from "@/lib/models/User"; 
import Settings from "@/lib/models/Settings";
import { NotificationsProvider } from "@/components/providers/NotificationsProvider"; // 👈 Imported Provider
import { getUserNotifications } from "@/app/actions/notifications"; // 👈 Imported Action
import { Wrench, LogOut } from "lucide-react";
import { logout } from "@/app/actions/auth";

export const instant = false; 

export default async function TerminalLayout({ children }: { children: React.ReactNode }) {
  await connection();

  const session = await getServerSession();
  if (!session) redirect("/login");

  await connectDB();
  
  const settings = await Settings.findOne().lean();
  if (settings?.maintenanceMode && session.role !== "admin") {
    return (
      <div className="relative min-h-screen bg-[#f0fdf4] dark:bg-[#050806] flex items-center justify-center p-4 font-sans">
        <div className="bg-white/80 dark:bg-[#0a0f0b]/80 backdrop-blur-xl border border-lime-500/30 rounded-3xl p-10 max-w-md w-full text-center shadow-2xl">
          <div className="w-20 h-20 bg-amber-500/20 rounded-full flex items-center justify-center mx-auto mb-6">
            <Wrench className="text-amber-500" size={40} />
          </div>
          <h1 className="text-2xl font-extrabold text-lime-950 dark:text-white mb-2">Scheduled Maintenance</h1>
          <p className="text-sm text-lime-800/60 dark:text-lime-200/50 mb-8 font-medium">
            The trading terminal is currently offline for upgrades. Please check back shortly.
          </p>
          <form action={logout}>
            <button className="w-full py-3 bg-red-500 hover:bg-red-600 text-white font-bold rounded-xl transition-colors flex items-center justify-center gap-2 shadow-lg shadow-red-500/20">
              <LogOut size={18} /> Sign Out
            </button>
          </form>
        </div>
      </div>
    );
  }

  const user = await User.findById(session.id).lean();
  
  const currencyMap: Record<string, string> = { 
    USD: "$", EUR: "€", GBP: "£", JPY: "¥", CAD: "C$", 
    AUD: "A$", CHF: "CHF", CNY: "¥", INR: "₹" 
  };
  const userCurrencyCode = user?.displayCurrency?.assetId || "USD";
  const displayCurrencySymbol = currencyMap[userCurrencyCode] || "$";

  // 👇 FETCH NOTIFICATIONS FOR PROVIDER
  const rawNotifs = await getUserNotifications();
  const mappedNotifs = rawNotifs.map((n: any) => ({
    id: n._id, type: n.type, title: n.title, message: n.message,
    timestamp: n.createdAt, read: n.read, href: n.href, meta: n.meta
  }));

  return (
    <div className="relative min-h-screen bg-[#f0fdf4] dark:bg-[#050806] text-lime-950 dark:text-white overflow-hidden font-sans">
      <WatermarkBackground />

      <div className="fixed top-4 left-4 right-4 sm:top-6 sm:left-6 sm:right-6 z-50 pointer-events-none">
        <div className="pointer-events-auto flex items-center justify-between gap-2 sm:gap-4 bg-white/60 dark:bg-[#121A14]/60 backdrop-blur-xl border border-lime-500/20 shadow-[0_8px_32px_0_rgba(132,204,22,0.15)] dark:shadow-[0_8px_32px_0_rgba(0,0,0,0.5)] px-3 py-2 sm:px-4 sm:py-2.5 rounded-full w-full">
          <div className="flex-1 max-w-md">
            <AnimatedSearch />
          </div>

          <div className="flex items-center gap-2 sm:gap-3 shrink-0">
            <NotificationButton  />
            <div className="h-5 sm:h-6 w-px bg-lime-500/20"></div>
            <HeaderActions hideNotifications={true} kycTier={session.tier || 0} />
          </div>
        </div>
      </div>

      <main className="relative z-10 h-screen overflow-y-auto pt-24 pb-10 px-4 sm:px-8">
        {/* 👇 WRAPPED WITH PROVIDER */}
        <NotificationsProvider initial={mappedNotifs}>
          {children}
        </NotificationsProvider>
      </main>
    </div>
  );
}
// // app/terminal/layout.tsx
// import { getServerSession } from "@/lib/session";
// import { redirect } from "next/navigation";
// import { connection } from "next/server";
// import HeaderActions from "@/components/HeaderActions";
// import NotificationButton from "@/app/dashboard/notifications/NotificationButton";
// import AnimatedSearch from "@/app/dashboard/AnimatedSearch";
// import WatermarkBackground from "@/components/WatermarkBackground";
// import connectDB from "@/lib/db"; 
// import User from "@/lib/models/User"; 
// import Settings from "@/lib/models/Settings"; // 👈 Imported Settings
// import { Wrench, LogOut } from "lucide-react"; // 👈 Imported Icons
// import { logout } from "@/app/actions/auth"; // 👈 Imported logout

// export const instant = false; 

// export default async function TerminalLayout({ children }: { children: React.ReactNode }) {
//   await connection();

//   const session = await getServerSession();
//   if (!session) redirect("/login");

//   await connectDB();
  
//   // 👇 ENFORCE MAINTENANCE MODE
//   const settings = await Settings.findOne().lean();
//   if (settings?.maintenanceMode && session.role !== "admin") {
//     return (
//       <div className="relative min-h-screen bg-[#f0fdf4] dark:bg-[#050806] flex items-center justify-center p-4 font-sans">
//         <div className="bg-white/80 dark:bg-[#0a0f0b]/80 backdrop-blur-xl border border-lime-500/30 rounded-3xl p-10 max-w-md w-full text-center shadow-2xl">
//           <div className="w-20 h-20 bg-amber-500/20 rounded-full flex items-center justify-center mx-auto mb-6">
//             <Wrench className="text-amber-500" size={40} />
//           </div>
//           <h1 className="text-2xl font-extrabold text-lime-950 dark:text-white mb-2">Scheduled Maintenance</h1>
//           <p className="text-sm text-lime-800/60 dark:text-lime-200/50 mb-8 font-medium">
//             The trading terminal is currently offline for upgrades. Please check back shortly.
//           </p>
//           <form action={logout}>
//             <button className="w-full py-3 bg-red-500 hover:bg-red-600 text-white font-bold rounded-xl transition-colors flex items-center justify-center gap-2 shadow-lg shadow-red-500/20">
//               <LogOut size={18} /> Sign Out
//             </button>
//           </form>
//         </div>
//       </div>
//     );
//   }

//   const user = await User.findById(session.id).lean();
  
//   const currencyMap: Record<string, string> = { 
//     USD: "$", EUR: "€", GBP: "£", JPY: "¥", CAD: "C$", 
//     AUD: "A$", CHF: "CHF", CNY: "¥", INR: "₹" 
//   };
//   const userCurrencyCode = user?.displayCurrency?.assetId || "USD";
//   const displayCurrencySymbol = currencyMap[userCurrencyCode] || "$";

//   return (
//     <div className="relative min-h-screen bg-[#f0fdf4] dark:bg-[#050806] text-lime-950 dark:text-white overflow-hidden font-sans">
//       <WatermarkBackground />

//       <div className="fixed top-4 left-4 right-4 sm:top-6 sm:left-6 sm:right-6 z-50 pointer-events-none">
//         <div className="pointer-events-auto flex items-center justify-between gap-2 sm:gap-4 bg-white/60 dark:bg-[#121A14]/60 backdrop-blur-xl border border-lime-500/20 shadow-[0_8px_32px_0_rgba(132,204,22,0.15)] dark:shadow-[0_8px_32px_0_rgba(0,0,0,0.5)] px-3 py-2 sm:px-4 sm:py-2.5 rounded-full w-full">
//           <div className="flex-1 max-w-md">
//             <AnimatedSearch />
//           </div>

//           <div className="flex items-center gap-2 sm:gap-3 shrink-0">
//             <NotificationButton type="urgent" />
//             <div className="h-5 sm:h-6 w-px bg-lime-500/20"></div>
//             <HeaderActions hideNotifications={true} kycTier={session.tier || 0} />
//           </div>
//         </div>
//       </div>

//       <main className="relative z-10 h-screen overflow-y-auto pt-24 pb-10 px-4 sm:px-8">
//         {children}
//       </main>
//     </div>
//   );
// }
// // app/terminal/layout.tsx
// import { getServerSession } from "@/lib/session";
// import { redirect } from "next/navigation";
// import { connection } from "next/server";
// import HeaderActions from "@/components/HeaderActions";
// import NotificationButton from "@/app/dashboard/notifications/NotificationButton";
// import AnimatedSearch from "@/app/dashboard/AnimatedSearch";
// import WatermarkBackground from "@/components/WatermarkBackground";
// import connectDB from "@/lib/db"; // 👈 Import DB
// import User from "@/lib/models/User"; // 👈 Import User model

// export const instant = false; 

// export default async function TerminalLayout({ children }: { children: React.ReactNode }) {
//   await connection();

//   const session = await getServerSession();
//   if (!session) redirect("/login");

//   // 👇 Fetch the user's preferred currency
//   await connectDB();
//   const user = await User.findById(session.id).lean();
  
//   const currencyMap: Record<string, string> = { 
//     USD: "$", EUR: "€", GBP: "£", JPY: "¥", CAD: "C$", 
//     AUD: "A$", CHF: "CHF", CNY: "¥", INR: "₹" 
//   };
//   const userCurrencyCode = user?.displayCurrency?.assetId || "USD";
//   const displayCurrencySymbol = currencyMap[userCurrencyCode] || "$";

//   return (
//     <div className="relative min-h-screen bg-[#f0fdf4] dark:bg-[#050806] text-lime-950 dark:text-white overflow-hidden font-sans">
//       <WatermarkBackground />

//       <div className="fixed top-4 left-4 right-4 sm:top-6 sm:left-6 sm:right-6 z-50 pointer-events-none">
//         <div className="pointer-events-auto flex items-center justify-between gap-2 sm:gap-4 bg-white/60 dark:bg-[#121A14]/60 backdrop-blur-xl border border-lime-500/20 shadow-[0_8px_32px_0_rgba(132,204,22,0.15)] dark:shadow-[0_8px_32px_0_rgba(0,0,0,0.5)] px-3 py-2 sm:px-4 sm:py-2.5 rounded-full w-full">
//           <div className="flex-1 max-w-md">
//             <AnimatedSearch />
//           </div>

//           <div className="flex items-center gap-2 sm:gap-3 shrink-0">
//             <NotificationButton type="urgent" />
//             <div className="h-5 sm:h-6 w-px bg-lime-500/20"></div>
//             <HeaderActions hideNotifications={true} kycTier={session.tier || 0} />
//           </div>
//         </div>
//       </div>

//       <main className="relative z-10 h-screen overflow-y-auto pt-24 pb-10 px-4 sm:px-8">
//         {/* 👇 Pass the currency symbol to children via a wrapper or context if needed, 
//             but for now, we will pass it directly in the page */}
//         {children}
//       </main>
//     </div>
//   );
// }