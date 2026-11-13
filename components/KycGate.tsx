// components/KycGate.tsx
"use client";

import React, { useEffect, useRef } from "react";
import { useDevModal } from "@/components/providers/DevModalProvider";
import { useRouter } from "next/navigation";
import { Lock } from "lucide-react";
import { useTranslations } from "next-intl";

interface KycGateProps {
  requiredTier: number;
  currentTier: number;
  children: React.ReactNode;
  featureName?: string;
}

export function KycGate({ requiredTier, currentTier, children, featureName }: KycGateProps) {
  const { openModal } = useDevModal();
  const router = useRouter();
  const t = useTranslations("Kyc");
  
  // Cleanup timeout to prevent memory leaks if component unmounts
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    };
  }, []);

  if (currentTier >= requiredTier) {
    return <>{children}</>;
  }

  const handleBlockedAction = (e: React.MouseEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    
    const featureText = featureName || t("thisFeature");

    openModal(
      t("tierRequiredTitle", { tier: requiredTier }), 
      t("tierRequiredDesc", { tier: requiredTier, feature: featureText }),
      "warning"
    );

    timeoutRef.current = setTimeout(() => {
      router.push(`/dashboard/kyc?upgrade=${requiredTier}`);
    }, 2000);
  };

  return (
    <div onClick={handleBlockedAction} className="cursor-not-allowed opacity-75 hover:opacity-100 transition-opacity">
      <div className="relative pointer-events-none">
        {children}
        <div className="absolute inset-0 bg-black/20 dark:bg-black/50 rounded-xl flex items-center justify-center z-10">
          <Lock size={16} className="text-white drop-shadow-md" />
        </div>
      </div>
    </div>
  );
}
// // components/KycGate.tsx
// "use client";

// import React from "react";
// import { useDevModal } from "@/components/providers/DevModalProvider";
// import { useRouter } from "next/navigation";
// import { Lock } from "lucide-react";

// interface KycGateProps {
//   requiredTier: number;
//   currentTier: number;
//   children: React.ReactNode;
//   featureName?: string;
// }

// export function KycGate({ requiredTier, currentTier, children, featureName = "this feature" }: KycGateProps) {
//   const { openModal } = useDevModal();
//   const router = useRouter();

//   if (currentTier >= requiredTier) {
//     return <>{children}</>;
//   }

//   const handleBlockedAction = (e: React.MouseEvent<HTMLDivElement>) => {
//     e.preventDefault();
//     e.stopPropagation();
    
//     openModal(
//       `Tier ${requiredTier} Required`, 
//       `You need to be at least Tier ${requiredTier} to use ${featureName}. Redirecting you to the KYC page...`,
//       "warning"
//     );

//     setTimeout(() => {
//       router.push(`/dashboard/kyc?upgrade=${requiredTier}`);
//     }, 2000);
//   };

//   return (
//     <div onClick={handleBlockedAction} className="cursor-not-allowed opacity-75 hover:opacity-100 transition-opacity">
//       <div className="relative pointer-events-none">
//         {children}
//         <div className="absolute inset-0 bg-black/20 dark:bg-black/50 rounded-xl flex items-center justify-center z-10">
//           <Lock size={16} className="text-white drop-shadow-md" />
//         </div>
//       </div>
//     </div>
//   );
// }