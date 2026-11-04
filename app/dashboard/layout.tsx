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
export const instant = false;

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  await connection(); 

  const session = await getServerSession();
  if (!session) redirect("/login");

  const cookieStore = await cookies();
  const hasSkippedKyc = cookieStore.get("kyc_skipped")?.value === "true";

  return (
    <div className="relative min-h-screen bg-[#f0fdf4] dark:bg-[#050806] text-lime-950 dark:text-white overflow-hidden font-sans">
      
      <WatermarkBackground />

      {/* 👇 FULL-WIDTH FLOATING PILL WITH MARGINS 👇 */}
      <div className="fixed top-4 left-4 right-4 sm:top-6 sm:left-6 sm:right-6 z-50 pointer-events-none">
        
        <div className="pointer-events-auto flex items-center justify-between gap-2 sm:gap-4 bg-white/60 dark:bg-[#121A14]/60 backdrop-blur-xl border border-lime-500/20 shadow-[0_8px_32px_0_rgba(132,204,22,0.15)] dark:shadow-[0_8px_32px_0_rgba(0,0,0,0.5)] px-3 py-2 sm:px-4 sm:py-2.5 rounded-full w-full">
          
          {/* Search Bar (Flex-1 allows it to stretch and fill the available space) */}
          <div className="flex-1 max-w-md">
            <AnimatedSearch />
          </div>

          {/* Right side controls */}
          <div className="flex items-center gap-2 sm:gap-3 shrink-0">
            <NotificationButton type="urgent" />
            
            <div className="h-5 sm:h-6 w-px bg-lime-500/20"></div>
            
            <HeaderActions hideNotifications={true} kycTier={session.tier || 0} />
          </div>

        </div>

      </div>

      <main className="relative z-10 h-h-[100dvh] overflow-y-auto pt-24 pb-10 px-4 sm:px-8">
        <KycProvider initialTier={(session.tier || 0) as 0 | 1 | 2 | 3} initialSkipped={hasSkippedKyc}>
          <KycGuard tier={session.tier || 0} isSkipped={hasSkippedKyc}>
            {children}
          </KycGuard>
        </KycProvider>
      </main>

    </div>
  );
}