"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { Zap, TrendingUp, Fingerprint, ArrowRight, Loader2, CheckCircle2, XCircle } from "lucide-react";
import { containerVariants, itemVariants, cardHoverVariants } from "@/lib/animations";
import { useTranslations } from "next-intl";
import { useState } from "react";
import { subscribeNewsletterAction } from "@/app/actions/newsletter";

function FeatureCard({ icon, title, description, bgClass }: { icon: React.ReactNode, title: string, description: string, bgClass: string }) {
  return (
    <motion.div variants={itemVariants} whileHover="hover" initial="initial" className="relative z-20">
      <motion.div variants={cardHoverVariants} className="p-6 sm:p-8 h-full rounded-3xl bg-white/60 dark:bg-[#0a0f0b]/60 backdrop-blur-xl border border-lime-500/20 dark:border-lime-500/10 hover:border-lime-500/50 dark:hover:border-lime-500/30 transition-colors duration-300 shadow-[0_8px_32px_0_rgba(132,204,22,0.05)] dark:shadow-[0_8px_32px_0_rgba(0,0,0,0.5)] group">
        <motion.div whileHover={{ rotate: 10, scale: 1.1 }} transition={{ type: "spring", stiffness: 300 }} className={`w-12 h-12 sm:w-14 sm:h-14 rounded-2xl flex items-center justify-center mb-4 sm:mb-6 ${bgClass} transition-transform duration-300`}>
          {icon}
        </motion.div>
        <h3 className="text-lg sm:text-xl font-bold text-lime-950 dark:text-[#ecfdf5] mb-2 sm:mb-3">{title}</h3>
        <p className="text-sm sm:text-base text-lime-800/70 dark:text-lime-200/60 leading-relaxed font-medium">{description}</p>
      </motion.div>
    </motion.div>
  );
}

function StepCard({ num, title, desc }: { num: string, title: string, desc: string }) {
  return (
    <motion.div variants={itemVariants} whileHover={{ x: 8 }} transition={{ type: "spring", stiffness: 300 }} className="flex items-start gap-4 sm:gap-6 p-5 sm:p-6 rounded-2xl bg-white/40 dark:bg-[#0a0f0b]/40 backdrop-blur-md border border-lime-500/10 relative z-20 cursor-default">
      <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-lime-600 text-white font-bold text-lg sm:text-xl flex items-center justify-center shrink-0 shadow-lg shadow-lime-600/30">{num}</div>
      <div>
        <h4 className="text-lg sm:text-xl font-bold text-lime-950 dark:text-[#ecfdf5] mb-1 sm:mb-2">{title}</h4>
        <p className="text-sm sm:text-base text-lime-800/70 dark:text-lime-200/60 font-medium leading-relaxed">{desc}</p>
      </div>
    </motion.div>
  );
}

export default function FeatureGrid() {
  const t = useTranslations("FeatureGrid");

  const [email, setEmail] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [status, setStatus] = useState<"idle" | "success" | "error">("idle");
  const [message, setMessage] = useState("");

  const handleSubscribe = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;

    setIsSubmitting(true);
    setStatus("idle");
    setMessage("");

    const res = await subscribeNewsletterAction({ email });
    
    // 👇 FIXED TYPESCRIPT UNION NARROWING
    if (!res.success) {
      setStatus("error");
      setMessage(t(`newsletter.errors.${res.error}`)); 
    } else {
      setStatus("success");
      setMessage(t(`newsletter.messages.${res.message}`));
      setEmail(""); 
    }
    
    setIsSubmitting(false);
  };

  return (
    <>
      <motion.div variants={containerVariants} initial="hidden" whileInView="visible" viewport={{ once: true, margin: "-100px" }} id="features" className="max-w-6xl mx-auto mt-24 sm:mt-32 grid grid-cols-1 md:grid-cols-3 gap-4 sm:gap-6 relative z-20">
        <FeatureCard 
          icon={<Zap className="text-lime-600 dark:text-lime-400" size={24} />} 
          title={t("features.gamifiedTitle")} 
          description={t("features.gamifiedDesc")} 
          bgClass="bg-lime-100 dark:bg-lime-900/30" 
        />
        <FeatureCard 
          icon={<TrendingUp className="text-green-600 dark:text-green-400" size={24} />} 
          title={t("features.ledgerTitle")} 
          description={t("features.ledgerDesc")} 
          bgClass="bg-green-100 dark:bg-green-900/30" 
        />
        <FeatureCard 
          icon={<Fingerprint className="text-emerald-600 dark:text-emerald-400" size={24} />} 
          title={t("features.biometricTitle")} 
          description={t("features.biometricDesc")} 
          bgClass="bg-emerald-100 dark:bg-emerald-900/30" 
        />
      </motion.div>

      <motion.div variants={containerVariants} initial="hidden" whileInView="visible" viewport={{ once: true, margin: "-100px" }} id="how-it-works" className="max-w-4xl mx-auto mt-24 sm:mt-32 relative z-20">
        <motion.div variants={itemVariants} className="text-center mb-10 sm:mb-12">
          <h2 className="text-2xl sm:text-3xl font-extrabold text-lime-950 dark:text-[#ecfdf5]">{t("howItWorks.title")}</h2>
          <p className="text-sm sm:text-base text-lime-800/70 dark:text-lime-200/60 mt-2">{t("howItWorks.subtitle")}</p>
        </motion.div>
        <div className="space-y-4 sm:space-y-6">
          <StepCard num="1" title={t("howItWorks.step1Title")} desc={t("howItWorks.step1Desc")} />
          <StepCard num="2" title={t("howItWorks.step2Title")} desc={t("howItWorks.step2Desc")} />
          <StepCard num="3" title={t("howItWorks.step3Title")} desc={t("howItWorks.step3Desc")} />
        </div>
      </motion.div>

      <motion.div initial={{ opacity: 0, y: 40 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.6 }} className="max-w-6xl mx-auto mt-24 sm:mt-32 bg-lime-600 rounded-3xl p-8 sm:p-12 relative overflow-hidden flex flex-col md:flex-row items-center justify-between gap-8 shadow-2xl shadow-lime-600/20 z-20">
        <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/3 pointer-events-none"></div>
        <div className="absolute bottom-0 left-0 w-48 h-48 bg-black/10 rounded-full blur-2xl translate-y-1/3 -translate-x-1/4 pointer-events-none"></div>
        
        <div className="relative z-10 max-w-md text-center md:text-left">
          <h2 className="text-3xl sm:text-4xl font-extrabold text-white mb-2 tracking-tight">{t("newsletter.title")}</h2>
          <p className="text-sm sm:text-base text-lime-50 font-medium">{t("newsletter.desc")}</p>
        </div>

        <div className="relative z-10 w-full md:w-auto flex flex-col gap-3 min-w-[280px] sm:min-w-[320px]">
          <form onSubmit={handleSubscribe} className="flex flex-col sm:flex-row gap-3 w-full">
            <input 
              type="email" 
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder={t("newsletter.placeholder")} 
              required
              disabled={isSubmitting}
              className="w-full sm:w-64 bg-transparent border-b-2 border-white/50 text-white placeholder-white/60 px-2 py-2 focus:outline-none focus:border-white transition-colors disabled:opacity-50" 
            />
            <button 
              type="submit" 
              disabled={isSubmitting || !email}
              className="bg-white text-lime-950 px-8 py-2.5 rounded-xl font-bold hover:bg-lime-50 transition-colors shadow-lg disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {isSubmitting ? (
                <>
                  <Loader2 size={16} className="animate-spin" />
                  {t("newsletter.subscribing")}
                </>
              ) : (
                t("newsletter.button")
              )}
            </button>
          </form>

          {status !== "idle" && (
            <div className={`flex items-center gap-2 text-sm font-medium ${status === "success" ? "text-green-200" : "text-red-200"}`}>
              {status === "success" ? <CheckCircle2 size={16} /> : <XCircle size={16} />}
              <span>{message}</span>
            </div>
          )}
        </div>
      </motion.div>

      <motion.div initial={{ opacity: 0, scale: 0.95, y: 40 }} whileInView={{ opacity: 1, scale: 1, y: 0 }} viewport={{ once: true, margin: "-100px" }} transition={{ duration: 0.6, type: "spring", stiffness: 200, damping: 20 }} className="max-w-4xl mx-auto mt-24 sm:mt-32 text-center bg-lime-600/10 dark:bg-lime-900/20 border border-lime-500/30 rounded-3xl p-8 sm:p-12 backdrop-blur-md shadow-2xl relative z-20">
        <h2 className="text-2xl sm:text-3xl md:text-4xl font-extrabold text-lime-950 dark:text-[#ecfdf5] mb-4">{t("cta.title")}</h2>
        <p className="text-sm sm:text-base text-lime-800/80 dark:text-lime-200/60 mb-6 sm:mb-8 max-w-xl mx-auto">{t("cta.desc")}</p>
        <Link href="/login" className="inline-flex items-center justify-center gap-2 bg-lime-600 text-white px-6 sm:px-8 py-3.5 sm:py-4 rounded-xl text-base sm:text-lg font-bold hover:bg-lime-700 transition-all shadow-lg shadow-lime-600/30 hover:scale-105">
          {t("cta.button")} <ArrowRight size={20} />
        </Link>
      </motion.div>
    </>
  );
}
// "use client";

// import Link from "next/link";
// import { motion } from "framer-motion";
// import { Zap, TrendingUp, Fingerprint, ArrowRight } from "lucide-react";
// import { containerVariants, itemVariants, cardHoverVariants } from "@/lib/animations";
// import { useTranslations } from "next-intl";

// // 👇 MODIFIED TO ACCEPT TRANSLATIONS CLEANLY
// function FeatureCard({ icon, title, description, bgClass }: { icon: React.ReactNode, title: string, description: string, bgClass: string }) {
//   return (
//     <motion.div variants={itemVariants} whileHover="hover" initial="initial" className="relative z-20">
//       <motion.div variants={cardHoverVariants} className="p-6 sm:p-8 h-full rounded-3xl bg-white/60 dark:bg-[#0a0f0b]/60 backdrop-blur-xl border border-lime-500/20 dark:border-lime-500/10 hover:border-lime-500/50 dark:hover:border-lime-500/30 transition-colors duration-300 shadow-[0_8px_32px_0_rgba(132,204,22,0.05)] dark:shadow-[0_8px_32px_0_rgba(0,0,0,0.5)] group">
//         <motion.div whileHover={{ rotate: 10, scale: 1.1 }} transition={{ type: "spring", stiffness: 300 }} className={`w-12 h-12 sm:w-14 sm:h-14 rounded-2xl flex items-center justify-center mb-4 sm:mb-6 ${bgClass} transition-transform duration-300`}>
//           {icon}
//         </motion.div>
//         <h3 className="text-lg sm:text-xl font-bold text-lime-950 dark:text-[#ecfdf5] mb-2 sm:mb-3">{title}</h3>
//         <p className="text-sm sm:text-base text-lime-800/70 dark:text-lime-200/60 leading-relaxed font-medium">{description}</p>
//       </motion.div>
//     </motion.div>
//   );
// }

// function StepCard({ num, title, desc }: { num: string, title: string, desc: string }) {
//   return (
//     <motion.div variants={itemVariants} whileHover={{ x: 8 }} transition={{ type: "spring", stiffness: 300 }} className="flex items-start gap-4 sm:gap-6 p-5 sm:p-6 rounded-2xl bg-white/40 dark:bg-[#0a0f0b]/40 backdrop-blur-md border border-lime-500/10 relative z-20 cursor-default">
//       <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-lime-600 text-white font-bold text-lg sm:text-xl flex items-center justify-center shrink-0 shadow-lg shadow-lime-600/30">{num}</div>
//       <div>
//         <h4 className="text-lg sm:text-xl font-bold text-lime-950 dark:text-[#ecfdf5] mb-1 sm:mb-2">{title}</h4>
//         <p className="text-sm sm:text-base text-lime-800/70 dark:text-lime-200/60 font-medium leading-relaxed">{desc}</p>
//       </div>
//     </motion.div>
//   );
// }

// export default function FeatureGrid() {
//   const t = useTranslations("FeatureGrid");

//   return (
//     <>
//       <motion.div variants={containerVariants} initial="hidden" whileInView="visible" viewport={{ once: true, margin: "-100px" }} id="features" className="max-w-6xl mx-auto mt-24 sm:mt-32 grid grid-cols-1 md:grid-cols-3 gap-4 sm:gap-6 relative z-20">
//         <FeatureCard 
//           icon={<Zap className="text-lime-600 dark:text-lime-400" size={24} />} 
//           title={t("features.gamifiedTitle")} 
//           description={t("features.gamifiedDesc")} 
//           bgClass="bg-lime-100 dark:bg-lime-900/30" 
//         />
//         <FeatureCard 
//           icon={<TrendingUp className="text-green-600 dark:text-green-400" size={24} />} 
//           title={t("features.ledgerTitle")} 
//           description={t("features.ledgerDesc")} 
//           bgClass="bg-green-100 dark:bg-green-900/30" 
//         />
//         <FeatureCard 
//           icon={<Fingerprint className="text-emerald-600 dark:text-emerald-400" size={24} />} 
//           title={t("features.biometricTitle")} 
//           description={t("features.biometricDesc")} 
//           bgClass="bg-emerald-100 dark:bg-emerald-900/30" 
//         />
//       </motion.div>

//       <motion.div variants={containerVariants} initial="hidden" whileInView="visible" viewport={{ once: true, margin: "-100px" }} id="how-it-works" className="max-w-4xl mx-auto mt-24 sm:mt-32 relative z-20">
//         <motion.div variants={itemVariants} className="text-center mb-10 sm:mb-12">
//           <h2 className="text-2xl sm:text-3xl font-extrabold text-lime-950 dark:text-[#ecfdf5]">{t("howItWorks.title")}</h2>
//           <p className="text-sm sm:text-base text-lime-800/70 dark:text-lime-200/60 mt-2">{t("howItWorks.subtitle")}</p>
//         </motion.div>
//         <div className="space-y-4 sm:space-y-6">
//           <StepCard num="1" title={t("howItWorks.step1Title")} desc={t("howItWorks.step1Desc")} />
//           <StepCard num="2" title={t("howItWorks.step2Title")} desc={t("howItWorks.step2Desc")} />
//           <StepCard num="3" title={t("howItWorks.step3Title")} desc={t("howItWorks.step3Desc")} />
//         </div>
//       </motion.div>

//       <motion.div initial={{ opacity: 0, y: 40 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.6 }} className="max-w-6xl mx-auto mt-24 sm:mt-32 bg-lime-600 rounded-3xl p-8 sm:p-12 relative overflow-hidden flex flex-col md:flex-row items-center justify-between gap-8 shadow-2xl shadow-lime-600/20 z-20">
//         <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/3 pointer-events-none"></div>
//         <div className="absolute bottom-0 left-0 w-48 h-48 bg-black/10 rounded-full blur-2xl translate-y-1/3 -translate-x-1/4 pointer-events-none"></div>
//         <div className="relative z-10 max-w-md text-center md:text-left">
//           <h2 className="text-3xl sm:text-4xl font-extrabold text-white mb-2 tracking-tight">{t("newsletter.title")}</h2>
//           <p className="text-sm sm:text-base text-lime-50 font-medium">{t("newsletter.desc")}</p>
//         </div>
//         <div className="relative z-10 w-full md:w-auto flex flex-col sm:flex-row gap-3">
//           <input type="email" placeholder={t("newsletter.placeholder")} className="w-full sm:w-64 bg-transparent border-b-2 border-white/50 text-white placeholder-white/60 px-2 py-2 focus:outline-none focus:border-white transition-colors" />
//           <button className="bg-white text-lime-950 px-8 py-2.5 rounded-xl font-bold hover:bg-lime-50 transition-colors shadow-lg">{t("newsletter.button")}</button>
//         </div>
//       </motion.div>

//       <motion.div initial={{ opacity: 0, scale: 0.95, y: 40 }} whileInView={{ opacity: 1, scale: 1, y: 0 }} viewport={{ once: true, margin: "-100px" }} transition={{ duration: 0.6, type: "spring", stiffness: 200, damping: 20 }} className="max-w-4xl mx-auto mt-24 sm:mt-32 text-center bg-lime-600/10 dark:bg-lime-900/20 border border-lime-500/30 rounded-3xl p-8 sm:p-12 backdrop-blur-md shadow-2xl relative z-20">
//         <h2 className="text-2xl sm:text-3xl md:text-4xl font-extrabold text-lime-950 dark:text-[#ecfdf5] mb-4">{t("cta.title")}</h2>
//         <p className="text-sm sm:text-base text-lime-800/80 dark:text-lime-200/60 mb-6 sm:mb-8 max-w-xl mx-auto">{t("cta.desc")}</p>
//         <Link href="/login" className="inline-flex items-center justify-center gap-2 bg-lime-600 text-white px-6 sm:px-8 py-3.5 sm:py-4 rounded-xl text-base sm:text-lg font-bold hover:bg-lime-700 transition-all shadow-lg shadow-lime-600/30 hover:scale-105">
//           {t("cta.button")} <ArrowRight size={20} />
//         </Link>
//       </motion.div>
//     </>
//   );
// }