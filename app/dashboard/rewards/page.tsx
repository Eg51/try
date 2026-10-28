"use client";

import { useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Search, Lock, Unlock } from "lucide-react";
import { ALL_BADGES, BADGE_CATEGORIES } from "@/lib/gamification";
import { claimBadgeReward } from "@/app/actions/gamification";
import { useToast } from "@/components/providers/ToastProvider";

// Mock user state - replace with actual data from your database
const mockUserState = {
  orders: 15,
  volume: 4500,
  xp: 1200,
  modeViews: { histogram: 5, bar: 2, donut: 1, graph: 0 },
  claimedBadges: ["badge:trade-1", "badge:trade-2", "badge:vol-100"],
  commodityCounts: { CHR: 10, BLF: 5 },
  daysTraded: [1, 2, 3],
  currentStreak: 3,
};

export default function RewardsPage() {
  const [filter, setFilter] = useState("all");
  const [search, setSearch] = useState("");
  const { toast } = useToast();

  const filteredBadges = useMemo(() => {
    return ALL_BADGES.filter((b) => {
      const matchesFilter = filter === "all" || b.cat === filter;
      const matchesSearch = b.title.toLowerCase().includes(search.toLowerCase()) || b.desc.toLowerCase().includes(search.toLowerCase());
      return matchesFilter && matchesSearch;
    });
  }, [filter, search]);

  const handleClaim = async (badgeId: string) => {
    const res = await claimBadgeReward(badgeId);
    if (res.error) {
      toast("Error", res.error, "error");
    } else {
      toast("Badge Claimed!", `Earned +${res.xpEarned} XP and +${res.coinsEarned} coins.`, "success");
      if (res.tierUpgraded) {
        toast("Tier Upgraded!", `You are now Tier ${res.newTier}.`, "success");
      }
    }
  };

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-lime-950 dark:text-white">Badges & Achievements</h1>
          <p className="text-sm text-lime-800/70 dark:text-lime-200/50 mt-1">
            Unlocked {mockUserState.claimedBadges.length} / {ALL_BADGES.length} badges
          </p>
        </div>
        
        {/* Search */}
        <div className="relative w-full md:w-72">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-lime-600/50" size={18} />
          <input
            type="text"
            placeholder="Search 1000 badges..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-white/50 dark:bg-black/30 border border-lime-500/20 rounded-xl pl-10 pr-4 py-2 text-sm text-lime-950 dark:text-white focus:outline-none focus:border-lime-500"
          />
        </div>
      </div>

      {/* Category Filters */}
      <div className="flex flex-wrap gap-2">
        {BADGE_CATEGORIES.map((cat) => (
          <button
            key={cat.id}
            onClick={() => setFilter(cat.id)}
            className={`px-3 py-1.5 text-xs font-bold font-mono rounded-lg border transition-all ${
              filter === cat.id
                ? "bg-lime-600 text-white border-lime-600 shadow-md shadow-lime-600/20"
                : "bg-white/50 dark:bg-black/30 text-lime-800 dark:text-lime-200 border-lime-500/20 hover:border-lime-500/50"
            }`}
          >
            {cat.icon} {cat.name}
          </button>
        ))}
      </div>

      {/* Badge Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
        <AnimatePresence>
          {filteredBadges.map((badge, i) => {
            const isUnlocked = mockUserState.claimedBadges.includes(`badge:${badge.id}`);
            const progress = badge.progress(mockUserState);
            const pct = Math.min(100, (progress / badge.goal) * 100);

            return (
              <motion.div
                key={badge.id}
                layout
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                className={`relative p-4 rounded-2xl border flex flex-col items-center text-center transition-all ${
                  isUnlocked
                    ? "bg-lime-500/10 border-lime-500/30"
                    : "bg-white/40 dark:bg-[#0a0f0b]/60 border-lime-500/10 opacity-70 grayscale"
                }`}
              >
                <div className="absolute top-2 right-2 text-lime-600 dark:text-lime-400">
                  {isUnlocked ? <Unlock size={14} /> : <Lock size={14} className="opacity-50" />}
                </div>
                
                <div className="text-3xl mb-2">{badge.icon}</div>
                <div className="text-xs font-bold text-lime-950 dark:text-white leading-tight mb-1">{badge.title}</div>
                <div className="text-[10px] text-lime-800/60 dark:text-lime-200/50 font-medium mb-3">{badge.desc}</div>
                
                {!isUnlocked && (
                  <div className="w-full mt-auto">
                    <div className="h-1.5 w-full bg-lime-500/10 rounded-full overflow-hidden">
                      <div className="h-full bg-lime-500 rounded-full" style={{ width: `${pct}%` }} />
                    </div>
                    <div className="text-[9px] font-mono text-lime-700 dark:text-lime-400 mt-1">
                      {progress} / {badge.goal}
                    </div>
                  </div>
                )}

                {/* Claim Button for completed but unclaimed badges */}
                {isUnlocked && !mockUserState.claimedBadges.includes(`badge:${badge.id}`) && (
                  <button 
                    onClick={() => handleClaim(badge.id)}
                    className="mt-3 w-full py-1.5 bg-lime-600 text-white rounded-lg text-xs font-bold hover:bg-lime-700 transition-colors"
                  >
                    Claim
                  </button>
                )}
              </motion.div>
            );
          })}
        </AnimatePresence>
      </div>
    </div>
  );
}