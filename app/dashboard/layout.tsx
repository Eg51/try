// app/dashboard/layout.tsx
import { getServerSession } from "@/lib/session";
import { redirect } from "next/navigation";
import { connection } from "next/server";
import { cookies } from "next/headers";
import { KycGuard } from "@/components/KycGuard"; 
import HeaderActions from "@/components/HeaderActions";
import WatermarkBackground from "@/components/WatermarkBackground";

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  await connection(); 

  const session = await getServerSession();
  if (!session) redirect("/login");

  const cookieStore = await cookies();
  const hasSkippedKyc = cookieStore.get("kyc_skipped")?.value === "true";

  return (
    <div className="relative min-h-screen bg-[#f0fdf4] dark:bg-[#050806] text-lime-950 dark:text-white overflow-hidden font-sans">
      
      <WatermarkBackground />

      <div className="fixed top-6 right-6 z-50 flex items-center gap-4">
        <HeaderActions hideNotifications={true} />
      </div>

      <main className="relative z-10 h-screen overflow-y-auto pt-20 pb-10 px-4 sm:px-8">
        <KycGuard tier={session.tier || 0} isSkipped={hasSkippedKyc}>
          {children}
        </KycGuard>
      </main>

    </div>
  );
}