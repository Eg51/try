"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Search, ArrowRight } from "lucide-react";
import { useRouter } from "next/navigation";

export function CommandPalette() {
  const [isOpen, setIsOpen] = useState(false);
  const [query, setQuery] = useState("");
  const router = useRouter();

  const commands = [
    { label: "Go to Dashboard", href: "/dashboard" },
    { label: "Go to Markets", href: "/markets" },
    { label: "Go to Wallet", href: "/dashboard/wallet" },
    { label: "Go to Settings", href: "/dashboard/settings" },
    { label: "Go to Rewards", href: "/dashboard/rewards" },
    { label: "Go to Terminal", href: "/terminal" },
  ];

  const filtered = commands.filter((c) => c.label.toLowerCase().includes(query.toLowerCase()));

  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.key === "k" && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        setIsOpen((open) => !open);
      }
    };
    document.addEventListener("keydown", down);
    return () => document.removeEventListener("keydown", down);
  }, []);

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[200] flex items-start justify-center pt-[15vh] bg-black/60 backdrop-blur-sm"
          onClick={() => setIsOpen(false)}
        >
          <motion.div
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.95, opacity: 0 }}
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-lg bg-[#f4fbf5] dark:bg-[#0a0f0b] border border-lime-500/20 rounded-2xl shadow-2xl overflow-hidden"
          >
            <div className="flex items-center px-4 py-3 border-b border-lime-500/10">
              <Search className="text-lime-500 mr-3" size={20} />
              <input
                autoFocus
                placeholder="Type a command or search..."
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                className="flex-1 bg-transparent border-none outline-none text-lime-950 dark:text-white placeholder:text-lime-800/40"
              />
              <kbd className="hidden sm:inline-block px-2 py-1 bg-lime-500/10 text-lime-600 rounded text-xs font-mono">
                ESC
              </kbd>
            </div>
            <div className="p-2 max-h-64 overflow-y-auto">
              {filtered.length === 0 ? (
                <div className="p-4 text-center text-sm text-lime-800/50">No results found.</div>
              ) : (
                filtered.map((cmd) => (
                  <button
                    key={cmd.href}
                    onClick={() => {
                      router.push(cmd.href);
                      setIsOpen(false);
                    }}
                    className="w-full flex items-center justify-between p-3 rounded-lg hover:bg-lime-500/10 text-left transition-colors"
                  >
                    <span className="text-sm font-medium text-lime-950 dark:text-white">{cmd.label}</span>
                    <ArrowRight size={16} className="text-lime-500" />
                  </button>
                ))
              )}
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}