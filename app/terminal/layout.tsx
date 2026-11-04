
// app/terminal/layout.tsx
import { getServerSession } from "@/lib/session";
import { redirect } from "next/navigation";
import { connection } from "next/server";
import HeaderActions from "@/components/HeaderActions";
import NotificationButton from "@/app/dashboard/notifications/NotificationButton"; 
import AnimatedSearch from "@/app/dashboard/AnimatedSearch"; 
import WatermarkBackground from "@/components/WatermarkBackground";

export const instant = false;

export default async function TerminalLayout({ children }: { children: React.ReactNode }) {
  await connection(); 

  const session = await getServerSession();
  if (!session) redirect("/login");

  return (
    <div className="relative min-h-screen bg-[#f0fdf4] dark:bg-[#050806] text-lime-950 dark:text-white overflow-hidden font-sans">
      
      <WatermarkBackground />

      {/* 👇 FLOATING HEADER PILL 👇 */}
      <div className="fixed top-4 left-4 right-4 sm:top-6 sm:left-6 sm:right-6 z-50 pointer-events-none">
        <div className="pointer-events-auto flex items-center justify-between gap-2 sm:gap-4 bg-white/60 dark:bg-[#121A14]/60 backdrop-blur-xl border border-lime-500/20 shadow-[0_8px_32px_0_rgba(132,204,22,0.15)] dark:shadow-[0_8px_32px_0_rgba(0,0,0,0.5)] px-3 py-2 sm:px-4 sm:py-2.5 rounded-full w-full">
          
          <div className="flex-1 max-w-md">
            <AnimatedSearch />
          </div>

          <div className="flex items-center gap-2 sm:gap-3 shrink-0">
            <NotificationButton type="urgent" />
            <div className="h-5 sm:h-6 w-px bg-lime-500/20"></div>
            <HeaderActions hideNotifications={true} kycTier={session.tier || 0} />
          </div>

        </div>
      </div>

      {/* 
        The pt-24 gives the Terminal component enough room 
        to sit below the floating header without overlapping 
      */}
      <main className="relative z-10 h-screen overflow-y-auto pt-24 pb-10 px-4 sm:px-8">
        {children}
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

// export const instant = false; // 👈 ADD THIS LINE

// export default async function TerminalLayout({ children }: { children: React.ReactNode }) {
//   await connection();

//   const session = await getServerSession();
//   if (!session) redirect("/login");

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