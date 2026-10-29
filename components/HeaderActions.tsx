"use client";

import { HelpCircle, Moon, Sun, User, Bell, Settings, SlidersHorizontal, X, LayoutDashboard, ArrowRightLeft, Wallet, Trophy } from "lucide-react";
import { useTheme } from "next-themes";
import { useEffect, useState, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";
import SettingsModal from "@/components/SettingsModal"; // 👈 Import the new modal

interface HeaderActionsProps {
  onHelpClick?: () => void;
  onUserClick?: () => void;
  hideNotifications?: boolean;
  helpId?: string;
  themeId?: string;
  userId?: string;
  forceOpen?: boolean;
}

export default function HeaderActions({ 
  onHelpClick, 
  onUserClick, 
  hideNotifications = false,
  helpId,
  themeId,
  userId,
  forceOpen
}: HeaderActionsProps) {
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false); // 👈 Settings state
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => setMounted(true), []);

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
    icon, label, onClick, href, id
  }: { 
    icon: React.ReactNode; label: string; onClick?: () => void; href?: string; id?: string;
  }) => {
    const innerContent = (
      <>
        <div className="flex items-center justify-center w-8 h-8 rounded-full bg-white/50 dark:bg-[#121A14] border border-lime-500/10 shadow-sm text-lime-800 dark:text-lime-200 group-hover:bg-lime-500 group-hover:text-white group-hover:border-lime-500 transition-all duration-300">
          {icon}
        </div>
        <span className="text-xs font-bold text-lime-950 dark:text-lime-50 group-hover:translate-x-1 transition-transform duration-300">{label}</span>
      </>
    );

    const baseClasses = "group flex items-center gap-3 w-full p-2 rounded-xl hover:bg-lime-100/50 dark:hover:bg-[#121A14]/80 transition-all cursor-pointer text-left";

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
              className="absolute top-full right-0 mt-2 w-56 p-2 bg-white/95 dark:bg-[#0a0f0b]/95 backdrop-blur-xl border border-lime-500/30 dark:border-lime-500/10 rounded-2xl shadow-[0_8px_32px_rgba(132,204,22,0.15)] dark:shadow-[0_8px_32px_rgba(0,0,0,0.5)] flex flex-col gap-1 z-50 origin-top-right"
            >
              {/* Navigation */}
              <div className="px-3 pt-2 pb-1">
                <span className="text-[10px] font-bold text-lime-800/40 dark:text-lime-200/30 uppercase tracking-widest">Menu</span>
              </div>
              <MenuItem href="/dashboard" icon={<LayoutDashboard size={16} strokeWidth={2.5} />} label="Overview" />
              <MenuItem href="/dashboard/markets" icon={<ArrowRightLeft size={16} strokeWidth={2.5} />} label="Markets" />
              <MenuItem href="/dashboard/wallet" icon={<Wallet size={16} strokeWidth={2.5} />} label="Wallet" />
              <MenuItem href="/dashboard/rewards" icon={<Trophy size={16} strokeWidth={2.5} />} label="Rewards" />

              <div className="h-px w-full bg-lime-500/20 my-1" />

              {/* Actions */}
              {!hideNotifications && (
                <MenuItem icon={<Bell size={16} strokeWidth={2.5} />} label="Notifications" />
              )}

              <MenuItem 
                id={helpId} onClick={onHelpClick}
                icon={<HelpCircle size={16} strokeWidth={2.5} />} label="Help & Demo" 
              />

              <MenuItem 
                id={themeId} onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
                icon={!mounted ? <div className="w-4 h-4" /> : theme === "dark" ? <Sun size={16} className="text-amber-600" strokeWidth={2.5} /> : <Moon size={16} className="text-gray-700" strokeWidth={2.5} />}
                label="Toggle Theme" 
              />

              {/* 👇 TRIGGERS THE NEW MODAL 👇 */}
              <MenuItem 
                onClick={() => setIsSettingsOpen(true)} 
                icon={<Settings size={16} strokeWidth={2.5} />} 
                label="Settings" 
              />

              <MenuItem 
                id={userId} onClick={onUserClick} 
                icon={<User size={16} strokeWidth={2.5} />} label="Profile" 
              />
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* 👇 RENDER THE MODAL HERE 👇 */}
      <SettingsModal isOpen={isSettingsOpen} onClose={() => setIsSettingsOpen(false)} />
    </>
  );
}