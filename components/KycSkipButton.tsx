// components/KycSkipButton.tsx
"use client";

import { useDevModal } from "@/components/providers/DevModalProvider";
import { useRouter } from "next/navigation";

export function KycSkipButton() {
  const { openModal } = useDevModal();
  const router = useRouter();

  const handleSkip = () => {
    // Set the cookie directly in the browser
    document.cookie = "kyc_skipped=true; path=/; max-age=86400"; 

    openModal(
      "KYC Skipped", 
      "You can explore the dashboard, but trading and wallet features remain locked until you verify your identity.",
      "warning"
    );
    router.push("/dashboard");
    router.refresh(); // Force Next.js to re-read the new cookie
  };

  return (
    <div className="text-center mt-8 relative z-20">
      <button 
        onClick={handleSkip} 
        className="text-sm font-semibold text-lime-800/50 dark:text-lime-200/40 hover:text-lime-600 dark:hover:text-lime-400 transition-colors underline decoration-lime-500/30 underline-offset-4"
      >
        Skip for now (Features will be limited)
      </button>
    </div>
  );
}