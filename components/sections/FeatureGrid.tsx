"use client";

import Link from "next/link";
import { m } from "framer-motion";
import { Zap, TrendingUp, Fingerprint, ArrowRight } from "lucide-react";
import { containerVariants, itemVariants, cardHoverVariants } from "@/lib/animations";

function FeatureCard({ icon, title, description, bgClass }: { icon: React.ReactNode, title: string, description: string, bgClass: string }) {
  return (
    <m.div variants={itemVariants} whileHover="hover" initial="initial" className="relative z-20">
      <m.div variants={cardHoverVariants} className="p-6 sm:p-8 h-full rounded-3xl bg-white/60 dark:bg-[#0a0f0b]/60 backdrop-blur-xl border border-lime-500/20 dark:border-lime-500/10 hover:border-lime-500/50 dark:hover:border-lime-500/30 transition-colors duration-300 shadow-[0_8px_32px_0_rgba(132,204,22,0.05)] dark:shadow-[0_8px_32px_0_rgba(0,0,0,0.5)] group">
        <m.div whileHover={{ rotate: 10, scale: 1.1 }} transition={{ type: "spring", stiffness: 300 }} className={`w-12 h-12 sm:w-14 sm:h-14 rounded-2xl flex items-center justify-center mb-4 sm:mb-6 ${bgClass} transition-transform duration-300`}>
          {icon}
        </m.div>
        <h3 className="text-lg sm:text-xl font-bold text-lime-950 dark:text-[#ecfdf5] mb-2 sm:mb-3">{title}</h3>
        <p className="text-sm sm:text-base text-lime-800/70 dark:text-lime-200/60 leading-relaxed font-medium">{description}</p>
      </m.div>
    </m.div>
  );
}

function StepCard({ num, title, desc }: { num: string, title: string, desc: string }) {
  return (
    <m.div variants={itemVariants} whileHover={{ x: 8 }} transition={{ type: "spring", stiffness: 300 }} className="flex items-start gap-4 sm:gap-6 p-5 sm:p-6 rounded-2xl bg-white/40 dark:bg-[#0a0f0b]/40 backdrop-blur-md border border-lime-500/10 relative z-20 cursor-default">
      <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-lime-600 text-white font-bold text-lg sm:text-xl flex items-center justify-center shrink-0 shadow-lg shadow-lime-600/30">{num}</div>
      <div>
        <h4 className="text-lg sm:text-xl font-bold text-lime-950 dark:text-[#ecfdf5] mb-1 sm:mb-2">{title}</h4>
        <p className="text-sm sm:text-base text-lime-800/70 dark:text-lime-200/60 font-medium leading-relaxed">{desc}</p>
      </div>
    </m.div>
  );
}

export default function FeatureGrid() {
  return (
    <>
      <m.div variants={containerVariants} initial="hidden" whileInView="visible" viewport={{ once: true, margin: "-100px" }} id="features" className="max-w-6xl mx-auto mt-24 sm:mt-32 grid grid-cols-1 md:grid-cols-3 gap-4 sm:gap-6 relative z-20">
        <FeatureCard icon={<Zap className="text-lime-600 dark:text-lime-400" size={24} />} title="Gamified Progression" description="Complete daily tasks, verify your identity, and earn XP to automatically upgrade your trading tier and unlock new asset classes." bgClass="bg-lime-100 dark:bg-lime-900/30" />
        <FeatureCard icon={<TrendingUp className="text-green-600 dark:text-green-400" size={24} />} title="Double-Entry Ledger" description="Institutional-grade financial architecture. Every single trade is cryptographically audited, balanced to zero, and instantly settled." bgClass="bg-green-100 dark:bg-green-900/30" />
        <FeatureCard icon={<Fingerprint className="text-emerald-600 dark:text-emerald-400" size={24} />} title="Biometric Security" description="Log in seamlessly with FaceID, TouchID, or Windows Hello. Your private keys never leave your device thanks to WebAuthn." bgClass="bg-emerald-100 dark:bg-emerald-900/30" />
      </m.div>

      <m.div variants={containerVariants} initial="hidden" whileInView="visible" viewport={{ once: true, margin: "-100px" }} id="how-it-works" className="max-w-4xl mx-auto mt-24 sm:mt-32 relative z-20">
        <m.div variants={itemVariants} className="text-center mb-10 sm:mb-12">
          <h2 className="text-2xl sm:text-3xl font-extrabold text-lime-950 dark:text-[#ecfdf5]">How It Works</h2>
          <p className="text-sm sm:text-base text-lime-800/70 dark:text-lime-200/60 mt-2">Start trading in three simple steps.</p>
        </m.div>
        <div className="space-y-4 sm:space-y-6">
          <StepCard num="1" title="Create Your Account" desc="Sign up with Email, Google, or a Passkey. You start at Tier 1 with access to local commodities." />
          <StepCard num="2" title="Complete Tasks & Earn XP" desc="Make your first trade, invite friends, and complete your profile to earn XP and level up your account." />
          <StepCard num="3" title="Unlock Global Markets" desc="Reach Tier 2 to unlock Crypto and Meme coins. Reach Tier 3 to unlock Forex and institutional trading limits." />
        </div>
      </m.div>

      <m.div initial={{ opacity: 0, y: 40 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.6 }} className="max-w-6xl mx-auto mt-24 sm:mt-32 bg-lime-600 rounded-3xl p-8 sm:p-12 relative overflow-hidden flex flex-col md:flex-row items-center justify-between gap-8 shadow-2xl shadow-lime-600/20 z-20">
        <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/3 pointer-events-none"></div>
        <div className="absolute bottom-0 left-0 w-48 h-48 bg-black/10 rounded-full blur-2xl translate-y-1/3 -translate-x-1/4 pointer-events-none"></div>
        <div className="relative z-10 max-w-md text-center md:text-left">
          <h2 className="text-3xl sm:text-4xl font-extrabold text-white mb-2 tracking-tight">Start mining now</h2>
          <p className="text-sm sm:text-base text-lime-50 font-medium">Join now with Quantix Solaris to get the latest news and start mining now.</p>
        </div>
        <div className="relative z-10 w-full md:w-auto flex flex-col sm:flex-row gap-3">
          <input type="email" placeholder="Enter your email" className="w-full sm:w-64 bg-transparent border-b-2 border-white/50 text-white placeholder-white/60 px-2 py-2 focus:outline-none focus:border-white transition-colors" />
          <button className="bg-white text-lime-950 px-8 py-2.5 rounded-xl font-bold hover:bg-lime-50 transition-colors shadow-lg">Subscribe</button>
        </div>
      </m.div>

      <m.div initial={{ opacity: 0, scale: 0.95, y: 40 }} whileInView={{ opacity: 1, scale: 1, y: 0 }} viewport={{ once: true, margin: "-100px" }} transition={{ duration: 0.6, type: "spring", stiffness: 200, damping: 20 }} className="max-w-4xl mx-auto mt-24 sm:mt-32 text-center bg-lime-600/10 dark:bg-lime-900/20 border border-lime-500/30 rounded-3xl p-8 sm:p-12 backdrop-blur-md shadow-2xl relative z-20">
        <h2 className="text-2xl sm:text-3xl md:text-4xl font-extrabold text-lime-950 dark:text-[#ecfdf5] mb-4">Ready to upgrade your trading?</h2>
        <p className="text-sm sm:text-base text-lime-800/80 dark:text-lime-200/60 mb-6 sm:mb-8 max-w-xl mx-auto">Join thousands of traders utilizing our double-entry ledger and gamified rewards system.</p>
        <Link href="/login" className="inline-flex items-center justify-center gap-2 bg-lime-600 text-white px-6 sm:px-8 py-3.5 sm:py-4 rounded-xl text-base sm:text-lg font-bold hover:bg-lime-700 transition-all shadow-lg shadow-lime-600/30 hover:scale-105">Create Free Account <ArrowRight size={20} /></Link>
      </m.div>
    </>
  );
}
// "use client";

// import Link from "next/link";
// import { m, Variants } from "framer-motion";
// import { Zap, TrendingUp, Fingerprint, ArrowRight } from "lucide-react";


// const containerVariants: Variants = {
//   hidden: { opacity: 0 },
//   visible: { opacity: 1, transition: { staggerChildren: 0.15, delayChildren: 0.1 } },
// };

// const itemVariants: Variants = {
//   hidden: { opacity: 0, y: 30 },
//   visible: { opacity: 1, y: 0, transition: { type: "spring", stiffness: 300, damping: 24 } },
// };

// const cardHoverVariants: Variants = {
//   initial: { y: 0, scale: 1 },
//   hover: { y: -8, scale: 1.02, transition: { type: "spring", stiffness: 400, damping: 10 } }
// };

// function FeatureCard({ icon, title, description, bgClass }: { icon: React.ReactNode, title: string, description: string, bgClass: string }) {
//   return (
//     <m.div variants={itemVariants} whileHover="hover" initial="initial" className="relative z-20">
//       <m.div variants={cardHoverVariants} className="p-6 sm:p-8 h-full rounded-3xl bg-white/60 dark:bg-[#0a0f0b]/60 backdrop-blur-xl border border-lime-500/20 dark:border-lime-500/10 hover:border-lime-500/50 dark:hover:border-lime-500/30 transition-colors duration-300 shadow-[0_8px_32px_0_rgba(132,204,22,0.05)] dark:shadow-[0_8px_32px_0_rgba(0,0,0,0.5)] group">
//         <m.div whileHover={{ rotate: 10, scale: 1.1 }} transition={{ type: "spring", stiffness: 300 }} className={`w-12 h-12 sm:w-14 sm:h-14 rounded-2xl flex items-center justify-center mb-4 sm:mb-6 ${bgClass} transition-transform duration-300`}>
//           {icon}
//         </m.div>
//         <h3 className="text-lg sm:text-xl font-bold text-lime-950 dark:text-[#ecfdf5] mb-2 sm:mb-3">{title}</h3>
//         <p className="text-sm sm:text-base text-lime-800/70 dark:text-lime-200/60 leading-relaxed font-medium">{description}</p>
//       </m.div>
//     </m.div>
//   );
// }

// function StepCard({ num, title, desc }: { num: string, title: string, desc: string }) {
//   return (
//     <m.div variants={itemVariants} whileHover={{ x: 8 }} transition={{ type: "spring", stiffness: 300 }} className="flex items-start gap-4 sm:gap-6 p-5 sm:p-6 rounded-2xl bg-white/40 dark:bg-[#0a0f0b]/40 backdrop-blur-md border border-lime-500/10 relative z-20 cursor-default">
//       <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-lime-600 text-white font-bold text-lg sm:text-xl flex items-center justify-center shrink-0 shadow-lg shadow-lime-600/30">{num}</div>
//       <div>
//         <h4 className="text-lg sm:text-xl font-bold text-lime-950 dark:text-[#ecfdf5] mb-1 sm:mb-2">{title}</h4>
//         <p className="text-sm sm:text-base text-lime-800/70 dark:text-lime-200/60 font-medium leading-relaxed">{desc}</p>
//       </div>
//     </m.div>
//   );
// }

// export default function FeatureGrid() {
//   return (
//     <>
//       <m.div variants={containerVariants} initial="hidden" whileInView="visible" viewport={{ once: true, margin: "-100px" }} id="features" className="max-w-6xl mx-auto mt-24 sm:mt-32 grid grid-cols-1 md:grid-cols-3 gap-4 sm:gap-6 relative z-20">
//         <FeatureCard icon={<Zap className="text-lime-600 dark:text-lime-400" size={24} />} title="Gamified Progression" description="Complete daily tasks, verify your identity, and earn XP to automatically upgrade your trading tier and unlock new asset classes." bgClass="bg-lime-100 dark:bg-lime-900/30" />
//         <FeatureCard icon={<TrendingUp className="text-green-600 dark:text-green-400" size={24} />} title="Double-Entry Ledger" description="Institutional-grade financial architecture. Every single trade is cryptographically audited, balanced to zero, and instantly settled." bgClass="bg-green-100 dark:bg-green-900/30" />
//         <FeatureCard icon={<Fingerprint className="text-emerald-600 dark:text-emerald-400" size={24} />} title="Biometric Security" description="Log in seamlessly with FaceID, TouchID, or Windows Hello. Your private keys never leave your device thanks to WebAuthn." bgClass="bg-emerald-100 dark:bg-emerald-900/30" />
//       </m.div>

//       <m.div variants={containerVariants} initial="hidden" whileInView="visible" viewport={{ once: true, margin: "-100px" }} id="how-it-works" className="max-w-4xl mx-auto mt-24 sm:mt-32 relative z-20">
//         <m.div variants={itemVariants} className="text-center mb-10 sm:mb-12">
//           <h2 className="text-2xl sm:text-3xl font-extrabold text-lime-950 dark:text-[#ecfdf5]">How It Works</h2>
//           <p className="text-sm sm:text-base text-lime-800/70 dark:text-lime-200/60 mt-2">Start trading in three simple steps.</p>
//         </m.div>
//         <div className="space-y-4 sm:space-y-6">
//           <StepCard num="1" title="Create Your Account" desc="Sign up with Email, Google, or a Passkey. You start at Tier 1 with access to local commodities." />
//           <StepCard num="2" title="Complete Tasks & Earn XP" desc="Make your first trade, invite friends, and complete your profile to earn XP and level up your account." />
//           <StepCard num="3" title="Unlock Global Markets" desc="Reach Tier 2 to unlock Crypto and Meme coins. Reach Tier 3 to unlock Forex and institutional trading limits." />
//         </div>
//       </m.div>

//       <m.div initial={{ opacity: 0, y: 40 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.6 }} className="max-w-6xl mx-auto mt-24 sm:mt-32 bg-lime-600 rounded-3xl p-8 sm:p-12 relative overflow-hidden flex flex-col md:flex-row items-center justify-between gap-8 shadow-2xl shadow-lime-600/20 z-20">
//         <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/3 pointer-events-none"></div>
//         <div className="absolute bottom-0 left-0 w-48 h-48 bg-black/10 rounded-full blur-2xl translate-y-1/3 -translate-x-1/4 pointer-events-none"></div>
//         <div className="relative z-10 max-w-md text-center md:text-left">
//           <h2 className="text-3xl sm:text-4xl font-extrabold text-white mb-2 tracking-tight">Start mining now</h2>
//           <p className="text-sm sm:text-base text-lime-50 font-medium">Join now with Quantix Solaris to get the latest news and start mining now.</p>
//         </div>
//         <div className="relative z-10 w-full md:w-auto flex flex-col sm:flex-row gap-3">
//           <input type="email" placeholder="Enter your email" className="w-full sm:w-64 bg-transparent border-b-2 border-white/50 text-white placeholder-white/60 px-2 py-2 focus:outline-none focus:border-white transition-colors" />
//           <button className="bg-white text-lime-950 px-8 py-2.5 rounded-xl font-bold hover:bg-lime-50 transition-colors shadow-lg">Subscribe</button>
//         </div>
//       </m.div>

//       <m.div initial={{ opacity: 0, scale: 0.95, y: 40 }} whileInView={{ opacity: 1, scale: 1, y: 0 }} viewport={{ once: true, margin: "-100px" }} transition={{ duration: 0.6, type: "spring", stiffness: 200, damping: 20 }} className="max-w-4xl mx-auto mt-24 sm:mt-32 text-center bg-lime-600/10 dark:bg-lime-900/20 border border-lime-500/30 rounded-3xl p-8 sm:p-12 backdrop-blur-md shadow-2xl relative z-20">
//         <h2 className="text-2xl sm:text-3xl md:text-4xl font-extrabold text-lime-950 dark:text-[#ecfdf5] mb-4">Ready to upgrade your trading?</h2>
//         <p className="text-sm sm:text-base text-lime-800/80 dark:text-lime-200/60 mb-6 sm:mb-8 max-w-xl mx-auto">Join thousands of traders utilizing our double-entry ledger and gamified rewards system.</p>
//         <Link href="/login" className="inline-flex items-center justify-center gap-2 bg-lime-600 text-white px-6 sm:px-8 py-3.5 sm:py-4 rounded-xl text-base sm:text-lg font-bold hover:bg-lime-700 transition-all shadow-lg shadow-lime-600/30 hover:scale-105">Create Free Account <ArrowRight size={20} /></Link>
//       </m.div>
//     </>
//   );
// }