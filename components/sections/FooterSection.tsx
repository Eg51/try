"use client";

import { m } from "framer-motion";
import { useDevModal } from "@/components/providers/DevModalProvider";
import { Logo } from "@/components/ui/Logo";
import { useRouter } from "next/navigation";
import Link from "next/link";

const SocialIcon = ({ name, size = 18 }: { name: string, size?: number }) => {
  const baseClass = "text-lime-800/60 dark:text-lime-200/40 hover:text-lime-600 dark:hover:text-lime-400 transition-colors duration-300";
  switch(name) {
    case 'facebook': return <svg className={baseClass} width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z"/></svg>;
    case 'instagram': return <svg className={baseClass} width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="2" width="20" height="20" rx="5" ry="5"/><path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"/><line x1="17.5" y1="6.5" x2="17.51" y2="6.5"/></svg>;
    case 'youtube': return <svg className={baseClass} width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22.54 6.42a2.78 2.78 0 0 0-1.94-2C18.88 4 12 4 12 4s-6.88 0-8.6.46a2.78 2.78 0 0 0-1.94 2A29 29 0 0 0 1 11.75a29 29 0 0 0 .46 5.33A2.78 2.78 0 0 0 3.4 19c1.72.46 8.6.46 8.6.46s6.88 0 8.6-.46a2.78 2.78 0 0 0 1.94-2 29 29 0 0 0 .46-5.25 29 29 0 0 0-.46-5.33z"/><polygon points="9.75 15.02 15.5 11.75 9.75 8.48 9.75 15.02"/></svg>;
    case 'twitter': return <svg className={baseClass} width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M23 3a10.9 10.9 0 0 1-3.14 1.53 4.48 4.48 0 0 0-7.86 3v1A10.66 10.66 0 0 1 3 4s-4 9 5 13a11.64 11.64 0 0 1-7 2c9 5 20 0 20-11.5a4.5 4.5 0 0 0-.08-.83A7.72 7.72 0 0 0 23 3z"/></svg>;
    case 'linkedin': return <svg className={baseClass} width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-2-2 2 2 0 0 0-2 2v7h-4v-7a6 6 0 0 1 6-6z"/><rect x="2" y="9" width="4" height="12"/><circle cx="4" cy="4" r="2"/></svg>;
    default: return null;
  }
};

const PaymentIcon = ({ name }: { name: string }) => {
  const baseClass = "h-6 md:h-7 w-auto text-lime-800/60 dark:text-lime-200/40 group-hover:text-lime-600 dark:group-hover:text-lime-400 transition-colors duration-300";
  switch (name) {
    case 'Visa': return <svg className={baseClass} viewBox="0 0 24 24" fill="currentColor"><path d="M9.112 7.935h2.376l-1.584 9.13H7.528l1.584-9.13zm5.633 0h-1.992c-.456 0-.8.128-1.04.384-.232.256-.368.608-.368 1.088 0 .48.152.848.456 1.072l1.256.88c.384.272.576.568.576.88 0 .448-.32.688-.96.688-.672 0-1.488-.232-2.448-.688v1.768c.76.32 1.624.488 2.584.488 1.048 0 1.872-.256 2.464-.752.592-.504.896-1.168.896-2.008 0-.48-.144-.856-.432-1.144-.28-.288-.792-.64-1.52-.992l-.56-.352c-.232-.144-.352-.312-.352-.504 0-.28.224-.44.672-.44.552 0 1.232.176 2.04.528V7.935zm3.92 0h-1.84c-.448 0-.776.12-.984.36-.208.24-.352.576-.352.992 0 .448.152.784.44 1.024l.808.592c.352.256.528.512.528.768 0 .336-.256.512-.76.512-.56 0-1.224-.208-1.992-.624v1.552c.72.288 1.504.432 2.352.432 1.048 0 1.872-.256 2.464-.752.592-.496.896-1.168.896-2.024 0-.496-.152-.872-.44-1.152-.288-.28-.792-.632-1.512-.984l-.456-.288c-.224-.144-.336-.304-.336-.496 0-.256.208-.408.624-.408.528 0 1.152.168 1.888.512V7.935zm-15.336.304l-3.328 8.68h2.496l.632-1.76h2.992l.376 1.76h2.216L5.625 8.239H3.329zm.848 2.592l.912 4.144H2.681l1.496-4.144z"/></svg>;
    case 'Mastercard': return <svg className={baseClass} viewBox="0 0 24 24" fill="currentColor"><path d="M16.24 8.5h-8.48A5.23 5.23 0 0 0 6 12.5c0 2.7 1.96 4.96 4.56 5.5h2.88c2.6-.54 4.56-2.8 4.56-5.5 0-2.7-1.96-4.96-4.56-5.5H16.24z"/></svg>;
    case 'PayPal': return <svg className={baseClass} viewBox="0 0 24 24" fill="currentColor"><path d="M7.076 21.337H2.47a.641.641 0 0 1-.633-.74L4.944.901C5.026.382 5.474 0 5.998 0h7.46c2.57 0 4.578.543 5.69 1.81 1.01 1.15 1.304 2.42 1.012 4.287-.023.143-.047.288-.077.437-.983 5.05-4.349 6.797-8.647 6.797h-2.19c-.524 0-.968.382-1.05.9l-1.12 7.106zm14.146-14.42a3.35 3.35 0 0 0-.607-.541c-.013.076-.026.175-.041.274-.93 4.778-4.005 7.201-9.138 7.201h-2.19a.563.563 0 0 0-.556.479l-1.187 7.527h-.506l-.24 1.516a.56.56 0 0 0 .554.647h3.882c.46 0 .85-.334.922-.788.06-.26.76-4.852.816-5.09a.932.932 0 0 1 .923-.788h.58c3.76 0 6.705-1.528 7.565-5.946.36-1.847.174-3.388-.777-4.471z"/></svg>;
    case 'Bitcoin': return <svg className={baseClass} viewBox="0 0 24 24" fill="currentColor"><path d="M14.647 10.702c.34-1.94-1.228-2.868-3.066-3.426l.716-2.87-1.688-.42-.7 2.804c-.442-.11-1.01-.257-1.582-.406l.714-2.866-1.686-.42-.727 2.912c-.426-.104-.863-.207-1.297-.317L3.626 4.935l-.454 1.82s1.24.296 1.215.315c.678.168.8.653.782.995l-1.556 6.24c-.074.183-.252.457-.648.353-.063-.015-1.212-.302-1.212-.302l-.87 1.92 4.31 1.074c.46.114.906.228 1.347.336l-.728 2.914 1.685.42.72-2.882c.55.148 1.09.286 1.568.408l-.722 2.89 1.686.42.73-2.924c2.382.45 4.156.27 4.912-1.88.608-1.73-.03-2.727-1.27-3.378.905-.208 1.587-.804 1.87-2.034zm-3.53 4.558c-.428 1.725-3.344.792-4.29.558l.76-3.058c.947.236 3.98.705 3.53 2.5zm.435-4.587c-.39 1.57-2.82.772-3.607.577l.686-2.754c.785.195 3.32.557 2.92 2.177z"/></svg>;
    case 'Ethereum': return <svg className={baseClass} viewBox="0 0 24 24" fill="currentColor"><path d="M12 0L4.32 12.453l7.68 4.523 7.68-4.523L12 0zm0 22.85l-7.68-10.397L12 24l7.68-11.547-7.68 10.397z"/></svg>;
    case 'Western Union': return <svg className={baseClass} viewBox="0 0 24 24" fill="currentColor"><path d="M2 6h20v12H2V6zm3 2l2 8h2l2-8H9l-1 5-1-5H5zm7 0v8h2V8h-2zm4 0l2 8h2l2-8h-2l-1 5-1-5h-2z"/></svg>;
    case 'Bank Transfer': return <svg className={baseClass} viewBox="0 0 24 24" fill="currentColor"><path d="M12 2L2 7v2h20V7L12 2zM4 11v6h3v-6H4zm6 0v6h4v-6h-4zm7 0v6h3v-6h-3zM2 19v2h20v-2H2z"/></svg>;
    case 'Cash': return <svg className={baseClass} viewBox="0 0 24 24" fill="currentColor"><path d="M19 6H5c-1.1 0-2 .9-2 2v8c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V8c0-1.1-.9-2-2-2zm0 10H5V8h14v8zM7 10h2v4H7zm8 0h2v4h-2zm-4 0h2v4h-2z"/></svg>;
    case 'Wire Transfer': return <svg className={baseClass} viewBox="0 0 24 24" fill="currentColor"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 17.93c-3.95-.49-7-3.85-7-7.93 0-.62.08-1.21.21-1.79L9 15v1c0 1.1.9 2 2 2v1.93zm6.9-2.54c-.26-.81-1-1.39-1.9-1.39h-1v-3c0-.55-.45-1-1-1H8v-2h2c.55 0 1-.45 1-1V7h2c1.1 0 2-.9 2-2v-.41c2.93 1.19 5 4.06 5 7.41 0 2.08-.8 3.97-2.1 5.39z"/></svg>;
    default: return null;
  }
};

export default function FooterSection() {
  const { openModal } = useDevModal();
  const router = useRouter();

  const paymentMethods = [
    'Visa', 'Mastercard', 'PayPal', 'Bitcoin', 'Ethereum', 
    'Western Union', 'Bank Transfer', 'Cash', 'Wire Transfer'
  ];

  return (
    <footer className="relative z-20 border-t border-lime-500/20 dark:border-lime-500/10 bg-white/40 dark:bg-[#050806]/80 backdrop-blur-xl pt-12 pb-8 mt-auto">
      <m.div 
        initial={{ opacity: 0, y: 20 }} 
        whileInView={{ opacity: 1, y: 0 }} 
        viewport={{ once: true }} 
        transition={{ duration: 0.5 }} 
        className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8"
      >
        {/* RESPONSIVE GRID */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-10 lg:gap-8 mb-12">
          
          {/* Column 1: Brand */}
          <div className="space-y-4">
            <Logo />
            <p className="text-xs sm:text-sm text-lime-800/70 dark:text-lime-200/50 font-medium leading-relaxed max-w-xs">
              The world's first highly gamified commodity and crypto exchange. Trade local goods, crypto, and forex seamlessly.
            </p>
            <div className="flex gap-4 pt-2">
              <a href="#" className="hover:scale-110 transition-transform"><SocialIcon name="facebook" /></a>
              <a href="#" className="hover:scale-110 transition-transform"><SocialIcon name="instagram" /></a>
              <a href="#" className="hover:scale-110 transition-transform"><SocialIcon name="youtube" /></a>
              <a href="#" className="hover:scale-110 transition-transform"><SocialIcon name="twitter" /></a>
              <a href="#" className="hover:scale-110 transition-transform"><SocialIcon name="linkedin" /></a>
            </div>
          </div>
          
          {/* Column 2: Product */}
          <div>
            <h4 className="text-xs font-bold text-lime-950 dark:text-[#ecfdf5] uppercase tracking-wider mb-4">Product</h4>
            <ul className="space-y-3">
              <li><a href="#markets" className="text-sm text-lime-800/70 dark:text-lime-200/60 hover:text-lime-600 dark:hover:text-lime-400 transition-colors">Markets</a></li>
              <li><a href="#features" className="text-sm text-lime-800/70 dark:text-lime-200/60 hover:text-lime-600 dark:hover:text-lime-400 transition-colors">Features</a></li>
              <li><a href="#how-it-works" className="text-sm text-lime-800/70 dark:text-lime-200/60 hover:text-lime-600 dark:hover:text-lime-400 transition-colors">How it Works</a></li>
              <li><Link href="/login" className="text-sm text-lime-800/70 dark:text-lime-200/60 hover:text-lime-600 dark:hover:text-lime-400 transition-colors">Launch App</Link></li>
            </ul>
          </div>

          {/* Column 3: Legal */}
          <div>
            <h4 className="text-xs font-bold text-lime-950 dark:text-[#ecfdf5] uppercase tracking-wider mb-4">Legal</h4>
            <ul className="space-y-3">
              <li><button onClick={() => openModal("Privacy Policy")} className="text-sm text-lime-800/70 dark:text-lime-200/60 hover:text-lime-600 dark:hover:text-lime-400 transition-colors cursor-pointer text-left">Privacy Policy</button></li>
              <li><button onClick={() => openModal("Terms of Service")} className="text-sm text-lime-800/70 dark:text-lime-200/60 hover:text-lime-600 dark:hover:text-lime-400 transition-colors cursor-pointer text-left">Terms of Service</button></li>
              <li><button onClick={() => openModal("Risk Disclosure")} className="text-sm text-lime-800/70 dark:text-lime-200/60 hover:text-lime-600 dark:hover:text-lime-400 transition-colors cursor-pointer text-left">Risk Disclosure</button></li>
            </ul>
          </div>

          {/* Column 4: Payments */}
          <div>
            <h4 className="text-xs font-bold text-lime-950 dark:text-[#ecfdf5] uppercase tracking-wider mb-4">Accepted Payments</h4>
            <div className="flex flex-wrap gap-3 sm:gap-4 items-center">
              {paymentMethods.map((method) => (
                <button key={method} onClick={() => router.push('/payment')} className="relative group flex items-center justify-center p-1 cursor-pointer transition-transform hover:scale-110">
                  <PaymentIcon name={method} />
                  <span className="absolute -top-8 left-1/2 -translate-x-1/2 px-2 py-1 bg-gray-900 dark:bg-[#121A14] text-white text-[10px] font-mono rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none z-50 shadow-lg border border-lime-500/20">{method}</span>
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="pt-8 border-t border-lime-500/10 flex flex-col md:flex-row items-center justify-between gap-4">
          <p className="text-xs text-center md:text-left text-lime-800/50 dark:text-lime-200/40 font-medium">
            © 2026 Quantix Solaris Exchange. All rights reserved.
          </p>
          <div className="flex items-center gap-4 text-xs font-medium text-lime-800/50 dark:text-lime-200/40">
            <span className="flex items-center gap-1.5"><span className="w-1.5 h-1.5 rounded-full bg-lime-500 animate-pulse"></span> All Systems Operational</span>
          </div>
        </div>
      </m.div>
    </footer>
  );
}
// "use client";

// import { m } from "framer-motion";
// import { useDevModal } from "@/components/providers/DevModalProvider";
// import { Logo } from "@/components/ui/Logo";
// import { useRouter } from "next/navigation";
// import Link from "next/link";

// const SocialIcon = ({ name, size = 18 }: { name: string, size?: number }) => {
//   const baseClass = "text-lime-800/60 dark:text-lime-200/40 hover:text-lime-600 dark:hover:text-lime-400 transition-colors duration-300";
//   switch(name) {
//     case 'facebook': return <svg className={baseClass} width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z"/></svg>;
//     case 'instagram': return <svg className={baseClass} width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="2" width="20" height="20" rx="5" ry="5"/><path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"/><line x1="17.5" y1="6.5" x2="17.51" y2="6.5"/></svg>;
//     case 'youtube': return <svg className={baseClass} width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22.54 6.42a2.78 2.78 0 0 0-1.94-2C18.88 4 12 4 12 4s-6.88 0-8.6.46a2.78 2.78 0 0 0-1.94 2A29 29 0 0 0 1 11.75a29 29 0 0 0 .46 5.33A2.78 2.78 0 0 0 3.4 19c1.72.46 8.6.46 8.6.46s6.88 0 8.6-.46a2.78 2.78 0 0 0 1.94-2 29 29 0 0 0 .46-5.25 29 29 0 0 0-.46-5.33z"/><polygon points="9.75 15.02 15.5 11.75 9.75 8.48 9.75 15.02"/></svg>;
//     case 'twitter': return <svg className={baseClass} width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M23 3a10.9 10.9 0 0 1-3.14 1.53 4.48 4.48 0 0 0-7.86 3v1A10.66 10.66 0 0 1 3 4s-4 9 5 13a11.64 11.64 0 0 1-7 2c9 5 20 0 20-11.5a4.5 4.5 0 0 0-.08-.83A7.72 7.72 0 0 0 23 3z"/></svg>;
//     case 'linkedin': return <svg className={baseClass} width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-2-2 2 2 0 0 0-2 2v7h-4v-7a6 6 0 0 1 6-6z"/><rect x="2" y="9" width="4" height="12"/><circle cx="4" cy="4" r="2"/></svg>;
//     default: return null;
//   }
// };

// const PaymentIcon = ({ name }: { name: string }) => {
//   const baseClass = "h-6 md:h-7 w-auto text-lime-800/60 dark:text-lime-200/40 group-hover:text-lime-600 dark:group-hover:text-lime-400 transition-colors duration-300";
//   switch (name) {
//     case 'Visa': return <svg className={baseClass} viewBox="0 0 24 24" fill="currentColor"><path d="M9.112 7.935h2.376l-1.584 9.13H7.528l1.584-9.13zm5.633 0h-1.992c-.456 0-.8.128-1.04.384-.232.256-.368.608-.368 1.088 0 .48.152.848.456 1.072l1.256.88c.384.272.576.568.576.88 0 .448-.32.688-.96.688-.672 0-1.488-.232-2.448-.688v1.768c.76.32 1.624.488 2.584.488 1.048 0 1.872-.256 2.464-.752.592-.504.896-1.168.896-2.008 0-.48-.144-.856-.432-1.144-.28-.288-.792-.64-1.52-.992l-.56-.352c-.232-.144-.352-.312-.352-.504 0-.28.224-.44.672-.44.552 0 1.232.176 2.04.528V7.935zm3.92 0h-1.84c-.448 0-.776.12-.984.36-.208.24-.352.576-.352.992 0 .448.152.784.44 1.024l.808.592c.352.256.528.512.528.768 0 .336-.256.512-.76.512-.56 0-1.224-.208-1.992-.624v1.552c.72.288 1.504.432 2.352.432 1.048 0 1.872-.256 2.464-.752.592-.496.896-1.168.896-2.024 0-.496-.152-.872-.44-1.152-.288-.28-.792-.632-1.512-.984l-.456-.288c-.224-.144-.336-.304-.336-.496 0-.256.208-.408.624-.408.528 0 1.152.168 1.888.512V7.935zm-15.336.304l-3.328 8.68h2.496l.632-1.76h2.992l.376 1.76h2.216L5.625 8.239H3.329zm.848 2.592l.912 4.144H2.681l1.496-4.144z"/></svg>;
//     case 'Mastercard': return <svg className={baseClass} viewBox="0 0 24 24" fill="currentColor"><path d="M16.24 8.5h-8.48A5.23 5.23 0 0 0 6 12.5c0 2.7 1.96 4.96 4.56 5.5h2.88c2.6-.54 4.56-2.8 4.56-5.5 0-2.7-1.96-4.96-4.56-5.5H16.24z"/></svg>;
//     case 'PayPal': return <svg className={baseClass} viewBox="0 0 24 24" fill="currentColor"><path d="M7.076 21.337H2.47a.641.641 0 0 1-.633-.74L4.944.901C5.026.382 5.474 0 5.998 0h7.46c2.57 0 4.578.543 5.69 1.81 1.01 1.15 1.304 2.42 1.012 4.287-.023.143-.047.288-.077.437-.983 5.05-4.349 6.797-8.647 6.797h-2.19c-.524 0-.968.382-1.05.9l-1.12 7.106zm14.146-14.42a3.35 3.35 0 0 0-.607-.541c-.013.076-.026.175-.041.274-.93 4.778-4.005 7.201-9.138 7.201h-2.19a.563.563 0 0 0-.556.479l-1.187 7.527h-.506l-.24 1.516a.56.56 0 0 0 .554.647h3.882c.46 0 .85-.334.922-.788.06-.26.76-4.852.816-5.09a.932.932 0 0 1 .923-.788h.58c3.76 0 6.705-1.528 7.565-5.946.36-1.847.174-3.388-.777-4.471z"/></svg>;
//     case 'Bitcoin': return <svg className={baseClass} viewBox="0 0 24 24" fill="currentColor"><path d="M14.647 10.702c.34-1.94-1.228-2.868-3.066-3.426l.716-2.87-1.688-.42-.7 2.804c-.442-.11-1.01-.257-1.582-.406l.714-2.866-1.686-.42-.727 2.912c-.426-.104-.863-.207-1.297-.317L3.626 4.935l-.454 1.82s1.24.296 1.215.315c.678.168.8.653.782.995l-1.556 6.24c-.074.183-.252.457-.648.353-.063-.015-1.212-.302-1.212-.302l-.87 1.92 4.31 1.074c.46.114.906.228 1.347.336l-.728 2.914 1.685.42.72-2.882c.55.148 1.09.286 1.568.408l-.722 2.89 1.686.42.73-2.924c2.382.45 4.156.27 4.912-1.88.608-1.73-.03-2.727-1.27-3.378.905-.208 1.587-.804 1.87-2.034zm-3.53 4.558c-.428 1.725-3.344.792-4.29.558l.76-3.058c.947.236 3.98.705 3.53 2.5zm.435-4.587c-.39 1.57-2.82.772-3.607.577l.686-2.754c.785.195 3.32.557 2.92 2.177z"/></svg>;
//     case 'Ethereum': return <svg className={baseClass} viewBox="0 0 24 24" fill="currentColor"><path d="M12 0L4.32 12.453l7.68 4.523 7.68-4.523L12 0zm0 22.85l-7.68-10.397L12 24l7.68-11.547-7.68 10.397z"/></svg>;
//     case 'Western Union': return <svg className={baseClass} viewBox="0 0 24 24" fill="currentColor"><path d="M2 6h20v12H2V6zm3 2l2 8h2l2-8H9l-1 5-1-5H5zm7 0v8h2V8h-2zm4 0l2 8h2l2-8h-2l-1 5-1-5h-2z"/></svg>;
//     case 'Bank Transfer': return <svg className={baseClass} viewBox="0 0 24 24" fill="currentColor"><path d="M12 2L2 7v2h20V7L12 2zM4 11v6h3v-6H4zm6 0v6h4v-6h-4zm7 0v6h3v-6h-3zM2 19v2h20v-2H2z"/></svg>;
//     case 'Cash': return <svg className={baseClass} viewBox="0 0 24 24" fill="currentColor"><path d="M19 6H5c-1.1 0-2 .9-2 2v8c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V8c0-1.1-.9-2-2-2zm0 10H5V8h14v8zM7 10h2v4H7zm8 0h2v4h-2zm-4 0h2v4h-2z"/></svg>;
//     case 'Wire Transfer': return <svg className={baseClass} viewBox="0 0 24 24" fill="currentColor"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 17.93c-3.95-.49-7-3.85-7-7.93 0-.62.08-1.21.21-1.79L9 15v1c0 1.1.9 2 2 2v1.93zm6.9-2.54c-.26-.81-1-1.39-1.9-1.39h-1v-3c0-.55-.45-1-1-1H8v-2h2c.55 0 1-.45 1-1V7h2c1.1 0 2-.9 2-2v-.41c2.93 1.19 5 4.06 5 7.41 0 2.08-.8 3.97-2.1 5.39z"/></svg>;
//     default: return null;
//   }
// };

// export default function FooterSection() {
//   const { openModal } = useDevModal();
//   const router = useRouter();

//   const paymentMethods = [
//     'Visa', 'Mastercard', 'PayPal', 'Bitcoin', 'Ethereum', 
//     'Western Union', 'Bank Transfer', 'Cash', 'Wire Transfer'
//   ];

//   return (
//     <footer className="relative z-20 border-t border-lime-500/20 dark:border-lime-500/10 bg-white/40 dark:bg-[#050806]/80 backdrop-blur-xl pt-12 pb-8 mt-auto">
//       <m.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.5 }} className="max-w-7xl mx-auto px-4 sm:px-6">
//         <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8 mb-12">
//           <div className="space-y-4">
//             <Logo />
//             <p className="text-xs text-lime-800/70 dark:text-lime-200/50 font-medium leading-relaxed max-w-xs mb-4">The world's first highly gamified commodity and crypto exchange. Trade local goods, crypto, and forex seamlessly.</p>
//             <div className="flex gap-4">
//               <a href="#" className="hover:scale-110 transition-transform"><SocialIcon name="facebook" /></a>
//               <a href="#" className="hover:scale-110 transition-transform"><SocialIcon name="instagram" /></a>
//               <a href="#" className="hover:scale-110 transition-transform"><SocialIcon name="youtube" /></a>
//               <a href="#" className="hover:scale-110 transition-transform"><SocialIcon name="twitter" /></a>
//               <a href="#" className="hover:scale-110 transition-transform"><SocialIcon name="linkedin" /></a>
//             </div>
//           </div>
//           <div>
//             <h4 className="text-xs font-bold text-lime-950 dark:text-[#ecfdf5] uppercase tracking-wider mb-4">Product</h4>
//             <ul className="space-y-3">
//               <li><a href="#markets" className="text-sm text-lime-800/70 dark:text-lime-200/60 hover:text-lime-600 dark:hover:text-lime-400 transition-colors">Markets</a></li>
//               <li><a href="#features" className="text-sm text-lime-800/70 dark:text-lime-200/60 hover:text-lime-600 dark:hover:text-lime-400 transition-colors">Features</a></li>
//               <li><a href="#how-it-works" className="text-sm text-lime-800/70 dark:text-lime-200/60 hover:text-lime-600 dark:hover:text-lime-400 transition-colors">How it Works</a></li>
//               <li><Link href="/login" className="text-sm text-lime-800/70 dark:text-lime-200/60 hover:text-lime-600 dark:hover:text-lime-400 transition-colors">Launch App</Link></li>
//             </ul>
//           </div>
//           <div>
//             <h4 className="text-xs font-bold text-lime-950 dark:text-[#ecfdf5] uppercase tracking-wider mb-4">Legal</h4>
//             <ul className="space-y-3">
//               <li><button onClick={() => openModal("Privacy Policy")} className="text-sm text-lime-800/70 dark:text-lime-200/60 hover:text-lime-600 dark:hover:text-lime-400 transition-colors cursor-pointer text-left">Privacy Policy</button></li>
//               <li><button onClick={() => openModal("Terms of Service")} className="text-sm text-lime-800/70 dark:text-lime-200/60 hover:text-lime-600 dark:hover:text-lime-400 transition-colors cursor-pointer text-left">Terms of Service</button></li>
//               <li><button onClick={() => openModal("Risk Disclosure")} className="text-sm text-lime-800/70 dark:text-lime-200/60 hover:text-lime-600 dark:hover:text-lime-400 transition-colors cursor-pointer text-left">Risk Disclosure</button></li>
//             </ul>
//           </div>
//           <div>
//             <h4 className="text-xs font-bold text-lime-950 dark:text-[#ecfdf5] uppercase tracking-wider mb-4">Accepted Payments</h4>
//             <div className="flex flex-wrap gap-4 items-center">
//               {paymentMethods.map((method) => (
//                 <button key={method} onClick={() => router.push('/payment')} className="relative group flex items-center justify-center p-1 cursor-pointer transition-transform hover:scale-110">
//                   <PaymentIcon name={method} />
//                   <span className="absolute -top-8 left-1/2 -translate-x-1/2 px-2 py-1 bg-gray-900 dark:bg-[#121A14] text-white text-[10px] font-mono rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none z-50 shadow-lg border border-lime-500/20">{method}</span>
//                 </button>
//               ))}
//             </div>
//           </div>
//         </div>
//         <div className="pt-8 border-t border-lime-500/10 flex flex-col md:flex-row items-center justify-between gap-4">
//           <p className="text-xs text-lime-800/50 dark:text-lime-200/40 font-medium">© 2026 Quantix Solaris Exchange. All rights reserved.</p>
//           <div className="flex items-center gap-4 text-xs font-medium text-lime-800/50 dark:text-lime-200/40">
//             <span className="flex items-center gap-1.5"><span className="w-1.5 h-1.5 rounded-full bg-lime-500 animate-pulse"></span> All Systems Operational</span>
//           </div>
//         </div>
//       </m.div>
//     </footer>
//   );
// }