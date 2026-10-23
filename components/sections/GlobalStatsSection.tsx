"use client";

import { m, useInView, Variants } from "framer-motion";
import { useRef, useState, useEffect } from "react";
import { LineChart, Users, Globe } from "lucide-react";

const AnimatedCounter = ({ value, duration = 2 }: { value: string, duration?: number }) => {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: "-50px" });
  const [displayValue, setDisplayValue] = useState("0");

  const match = value.match(/^([^\d]*)([\d.]+)(.*)$/);
  const prefix = match ? match[1] : "";
  const numericString = match ? match[2] : "0";
  const suffix = match ? match[3] : value;
  const target = parseFloat(numericString);
  const isDecimal = numericString.includes('.');

  useEffect(() => {
    if (isInView) {
      let startTime: number | null = null;
      const animateCount = (timestamp: number) => {
        if (!startTime) startTime = timestamp;
        const progress = Math.min((timestamp - startTime) / (duration * 1000), 1);
        const easeOut = progress === 1 ? 1 : 1 - Math.pow(2, -10 * progress);
        const current = easeOut * target;
        setDisplayValue(isDecimal ? current.toFixed(1) : Math.floor(current).toString());
        if (progress < 1) requestAnimationFrame(animateCount);
      };
      requestAnimationFrame(animateCount);
    }
  }, [isInView, target, duration, isDecimal]);

  return <span ref={ref}>{prefix}{displayValue}{suffix}</span>;
};

const containerVariants: Variants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { staggerChildren: 0.15, delayChildren: 0.1 } },
};

const itemVariants: Variants = {
  hidden: { opacity: 0, y: 30 },
  visible: { opacity: 1, y: 0, transition: { type: "spring", stiffness: 300, damping: 24 } },
};

export default function GlobalStatsSection() {
  return (
    <m.div 
      variants={containerVariants} 
      initial="hidden" 
      whileInView="visible" 
      viewport={{ once: true }} 
      className="max-w-4xl mx-auto mt-24 justify-between sm:mt-32 grid grid-cols-1 sm:grid-cols-3 gap-8 sm:gap-12 place-items-center relative z-20"
    >
      <m.div variants={itemVariants} className="flex flex-col items-center text-center">
        <div className="w-14 h-14 rounded-full bg-lime-100 dark:bg-lime-900/30 flex items-center justify-center mb-6 text-lime-600 dark:text-lime-400 shadow-sm border border-lime-500/10">
          <LineChart size={28} />
        </div>
        <h3 className="text-4xl md:text-5xl font-extrabold text-lime-950 dark:text-white mb-2 font-mono">
          <AnimatedCounter value="$30B" />
        </h3>
        <p className="text-sm md:text-base font-semibold text-lime-800/60 dark:text-lime-200/50">
          Digital Currency Exchanged
        </p>
      </m.div>
      
      <m.div variants={itemVariants} className="flex flex-col items-center text-center">
        <div className="w-14 h-14 rounded-full bg-lime-100 dark:bg-lime-900/30 flex items-center justify-center mb-6 text-lime-600 dark:text-lime-400 shadow-sm border border-lime-500/10">
          <Users size={28} />
        </div>
        <h3 className="text-4xl md:text-5xl font-extrabold text-lime-950 dark:text-white mb-2 font-mono">
          <AnimatedCounter value="10M+" />
        </h3>
        <p className="text-sm md:text-base font-semibold text-lime-800/60 dark:text-lime-200/50">
          Trusted Wallets Investor
        </p>
      </m.div>
      
      <m.div variants={itemVariants} className="flex flex-col items-center text-center">
        <div className="w-14 h-14 rounded-full bg-lime-100 dark:bg-lime-900/30 flex items-center justify-center mb-6 text-lime-600 dark:text-lime-400 shadow-sm border border-lime-500/10">
          <Globe size={28} />
        </div>
        <h3 className="text-4xl md:text-5xl font-extrabold text-lime-950 dark:text-white mb-2 font-mono">
          <AnimatedCounter value="195" />
        </h3>
        <p className="text-sm md:text-base font-semibold text-lime-800/60 dark:text-lime-200/50">
          Countries Supported
        </p>
      </m.div>
    </m.div>
  );
}