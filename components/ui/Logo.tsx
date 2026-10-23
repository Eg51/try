// components/ui/Logo.tsx
import Link from "next/link";
import { cn } from "@/lib/utils";

interface LogoProps {
  className?: string;
  iconOnly?: boolean;
}

export function Logo({ className, iconOnly = false }: LogoProps) {
  return (
    <Link href="/" className={cn("flex items-center gap-2 group", className)}>
      {/* The Isometric Data Nexus Icon */}
      <div className="relative flex items-center justify-center w-10 h-10 transition-transform duration-300 group-hover:scale-105 group-hover:rotate-3">
        <svg
          viewBox="0 0 100 100"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          className="w-full h-full drop-shadow-[0_0_8px_rgba(163,230,53,0.3)] dark:drop-shadow-[0_0_12px_rgba(163,230,53,0.4)]"
        >
          <defs>
            {/* Main Bright Gradient */}
            <linearGradient id="limeBright" x1="0%" y1="100%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#4d7c0f" /> {/* lime-700 */}
              <stop offset="100%" stopColor="#a3e635" /> {/* lime-400 */}
            </linearGradient>
            
            {/* Dark Tech Gradient */}
            <linearGradient id="limeDark" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#65a30d" /> {/* lime-600 */}
              <stop offset="100%" stopColor="#1a2e05" /> {/* deep forest */}
            </linearGradient>

            {/* Glass Overlay Gradient */}
            <linearGradient id="glass" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="#ecfdf5" stopOpacity="0.4" />
              <stop offset="100%" stopColor="#ecfdf5" stopOpacity="0.0" />
            </linearGradient>

            <filter id="glowNode" x="-50%" y="-50%" width="200%" height="200%">
              <feGaussianBlur stdDeviation="2" result="blur" />
              <feComposite in="SourceGraphic" in2="blur" operator="over" />
            </filter>
          </defs>

          {/* 1. The Isometric Hex Base (Tech/Blockchain) */}
          <path d="M50 5 L93 30 L93 70 L50 95 L7 70 L7 30 Z" stroke="url(#limeDark)" strokeWidth="2" fill="none" opacity="0.3" />
          <path d="M50 15 L83 35 L83 65 L50 85 L17 65 L17 35 Z" stroke="url(#limeBright)" strokeWidth="1" fill="none" opacity="0.5" />

          {/* 2. The Candlestick Shards (Trading/Volatility) */}
          {/* Left Shard */}
          <path d="M25 60 L40 70 L40 90 L25 80 Z" fill="url(#limeDark)" />
          <path d="M25 60 L40 70 L40 90 L25 80 Z" fill="url(#glass)" />
          
          {/* Right Shard */}
          <path d="M75 40 L60 50 L60 80 L75 70 Z" fill="url(#limeDark)" />
          <path d="M75 40 L60 50 L60 80 L75 70 Z" fill="url(#glass)" />

          {/* Central Rising Shard (The Trend) */}
          <path d="M50 20 L65 45 L50 65 L35 45 Z" fill="url(#limeBright)" />
          <path d="M50 20 L65 45 L50 65 L35 45 Z" fill="url(#glass)" opacity="0.6" />
          
          {/* 3. Circuit Nodes & Data Traces */}
          {/* Horizontal Tech Line */}
          <path d="M10 50 L30 50 L35 45" stroke="#a3e635" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
          <path d="M90 50 L70 50 L65 55" stroke="#a3e635" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
          
          {/* Vertical Data Trace */}
          <path d="M50 90 L50 75" stroke="#a3e635" strokeWidth="2" strokeLinecap="round" />
          
          {/* Glowing Nodes */}
          <circle cx="50" cy="20" r="4" fill="#ecfdf5" filter="url(#glowNode)" />
          <circle cx="35" cy="45" r="3" fill="#a3e635" />
          <circle cx="65" cy="55" r="3" fill="#a3e635" />
          <circle cx="10" cy="50" r="2" fill="#a3e635" opacity="0.7" />
          <circle cx="90" cy="50" r="2" fill="#a3e635" opacity="0.7" />

          {/* Central Pulsing Core */}
          <circle cx="50" cy="45" r="6" fill="#a3e635" opacity="0.8" filter="url(#glowNode)" />
          <circle cx="50" cy="45" r="2" fill="#ecfdf5" />
        </svg>
      </div>

      {/* The Typography */}
      {!iconOnly && (
        <div className="flex flex-col justify-center">
          <span className="text-lime-950 dark:text-[#ecfdf5] font-extrabold text-xl tracking-tighter leading-none">
            QUANTIX
          </span>
          <span className="text-lime-700/60 dark:text-lime-300/60 text-[10px] font-mono font-bold tracking-[0.2em] mt-0.5">
            SOLARIS
          </span>
        </div>
      )}
    </Link>
  );
}