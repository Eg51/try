// app/not-found.tsx
"use client";

import { useEffect, useRef } from "react";
import { useRouter } from "next/navigation"; // 👈 Imported useRouter
import Link from "next/link";
import { ArrowLeft, Home, Compass } from "lucide-react";

const WATERMARK_SYMBOLS = [
  "$", "€", "£", "¥", "₦", "₹", "₩", "₪", "₫", "₴", "₭", "₮", "₱", "฿", "₲", "₵", "₡", "₸", "₼", "₾", "֏", "؋", "৳", "៛", "₥", "₣", "₤", "₧", "₯", "₰", "₳", "₢", "₠", "₨", "₶", "₷", "₺", "₻", "₽", "₿", "C$", "A$", "R$", "S$", "HK$", "NT$", "NZ$", "CHF", "kr", "zł", "Kč", "Ft", "lei", "₤", "₦", "₱", "₲", "₵", "₡", "₸",
  "Ξ", "Ð", "Ł", "Ƀ", "ȿ", "Μ", "◎", "Ꞩ", "✕", "ⓩ", "⧫", "Ɖ", "ɱ", "Ꝟ", "Ꝑ", "Ⓝ", "Ⓞ", "Ⓣ", "Ⓡ", "Ⓢ", "Ⓤ", "Ⓐ", "Ⓥ", "Ⓔ", "Ⓛ", "Ⓜ", "Ⓟ", "Ⓠ", "Ⓦ", "Ⓧ", "Ⓨ", "Ⓩ", "⓪", "①", "②", "③", "④", "⑤", "⑥", "⑦", "⑧", "⑨", "⑩", "♦", "◈", "⬡", "⬢", "◊", "⟁", "⧉", "⧈", "⌬", "⎔", "⏣", "⏥", "⏦",
  "🐕", "🐶", "🐱", "🐸", "🐵", "🦍", "🦊", "🐺", "🐻", "🐼", "🐨", "🐷", "🐮", "🐔", "🐧", "🦅", "🦄", "🐳", "🐋", "🦈", "🐙", "🦑", "🦀", "🦞", "🦐", "🐡", "🐠", "🐟", "🌙", "🚀", "💎", "🙌", "🔥", "🚀", "🌕", "⭐", "🌟", "✨", "⚡", "💥", "💫", "🪙", "💰", "💸", "💵", "💴", "💶", "💷", "🪙"
];

export default function NotFound() {
  const router = useRouter(); // 👈 Initialized router
  const containerRef = useRef<HTMLDivElement>(null);
  const elementsRef = useRef<(HTMLDivElement | null)[]>([]);

  useEffect(() => {
    if (!containerRef.current) return;
    
    const isMobile = window.innerWidth < 768;
    const count = isMobile ? 25 : 60;
    const baseSpeed = isMobile ? 40 : 100;

    const particles: { x: number; y: number; vx: number; vy: number; rot: number; vrot: number; el: HTMLDivElement; }[] = [];
    let width = window.innerWidth;
    let height = window.innerHeight;

    for (let i = 0; i < count; i++) {
      const el = elementsRef.current[i];
      if (!el) continue;
      el.style.opacity = "1";
      particles.push({
        x: Math.random() * width,
        y: Math.random() * height,
        vx: (Math.random() - 0.5) * baseSpeed,
        vy: (Math.random() - 0.5) * baseSpeed,
        rot: Math.random() * 360,
        vrot: (Math.random() - 0.5) * 20,
        el,
      });
    }

    let animationFrameId: number;
    let lastTime = performance.now();
    const radius = isMobile ? 45 : 35;

    const update = (time: number) => {
      const delta = Math.min(time - lastTime, 50) / 1000; 
      lastTime = time;

      for (let i = 0; i < particles.length; i++) {
        const p = particles[i];
        p.x += p.vx * delta;
        p.y += p.vy * delta;
        p.rot += p.vrot * delta;

        if (p.x < -radius) { p.x = -radius; p.vx *= -1; }
        if (p.x > width - radius) { p.x = width - radius; p.vx *= -1; }
        if (p.y < -radius) { p.y = -radius; p.vy *= -1; }
        if (p.y > height - radius) { p.y = height - radius; p.vy *= -1; }

        for (let j = i + 1; j < particles.length; j++) {
          const p2 = particles[j];
          const dx = p.x - p2.x;
          const dy = p.y - p2.y;
          const distSq = dx * dx + dy * dy;
          const minDist = radius * 2;

          if (distSq < minDist * minDist && distSq > 0) {
            const dist = Math.sqrt(distSq);
            const angle = Math.atan2(dy, dx);
            const overlap = minDist - dist;
            
            p.x += Math.cos(angle) * overlap * 0.5;
            p.y += Math.sin(angle) * overlap * 0.5;
            p2.x -= Math.cos(angle) * overlap * 0.5;
            p2.y -= Math.sin(angle) * overlap * 0.5;

            const p1vx = p.vx, p1vy = p.vy;
            p.vx = p2.vx; p.vy = p2.vy;
            p2.vx = p1vx; p2.vy = p1vy;

            p.vrot = (Math.random() - 0.5) * 30;
            p2.vrot = (Math.random() - 0.5) * 30;
          }
        }
        p.el.style.transform = `translate3d(calc(${p.x}px - 50%), calc(${p.y}px - 50%), 0) rotate(${p.rot}deg)`;
      }
      animationFrameId = requestAnimationFrame(update);
    };

    const handleResize = () => {
      width = window.innerWidth;
      height = window.innerHeight;
    };
    window.addEventListener('resize', handleResize);
    animationFrameId = requestAnimationFrame(update);

    return () => {
      cancelAnimationFrame(animationFrameId);
      window.removeEventListener('resize', handleResize);
    };
  }, []);

  // 👇 The "Go Back" Logic with Fallback
  const handleGoBack = () => {
    if (window.history.length > 1) {
      router.back(); // Go to previous page
    } else {
      router.push("/"); // Fallback: If no history, go home
    }
  };

  return (
    <div className="relative min-h-[100dvh] flex flex-col items-center justify-center font-sans bg-[#f0fdf4] dark:bg-[#050806] overflow-hidden px-4 transition-colors duration-300">
      
      {/* BACKGROUND WATERMARKS */}
      <div ref={containerRef} className="fixed inset-0 w-full h-full overflow-hidden pointer-events-none select-none z-0">
        {Array.from({ length: 60 }).map((_, i) => (
          <div
            key={i}
            ref={(el) => { elementsRef.current[i] = el; }}
            className={`absolute top-0 left-0 text-2xl md:text-4xl lg:text-5xl font-extrabold text-lime-900/[0.12] dark:text-lime-400/[0.08] select-none will-change-transform ${i >= 25 ? 'hidden md:block' : 'block'}`}
            style={{ opacity: 0 }}
          >
            {WATERMARK_SYMBOLS[i % WATERMARK_SYMBOLS.length]}
          </div>
        ))}
        <div className="absolute inset-0 z-10 bg-[#f0fdf4] dark:bg-[#050806] [mask-image:radial-gradient(ellipse_at_center,black_20%,transparent_80%)]"></div>
      </div>

      {/* AURORA GLOWS */}
      <div className="fixed top-[-10%] left-[-10%] w-[60%] md:w-[40%] h-[40%] bg-lime-300/40 dark:bg-lime-900/10 blur-[120px] rounded-full pointer-events-none z-0"></div>
      <div className="fixed bottom-[-10%] right-[-10%] w-[60%] md:w-[40%] h-[40%] bg-green-300/30 dark:bg-green-900/10 blur-[120px] rounded-full pointer-events-none z-0"></div>

      {/* GLASS CARD */}
      <div className="relative z-10 w-[92%] sm:w-full max-w-md p-6 sm:p-8 bg-[#f4fbf5]/90 dark:bg-[#0a0f0b]/90 backdrop-blur-2xl border border-lime-500/20 dark:border-lime-500/10 rounded-3xl shadow-[0_8px_32px_0_rgba(132,204,22,0.15)] dark:shadow-[0_8px_32px_0_rgba(0,0,0,0.5)] text-center space-y-6">
        
        <div className="w-16 h-16 sm:w-20 sm:h-20 mx-auto bg-lime-100 dark:bg-lime-900/30 rounded-2xl flex items-center justify-center shadow-inner">
          <Compass className="text-lime-600 dark:text-lime-400" size={32} />
        </div>

        <div>
          <h1 className="text-5xl sm:text-6xl font-extrabold font-mono text-lime-950 dark:text-white tracking-tight mb-2">
            404
          </h1>
          <h2 className="text-lg sm:text-xl font-bold text-lime-950 dark:text-white mb-2">
            Page Not Found
          </h2>
          <p className="text-xs sm:text-sm text-lime-800/70 dark:text-lime-200/50 font-medium px-2">
            The page you&apos;re looking for doesn&apos;t exist or has been moved.
          </p>
        </div>

        <div className="flex flex-col gap-3 pt-2">
          <Link
            href="/dashboard"
            className="w-full flex items-center justify-center gap-2 bg-lime-600 hover:bg-lime-700 text-white font-bold h-12 rounded-xl shadow-lg shadow-lime-600/20 transition-all active:scale-95 text-sm sm:text-base"
          >
            <Home size={18} /> Go to Dashboard
          </Link>
          
          {/* 👇 CHANGED TO BUTTON WITH FALLBACK */}
          <button
            onClick={handleGoBack}
            className="w-full flex items-center justify-center gap-2 border border-lime-500/30 dark:border-lime-500/20 bg-[#f4fbf5]/50 dark:bg-[#050806] hover:bg-white dark:hover:bg-[#121A14] text-lime-950 dark:text-white font-bold h-11 rounded-xl transition-all active:scale-95 text-sm sm:text-base cursor-pointer"
          >
            <ArrowLeft size={18} /> Go Back
          </button>
        </div>

      </div>
    </div>
  );
}