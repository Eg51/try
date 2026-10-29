// components/WatermarkBackground.tsx
"use client";

import { useEffect, useRef } from "react";

const WATERMARK_SYMBOLS = [
  "$", "€", "£", "¥", "₦", "₹", "₿", "Ξ", "Ð", "Ł", "₮", "₳", "₱", "₩", "₪", "₫", "₴", "₭", "₮", "₯",
  "🐕", "🐶", "🐱", "🐸", "🐵", "🦍", "🦊", "🐺", "🐻", "🐼", "🐨", "🐷", "🐮", "🐔", "🐧", "🦅", "🦄", "🐳", "🐋", "🦈",
  "🌙", "🚀", "💎", "🙌", "🔥", "🚀", "🌕", "⭐", "🌟", "✨", "⚡", "💥", "💫", "🪙", "💰", "💸", "💵"
];

export default function WatermarkBackground() {
  const containerRef = useRef<HTMLDivElement>(null);
  const elementsRef = useRef<(HTMLDivElement | null)[]>([]);

  useEffect(() => {
    if (!containerRef.current) return;
    const isMobile = window.innerWidth < 768;
    const count = isMobile ? 25 : 50; 
    const baseSpeed = isMobile ? 40 : 80; 
    const radius = isMobile ? 45 : 35; 

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

    const update = (time: number) => {
      const delta = Math.min(time - lastTime, 50) / 1000; 
      lastTime = time;

      for (let i = 0; i < particles.length; i++) {
        const p = particles[i];
        p.x += p.vx * delta;
        p.y += p.vy * delta;
        p.rot += p.vrot * delta;

        if (p.x < radius) { p.x = radius; p.vx *= -1; }
        if (p.x > width - radius) { p.x = width - radius; p.vx *= -1; }
        if (p.y < radius) { p.y = radius; p.vy *= -1; }
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
          }
        }
        p.el.style.transform = `translate3d(calc(${p.x}px - 50%), calc(${p.y}px - 50%), 0) rotate(${p.rot}deg)`;
      }
      animationFrameId = requestAnimationFrame(update);
    };

    const handleResize = () => { width = window.innerWidth; height = window.innerHeight; };
    window.addEventListener('resize', handleResize);
    animationFrameId = requestAnimationFrame(update);

    return () => {
      cancelAnimationFrame(animationFrameId);
      window.removeEventListener('resize', handleResize);
    };
  }, []);

  return (
    <div ref={containerRef} className="fixed inset-0 w-full h-full overflow-hidden pointer-events-none select-none z-0">
      {Array.from({ length: 50 }).map((_, i) => (
        <div
          key={i}
          ref={(el) => { elementsRef.current[i] = el; }}
          className={`absolute top-0 left-0 text-4xl lg:text-6xl font-extrabold text-lime-900/[0.08] dark:text-lime-400/[0.05] select-none will-change-transform ${i >= 25 ? 'hidden md:block' : 'block'}`}
          style={{ opacity: 0 }}
        >
          {WATERMARK_SYMBOLS[i % WATERMARK_SYMBOLS.length]}
        </div>
      ))}
      <div className="absolute inset-0 z-10 bg-[#f0fdf4] dark:bg-[#050806] [mask-image:radial-gradient(ellipse_at_center,transparent_30%,black_80%)]"></div>
    </div>
  );
}