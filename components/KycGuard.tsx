// components/KycGuard.tsx
"use client";

import { usePathname, useRouter } from "next/navigation";
import { useEffect } from "react";
import { Loader2, Shield } from "lucide-react";
import { motion } from "framer-motion";

export function KycGuard({ children, tier, isSkipped }: { children: React.ReactNode, tier: number, isSkipped: boolean }) {
  const pathname = usePathname();
  const router = useRouter();

  useEffect(() => {
    // If they are Tier 0, haven't skipped, and are NOT on the KYC page
    if (tier === 0 && !isSkipped && pathname !== "/dashboard/kyc") {
      router.push("/dashboard/kyc");
    }
  }, [tier, isSkipped, pathname, router]);

  // Show a loading state while redirecting to prevent flashing the dashboard
  if (tier === 0 && !isSkipped && pathname !== "/dashboard/kyc") {
    return (
      <div className="h-full w-full min-h-[80vh] flex items-center justify-center relative z-20">
        <motion.div 
          initial={{ opacity: 0, scale: 0.9, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          className="bg-white/60 dark:bg-[#0a0f0b]/60 backdrop-blur-2xl border border-lime-500/30 rounded-3xl p-10 flex flex-col items-center max-w-sm w-full mx-4 shadow-[0_8px_32px_0_rgba(132,204,22,0.15)] dark:shadow-[0_8px_32px_0_rgba(0,0,0,0.5)] relative overflow-hidden"
        >
          {/* Subtle glow effect inside the card */}
          <div className="absolute top-[-50%] left-[-50%] w-200% h-200% bg-lime-500/10 blur-[80px] rounded-full pointer-events-none"></div>

          <div className="relative">
            <div className="absolute inset-0 bg-lime-500 blur-xl opacity-20 animate-pulse"></div>
            <div className="w-20 h-20 bg-lime-100 dark:bg-[#121A14] rounded-2xl flex items-center justify-center relative z-10 border border-lime-500/20 mb-6">
              <Shield className="text-lime-600 dark:text-lime-400" size={36} />
              <Loader2 className="absolute -bottom-2 -right-2 animate-spin text-lime-500" size={24} />
            </div>
          </div>

          <h2 className="text-xl font-extrabold text-lime-950 dark:text-white mb-2 relative z-10">Identity Verification</h2>
          <p className="text-sm text-lime-800/70 dark:text-lime-200/60 font-medium text-center relative z-10">
            Redirecting you to complete your KYC profile...
          </p>
        </motion.div>
      </div>
    );
  }

  return <>{children}</>;
}