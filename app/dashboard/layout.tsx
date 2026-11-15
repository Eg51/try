// app/dashboard/layout.tsx
import { getServerSession } from "@/lib/session";
import { redirect } from "next/navigation";
import { KycProvider } from "@/components/providers/KycProvider";
import { connection } from "next/server";
import { cookies } from "next/headers";
import { KycGuard } from "@/components/KycGuard"; 
import HeaderActions from "@/components/HeaderActions";
import NotificationButton from "@/app/dashboard/notifications/NotificationButton"; 
import AnimatedSearch from "@/app/dashboard/AnimatedSearch"; 
import WatermarkBackground from "@/components/WatermarkBackground";
import connectDB from "@/lib/db";
import Settings from "@/lib/models/Settings";
import { NotificationsProvider } from "@/components/providers/NotificationsProvider";
import { getUserNotifications } from "@/app/actions/notifications";
import { Wrench, LogOut } from "lucide-react";
import { logout } from "@/app/actions/auth";
import { getTranslations } from "next-intl/server";

export const instant = false;

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  await connection(); 
  const t = await getTranslations("DashboardLayout");

  const session = await getServerSession();
  if (!session) redirect("/login");

  await connectDB();
  const settings = await Settings.findOne().lean();
  
  if (settings?.maintenanceMode && session.role !== "admin") {
    return (
      <div className="relative min-h-screen bg-[#f0fdf4] dark:bg-[#050806] flex items-center justify-center p-4 font-sans">
        <div className="bg-white/80 dark:bg-[#0a0f0b]/80 backdrop-blur-xl border border-lime-500/30 rounded-3xl p-10 max-w-md w-full text-center shadow-[0_8px_32px_0_rgba(132,204,22,0.15)] dark:shadow-[0_8px_32px_0_rgba(0,0,0,0.5)]">
          <div className="w-20 h-20 bg-amber-500/20 rounded-full flex items-center justify-center mx-auto mb-6">
            <Wrench className="text-amber-500" size={40} />
          </div>
          <h1 className="text-2xl font-extrabold text-lime-950 dark:text-white mb-2">
            {t("maintenance.title")}
          </h1>
          <p className="text-sm text-lime-800/60 dark:text-lime-200/50 mb-8 font-medium">
            {t("maintenance.desc")}
          </p>
          <form action={logout}>
            <button className="w-full py-3 bg-red-500 hover:bg-red-600 text-white font-bold rounded-xl transition-colors flex items-center justify-center gap-2 shadow-lg shadow-red-500/20">
              <LogOut size={18} /> {t("maintenance.signOut")}
            </button>
          </form>
        </div>
      </div>
    );
  }

  const cookieStore = await cookies();
  const hasSkippedKyc = cookieStore.get("kyc_skipped")?.value === "true";

  const rawNotifs = await getUserNotifications();
  const mappedNotifs = rawNotifs.map((n: any) => ({
    id: n._id, type: n.type, title: n.title, message: n.message,
    timestamp: n.createdAt, read: n.read, href: n.href, meta: n.meta
  }));

  return (
    <NotificationsProvider initial={mappedNotifs}>
      <div className="relative min-h-screen bg-[#f0fdf4] dark:bg-[#050806] text-lime-950 dark:text-white overflow-hidden font-sans">
        
        <WatermarkBackground />

        <div className="fixed top-4 left-4 right-4 sm:top-6 sm:left-6 sm:right-6 z-50 pointer-events-none">
          <div className="pointer-events-auto flex items-center justify-between gap-2 sm:gap-4 bg-white/60 dark:bg-[#121A14]/60 backdrop-blur-xl border border-lime-500/20 shadow-[0_8px_32px_0_rgba(132,204,22,0.15)] dark:shadow-[0_8px_32px_0_rgba(0,0,0,0.5)] px-3 py-2 sm:px-4 sm:py-2.5 rounded-full w-full">
            
            <div className="flex-1 max-w-md">
              <AnimatedSearch />
            </div>

            <div className="flex items-center gap-2 sm:gap-3 shrink-0">
              <NotificationButton />
              <div className="h-5 sm:h-6 w-px bg-lime-500/20"></div>
              <HeaderActions hideNotifications={true} kycTier={session.tier || 0} />
            </div>

          </div>
        </div>

        <main className="relative z-10 h-[100dvh] overflow-y-auto pt-24 pb-10 px-4 sm:px-8">
          <KycProvider initialTier={(session.tier || 0) as 0 | 1 | 2 | 3} initialSkipped={hasSkippedKyc}>
            {/* 👇 THE FIX IS ON THIS LINE 👇 */}
            <KycGuard tier={session.tier || 0} isSkipped={hasSkippedKyc} isAdmin={session.role === "admin"} >
              {children}
            </KycGuard>
          </KycProvider>
        </main>
      </div>
    </NotificationsProvider>
  );
}







// // app/dashboard/layout.tsx
// import { getServerSession } from "@/lib/session";
// import { redirect } from "next/navigation";
// import { KycProvider } from "@/components/providers/KycProvider";
// import { connection } from "next/server";
// import { cookies } from "next/headers";
// import { KycGuard } from "@/components/KycGuard"; 
// import HeaderActions from "@/components/HeaderActions";
// import NotificationButton from "@/app/dashboard/notifications/NotificationButton"; 
// import AnimatedSearch from "@/app/dashboard/AnimatedSearch"; 
// import WatermarkBackground from "@/components/WatermarkBackground";
// import connectDB from "@/lib/db";
// import Settings from "@/lib/models/Settings";
// import { NotificationsProvider } from "@/components/providers/NotificationsProvider";
// import { getUserNotifications } from "@/app/actions/notifications";
// import { Wrench, LogOut } from "lucide-react";
// import { logout } from "@/app/actions/auth";
// import { getTranslations } from "next-intl/server"; // 👈 ADDED

// export const instant = false;

// export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
//   await connection(); 
//   const t = await getTranslations("DashboardLayout"); // 👈 ADDED

//   const session = await getServerSession();
//   if (!session) redirect("/login");

//   await connectDB();
//   const settings = await Settings.findOne().lean();
  
//   if (settings?.maintenanceMode && session.role !== "admin") {
//     return (
//       <div className="relative min-h-screen bg-[#f0fdf4] dark:bg-[#050806] flex items-center justify-center p-4 font-sans">
//         <div className="bg-white/80 dark:bg-[#0a0f0b]/80 backdrop-blur-xl border border-lime-500/30 rounded-3xl p-10 max-w-md w-full text-center shadow-[0_8px_32px_0_rgba(132,204,22,0.15)] dark:shadow-[0_8px_32px_0_rgba(0,0,0,0.5)]">
//           <div className="w-20 h-20 bg-amber-500/20 rounded-full flex items-center justify-center mx-auto mb-6">
//             <Wrench className="text-amber-500" size={40} />
//           </div>
//           <h1 className="text-2xl font-extrabold text-lime-950 dark:text-white mb-2">
//             {t("maintenance.title")}
//           </h1>
//           <p className="text-sm text-lime-800/60 dark:text-lime-200/50 mb-8 font-medium">
//             {t("maintenance.desc")}
//           </p>
//           <form action={logout}>
//             <button className="w-full py-3 bg-red-500 hover:bg-red-600 text-white font-bold rounded-xl transition-colors flex items-center justify-center gap-2 shadow-lg shadow-red-500/20">
//               <LogOut size={18} /> {t("maintenance.signOut")}
//             </button>
//           </form>
//         </div>
//       </div>
//     );
//   }

//   const cookieStore = await cookies();
//   const hasSkippedKyc = cookieStore.get("kyc_skipped")?.value === "true";

//   const rawNotifs = await getUserNotifications();
//   const mappedNotifs = rawNotifs.map((n: any) => ({
//     id: n._id, type: n.type, title: n.title, message: n.message,
//     timestamp: n.createdAt, read: n.read, href: n.href, meta: n.meta
//   }));

//   // 👇 FIXED: NotificationsProvider wraps the ENTIRE layout
//   return (
//     <NotificationsProvider initial={mappedNotifs}>
//       <div className="relative min-h-screen bg-[#f0fdf4] dark:bg-[#050806] text-lime-950 dark:text-white overflow-hidden font-sans">
        
//         <WatermarkBackground />

//         <div className="fixed top-4 left-4 right-4 sm:top-6 sm:left-6 sm:right-6 z-50 pointer-events-none">
//           <div className="pointer-events-auto flex items-center justify-between gap-2 sm:gap-4 bg-white/60 dark:bg-[#121A14]/60 backdrop-blur-xl border border-lime-500/20 shadow-[0_8px_32px_0_rgba(132,204,22,0.15)] dark:shadow-[0_8px_32px_0_rgba(0,0,0,0.5)] px-3 py-2 sm:px-4 sm:py-2.5 rounded-full w-full">
            
//             <div className="flex-1 max-w-md">
//               <AnimatedSearch />
//             </div>

//             <div className="flex items-center gap-2 sm:gap-3 shrink-0">
//               <NotificationButton />
//               <div className="h-5 sm:h-6 w-px bg-lime-500/20"></div>
//               <HeaderActions hideNotifications={true} kycTier={session.tier || 0} />
//             </div>

//           </div>
//         </div>

//         <main className="relative z-10 h-[100dvh] overflow-y-auto pt-24 pb-10 px-4 sm:px-8">
//           <KycProvider initialTier={(session.tier || 0) as 0 | 1 | 2 | 3} initialSkipped={hasSkippedKyc}>
//             <KycGuard tier={session.tier || 0} isSkipped={hasSkippedKyc}>
//               {children}
//             </KycGuard>
//           </KycProvider>
//         </main>

//       </div>
//     </NotificationsProvider>
//   );
// }