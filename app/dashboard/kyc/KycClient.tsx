// app/dashboard/kyc/KycClient.tsx
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation"; // 👈 Import useRouter
import { motion } from "framer-motion";
import { 
  Shield, ShieldCheck, ShieldAlert, CheckCircle2, Lock, Loader2,
  UploadCloud, ChevronDown, User, Calendar, Phone, FileText, Camera, MapPin, TrendingUp, Mail 
} from "lucide-react";
import { useDevModal } from "@/components/providers/DevModalProvider";
import { Button } from "@/components/ui/Button";
import { submitKyc } from "@/app/actions/kyc";

export default function KycClient({ currentTier, submission, userName, userEmail }: { currentTier: number, submission: any, userName: string, userEmail: string }) {
  const router = useRouter(); // 👈 Initialize router
  const { openModal } = useDevModal();
  
  const [isLoading, setIsLoading] = useState(false);
  const [activeFormTier, setActiveFormTier] = useState<number>(currentTier === 0 ? 1 : currentTier + 1);
  const [idType, setIdType] = useState("passport");

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    
    const formData = new FormData(e.currentTarget);
    const data = Object.fromEntries(formData.entries());

    const needsIdNumber = idType !== "passport";

    if (!data.legalName || !data.dob || !data.phone || (needsIdNumber && !data.idNumber) || !data.email) {
      
      // 👇 PASSING THE SECONDARY ACTION HERE 👇
      openModal(
        "Missing Information", 
        "Please fill out all required fields before submitting, or skip for now.", 
        "warning",
        {
          label: "Skip",
            onClick: () => {
            document.cookie = "kyc_skipped=true; path=/; max-age=86400";
            // 👇 Force a hard navigation so the server picks up the new cookie
            window.location.href = "/dashboard";
            }
        }
      );
      return; 
    }

    setIsLoading(true);
    openModal(
      "Feature In Development", 
      "Document uploads are currently disabled. We are simulating a successful KYC submission for you.", 
      "info"
    );
    
    setTimeout(async () => {
      const payload = {
        ...data,
        idType: idType,
        selfieLivenessUrl: "https://placeholder.com/selfie.jpg",
        proofOfAddressUrl: activeFormTier >= 2 ? "https://placeholder.com/poa.pdf" : "",
        sourceOfWealthUrl: activeFormTier >= 3 ? "https://placeholder.com/sow.pdf" : "",
      };

      const res = await submitKyc(activeFormTier as 1 | 2 | 3, payload);
      
      if (res.success) {
        openModal("Verification Submitted", `You have successfully applied for Tier ${activeFormTier}.`, "success");
        window.location.reload();
      } else {
        openModal("Error", res.error || "Submission failed", "error");
      }
      setIsLoading(false);
    }, 1500);
  };

  const getTierStatus = (tier: number) => {
    if (currentTier >= tier) return "complete";
    if (submission && submission.tierRequested === tier) return submission.status; 
    if (currentTier === tier - 1) return "action_required";
    return "locked";
  };

  const t1Status = getTierStatus(1);
  const t2Status = getTierStatus(2);
  const t3Status = getTierStatus(3);

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="text-center">
        <h1 className="text-3xl font-extrabold text-lime-950 dark:text-[#ecfdf5] tracking-tight">Identity Verification</h1>
        <p className="text-lime-800/70 dark:text-lime-200/50 mt-2 text-sm max-w-lg mx-auto font-medium">
          Complete the tiers below to unlock higher trading limits, withdrawals, and new asset classes.
        </p>
      </motion.div>

      <div className="space-y-4">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
          <TierCard 
            tier={1} title="Tier 1: Basic Verification" status={t1Status} 
            statusText={t1Status === 'complete' ? 'COMPLETE' : t1Status === 'pending' ? 'PENDING' : t1Status === 'rejected' ? 'REJECTED' : 'ACTION REQUIRED'}
            subtitle={t1Status === 'complete' ? '(Small Limits Unlocked)' : t1Status === 'pending' ? '(Under Review)' : 'ID & Selfie Required'}
            icon={t1Status === 'complete' ? <CheckCircle2 size={28} /> : <Shield size={28} />}
            onClick={() => t1Status === 'action_required' && setActiveFormTier(1)} isActive={activeFormTier === 1 && t1Status === 'action_required'}
          />
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
          <TierCard 
            tier={2} title="Tier 2: Standard Verification" status={t2Status} 
            statusText={t2Status === 'complete' ? 'COMPLETE' : t2Status === 'pending' ? 'PENDING' : t2Status === 'rejected' ? 'REJECTED' : 'LOCKED'}
            subtitle={t2Status === 'complete' ? '(High Limits Unlocked)' : t2Status === 'pending' ? '(Proof of Address Uploaded)' : 'Proof of Address Required'}
            icon={t2Status === 'complete' ? <CheckCircle2 size={28} /> : t2Status === 'pending' ? <Loader2 className="animate-spin" size={28} /> : <ShieldCheck size={28} />}
            onClick={() => t2Status === 'action_required' && setActiveFormTier(2)} isActive={activeFormTier === 2 && t2Status === 'action_required'}
          />
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}>
          <TierCard 
            tier={3} title="Tier 3: Enhanced Due Diligence" status={t3Status} 
            statusText={t3Status === 'complete' ? 'COMPLETE' : t3Status === 'pending' ? 'PENDING' : t3Status === 'rejected' ? 'REJECTED' : 'LOCKED'}
            subtitle={t3Status === 'complete' ? '(Institutional Unlocked)' : t3Status === 'pending' ? '(Source of Wealth Under Review)' : 'Verification Required for VIP'}
            icon={t3Status === 'complete' ? <CheckCircle2 size={28} /> : <ShieldAlert size={28} />}
            onClick={() => t3Status === 'action_required' && setActiveFormTier(3)} isActive={activeFormTier === 3 && t3Status === 'action_required'}
          />
        </motion.div>
      </div>

      {((activeFormTier === 1 && t1Status === 'action_required') || 
        (activeFormTier === 2 && t2Status === 'action_required') || 
        (activeFormTier === 3 && t3Status === 'action_required')) && (
        <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} className="bg-white/80 dark:bg-[#0a0f0b]/80 backdrop-blur-xl border border-lime-500/30 rounded-3xl p-6 sm:p-8 shadow-2xl mt-8">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-bold text-lime-950 dark:text-white">Upgrade to Tier {activeFormTier}</h2>
          </div>

          <form onSubmit={handleSubmit} noValidate className="space-y-8">
            <div className="space-y-4">
              <h3 className="text-sm font-bold text-lime-950 dark:text-white uppercase tracking-wider border-b border-lime-500/20 pb-2">1. Basic Identity</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                
                <FloatingInput 
                  name="legalName" 
                  label="Full Legal Name" 
                  icon={<User size={16} />} 
                  defaultValue={userName}
                  disabled={!!userName} 
                />

                <FloatingInput name="dob" label="Date of Birth" type="date" icon={<Calendar size={16} />} />
                <FloatingInput name="phone" label="Phone Number" type="tel" icon={<Phone size={16} />} />
                
                <div className="relative">
                  <select 
                    name="idType" 
                    value={idType}
                    onChange={(e) => setIdType(e.target.value)}
                    className="peer w-full bg-[#f4fbf5] dark:bg-[#0a0f0b] border-2 border-lime-500/30 dark:border-lime-500/20 rounded-xl px-4 pt-6 pb-2 text-lime-950 dark:text-white focus:outline-none focus:border-lime-500 transition-colors font-medium appearance-none"
                  >
                    <option value="passport">Passport</option>
                    <option value="national_id">National ID Card</option>
                    <option value="drivers_license">Driver's License</option>
                  </select>
                  <label className="absolute left-3 -top-3 text-xs bg-[#f4fbf5] dark:bg-[#0a0f0b] px-1 text-lime-600 dark:text-lime-400">ID Type</label>
                  <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 text-lime-500 pointer-events-none" size={20} />
                </div>
                
                {idType === "passport" ? (
                  <div onClick={() => openModal("Feature In Development", "Passport image upload is coming soon.", "info")}>
                    <UploadBox label="Upload Passport Bio Page" icon={<UploadCloud size={24} />} />
                  </div>
                ) : (
                  <FloatingInput name="idNumber" label="ID Number" icon={<FileText size={16} />} />
                )}

                <FloatingInput 
                  name="email" 
                  label="Email Address" 
                  type="email"
                  icon={<Mail size={16} />} 
                  defaultValue={userEmail}
                  disabled={!!userEmail} 
                />

              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                <div onClick={() => openModal("Feature In Development", "File uploads are coming soon in the next update.", "info")}>
                  <UploadBox label="Government ID Photo" icon={<UploadCloud size={24} />} />
                </div>
                <div onClick={() => openModal("Feature In Development", "Biometric selfie capture is coming soon.", "info")}>
                  <UploadBox label="Biometric Selfie (Liveness)" icon={<Camera size={24} />} />
                </div>
              </div>
            </div>

            {activeFormTier >= 2 && (
              <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} className="space-y-4 pt-4">
                <h3 className="text-sm font-bold text-lime-950 dark:text-white uppercase tracking-wider border-b border-lime-500/20 pb-2">2. Proof of Address</h3>
                <div onClick={() => openModal("Feature In Development", "Proof of address uploads are coming soon.", "info")}>
                  <UploadBox label="Proof of Address Document" icon={<MapPin size={24} />} />
                </div>
              </motion.div>
            )}

            {activeFormTier >= 3 && (
              <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} className="space-y-4 pt-4">
                <h3 className="text-sm font-bold text-lime-950 dark:text-white uppercase tracking-wider border-b border-lime-500/20 pb-2">3. Source of Wealth</h3>
                <div onClick={() => openModal("Feature In Development", "Source of wealth uploads are coming soon.", "info")}>
                  <UploadBox label="Source of Wealth Document" icon={<TrendingUp size={24} />} />
                </div>
              </motion.div>
            )}

            <Button type="submit" disabled={isLoading} className="w-full h-14 mt-6 bg-lime-600 hover:bg-lime-700 text-white font-bold text-lg rounded-xl shadow-lg shadow-lime-600/20">
              {isLoading ? <Loader2 className="animate-spin" size={24} /> : `Submit for Tier ${activeFormTier}`}
            </Button>
          </form>
        </motion.div>
      )}
    </div>
  );
}

// --- CUSTOM COMPONENTS ---

function TierCard({ tier, title, status, statusText, subtitle, icon, onClick, isActive }: any) {
  const isComplete = status === 'complete';
  const isPending = status === 'pending' || status === 'rejected';
  const isLocked = status === 'locked';
  
  const baseClasses = "relative flex flex-col items-center justify-center p-6 rounded-3xl border transition-all text-center";
  const stateClasses = isComplete 
    ? "bg-lime-500/10 border-lime-500/30 shadow-[0_0_15px_rgba(132,204,22,0.1)]" 
    : isPending 
      ? "bg-amber-500/10 border-amber-500/30 shadow-[0_0_15px_rgba(245,158,11,0.1)]" 
      : isLocked 
        ? "bg-black/5 dark:bg-white/5 border-transparent opacity-60" 
        : "bg-white/80 dark:bg-[#0a0f0b]/80 border-lime-500 shadow-xl hover:bg-white cursor-pointer";

  return (
    <div onClick={onClick} className={`${baseClasses} ${stateClasses}`}>
      {isActive && <div className="absolute inset-0 border-2 border-lime-500 rounded-3xl animate-pulse pointer-events-none"></div>}
      <h3 className={`text-base font-bold mb-3 ${isLocked ? 'text-gray-500' : 'text-lime-950 dark:text-white'}`}>{title}</h3>
      <div className={`p-3 rounded-full mb-3 ${isComplete ? 'bg-lime-500 text-white' : isPending ? 'bg-amber-500 text-white' : isLocked ? 'bg-gray-300 dark:bg-gray-700 text-gray-500 dark:text-gray-400' : 'bg-lime-500 text-white animate-bounce'}`}>
        {isLocked ? <Lock size={28} /> : icon}
      </div>
      <div className="space-y-1">
        <p className={`text-xs font-bold font-mono tracking-widest ${isComplete ? 'text-lime-600 dark:text-lime-400' : isPending ? 'text-amber-600 dark:text-amber-400' : 'text-gray-500'}`}>STATUS: {statusText}</p>
        <p className={`text-xs font-medium ${isLocked ? 'text-gray-400' : 'text-lime-800/70 dark:text-lime-200/50'}`}>{subtitle}</p>
      </div>
    </div>
  );
}

function FloatingInput({ name, label, type = "text", icon, defaultValue = "", disabled = false }: any) {
  return (
    <div className="relative">
      <input 
        type={type} 
        name={name} 
        defaultValue={defaultValue}
        disabled={disabled}
        placeholder=" " 
        className={`peer w-full bg-[#f4fbf5] dark:bg-[#0a0f0b] border-2 border-lime-500/30 dark:border-lime-500/20 rounded-xl px-4 pt-6 pb-2 text-lime-950 dark:text-white focus:outline-none focus:border-lime-500 transition-colors font-medium ${
          disabled 
            ? 'opacity-60 cursor-not-allowed bg-black/5 dark:bg-white/5 border-lime-500/10 text-lime-800/50 dark:text-lime-200/40' 
            : ''
        }`} 
      />
      <label 
        htmlFor={name} 
        className={`absolute left-3 top-4 text-lime-700/60 dark:text-lime-300/60 transition-all duration-200 pointer-events-none 
                   peer-focus:-top-3 peer-focus:text-xs peer-focus:bg-[#f4fbf5] dark:peer-focus:bg-[#0a0f0b] peer-focus:px-1 peer-focus:text-lime-600
                   peer-[:not(:placeholder-shown)]:-top-3 peer-[:not(:placeholder-shown)]:text-xs peer-[:not(:placeholder-shown)]:bg-[#f4fbf5] dark:peer-[:not(:placeholder-shown)]:bg-[#0a0f0b] peer-[:not(:placeholder-shown)]:px-1 ${
                     disabled ? 'opacity-50 text-lime-600/50 dark:text-lime-400/50' : ''
                   }`}
      >
        <div className="flex items-center gap-2">{icon} {label}</div>
      </label>
    </div>
  );
}

function UploadBox({ label, icon }: any) {
  return (
    <div className="border-2 border-dashed border-lime-500/30 hover:border-lime-500/60 transition-colors rounded-2xl p-6 text-center cursor-pointer bg-lime-500/5 flex flex-col justify-center h-full min-h-[76px]">
      <div className="mx-auto text-lime-500 mb-1 flex justify-center">{icon}</div>
      <p className="text-xs font-semibold text-lime-950 dark:text-white">{label}</p>
    </div>
  );
}// // app/dashboard/kyc/KycClient.tsx
// "use client";

// import { useState } from "react";
// import { motion } from "framer-motion";
// import { 
//   Shield, ShieldCheck, ShieldAlert, CheckCircle2, Lock, Loader2,
//   UploadCloud, ChevronDown, User, Calendar, Phone, FileText, Camera, MapPin, TrendingUp, Mail 
// } from "lucide-react";
// import { useDevModal } from "@/components/providers/DevModalProvider";
// import { Button } from "@/components/ui/Button";
// import { submitKyc } from "@/app/actions/kyc";

// export default function KycClient({ currentTier, submission, userName, userEmail }: { currentTier: number, submission: any, userName: string, userEmail: string }) {
//   const { openModal } = useDevModal();
  
//   const [isLoading, setIsLoading] = useState(false);
//   const [activeFormTier, setActiveFormTier] = useState<number>(currentTier === 0 ? 1 : currentTier + 1);
  
//   // 👇 NEW STATE: Tracks the selected ID type
//   const [idType, setIdType] = useState("passport");

//   const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
//     e.preventDefault();
    
//     const formData = new FormData(e.currentTarget);
//     const data = Object.fromEntries(formData.entries());

//     // Adjust validation based on ID type
//     const needsIdNumber = idType !== "passport";

//     if (!data.legalName || !data.dob || !data.phone || (needsIdNumber && !data.idNumber) || !data.email) {
//       openModal(
//         "Missing Information", 
//         "Please fill out all required fields before submitting.", 
//         "warning"
//       );
//       return; 
//     }

//     setIsLoading(true);
//     openModal(
//       "Feature In Development", 
//       "Document uploads are currently disabled. We are simulating a successful KYC submission for you.", 
//       "info"
//     );
    
//     setTimeout(async () => {
//       const payload = {
//         ...data,
//         idType: idType, // Pass the selected ID type
//         selfieLivenessUrl: "https://placeholder.com/selfie.jpg",
//         proofOfAddressUrl: activeFormTier >= 2 ? "https://placeholder.com/poa.pdf" : "",
//         sourceOfWealthUrl: activeFormTier >= 3 ? "https://placeholder.com/sow.pdf" : "",
//       };

//       const res = await submitKyc(activeFormTier as 1 | 2 | 3, payload);
      
//       if (res.success) {
//         openModal("Verification Submitted", `You have successfully applied for Tier ${activeFormTier}.`, "success");
//         window.location.reload();
//       } else {
//         openModal("Error", res.error || "Submission failed", "error");
//       }
//       setIsLoading(false);
//     }, 1500);
//   };

//   const getTierStatus = (tier: number) => {
//     if (currentTier >= tier) return "complete";
//     if (submission && submission.tierRequested === tier) return submission.status; 
//     if (currentTier === tier - 1) return "action_required";
//     return "locked";
//   };

//   const t1Status = getTierStatus(1);
//   const t2Status = getTierStatus(2);
//   const t3Status = getTierStatus(3);

//   return (
//     <div className="max-w-2xl mx-auto space-y-6">
      
//       <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="text-center">
//         <h1 className="text-3xl font-extrabold text-lime-950 dark:text-[#ecfdf5] tracking-tight">Identity Verification</h1>
//         <p className="text-lime-800/70 dark:text-lime-200/50 mt-2 text-sm max-w-lg mx-auto font-medium">
//           Complete the tiers below to unlock higher trading limits, withdrawals, and new asset classes.
//         </p>
//       </motion.div>

//       <div className="space-y-4">
//         <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
//           <TierCard 
//             tier={1} title="Tier 1: Basic Verification" status={t1Status} 
//             statusText={t1Status === 'complete' ? 'COMPLETE' : t1Status === 'pending' ? 'PENDING' : t1Status === 'rejected' ? 'REJECTED' : 'ACTION REQUIRED'}
//             subtitle={t1Status === 'complete' ? '(Small Limits Unlocked)' : t1Status === 'pending' ? '(Under Review)' : 'ID & Selfie Required'}
//             icon={t1Status === 'complete' ? <CheckCircle2 size={28} /> : <Shield size={28} />}
//             onClick={() => t1Status === 'action_required' && setActiveFormTier(1)} isActive={activeFormTier === 1 && t1Status === 'action_required'}
//           />
//         </motion.div>

//         <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
//           <TierCard 
//             tier={2} title="Tier 2: Standard Verification" status={t2Status} 
//             statusText={t2Status === 'complete' ? 'COMPLETE' : t2Status === 'pending' ? 'PENDING' : t2Status === 'rejected' ? 'REJECTED' : 'LOCKED'}
//             subtitle={t2Status === 'complete' ? '(High Limits Unlocked)' : t2Status === 'pending' ? '(Proof of Address Uploaded)' : 'Proof of Address Required'}
//             icon={t2Status === 'complete' ? <CheckCircle2 size={28} /> : t2Status === 'pending' ? <Loader2 className="animate-spin" size={28} /> : <ShieldCheck size={28} />}
//             onClick={() => t2Status === 'action_required' && setActiveFormTier(2)} isActive={activeFormTier === 2 && t2Status === 'action_required'}
//           />
//         </motion.div>

//         <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}>
//           <TierCard 
//             tier={3} title="Tier 3: Enhanced Due Diligence" status={t3Status} 
//             statusText={t3Status === 'complete' ? 'COMPLETE' : t3Status === 'pending' ? 'PENDING' : t3Status === 'rejected' ? 'REJECTED' : 'LOCKED'}
//             subtitle={t3Status === 'complete' ? '(Institutional Unlocked)' : t3Status === 'pending' ? '(Source of Wealth Under Review)' : 'Verification Required for VIP'}
//             icon={t3Status === 'complete' ? <CheckCircle2 size={28} /> : <ShieldAlert size={28} />}
//             onClick={() => t3Status === 'action_required' && setActiveFormTier(3)} isActive={activeFormTier === 3 && t3Status === 'action_required'}
//           />
//         </motion.div>
//       </div>

//       {((activeFormTier === 1 && t1Status === 'action_required') || 
//         (activeFormTier === 2 && t2Status === 'action_required') || 
//         (activeFormTier === 3 && t3Status === 'action_required')) && (
//         <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} className="bg-white/80 dark:bg-[#0a0f0b]/80 backdrop-blur-xl border border-lime-500/30 rounded-3xl p-6 sm:p-8 shadow-2xl mt-8">
//           <div className="flex items-center justify-between mb-6">
//             <h2 className="text-xl font-bold text-lime-950 dark:text-white">Upgrade to Tier {activeFormTier}</h2>
//           </div>

//           <form onSubmit={handleSubmit} noValidate className="space-y-8">
//             <div className="space-y-4">
//               <h3 className="text-sm font-bold text-lime-950 dark:text-white uppercase tracking-wider border-b border-lime-500/20 pb-2">1. Basic Identity</h3>
//               <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                
//                 <FloatingInput 
//                   name="legalName" 
//                   label="Full Legal Name" 
//                   icon={<User size={16} />} 
//                   defaultValue={userName}
//                   disabled={!!userName} 
//                 />

//                 <FloatingInput name="dob" label="Date of Birth" type="date" icon={<Calendar size={16} />} />
//                 <FloatingInput name="phone" label="Phone Number" type="tel" icon={<Phone size={16} />} />
                
//                 {/* 👇 CONTROLLED SELECT DROPDOWN 👇 */}
//                 <div className="relative">
//                   <select 
//                     name="idType" 
//                     value={idType}
//                     onChange={(e) => setIdType(e.target.value)}
//                     className="peer w-full bg-[#f4fbf5] dark:bg-[#0a0f0b] border-2 border-lime-500/30 dark:border-lime-500/20 rounded-xl px-4 pt-6 pb-2 text-lime-950 dark:text-white focus:outline-none focus:border-lime-500 transition-colors font-medium appearance-none"
//                   >
//                     <option value="passport">Passport</option>
//                     <option value="national_id">ID Card</option>
//                     <option value="drivers_license">Driver's License</option>
//                   </select>
//                   <label className="absolute left-3 -top-3 text-xs bg-[#f4fbf5] dark:bg-[#0a0f0b] px-1 text-lime-600 dark:text-lime-400">ID Type</label>
//                   <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 text-lime-500 pointer-events-none" size={20} />
//                 </div>
                
//                 {/* 👇 CONDITIONAL RENDER: Shows upload box for Passport, Input for others 👇 */}
//                 {idType === "passport" ? (
//                   <div onClick={() => openModal("Feature In Development", "Passport image upload is coming soon.", "info")}>
//                     <UploadBox label="Upload file" icon={<UploadCloud size={24} />} />
//                   </div>
//                 ) : (
//                   <FloatingInput name="idNumber" label="ID Number (if any)" icon={<FileText size={16} />} />
//                 )}

//                 <FloatingInput 
//                   name="email" 
//                   label="Email Address" 
//                   type="email"
//                   icon={<Mail size={16} />} 
//                   defaultValue={userEmail}
//                   disabled={!!userEmail} 
//                 />

//               </div>
              
//               <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
//                 <div onClick={() => openModal("Feature In Development", "File uploads are coming soon in the next update.", "info")}>
//                   <UploadBox label="Upload file" icon={<UploadCloud size={24} />} />
//                 </div>
//                 <div onClick={() => openModal("Feature In Development", "Biometric selfie capture is coming soon.", "info")}>
//                   <UploadBox label="Selfie (Liveness)" icon={<Camera size={24} />} />
//                 </div>
//               </div>
//             </div>

//             {activeFormTier >= 2 && (
//               <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} className="space-y-4 pt-4">
//                 <h3 className="text-sm font-bold text-lime-950 dark:text-white uppercase tracking-wider border-b border-lime-500/20 pb-2">2. Proof of Address</h3>
//                 <div onClick={() => openModal("Feature In Development", "Proof of address uploads are coming soon.", "info")}>
//                   <UploadBox label="Proof of Address Document" icon={<MapPin size={24} />} />
//                 </div>
//               </motion.div>
//             )}

//             {activeFormTier >= 3 && (
//               <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} className="space-y-4 pt-4">
//                 <h3 className="text-sm font-bold text-lime-950 dark:text-white uppercase tracking-wider border-b border-lime-500/20 pb-2">3. Source of Wealth</h3>
//                 <div onClick={() => openModal("Feature In Development", "Source of wealth uploads are coming soon.", "info")}>
//                   <UploadBox label="Source of Wealth Document" icon={<TrendingUp size={24} />} />
//                 </div>
//               </motion.div>
//             )}

//             <Button type="submit" disabled={isLoading} className="w-full h-14 mt-6 bg-lime-600 hover:bg-lime-700 text-white font-bold text-lg rounded-xl shadow-lg shadow-lime-600/20">
//               {isLoading ? <Loader2 className="animate-spin" size={24} /> : `Submit for Tier ${activeFormTier}`}
//             </Button>
//           </form>
//         </motion.div>
//       )}
//     </div>
//   );
// }

// // --- CUSTOM COMPONENTS ---

// function TierCard({ tier, title, status, statusText, subtitle, icon, onClick, isActive }: any) {
//   const isComplete = status === 'complete';
//   const isPending = status === 'pending' || status === 'rejected';
//   const isLocked = status === 'locked';
  
//   const baseClasses = "relative flex flex-col items-center justify-center p-6 rounded-3xl border transition-all text-center";
//   const stateClasses = isComplete 
//     ? "bg-lime-500/10 border-lime-500/30 shadow-[0_0_15px_rgba(132,204,22,0.1)]" 
//     : isPending 
//       ? "bg-amber-500/10 border-amber-500/30 shadow-[0_0_15px_rgba(245,158,11,0.1)]" 
//       : isLocked 
//         ? "bg-black/5 dark:bg-white/5 border-transparent opacity-60" 
//         : "bg-white/80 dark:bg-[#0a0f0b]/80 border-lime-500 shadow-xl hover:bg-white cursor-pointer";

//   return (
//     <div onClick={onClick} className={`${baseClasses} ${stateClasses}`}>
//       {isActive && <div className="absolute inset-0 border-2 border-lime-500 rounded-3xl animate-pulse pointer-events-none"></div>}
//       <h3 className={`text-base font-bold mb-3 ${isLocked ? 'text-gray-500' : 'text-lime-950 dark:text-white'}`}>{title}</h3>
//       <div className={`p-3 rounded-full mb-3 ${isComplete ? 'bg-lime-500 text-white' : isPending ? 'bg-amber-500 text-white' : isLocked ? 'bg-gray-300 dark:bg-gray-700 text-gray-500 dark:text-gray-400' : 'bg-lime-500 text-white animate-bounce'}`}>
//         {isLocked ? <Lock size={28} /> : icon}
//       </div>
//       <div className="space-y-1">
//         <p className={`text-xs font-bold font-mono tracking-widest ${isComplete ? 'text-lime-600 dark:text-lime-400' : isPending ? 'text-amber-600 dark:text-amber-400' : 'text-gray-500'}`}>STATUS: {statusText}</p>
//         <p className={`text-xs font-medium ${isLocked ? 'text-gray-400' : 'text-lime-800/70 dark:text-lime-200/50'}`}>{subtitle}</p>
//       </div>
//     </div>
//   );
// }

// function FloatingInput({ name, label, type = "text", icon, defaultValue = "", disabled = false }: any) {
//   return (
//     <div className="relative">
//       <input 
//         type={type} 
//         name={name} 
//         defaultValue={defaultValue}
//         disabled={disabled}
//         placeholder=" " 
//         className={`peer w-full bg-[#f4fbf5] dark:bg-[#0a0f0b] border-2 border-lime-500/30 dark:border-lime-500/20 rounded-xl px-4 pt-6 pb-2 text-lime-950 dark:text-white focus:outline-none focus:border-lime-500 transition-colors font-medium ${
//           disabled 
//             ? 'opacity-60 cursor-not-allowed bg-black/5 dark:bg-white/5 border-lime-500/10 text-lime-800/50 dark:text-lime-200/40' 
//             : ''
//         }`} 
//       />
//       <label 
//         htmlFor={name} 
//         className={`absolute left-3 top-4 text-lime-700/60 dark:text-lime-300/60 transition-all duration-200 pointer-events-none 
//                    peer-focus:-top-3 peer-focus:text-xs peer-focus:bg-[#f4fbf5] dark:peer-focus:bg-[#0a0f0b] peer-focus:px-1 peer-focus:text-lime-600
//                    peer-[:not(:placeholder-shown)]:-top-3 peer-[:not(:placeholder-shown)]:text-xs peer-[:not(:placeholder-shown)]:bg-[#f4fbf5] dark:peer-[:not(:placeholder-shown)]:bg-[#0a0f0b] peer-[:not(:placeholder-shown)]:px-1 ${
//                      disabled ? 'opacity-50 text-lime-600/50 dark:text-lime-400/50' : ''
//                    }`}
//       >
//         <div className="flex items-center gap-2">{icon} {label}</div>
//       </label>
//     </div>
//   );
// }

// function UploadBox({ label, icon }: any) {
//   return (
//     <div className="border-2 border-dashed border-lime-500/30 hover:border-lime-500/60 transition-colors rounded-2xl p-6 text-center cursor-pointer bg-lime-500/5 flex flex-col justify-center h-full min-h-[76px]">
//       <div className="mx-auto text-lime-500 mb-1 flex justify-center">{icon}</div>
//       <p className="text-xs font-semibold text-lime-950 dark:text-white">{label}</p>
//     </div>
//   );
// }