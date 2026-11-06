// components/HeaderActions.tsx
"use client";

import { 
  HelpCircle, Moon, Sun, User, Bell, Settings, SlidersHorizontal, X, 
  LayoutDashboard, Store, Trophy, LogOut, Play, 
  LineChart, Banknote, ShieldAlert 
} from "lucide-react";
import { useTheme } from "next-themes";
import { useTour } from "@/components/providers/TourProvider"; 
import { useUI } from "@/components/providers/UIProvider"; 
import { useEffect, useState, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";
import { useRouter } from "next/navigation"; // 👈 Imported useRouter
import { logout } from "@/app/actions/auth";
import KycReminderModal from "@/components/modals/KycReminderModal";

interface HeaderActionsProps {
  onHelpClick?: () => void;
  onUserClick?: () => void;
  hideNotifications?: boolean;
  helpId?: string;
  themeId?: string;
  userId?: string;
  forceOpen?: boolean;
  kycTier?: number; 
}

export default function HeaderActions({ 
  onHelpClick, 
  onUserClick, 
  hideNotifications = false,
  helpId,
  themeId,
  userId,
  forceOpen,
  kycTier = 1 
}: HeaderActionsProps) {
  const router = useRouter(); // 👈 Initialized Router
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const [isKycReminderOpen, setIsKycReminderOpen] = useState(false); 
  const menuRef = useRef<HTMLDivElement>(null);
  
  const { startTour, steps } = useTour(); 
  const { openSettings } = useUI(); 

  useEffect(() => setMounted(true), []);

  useEffect(() => {
    if (kycTier > 0) return;
    const TWO_HOURS = 2 * 60 * 60 * 1000; 
    const interval = setInterval(() => {
      setIsKycReminderOpen(true);
    }, TWO_HOURS);
    return () => clearInterval(interval);
  }, [kycTier]);

  useEffect(() => {
    if (forceOpen !== undefined) {
      setIsOpen(forceOpen);
    }
  }, [forceOpen]);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (forceOpen) return; 
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [isOpen, forceOpen]);

  const MenuItem = ({ 
    icon, label, onClick, href, id, isDestructive = false
  }: { 
    icon: React.ReactNode; label: string; onClick?: () => void; href?: string; id?: string; isDestructive?: boolean;
  }) => {
    const innerContent = (
      <>
        <div className={`flex items-center justify-center w-8 h-8 rounded-full bg-white/50 dark:bg-[#121A14] border shadow-sm transition-all duration-300 ${
          isDestructive 
            ? "border-red-500/20 text-red-500 group-hover:bg-red-500 group-hover:text-white group-hover:border-red-500" 
            : "border-lime-500/10 text-lime-800 dark:text-lime-200 group-hover:bg-lime-500 group-hover:text-white group-hover:border-lime-500"
        }`}>
          {icon}
        </div>
        <span className={`text-xs font-bold group-hover:translate-x-1 transition-transform duration-300 ${
          isDestructive ? "text-red-500" : "text-lime-950 dark:text-lime-50"
        }`}>{label}</span>
      </>
    );

    const baseClasses = `group flex items-center gap-3 w-full p-2 rounded-xl transition-all cursor-pointer text-left ${
      isDestructive ? "hover:bg-red-500/10" : "hover:bg-lime-100/50 dark:hover:bg-[#121A14]/80"
    }`;

    if (href) {
      return (
        <Link href={href} id={id} onClick={() => setIsOpen(false)} className={baseClasses}>
          {innerContent}
        </Link>
      );
    }

    return (
      <button id={id} onClick={() => { onClick?.(); setIsOpen(false); }} className={baseClasses}>
        {innerContent}
      </button>
    );
  };

  return (
    <>
      <div className="relative flex items-center" ref={menuRef}>
        
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          animate={{ rotate: isOpen ? 90 : 0 }}
          onClick={() => setIsOpen(!isOpen)}
          aria-label="Toggle menu"
          className="relative flex items-center justify-center p-2 text-lime-800 dark:text-lime-200 hover:text-lime-600 dark:hover:text-lime-400 transition-colors cursor-pointer z-50"
        >
          {isOpen ? <X size={24} strokeWidth={2.5} /> : <SlidersHorizontal size={24} strokeWidth={2.5} />}
        </motion.button>

        <AnimatePresence>
          {isOpen && (
            <motion.div
              initial={{ opacity: 0, y: -10, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -10, scale: 0.95 }}
              transition={{ type: "spring", stiffness: 300, damping: 25 }}
              className="absolute top-full right-0 mt-2 w-56 max-h-[75vh] overflow-y-auto custom-scrollbar p-2 bg-white/95 dark:bg-[#0a0f0b]/95 backdrop-blur-xl border border-lime-500/30 dark:border-lime-500/10 rounded-2xl shadow-[0_8px_32px_rgba(132,204,22,0.15)] dark:shadow-[0_8px_32px_rgba(0,0,0,0.5)] flex flex-col gap-1 z-50 origin-top-right"
            >
              {/* Navigation */}
              <div className="px-3 pt-2 pb-1">
                <span className="text-[10px] font-bold text-lime-800/40 dark:text-lime-200/30 uppercase tracking-widest">Navigation</span>
              </div>
              
              <MenuItem href="/dashboard" icon={<LayoutDashboard size={16} strokeWidth={2.5} />} label="Overview" />
              <MenuItem href="/terminal" icon={<LineChart size={16} strokeWidth={2.5} />} label="Terminal" />
              <MenuItem href="/markets" icon={<Store size={16} strokeWidth={2.5} />} label="Markets" />
              <MenuItem href="/dashboard/transfer" icon={<Banknote size={16} strokeWidth={2.5} />} label="Transact" />
              <MenuItem href="/dashboard/rewards" icon={<Trophy size={16} strokeWidth={2.5} />} label="Rewards" />

              <div className="h-px w-full bg-lime-500/20 my-1" />

              {/* CONDITIONAL KYC LINK */}
              {kycTier === 0 && (
                <MenuItem 
                  href="/dashboard/kyc" 
                  icon={<ShieldAlert size={16} strokeWidth={2.5} className="text-amber-500 group-hover:text-white" />} 
                  label="Verify Identity" 
                />
              )}

              {/* Actions */}
              {!hideNotifications && (
                <MenuItem icon={<Bell size={16} strokeWidth={2.5} />} label="Notifications" />
              )}

              <MenuItem 
                id={helpId} onClick={onHelpClick}
                icon={<HelpCircle size={16} strokeWidth={2.5} />} label="Help & Support" 
              />

              {steps.length > 0 && (
                <MenuItem 
                  onClick={startTour}
                  icon={<Play size={16} strokeWidth={2.5} />} 
                  label="Play Page Tour" 
                />
              )}

              <MenuItem 
                id={themeId} onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
                icon={!mounted ? <div className="w-4 h-4" /> : theme === "dark" ? <Sun size={16} className="text-amber-600" strokeWidth={2.5} /> : <Moon size={16} className="text-gray-700" strokeWidth={2.5} />}
                label="Toggle Theme" 
              />

              <MenuItem 
                onClick={() => openSettings()} 
                icon={<Settings size={16} strokeWidth={2.5} />} 
                label="Settings" 
              />

              {/* 👇 FIXED PROFILE BUTTON TO USE ROUTER PUSH IF NO ONCLICK PASSED */}
              <MenuItem 
                id={userId} 
                onClick={onUserClick || (() => router.push("/dashboard/profile"))} 
                icon={<User size={16} strokeWidth={2.5} />} 
                label="Profile" 
              />

              <div className="h-px w-full bg-lime-500/20 my-1" />
              
              <form action={logout} className="w-full">
                <button 
                  type="submit" 
                  className="group flex items-center gap-3 w-full p-2 rounded-xl hover:bg-red-500/10 transition-all cursor-pointer text-left"
                >
                  <div className="flex items-center justify-center w-8 h-8 rounded-full bg-red-500/10 border border-red-500/20 shadow-sm text-red-500 group-hover:bg-red-500 group-hover:text-white transition-all duration-300">
                    <LogOut size={16} strokeWidth={2.5} />
                  </div>
                  <span className="text-xs font-bold text-red-500 group-hover:translate-x-1 transition-transform duration-300">
                    Log Out
                  </span>
                </button>
              </form>

            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <KycReminderModal 
        isOpen={isKycReminderOpen} 
        onClose={() => setIsKycReminderOpen(false)} 
      />
    </>
  );
}
// // components/HeaderActions.tsx
// "use client";

// import { 
//   HelpCircle, Moon, Sun, User, Bell, Settings, SlidersHorizontal, X, 
//   LayoutDashboard, Store, Trophy, LogOut, Play, 
//   LineChart, Banknote, ShieldAlert 
// } from "lucide-react";
// import { useTheme } from "next-themes";
// import { useTour } from "@/components/providers/TourProvider"; 
// import { useUI } from "@/components/providers/UIProvider"; // 👈 Imported Global UI Hook
// import { useEffect, useState, useRef } from "react";
// import { motion, AnimatePresence } from "framer-motion";
// import Link from "next/link";
// import { logout } from "@/app/actions/auth";
// import KycReminderModal from "@/components/modals/KycReminderModal";

// interface HeaderActionsProps {
//   onHelpClick?: () => void;
//   onUserClick?: () => void;
//   hideNotifications?: boolean;
//   helpId?: string;
//   themeId?: string;
//   userId?: string;
//   forceOpen?: boolean;
//   kycTier?: number; // 👈 Added prop to check KYC status
// }

// export default function HeaderActions({ 
//   onHelpClick, 
//   onUserClick, 
//   hideNotifications = false,
//   helpId,
//   themeId,
//   userId,
//   forceOpen,
//   kycTier = 1 // Default to 1 (verified) to prevent spam if prop isn't passed
// }: HeaderActionsProps) {
//   const { theme, setTheme } = useTheme();
//   const [mounted, setMounted] = useState(false);
//   const [isOpen, setIsOpen] = useState(false);
//   const [isKycReminderOpen, setIsKycReminderOpen] = useState(false); // 👈 State for modal
//   const menuRef = useRef<HTMLDivElement>(null);
  
//   const { startTour, steps } = useTour(); 
//   const { openSettings } = useUI(); // 👈 Initialize Global Settings Trigger

//   useEffect(() => setMounted(true), []);

//   // 👇 2-HOUR KYC REMINDER TIMER
//   useEffect(() => {
//     // If user is already verified, don't set the timer
//     if (kycTier > 0) return;

//     // 2 hours in milliseconds (2 * 60 * 60 * 1000)
//     // For testing, you can change this to 10000 (10 seconds)
//     const TWO_HOURS = 2 * 60 * 60 * 1000; 

//     const interval = setInterval(() => {
//       setIsKycReminderOpen(true);
//     }, TWO_HOURS);

//     return () => clearInterval(interval);
//   }, [kycTier]);

//   useEffect(() => {
//     if (forceOpen !== undefined) {
//       setIsOpen(forceOpen);
//     }
//   }, [forceOpen]);

//   useEffect(() => {
//     function handleClickOutside(event: MouseEvent) {
//       if (forceOpen) return; 
//       if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
//         setIsOpen(false);
//       }
//     }
//     if (isOpen) {
//       document.addEventListener("mousedown", handleClickOutside);
//     }
//     return () => document.removeEventListener("mousedown", handleClickOutside);
//   }, [isOpen, forceOpen]);

//   const MenuItem = ({ 
//     icon, label, onClick, href, id, isDestructive = false
//   }: { 
//     icon: React.ReactNode; label: string; onClick?: () => void; href?: string; id?: string; isDestructive?: boolean;
//   }) => {
//     const innerContent = (
//       <>
//         <div className={`flex items-center justify-center w-8 h-8 rounded-full bg-white/50 dark:bg-[#121A14] border shadow-sm transition-all duration-300 ${
//           isDestructive 
//             ? "border-red-500/20 text-red-500 group-hover:bg-red-500 group-hover:text-white group-hover:border-red-500" 
//             : "border-lime-500/10 text-lime-800 dark:text-lime-200 group-hover:bg-lime-500 group-hover:text-white group-hover:border-lime-500"
//         }`}>
//           {icon}
//         </div>
//         <span className={`text-xs font-bold group-hover:translate-x-1 transition-transform duration-300 ${
//           isDestructive ? "text-red-500" : "text-lime-950 dark:text-lime-50"
//         }`}>{label}</span>
//       </>
//     );

//     const baseClasses = `group flex items-center gap-3 w-full p-2 rounded-xl transition-all cursor-pointer text-left ${
//       isDestructive ? "hover:bg-red-500/10" : "hover:bg-lime-100/50 dark:hover:bg-[#121A14]/80"
//     }`;

//     if (href) {
//       return (
//         <Link href={href} id={id} onClick={() => setIsOpen(false)} className={baseClasses}>
//           {innerContent}
//         </Link>
//       );
//     }

//     return (
//       <button id={id} onClick={() => { onClick?.(); setIsOpen(false); }} className={baseClasses}>
//         {innerContent}
//       </button>
//     );
//   };

//   return (
//     <>
//       <div className="relative flex items-center" ref={menuRef}>
        
//         <motion.button
//           whileHover={{ scale: 1.05 }}
//           whileTap={{ scale: 0.95 }}
//           animate={{ rotate: isOpen ? 90 : 0 }}
//           onClick={() => setIsOpen(!isOpen)}
//           aria-label="Toggle menu"
//           className="relative flex items-center justify-center p-2 text-lime-800 dark:text-lime-200 hover:text-lime-600 dark:hover:text-lime-400 transition-colors cursor-pointer z-50"
//         >
//           {isOpen ? <X size={24} strokeWidth={2.5} /> : <SlidersHorizontal size={24} strokeWidth={2.5} />}
//         </motion.button>

//         <AnimatePresence>
//           {isOpen && (
//             <motion.div
//               initial={{ opacity: 0, y: -10, scale: 0.95 }}
//               animate={{ opacity: 1, y: 0, scale: 1 }}
//               exit={{ opacity: 0, y: -10, scale: 0.95 }}
//               transition={{ type: "spring", stiffness: 300, damping: 25 }}
//              className="absolute top-full right-0 mt-2 w-56 max-h-[75vh] overflow-y-auto custom-scrollbar p-2 bg-white/95 dark:bg-[#0a0f0b]/95 backdrop-blur-xl border border-lime-500/30 dark:border-lime-500/10 rounded-2xl shadow-[0_8px_32px_rgba(132,204,22,0.15)] dark:shadow-[0_8px_32px_rgba(0,0,0,0.5)] flex flex-col gap-1 z-50 origin-top-right"
//               >
//               {/* Navigation */}
//               <div className="px-3 pt-2 pb-1">
//                 <span className="text-[10px] font-bold text-lime-800/40 dark:text-lime-200/30 uppercase tracking-widest">Navigation</span>
//               </div>
              
//               <MenuItem href="/dashboard" icon={<LayoutDashboard size={16} strokeWidth={2.5} />} label="Overview" />
//               <MenuItem href="/terminal" icon={<LineChart size={16} strokeWidth={2.5} />} label="Terminal" />
//               <MenuItem href="/markets" icon={<Store size={16} strokeWidth={2.5} />} label="Markets" />
//               <MenuItem href="/dashboard/transfer" icon={<Banknote size={16} strokeWidth={2.5} />} label="Transact" />
//               <MenuItem href="/dashboard/rewards" icon={<Trophy size={16} strokeWidth={2.5} />} label="Rewards" />

//               <div className="h-px w-full bg-lime-500/20 my-1" />

//               {/* 👇 CONDITIONAL KYC LINK 👇 */}
//               {kycTier === 0 && (
//                 <MenuItem 
//                   href="/dashboard/kyc" 
//                   icon={<ShieldAlert size={16} strokeWidth={2.5} className="text-amber-500 group-hover:text-white" />} 
//                   label="Verify Identity" 
//                 />
//               )}

//               {/* Actions */}
//               {!hideNotifications && (
//                 <MenuItem icon={<Bell size={16} strokeWidth={2.5} />} label="Notifications" />
//               )}

//               <MenuItem 
//                 id={helpId} onClick={onHelpClick}
//                 icon={<HelpCircle size={16} strokeWidth={2.5} />} label="Help & Support" 
//               />

//               {steps.length > 0 && (
//                 <MenuItem 
//                   onClick={startTour}
//                   icon={<Play size={16} strokeWidth={2.5} />} 
//                   label="Play Page Tour" 
//                 />
//               )}

//               <MenuItem 
//                 id={themeId} onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
//                 icon={!mounted ? <div className="w-4 h-4" /> : theme === "dark" ? <Sun size={16} className="text-amber-600" strokeWidth={2.5} /> : <Moon size={16} className="text-gray-700" strokeWidth={2.5} />}
//                 label="Toggle Theme" 
//               />

//               {/* 👇 WIRED TO GLOBAL UI PROVIDER 👇 */}
//               <MenuItem 
//                 onClick={() => openSettings()} 
//                 icon={<Settings size={16} strokeWidth={2.5} />} 
//                 label="Settings" 
//               />

//               <MenuItem 
//                 id={userId} onClick={onUserClick} 
//                 icon={<User size={16} strokeWidth={2.5} />} label="Profile" 
//               />

//               <div className="h-px w-full bg-lime-500/20 my-1" />
              
//               <form action={logout} className="w-full">
//                 <button 
//                   type="submit" 
//                   className="group flex items-center gap-3 w-full p-2 rounded-xl hover:bg-red-500/10 transition-all cursor-pointer text-left"
//                 >
//                   <div className="flex items-center justify-center w-8 h-8 rounded-full bg-red-500/10 border border-red-500/20 shadow-sm text-red-500 group-hover:bg-red-500 group-hover:text-white transition-all duration-300">
//                     <LogOut size={16} strokeWidth={2.5} />
//                   </div>
//                   <span className="text-xs font-bold text-red-500 group-hover:translate-x-1 transition-transform duration-300">
//                     Log Out
//                   </span>
//                 </button>
//               </form>

//             </motion.div>
//           )}
//         </AnimatePresence>
//       </div>

//       {/* 👇 MOUNT THE KYC REMINDER MODAL 👇 */}
//       <KycReminderModal 
//         isOpen={isKycReminderOpen} 
//         onClose={() => setIsKycReminderOpen(false)} 
//       />
//     </>
//   );
// }
