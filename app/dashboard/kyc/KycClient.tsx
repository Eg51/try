// app/dashboard/kyc/KycClient.tsx
"use client";

import { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Shield, ShieldCheck, ShieldAlert, CheckCircle2, Lock, Loader2,
  ChevronDown, User, Calendar, Phone, FileText, Mail, MapPin, Globe 
} from "lucide-react";
import { useDevModal } from "@/components/providers/DevModalProvider";
import { useTour } from "@/components/providers/TourProvider"; // 👈 Import Tour Context
import { Button } from "@/components/ui/Button";
import { submitKyc } from "@/app/actions/kyc";
import ImageUpload from "@/components/ui/ImageUpload";

import { DayPicker } from 'react-day-picker';
import 'react-day-picker/dist/style.css';
import { format } from 'date-fns';

export default function KycClient({ currentTier, submission, userName, userEmail }: { currentTier: number, submission: any, userName: string, userEmail: string }) {
  const router = useRouter();
  const { openModal } = useDevModal();
  const { setSteps } = useTour(); // 👈 Get setSteps from context
  
  const [isLoading, setIsLoading] = useState(false);
  const [activeFormTier, setActiveFormTier] = useState<number>(currentTier === 0 ? 1 : currentTier + 1);

  // State for all 3 ID types + Selfie
  const [passportImage, setPassportImage] = useState("");
  const [govIdNumber, setGovIdNumber] = useState("");
  const [govIdImage, setGovIdImage] = useState("");
  const [driverLicenseNumber, setDriverLicenseNumber] = useState("");
  const [driverLicenseImage, setDriverLicenseImage] = useState("");
  const [selfieImage, setSelfieImage] = useState("");

  const [dob, setDob] = useState<Date>();
  const [isCalendarOpen, setIsCalendarOpen] = useState(false);
  const calendarRef = useRef<HTMLDivElement>(null);

  // 👇 Register the Tour Steps for this page
  useEffect(() => {
    setSteps([
      { id: "tour-kyc-header", title: "Identity Verification", text: "This is your KYC center. Here you can verify your identity to unlock trading limits." },
      { id: "tour-kyc-tier-1", title: "Tier 1: Basic", text: "Start here. Provide an ID and a selfie to unlock basic trading." },
      { id: "tour-kyc-tier-2", title: "Tier 2: Standard", text: "Upgrade to Tier 2 by providing Proof of Address to unlock higher limits." },
      { id: "tour-kyc-form", title: "Verification Form", text: "Fill out this form carefully. You must provide at least 2 forms of ID and a selfie." },
    ]);
  }, [setSteps]);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (calendarRef.current && !calendarRef.current.contains(event.target as Node)) {
        setIsCalendarOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    
    const formData = new FormData(e.currentTarget);
    const data = Object.fromEntries(formData.entries());

    // 1. Basic Text Validation
    const missingFields = [];
    const legalName = data.legalName || userName;
    const email = data.email || userEmail;

    if (!legalName) missingFields.push("Full Legal Name");
    if (!data.dob) missingFields.push("Date of Birth");
    if (!data.phone) missingFields.push("Phone Number");
    if (!email) missingFields.push("Email Address");
    if (!data.street) missingFields.push("Street Address");
    if (!data.city) missingFields.push("City");
    if (!data.state) missingFields.push("State/Province");
    if (!data.country) missingFields.push("Country");

    if (missingFields.length > 0) {
      openModal("Missing Information", `Please fill out: ${missingFields.join(", ")}.`, "warning", {
        label: "Skip", onClick: () => {
          document.cookie = "kyc_skipped=true; path=/; max-age=86400";
          window.location.href = "/dashboard";
        }
      });
      return; 
    }

    // 2. Identity Validation (Pick 2 of 3)
    let validIds = 0;
    if (passportImage) validIds++;
    if (govIdNumber && govIdImage) validIds++;
    if (driverLicenseNumber && driverLicenseImage) validIds++;

    if (validIds < 2) {
      openModal(
        "Insufficient ID Documents", 
        "Please provide at least TWO of the following: Passport, Government ID, or Driver's License.", 
        "warning"
      );
      return;
    }

    // 3. Selfie Validation
    if (!selfieImage) {
      openModal("Missing Selfie", "Please upload your Biometric Selfie for liveness verification.", "warning");
      return;
    }

    // 4. Submission
    setIsLoading(true);
    
    setTimeout(async () => {
      const payload = {
        ...data,
        legalName,
        email,
        passportImage,
        govIdNumber,
        govIdImage,
        driverLicenseNumber,
        driverLicenseImage,
        selfieLivenessUrl: selfieImage, 
        proofOfAddressUrl: activeFormTier >= 2 ? "mock_base64_poa" : "",
        sourceOfWealthUrl: activeFormTier >= 3 ? "mock_base64_sow" : "",
      };

      const primaryIdType = passportImage ? "passport" : govIdImage ? "government_id" : "drivers_license";
      const primaryIdDoc = passportImage || govIdImage || driverLicenseImage;

      const res = await submitKyc(activeFormTier as 1 | 2 | 3, {
        ...payload,
        idType: primaryIdType,
        idDocumentUrl: primaryIdDoc
      });
      
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
      
      {/* 👇 Added ID for Tour */}
      <motion.div id="tour-kyc-header" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="text-center">
        <h1 className="text-3xl font-extrabold text-lime-950 dark:text-[#ecfdf5] tracking-tight">Identity Verification</h1>
        <p className="text-lime-800/70 dark:text-lime-200/50 mt-2 text-sm max-w-lg mx-auto font-medium">
          Complete the tiers below to unlock higher trading limits, withdrawals, and new asset classes.
        </p>
      </motion.div>

      <div className="space-y-4">
        {/* 👇 Added ID for Tour */}
        <motion.div id="tour-kyc-tier-1" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
          <TierCard 
            tier={1} title="Tier 1: Basic Verification" status={t1Status} 
            statusText={t1Status === 'complete' ? 'COMPLETE' : t1Status === 'pending' ? 'PENDING' : t1Status === 'rejected' ? 'REJECTED' : 'ACTION REQUIRED'}
            subtitle={t1Status === 'complete' ? '(Small Limits Unlocked)' : t1Status === 'pending' ? '(Under Review)' : 'ID & Selfie Required'}
            icon={t1Status === 'complete' ? <CheckCircle2 size={28} /> : <Shield size={28} />}
            onClick={() => t1Status === 'action_required' && setActiveFormTier(1)} isActive={activeFormTier === 1 && t1Status === 'action_required'}
          />
        </motion.div>

        {/* 👇 Added ID for Tour */}
        <motion.div id="tour-kyc-tier-2" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
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
        // 👇 Added ID for Tour
        <motion.div id="tour-kyc-form" initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} className="bg-white/80 dark:bg-[#0a0f0b]/80 backdrop-blur-xl border border-lime-500/30 rounded-3xl p-6 sm:p-8 shadow-2xl mt-8">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-bold text-lime-950 dark:text-white">Upgrade to Tier {activeFormTier}</h2>
          </div>

          <form onSubmit={handleSubmit} noValidate className="space-y-8">
            
            {/* 👇 1. BASIC IDENTITY 👇 */}
            <div className="space-y-4">
              <h3 className="text-sm font-bold text-lime-950 dark:text-white uppercase tracking-wider border-b border-lime-500/20 pb-2">1. Basic Identity</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                
                <FloatingInput name="legalName" label="Legal Name" icon={<User size={16} />} defaultValue={userName} readOnly={!!userName} />

                <div className="relative" ref={calendarRef}>
                  <input type="hidden" name="dob" value={dob ? format(dob, "yyyy-MM-dd") : ""} />
                  <button
                    type="button" onClick={() => setIsCalendarOpen(!isCalendarOpen)}
                    className="peer w-full text-left bg-[#f4fbf5] dark:bg-[#0a0f0b] border-2 border-lime-500/30 dark:border-lime-500/20 rounded-xl px-4 pt-6 pb-2 text-lime-950 dark:text-white focus:outline-none focus:border-lime-500 transition-colors font-medium h-[54px]"
                  >
                    {dob ? format(dob, "PPP") : <span className="opacity-50">Select date</span>}
                  </button>
                  <label className="absolute left-3 -top-3 text-xs bg-[#f4fbf5] dark:bg-[#0a0f0b] px-1 text-lime-600 dark:text-lime-400">Date of Birth</label>
                  
                  <AnimatePresence>
                    {isCalendarOpen && (
                      <motion.div 
                        initial={{ opacity: 0, y: 10, scale: 0.95 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: 10, scale: 0.95 }}
                        className="absolute top-full left-0 mt-2 z-50 p-4 bg-white/95 dark:bg-[#0a0f0b]/95 backdrop-blur-xl border border-lime-500/30 rounded-2xl shadow-2xl"
                      >
                        <DayPicker mode="single" selected={dob} onSelect={(date) => { setDob(date); setIsCalendarOpen(false); }} disabled={{ after: new Date() }} />
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>

                <FloatingInput name="phone" label="Phone Number" type="tel" icon={<Phone size={16} />} />
                <FloatingInput name="email" label="Email Address" type="email" icon={<Mail size={16} />} defaultValue={userEmail} readOnly={!!userEmail} />
              </div>
            </div>

            {/* 👇 2. ADDRESS 👇 */}
            <div className="space-y-4">
              <h3 className="text-sm font-bold text-lime-950 dark:text-white uppercase tracking-wider border-b border-lime-500/20 pb-2">2. Residential Address</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FloatingInput name="street" label="Street Address" icon={<MapPin size={16} />} />
                <FloatingInput name="city" label="City" icon={<Globe size={16} />} />
                <FloatingInput name="state" label="State / Province" icon={<Globe size={16} />} />
                <FloatingInput name="country" label="Country" icon={<Globe size={16} />} />
              </div>
            </div>

            {/* 👇 3. DOCUMENTS (Pick 2 of 3) 👇 */}
            <div className="space-y-4">
              <div className="flex justify-between items-end border-b border-lime-500/20 pb-2">
                <h3 className="text-sm font-bold text-lime-950 dark:text-white uppercase tracking-wider">3. Identity Documents</h3>
                <span className="text-[10px] font-bold text-amber-600 dark:text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded">Pick any 2</span>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                
                {/* PASSPORT */}
                <div className="space-y-2 p-4 border border-lime-500/20 rounded-2xl bg-lime-500/5">
                  <p className="text-xs font-bold text-lime-950 dark:text-white mb-2">Option 1: Passport</p>
                  <ImageUpload label="Upload Passport" onChange={(base64) => setPassportImage(base64)} />
                </div>

                {/* GOV ID */}
                <div className="space-y-2 p-4 border border-lime-500/20 rounded-2xl bg-lime-500/5">
                  <p className="text-xs font-bold text-lime-950 dark:text-white mb-2">Option 2: Government ID</p>
                  <FloatingInput name="govIdNumber" label="Gov ID Number" icon={<FileText size={16} />} onChange={(e:any) => setGovIdNumber(e.target.value)} />
                  <div className="mt-2">
                    <ImageUpload label="Upload Gov ID" onChange={(base64) => setGovIdImage(base64)} />
                  </div>
                </div>

                {/* DRIVER'S LICENSE */}
                <div className="space-y-2 p-4 border border-lime-500/20 rounded-2xl bg-lime-500/5">
                  <p className="text-xs font-bold text-lime-950 dark:text-white mb-2">Option 3: Driver's License</p>
                  <FloatingInput name="driverLicenseNumber" label="DL Number" icon={<FileText size={16} />} onChange={(e:any) => setDriverLicenseNumber(e.target.value)} />
                  <div className="mt-2">
                    <ImageUpload label="Upload Driver's License" onChange={(base64) => setDriverLicenseImage(base64)} />
                  </div>
                </div>

                {/* SELFIE (Always Required) */}
                <div className="space-y-2 p-4 border-2 border-amber-500/30 rounded-2xl bg-amber-500/5">
                  <p className="text-xs font-bold text-amber-600 dark:text-amber-400 mb-2 flex items-center gap-2">
                    Biometric Selfie (Mandatory)
                  </p>
                  <ImageUpload label="Upload Selfie" onChange={(base64) => setSelfieImage(base64)} isSelfie={true} />
                </div>

              </div>
            </div>

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

function FloatingInput({ name, label, type = "text", icon, defaultValue = "", readOnly = false, onChange }: any) {
  return (
    <div className="relative">
      <input 
        type={type} name={name} defaultValue={defaultValue} readOnly={readOnly} placeholder=" " onChange={onChange}
        className={`peer w-full bg-[#f4fbf5] dark:bg-[#0a0f0b] border-2 border-lime-500/30 dark:border-lime-500/20 rounded-xl px-4 pt-6 pb-2 text-lime-950 dark:text-white focus:outline-none focus:border-lime-500 transition-colors font-medium ${readOnly ? 'opacity-60 cursor-not-allowed bg-black/5 dark:bg-white/5 border-lime-500/10 text-lime-800/50 dark:text-lime-200/40' : ''}`} 
      />
      <label 
        htmlFor={name} 
        className={`absolute left-3 top-4 text-lime-700/60 dark:text-lime-300/60 transition-all duration-200 pointer-events-none peer-focus:-top-3 peer-focus:text-xs peer-focus:bg-[#f4fbf5] dark:peer-focus:bg-[#0a0f0b] peer-focus:px-1 peer-focus:text-lime-600 peer-[:not(:placeholder-shown)]:-top-3 peer-[:not(:placeholder-shown)]:text-xs peer-[:not(:placeholder-shown)]:bg-[#f4fbf5] dark:peer-[:not(:placeholder-shown)]:bg-[#0a0f0b] peer-[:not(:placeholder-shown)]:px-1 ${readOnly ? 'opacity-50 text-lime-600/50 dark:text-lime-400/50' : ''}`}
      >
        <div className="flex items-center gap-2">{icon} {label}</div>
      </label>
    </div>
  );
}
// // app/dashboard/kyc/KycClient.tsx
// "use client";

// import { useState, useRef, useEffect } from "react";
// import { useRouter } from "next/navigation";
// import { motion, AnimatePresence } from "framer-motion";
// import { 
//   Shield, ShieldCheck, ShieldAlert, CheckCircle2, Lock, Loader2,
//   ChevronDown, User, Calendar, Phone, FileText, Mail, MapPin, Globe, UploadCloud 
// } from "lucide-react";
// import { useDevModal } from "@/components/providers/DevModalProvider";
// import { Button } from "@/components/ui/Button";
// import { submitKyc } from "@/app/actions/kyc";
// import ImageUpload from "@/components/ui/ImageUpload";

// import { DayPicker } from 'react-day-picker';
// import 'react-day-picker/dist/style.css';
// import { format } from 'date-fns';

// export default function KycClient({ currentTier, submission, userName, userEmail }: { currentTier: number, submission: any, userName: string, userEmail: string }) {
//   const router = useRouter();
//   const { openModal } = useDevModal();
  
//   const [isLoading, setIsLoading] = useState(false);
//   const [activeFormTier, setActiveFormTier] = useState<number>(currentTier === 0 ? 1 : currentTier + 1);
//   const [idType, setIdType] = useState("passport");

//   const [idImage, setIdImage] = useState("");
//   const [selfieImage, setSelfieImage] = useState("");

//   const [dob, setDob] = useState<Date>();
//   const [isCalendarOpen, setIsCalendarOpen] = useState(false);
//   const calendarRef = useRef<HTMLDivElement>(null);

//   useEffect(() => {
//     function handleClickOutside(event: MouseEvent) {
//       if (calendarRef.current && !calendarRef.current.contains(event.target as Node)) {
//         setIsCalendarOpen(false);
//       }
//     }
//     document.addEventListener("mousedown", handleClickOutside);
//     return () => document.removeEventListener("mousedown", handleClickOutside);
//   }, []);

//   const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
//     e.preventDefault();
    
//     const formData = new FormData(e.currentTarget);
//     const data = Object.fromEntries(formData.entries());

//     const missingFields = [];
    
//     const legalName = data.legalName || userName;
//     const email = data.email || userEmail;

//     if (!legalName) missingFields.push("Full Legal Name");
//     if (!data.dob) missingFields.push("Date of Birth");
//     if (!data.phone) missingFields.push("Phone Number");
    
//     // Only require ID number if it's NOT a passport
//     if (idType !== "passport" && !data.idNumber) {
//       missingFields.push("ID Number"); 
//     }
    
//     if (!email) missingFields.push("Email Address");
    
//     if (!data.street) missingFields.push("Street Address");
//     if (!data.city) missingFields.push("City");
//     if (!data.state) missingFields.push("State/Province");
//     if (!data.country) missingFields.push("Country");

//     if (missingFields.length > 0) {
//       openModal(
//         "Missing Information", 
//         `Please fill out the following required fields: ${missingFields.join(", ")}.`, 
//         "warning",
//         {
//           label: "Skip",
//           onClick: () => {
//             document.cookie = "kyc_skipped=true; path=/; max-age=86400";
//             window.location.href = "/dashboard";
//           }
//         }
//       );
//       return; 
//     }

//     if (!idImage) {
//       openModal("Missing Documents", `Please upload your ${idType === "passport" ? "Passport Bio Page" : "Government ID"}.`, "warning");
//       return;
//     }
//     if (!selfieImage) {
//       openModal("Missing Documents", "Please upload your Biometric Selfie.", "warning");
//       return;
//     }

//     setIsLoading(true);
    
//     setTimeout(async () => {
//       const payload = {
//         ...data,
//         legalName,
//         email,
//         idType: idType,
//         idDocumentUrl: idImage,        
//         selfieLivenessUrl: selfieImage, 
//         proofOfAddressUrl: activeFormTier >= 2 ? "mock_base64_poa" : "",
//         sourceOfWealthUrl: activeFormTier >= 3 ? "mock_base64_sow" : "",
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
            
//             {/* 👇 1. BASIC IDENTITY 👇 */}
//             <div className="space-y-4">
//               <h3 className="text-sm font-bold text-lime-950 dark:text-white uppercase tracking-wider border-b border-lime-500/20 pb-2">1. Basic Identity</h3>
//               <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                
//                 <FloatingInput 
//                   name="legalName" label="Legal Name" 
//                   icon={<User size={16} />} defaultValue={userName} readOnly={!!userName} 
//                 />

//                 {/* 👇 THE CUSTOM GLASSMORPHIC DATE PICKER 👇 */}
//                 <div className="relative" ref={calendarRef}>
//                   <input type="hidden" name="dob" value={dob ? format(dob, "yyyy-MM-dd") : ""} />
//                   <button
//                     type="button"
//                     onClick={() => setIsCalendarOpen(!isCalendarOpen)}
//                     className="peer w-full text-left bg-[#f4fbf5] dark:bg-[#0a0f0b] border-2 border-lime-500/30 dark:border-lime-500/20 rounded-xl px-4 pt-6 pb-2 text-lime-950 dark:text-white focus:outline-none focus:border-lime-500 transition-colors font-medium h-[54px]"
//                   >
//                     {dob ? format(dob, "PPP") : <span className="opacity-50">Select date</span>}
//                   </button>
//                   <label className="absolute left-3 -top-3 text-xs bg-[#f4fbf5] dark:bg-[#0a0f0b] px-1 text-lime-600 dark:text-lime-400">
//                     Date of Birth
//                   </label>
                  
//                   <AnimatePresence>
//                     {isCalendarOpen && (
//                       <motion.div 
//                         initial={{ opacity: 0, y: 10, scale: 0.95 }}
//                         animate={{ opacity: 1, y: 0, scale: 1 }}
//                         exit={{ opacity: 0, y: 10, scale: 0.95 }}
//                         className="absolute top-full left-0 mt-2 z-50 p-4 bg-white/95 dark:bg-[#0a0f0b]/95 backdrop-blur-xl border border-lime-500/30 rounded-2xl shadow-2xl"
//                       >
//                         <DayPicker
//                           mode="single"
//                           selected={dob}
//                           onSelect={(date) => {
//                             setDob(date);
//                             setIsCalendarOpen(false);
//                           }}
//                           disabled={{ after: new Date() }}
//                           className="text-lime-950 dark:text-white"
//                         />
//                       </motion.div>
//                     )}
//                   </AnimatePresence>
//                 </div>
//                 {/* 👆 END CUSTOM DATE PICKER 👆 */}

//                 <FloatingInput name="phone" label="Phone Number" type="tel" icon={<Phone size={16} />} />
                
//                 <div className="relative">
//                   <select 
//                     name="idType" value={idType}
//                     onChange={(e) => {
//                       setIdType(e.target.value);
//                       setIdImage(""); // Clear image if they switch types
//                     }}
//                     className="peer w-full bg-[#f4fbf5] dark:bg-[#0a0f0b] border-2 border-lime-500/30 dark:border-lime-500/20 rounded-xl px-4 pt-6 pb-2 text-lime-950 dark:text-white focus:outline-none focus:border-lime-500 transition-colors font-medium appearance-none h-[54px]"
//                   >
//                     <option value="passport">Passport</option>
//                     <option value="government_id">Government ID</option>
//                     <option value="drivers_license">Driver's License</option>
//                   </select>
//                   <label className="absolute left-3 -top-3 text-xs bg-[#f4fbf5] dark:bg-[#0a0f0b] px-1 text-lime-600 dark:text-lime-400">ID Type</label>
//                   <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 text-lime-500 pointer-events-none" size={20} />
//                 </div>
                
//                 {/* 👇 CONDITIONAL RENDER: Grayed out upload trigger vs normal input 👇 */}
//                 {idType === "passport" ? (
//                   <InlineUploadButton 
//                     label="Passport File" 
//                     onChange={(base64) => setIdImage(base64)} 
//                     icon={<UploadCloud size={16} />} 
//                   />
//                 ) : (
//                   <FloatingInput 
//                     name="idNumber" 
//                     label="ID Number" 
//                     icon={<FileText size={16} />} 
//                   />
//                 )}

//                 <FloatingInput 
//                   name="email" label="Email Address" type="email"
//                   icon={<Mail size={16} />} defaultValue={userEmail} readOnly={!!userEmail} 
//                 />
//               </div>
//             </div>

//             {/* 👇 2. ADDRESS 👇 */}
//             <div className="space-y-4">
//               <h3 className="text-sm font-bold text-lime-950 dark:text-white uppercase tracking-wider border-b border-lime-500/20 pb-2">2. Residential Address</h3>
//               <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
//                 <FloatingInput name="street" label="Street Address" icon={<MapPin size={16} />} />
//                 <FloatingInput name="city" label="City" icon={<Globe size={16} />} />
//                 <FloatingInput name="state" label="State / Province" icon={<Globe size={16} />} />
//                 <FloatingInput name="country" label="Country" icon={<Globe size={16} />} />
//               </div>
//             </div>

//             {/* 👇 3. DOCUMENTS 👇 */}
//             <div className="space-y-4">
//               <h3 className="text-sm font-bold text-lime-950 dark:text-white uppercase tracking-wider border-b border-lime-500/20 pb-2">3. Upload Documents</h3>
//               <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                
//                 {/* 👇 Kept exactly as Image 2. Shows the preview if uploaded from the top. 👇 */}
//                 <div className="h-[120px]">
//                   <ImageUpload 
//                     label="Upload Identity Document" 
//                     onChange={(base64) => setIdImage(base64)} 
//                   />
//                 </div>
                
//                 <div className="h-[120px]">
//                   <ImageUpload 
//                     label="Upload Biometric Selfie" 
//                     onChange={(base64) => setSelfieImage(base64)} 
//                   />
//                 </div>
//               </div>
//             </div>

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

// function FloatingInput({ name, label, type = "text", icon, defaultValue = "", readOnly = false }: any) {
//   return (
//     <div className="relative">
//       <input 
//         type={type} name={name} defaultValue={defaultValue} readOnly={readOnly} placeholder=" " 
//         className={`peer w-full bg-[#f4fbf5] dark:bg-[#0a0f0b] border-2 border-lime-500/30 dark:border-lime-500/20 rounded-xl px-4 pt-6 pb-2 text-lime-950 dark:text-white focus:outline-none focus:border-lime-500 transition-colors font-medium ${readOnly ? 'opacity-60 cursor-not-allowed bg-black/5 dark:bg-white/5 border-lime-500/10 text-lime-800/50 dark:text-lime-200/40' : ''}`} 
//       />
//       <label 
//         htmlFor={name} 
//         className={`absolute left-3 top-4 text-lime-700/60 dark:text-lime-300/60 transition-all duration-200 pointer-events-none peer-focus:-top-3 peer-focus:text-xs peer-focus:bg-[#f4fbf5] dark:peer-focus:bg-[#0a0f0b] peer-focus:px-1 peer-focus:text-lime-600 peer-[:not(:placeholder-shown)]:-top-3 peer-[:not(:placeholder-shown)]:text-xs peer-[:not(:placeholder-shown)]:bg-[#f4fbf5] dark:peer-[:not(:placeholder-shown)]:bg-[#0a0f0b] peer-[:not(:placeholder-shown)]:px-1 ${readOnly ? 'opacity-50 text-lime-600/50 dark:text-lime-400/50' : ''}`}
//       >
//         <div className="flex items-center gap-2">{icon} {label}</div>
//       </label>
//     </div>
//   );
// }

// // 👇 NEW COMPONENT: Looks like a disabled input but opens the file dialog 👇
// function InlineUploadButton({ label, onChange, icon }: any) {
//   const fileInputRef = useRef<HTMLInputElement>(null);
//   const { openModal } = useDevModal();

//   const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
//     const file = e.target.files?.[0];
//     if (!file) return;

//     if (file.size > 100 * 1024) {
//       openModal("File Too Large", "The selected image exceeds the 100KB limit. Please compress the image and try again.", "warning");
//       if (fileInputRef.current) fileInputRef.current.value = "";
//       return;
//     }

//     if (!file.type.startsWith("image/")) {
//       openModal("Invalid File", "Please upload a valid image file (JPG, PNG).", "warning");
//       return;
//     }

//     const reader = new FileReader();
//     reader.onloadend = () => {
//       onChange(reader.result as string);
//     };
//     reader.readAsDataURL(file);
//   };

//   return (
//     <div className="relative">
//       <button 
//         type="button"
//         // onClick={() => fileInputRef.current?.click()}
//         className="peer w-full text-left bg-black/5 dark:bg-white/5 border-2 border-lime-500/10 rounded-xl px-4 pt-6 pb-2 text-lime-800/50 dark:text-lime-200/40 transition-colors font-medium h-[54px] cursor-pointer flex items-center"
//       >
//         <span className="flex items-center gap-2">{icon} Upload image below</span>
//       </button>
//       <label className="absolute left-3 -top-3 text-xs bg-[#f4fbf5] dark:bg-[#0a0f0b] px-1 text-lime-600/50 dark:text-lime-400/50">
//         {label}
//       </label>
//       <input type="file" accept="image/*" className="hidden" ref={fileInputRef} onChange={handleFileChange} />
//     </div>
//   );
// }
// app/dashboard/kyc/KycClient.tsx
// "use client";

// import { useState, useRef, useEffect } from "react";
// import { useRouter } from "next/navigation";
// import { motion, AnimatePresence } from "framer-motion";
// import { 
//   Shield, ShieldCheck, ShieldAlert, CheckCircle2, Lock, Loader2,
//   ChevronDown, User, Calendar, Phone, FileText, Mail, MapPin, Globe 
// } from "lucide-react";
// import { useDevModal } from "@/components/providers/DevModalProvider";
// import { Button } from "@/components/ui/Button";
// import { submitKyc } from "@/app/actions/kyc";
// import ImageUpload from "@/components/ui/ImageUpload";

// // 👇 Import the custom calendar
// import { DayPicker } from 'react-day-picker';
// import 'react-day-picker/dist/style.css';
// import { format } from 'date-fns';

// export default function KycClient({ currentTier, submission, userName, userEmail }: { currentTier: number, submission: any, userName: string, userEmail: string }) {
//   const router = useRouter();
//   const { openModal } = useDevModal();
  
//   const [isLoading, setIsLoading] = useState(false);
//   const [activeFormTier, setActiveFormTier] = useState<number>(currentTier === 0 ? 1 : currentTier + 1);
//   const [idType, setIdType] = useState("passport");

//   const [idImage, setIdImage] = useState("");
//   const [selfieImage, setSelfieImage] = useState("");

//   // 👇 State for the custom date picker
//   const [dob, setDob] = useState<Date>();
//   const [isCalendarOpen, setIsCalendarOpen] = useState(false);
//   const calendarRef = useRef<HTMLDivElement>(null);

//   // Close calendar when clicking outside
//   useEffect(() => {
//     function handleClickOutside(event: MouseEvent) {
//       if (calendarRef.current && !calendarRef.current.contains(event.target as Node)) {
//         setIsCalendarOpen(false);
//       }
//     }
//     document.addEventListener("mousedown", handleClickOutside);
//     return () => document.removeEventListener("mousedown", handleClickOutside);
//   }, []);

//   const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
//     e.preventDefault();
    
//     const formData = new FormData(e.currentTarget);
//     const data = Object.fromEntries(formData.entries());

//     // 👇 1. Dynamic Text Field Validation
//     const missingFields = [];
    
//     const legalName = data.legalName || userName;
//     const email = data.email || userEmail;

//     if (!legalName) missingFields.push("Full Legal Name");
//     if (!data.dob) missingFields.push("Date of Birth");
//     if (!data.phone) missingFields.push("Phone Number");
//     if (!data.idNumber) missingFields.push("ID Number"); 
//     if (!email) missingFields.push("Email Address");
    
//     if (!data.street) missingFields.push("Street Address");
//     if (!data.city) missingFields.push("City");
//     if (!data.state) missingFields.push("State/Province");
//     if (!data.country) missingFields.push("Country");

//     if (missingFields.length > 0) {
//       openModal(
//         "Missing Information", 
//         `Please fill out the following required fields: ${missingFields.join(", ")}.`, 
//         "warning",
//         {
//           label: "Skip",
//           onClick: () => {
//             document.cookie = "kyc_skipped=true; path=/; max-age=86400";
//             window.location.href = "/dashboard";
//           }
//         }
//       );
//       return; 
//     }

//     // 👇 2. Document Validation
//     const missingDocs = [];
//     if (!idImage) missingDocs.push("Identity Document");
//     if (!selfieImage) missingDocs.push("Biometric Selfie");

//     if (missingDocs.length > 0) {
//       openModal("Missing Documents", `Please upload the following documents: ${missingDocs.join(" and ")}.`, "warning");
//       return;
//     }

//     // 👇 3. Submission
//     setIsLoading(true);
    
//     setTimeout(async () => {
//       const payload = {
//         ...data,
//         legalName,
//         email,
//         idType: idType,
//         idDocumentUrl: idImage,        
//         selfieLivenessUrl: selfieImage, 
//         proofOfAddressUrl: activeFormTier >= 2 ? "mock_base64_poa" : "",
//         sourceOfWealthUrl: activeFormTier >= 3 ? "mock_base64_sow" : "",
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
            
//             {/* 👇 1. BASIC IDENTITY 👇 */}
//             <div className="space-y-4">
//               <h3 className="text-sm font-bold text-lime-950 dark:text-white uppercase tracking-wider border-b border-lime-500/20 pb-2">1. Basic Identity</h3>
//               <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                
//                 <FloatingInput 
//                   name="legalName" label="Legal Name" 
//                   icon={<User size={16} />} defaultValue={userName} readOnly={!!userName} 
//                 />

//                 {/* 👇 THE CUSTOM GLASSMORPHIC DATE PICKER 👇 */}
//                 <div className="relative" ref={calendarRef}>
//                   <input type="hidden" name="dob" value={dob ? format(dob, "yyyy-MM-dd") : ""} />
//                   <button
//                     type="button"
//                     onClick={() => setIsCalendarOpen(!isCalendarOpen)}
//                     className="peer w-full text-left bg-[#f4fbf5] dark:bg-[#0a0f0b] border-2 border-lime-500/30 dark:border-lime-500/20 rounded-xl px-4 pt-6 pb-2 text-lime-950 dark:text-white focus:outline-none focus:border-lime-500 transition-colors font-medium h-[54px]"
//                   >
//                     {dob ? format(dob, "PPP") : <span className="opacity-50">Select date</span>}
//                   </button>
//                   <label className="absolute left-3 -top-3 text-xs bg-[#f4fbf5] dark:bg-[#0a0f0b] px-1 text-lime-600 dark:text-lime-400">
//                     Date of Birth
//                   </label>
                  
//                   <AnimatePresence>
//                     {isCalendarOpen && (
//                       <motion.div 
//                         initial={{ opacity: 0, y: 10, scale: 0.95 }}
//                         animate={{ opacity: 1, y: 0, scale: 1 }}
//                         exit={{ opacity: 0, y: 10, scale: 0.95 }}
//                         className="absolute top-full left-0 mt-2 z-50 p-4 bg-white/95 dark:bg-[#0a0f0b]/95 backdrop-blur-xl border border-lime-500/30 rounded-2xl shadow-2xl"
//                       >
//                         <DayPicker
//                           mode="single"
//                           selected={dob}
//                           onSelect={(date) => {
//                             setDob(date);
//                             setIsCalendarOpen(false);
//                           }}
//                           disabled={{ after: new Date() }} // Prevent future dates
//                           className="text-lime-950 dark:text-white"
//                         />
//                       </motion.div>
//                     )}
//                   </AnimatePresence>
//                 </div>
//                 {/* 👆 END CUSTOM DATE PICKER 👆 */}

//                 <FloatingInput name="phone" label="Phone Number" type="tel" icon={<Phone size={16} />} />
                
//                 <div className="relative">
//                   <select 
//                     name="idType" value={idType}
//                     onChange={(e) => setIdType(e.target.value)}
//                     className="peer w-full bg-[#f4fbf5] dark:bg-[#0a0f0b] border-2 border-lime-500/30 dark:border-lime-500/20 rounded-xl px-4 pt-6 pb-2 text-lime-950 dark:text-white focus:outline-none focus:border-lime-500 transition-colors font-medium appearance-none h-[54px]"
//                   >
//                     <option value="passport">Passport</option>
//                     <option value="national_id">National ID Card</option>
//                     <option value="drivers_license">Driver's License</option>
//                   </select>
//                   <label className="absolute left-3 -top-3 text-xs bg-[#f4fbf5] dark:bg-[#0a0f0b] px-1 text-lime-600 dark:text-lime-400">ID Type</label>
//                   <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 text-lime-500 pointer-events-none" size={20} />
//                 </div>
                
//                 <FloatingInput 
//                   name="idNumber" 
//                   label={
//                     idType === "passport" ? "Passport Number" : 
//                     idType === "national_id" ? "National ID Number" : 
//                     "Driver's License Number"
//                   } 
//                   icon={<FileText size={16} />} 
//                 />

//                 <FloatingInput 
//                   name="email" label="Email Address" type="email"
//                   icon={<Mail size={16} />} defaultValue={userEmail} readOnly={!!userEmail} 
//                 />
//               </div>
//             </div>

//             {/* 👇 2. ADDRESS 👇 */}
//             <div className="space-y-4">
//               <h3 className="text-sm font-bold text-lime-950 dark:text-white uppercase tracking-wider border-b border-lime-500/20 pb-2">2. Residential Address</h3>
//               <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
//                 <FloatingInput name="street" label="Street Address" icon={<MapPin size={16} />} />
//                 <FloatingInput name="city" label="City" icon={<Globe size={16} />} />
//                 <FloatingInput name="state" label="State / Province" icon={<Globe size={16} />} />
//                 <FloatingInput name="country" label="Country" icon={<Globe size={16} />} />
//               </div>
//             </div>

//             {/* 👇 3. DOCUMENTS 👇 */}
//             <div className="space-y-4">
//               <h3 className="text-sm font-bold text-lime-950 dark:text-white uppercase tracking-wider border-b border-lime-500/20 pb-2">3. Upload Documents</h3>
//               <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
//                 <ImageUpload 
//                   label="Upload Identity Document" 
//                   onChange={(base64) => setIdImage(base64)} 
//                 />
//                 <ImageUpload 
//                   label="Upload Biometric Selfie" 
//                   onChange={(base64) => setSelfieImage(base64)} 
//                 />
//               </div>
//             </div>

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

// function FloatingInput({ name, label, type = "text", icon, defaultValue = "", readOnly = false }: any) {
//   return (
//     <div className="relative">
//       <input 
//         type={type} name={name} defaultValue={defaultValue} readOnly={readOnly} placeholder=" " 
//         className={`peer w-full bg-[#f4fbf5] dark:bg-[#0a0f0b] border-2 border-lime-500/30 dark:border-lime-500/20 rounded-xl px-4 pt-6 pb-2 text-lime-950 dark:text-white focus:outline-none focus:border-lime-500 transition-colors font-medium ${readOnly ? 'opacity-60 cursor-not-allowed bg-black/5 dark:bg-white/5 border-lime-500/10 text-lime-800/50 dark:text-lime-200/40' : ''}`} 
//       />
//       <label 
//         htmlFor={name} 
//         className={`absolute left-3 top-4 text-lime-700/60 dark:text-lime-300/60 transition-all duration-200 pointer-events-none peer-focus:-top-3 peer-focus:text-xs peer-focus:bg-[#f4fbf5] dark:peer-focus:bg-[#0a0f0b] peer-focus:px-1 peer-focus:text-lime-600 peer-[:not(:placeholder-shown)]:-top-3 peer-[:not(:placeholder-shown)]:text-xs peer-[:not(:placeholder-shown)]:bg-[#f4fbf5] dark:peer-[:not(:placeholder-shown)]:bg-[#0a0f0b] peer-[:not(:placeholder-shown)]:px-1 ${readOnly ? 'opacity-50 text-lime-600/50 dark:text-lime-400/50' : ''}`}
//       >
//         <div className="flex items-center gap-2">{icon} {label}</div>
//       </label>
//     </div>
//   );
// }