// app/login/page.tsx
"use client";

import { useState, useEffect, useMemo, useRef, ChangeEvent } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { useDevModal } from "@/components/providers/DevModalProvider";
import { useTheme } from "next-themes";
import HeaderActions from "@/components/HeaderActions";
import { signInWithPopup, getRedirectResult, signInWithCustomToken, GoogleAuthProvider } from "firebase/auth";
import { startAuthentication } from "@simplewebauthn/browser";
import { auth } from "@/lib/firebase-client";
import { loginWithEmail, registerWithEmail, loginWithFirebase } from "@/app/actions/auth";
import { getAuthenticationOptions, verifyAuthentication } from "@/app/actions/webauthn";
import { Button } from "@/components/ui/Button";
import { useTranslations } from "next-intl"; 
import { 
  Fingerprint, Mail, Lock, User, PlayCircle, ChevronLeft, ChevronRight, 
  Sparkles, X, Eye, EyeOff, ShieldAlert, KeyRound, ServerCrash, UserX, AlertCircle
} from "lucide-react";

const WATERMARK_SYMBOLS = [
  "$", "€", "£", "¥", "₦", "₹", "₩", "₪", "₫", "₴", "₭", "₮", "₱", "฿", "₲", "₵", "₡", "₸", "₼", "₾", "֏", "؋", "৳", "៛", "₥", "₣", "₤", "₧", "₯", "₰", "₳", "₢", "₠", "₨", "₶", "₷", "₺", "₻", "₽", "₿", "C$", "A$", "R$", "S$", "HK$", "NT$", "NZ$", "CHF", "kr", "zł", "Kč", "Ft", "lei", "лв", "din", "ден", "L", "Q", "B/.", "₡", "₲", "Gs", "S/.", "Bs.", "$U", "RD$", "J$", "TT$", "Bds$", "EC$", "FJ$", "WS$", "T$", "VT", "K", "T", "₭", "₮", "៛", "₫", "Rp", "RM", "S$", "฿",
  "Ξ", "Ð", "Ł", "Ƀ", "ȿ", "Μ", "◎", "Ꞩ", "✕", "ⓩ", "⧫", "Ɖ", "ɱ", "Ꝟ", "Ꝑ", "Ⓝ", "Ⓞ", "Ⓣ", "Ⓡ", "Ⓢ", "Ⓤ", "Ⓐ", "Ⓥ", "Ⓔ", "Ⓛ", "Ⓜ", "Ⓟ", "Ⓠ", "Ⓦ", "Ⓧ", "Ⓨ", "Ⓩ", "⓪", "①", "②", "③", "④", "⑤", "⑥", "⑦", "⑧", "⑨", "⑩", "♦", "◈", "⬡", "⬢", "◊", "⟁", "⧉", "⧈", "⌬", "⎔", "⏣", "⏥", "⏦", "✕", "✖", "☰", "⛓", "🔗", "🌐", "⚙️", "🧩", "🧮", "📈", "📉", "⚖️", "🛡️", "🔑", "🗝️", "🧊", "🔥", "💧", "🌪️", "🌍", "🪐", "☄️", "🛰️",
  "🐕", "🐶", "🐱", "🐸", "🐵", "🦍", "🦊", "🐺", "🐻", "🐼", "🐨", "🐷", "🐮", "🐔", "🐧", "🦅", "🦄", "🐳", "🐋", "🦈", "🐙", "🦑", "🦀", "🦞", "🦐", "🐡", "🐠", "🐟", "🌙", "🚀", "💎", "🙌", "🔥", "🌕", "⭐", "🌟", "✨", "⚡", "💥", "💫", "🪙", "💰", "💸", "💵", "💴", "💶", "💷", "🍌", "🍕", "🍻", "🍼", "🧠", "👽", "🤖", "👻", "💀", "🤡", "🐂", "🐻", "🦍", "🐕‍🦺", "🦴", "🥩", "🍗", "🧀", "🌮", "🍔", "🍟", "🥑"
];

type ErrorState = {
  title: string;
  message: string;
  type: "auth" | "server" | "missing" | "suspended" | "exists";
} | null;

interface FloatingInputProps {
  id: string;
  type: string;
  value: string;
  onChange: (e: ChangeEvent<HTMLInputElement>) => void;
  label: string;
  icon: React.ReactNode;
}

const FloatingInput = ({ id, type, value, onChange, label, icon }: FloatingInputProps) => {
  const [showPassword, setShowPassword] = useState(false);
  const isPassword = type === "password";
  const inputType = isPassword && showPassword ? "text" : type;

  return (
    <div id={id} className="relative">
      <input 
        type={inputType} 
        id={id} 
        value={value} 
        onChange={onChange} 
        placeholder=" " 
        required 
        className="peer w-full bg-[#f4fbf5] dark:bg-[#0a0f0b] border-2 border-lime-500/30 dark:border-lime-500/20 rounded-xl px-4 pr-12 pt-6 pb-2 text-lime-950 dark:text-white focus:outline-none focus:border-lime-500 transition-colors font-medium"
      />
      <label 
        htmlFor={id} 
        className="absolute left-3 top-4 text-lime-700/60 dark:text-lime-300/60 transition-all duration-200 pointer-events-none 
                   peer-focus:-top-3 peer-focus:text-xs peer-focus:bg-[#f4fbf5] dark:peer-focus:bg-[#0a0f0b] peer-focus:px-1 peer-focus:text-lime-600
                   peer-[:not(:placeholder-shown)]:-top-3 peer-[:not(:placeholder-shown)]:text-xs peer-[:not(:placeholder-shown)]:bg-[#f4fbf5] dark:peer-[:not(:placeholder-shown)]:bg-[#0a0f0b] peer-[:not(:placeholder-shown)]:px-1"
      >
        <div className="flex items-center gap-2">{icon} {label}</div>
      </label>

      {isPassword && (
        <button
          type="button"
          onClick={() => setShowPassword(!showPassword)}
          className="absolute right-4 top-1/2 -translate-y-1/2 text-lime-700/50 hover:text-lime-600 dark:text-lime-300/50 dark:hover:text-lime-400 transition-colors z-10"
          aria-label={showPassword ? "Hide password" : "Show password"}
        >
          {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
        </button>
      )}
    </div>
  );
};

export default function LoginPage() {
  const t = useTranslations("Login");
  const router = useRouter();
  const redirectHandled = useRef(false);
  const { openModal } = useDevModal();
  const [mounted, setMounted] = useState(false);

  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  
  const [errorState, setErrorState] = useState<ErrorState>(null);

  const [tourStep, setTourStep] = useState(-1);
  const [showWelcomeModal, setShowWelcomeModal] = useState(false);

  // 👇 WATERMARK GENERATION (deterministic, no hydration errors)
  const watermarks = useMemo(() => {
    return Array.from({ length: 48 }).map((_, i) => ({
      symbol: WATERMARK_SYMBOLS[i % WATERMARK_SYMBOLS.length],
      rotation: ((i * 15) % 60) - 30,
    }));
  }, []);

  useEffect(() => setMounted(true), []);

  // 👇 HANDLE FIREBASE REDIRECT RESULT (For Google Sign-in on mobile)
  useEffect(() => {
    getRedirectResult(auth)
      .then(async (result) => {
        if (result?.user && !redirectHandled.current) {
          redirectHandled.current = true;
          setIsLoading(true);
          const idToken = await result.user.getIdToken();
          const res = await loginWithFirebase({ token: idToken });
          if (res.success) {
            router.push("/dashboard");
          } else {
            setErrorState({ title: "Redirect Login Failed", message: res.error || "Please try again.", type: "auth" });
            setIsLoading(false);
          }
        }
      })
      .catch((err) => {
        console.error("Redirect error:", err);
        setIsLoading(false);
      });
  }, [router]);

  // 👇 SHOW WELCOME MODAL FOR FIRST-TIME VISITORS
  useEffect(() => {
    if (!mounted) return;
    const hasSeenWelcome = localStorage.getItem("quantix_welcome_seen");
    if (!hasSeenWelcome) {
      const timer = setTimeout(() => setShowWelcomeModal(true), 1500);
      return () => clearTimeout(timer);
    }
  }, [mounted]);

  const dismissWelcome = () => {
    setShowWelcomeModal(false);
    localStorage.setItem("quantix_welcome_seen", "true");
  };

  // 👇 EMAIL / PASSWORD AUTH
  const handleEmailAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setErrorState(null);

    try {
      const action = isLogin ? loginWithEmail : registerWithEmail;
      const payload = isLogin ? { email, password } : { email, password, name };
      
      const res = await action(payload);

      if (res.error) {
        setErrorState({ 
          title: isLogin ? "Login Failed" : "Registration Failed", 
          message: res.error, 
          type: "auth" 
        });
        setIsLoading(false);
        return;
      }

      if (res.customToken) {
        const userCredential = await signInWithCustomToken(auth, res.customToken);
        const idToken = await userCredential.user.getIdToken();
        
        const finalRes = await loginWithFirebase({ token: idToken });
        
        if (finalRes.error) {
          setErrorState({ title: "Session Error", message: finalRes.error, type: "server" });
          setIsLoading(false);
          return;
        }

        router.push("/dashboard");
      }
    } catch (error: any) {
      setErrorState({ 
        title: "System Error", 
        message: error.message || "An unexpected error occurred.", 
        type: "server" 
      });
      setIsLoading(false);
    }
  };

  // 👇 GOOGLE AUTH
  const handleGoogleAuth = async () => {
    setIsLoading(true);
    setErrorState(null);
    try {
      const provider = new GoogleAuthProvider();
      const result = await signInWithPopup(auth, provider);
      const idToken = await result.user.getIdToken();
      
      const res = await loginWithFirebase({ token: idToken });
      
      if (res.error) {
        setErrorState({ title: "Google Auth Failed", message: res.error, type: "auth" });
        setIsLoading(false);
        return;
      }
      router.push("/dashboard");
    } catch (error: any) {
      setErrorState({ 
        title: "Google Auth Failed", 
        message: error.message || "Popup closed before completion.", 
        type: "auth" 
      });
      setIsLoading(false);
    }
  };

 // 👇 PASSKEY (WEBAUTHN) AUTH — CLEAN VERSION
  const handlePasskeyAuth = async () => {
    setIsLoading(true);
    setErrorState(null);
    try {
      // 1. Get challenge from server (throws on error → caught below)
      const options = await getAuthenticationOptions();

      // 2. Trigger biometric prompt
      const assertion = await startAuthentication({ optionsJSON: options as any });
      
      // 3. Verify with server — returns a discriminated union
      const res = await verifyAuthentication(assertion);
      
      // 👇 TypeScript now narrows perfectly on res.success
      if (!res.success) {
        setErrorState({ 
          title: "Passkey Failed", 
          message: res.error, 
          type: "auth" 
        });
        setIsLoading(false);
        return;
      }

      // 👇 res.success === true → res.customToken is guaranteed to exist
      const userCredential = await signInWithCustomToken(auth, res.customToken);
      const idToken = await userCredential.user.getIdToken();
      
      const finalRes = await loginWithFirebase({ token: idToken });
      if (finalRes.error) {
        setErrorState({ title: "Session Error", message: finalRes.error, type: "server" });
        setIsLoading(false);
        return;
      }
      router.push("/dashboard");
    } catch (error: any) {
      if (error.name === "NotAllowedError") {
        setErrorState({ title: "Cancelled", message: "Biometric prompt was cancelled.", type: "auth" });
      } else {
        setErrorState({ title: "Passkey Error", message: error.message || "Failed to authenticate.", type: "auth" });
      }
      setIsLoading(false);
    }
  };

  if (!mounted) return null;

  return (
    <div className="relative min-h-screen flex flex-col items-center justify-center font-sans bg-[#f0fdf4] dark:bg-[#050806] overflow-hidden px-4 py-8 transition-colors duration-300">
      
      {/* 👇 WATERMARKS */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden select-none z-0 grid grid-cols-4 md:grid-cols-6 lg:grid-cols-8 gap-8 p-4 place-items-center opacity-10 dark:opacity-5">
        {watermarks.map((wm, i) => (
          <span 
            key={i} 
            className="text-4xl md:text-6xl font-bold text-lime-900 dark:text-lime-100" 
            style={{ transform: `rotate(${wm.rotation}deg)` }}
          >
            {wm.symbol}
          </span>
        ))}
      </div>

      {/* 👇 WELCOME MODAL */}
      <AnimatePresence>
        {showWelcomeModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[150] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
          >
            <motion.div
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 20 }}
              className="relative w-full max-w-md bg-[#f4fbf5]/95 dark:bg-[#0a0f0b]/95 backdrop-blur-2xl border border-lime-500/30 rounded-3xl p-8 shadow-2xl text-center"
            >
              <button onClick={dismissWelcome} className="absolute top-4 right-4 text-lime-600 hover:text-red-500 transition-colors">
                <X size={20} />
              </button>
              <div className="w-16 h-16 mx-auto bg-lime-500/20 rounded-2xl flex items-center justify-center mb-4">
                <Sparkles className="text-lime-600 dark:text-lime-400" size={32} />
              </div>
              <h2 className="text-2xl font-extrabold text-lime-950 dark:text-white mb-2">Welcome to Quantix Solaris</h2>
              <p className="text-sm text-lime-800/70 dark:text-lime-200/60 mb-6 font-medium">
                The world's first highly gamified commodity and crypto exchange. Start with local goods, earn XP, and unlock institutional-grade markets.
              </p>
              <Button onClick={dismissWelcome} className="w-full h-12 bg-lime-600 hover:bg-lime-700 text-white font-bold rounded-xl shadow-lg shadow-lime-600/20">
                Let&apos;s Go!
              </Button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <motion.div layout className="relative z-10 w-full max-w-md p-6 sm:p-8 bg-[#f4fbf5]/90 dark:bg-[#0a0f0b]/90 backdrop-blur-2xl border border-lime-500/20 dark:border-lime-500/10 rounded-3xl shadow-[0_8px_32px_0_rgba(132,204,22,0.15)] dark:shadow-[0_8px_32px_0_rgba(0,0,0,0.5)] transition-colors duration-300">
        
        <div className="flex items-center justify-between mb-8 gap-4">
          <div className="relative flex p-1 flex-1 bg-lime-100/50 dark:bg-[#050806]/80 rounded-full border border-lime-500/20 dark:border-lime-500/10 shadow-inner">
            <motion.div className="absolute top-1 bottom-1 w-[calc(50%-4px)] bg-white dark:bg-[#121A14] rounded-full shadow-md" animate={{ x: isLogin ? 0 : "100%" }} transition={{ type: "spring", stiffness: 300, damping: 30 }} />
            <button id="tour-toggle-login" type="button" onClick={() => { setIsLogin(true); setErrorState(null); }} className={`flex-1 relative z-10 py-2 text-sm font-bold transition-colors ${isLogin ? "text-lime-950 dark:text-lime-100" : "text-lime-700/60 dark:text-lime-400/60"}`}>{t("logIn")}</button>
            <button id="tour-toggle-signup" type="button" onClick={() => { setIsLogin(false); setErrorState(null); }} className={`flex-1 relative z-10 py-2 text-sm font-bold transition-colors ${!isLogin ? "text-lime-950 dark:text-lime-100" : "text-lime-700/60 dark:text-lime-400/60"}`}>{t("signUp")}</button>
          </div>

          <HeaderActions 
            hideNotifications={false} 
            helpId="tour-play-btn"
            themeId="tour-theme-btn"
            userId="tour-user-icon"
            onHelpClick={() => {}} 
            onUserClick={() => openModal("User Profile")}
            forceOpen={tourStep >= 0 && tourStep <= 2} 
          />
        </div>

        <div className="text-center mb-6">
          <h1 className="text-2xl font-extrabold text-lime-950 dark:text-[#ecfdf5] tracking-tight">{isLogin ? t("welcomeBack") : t("createAccount")}</h1>
          <p className="text-sm text-lime-800/70 dark:text-lime-200/50 mt-1 font-medium">{isLogin ? t("enterDetails") : t("joinExchange")}</p>
        </div>

        <div className="relative overflow-hidden">
          <AnimatePresence mode="wait" initial={false}>
            <motion.form 
              key={isLogin ? "login" : "signup"} 
              initial={{ opacity: 0, x: isLogin ? -50 : 50 }} 
              animate={{ opacity: 1, x: 0 }} 
              exit={{ opacity: 0, x: isLogin ? 50 : -50 }} 
              transition={{ duration: 0.3, ease: "easeInOut" }} 
              onSubmit={handleEmailAuth} 
              className="space-y-4 pt-2 pb-4"
            >
              
              {!isLogin && (
                <FloatingInput 
                  id="name" type="text" value={name} 
                  onChange={(e: ChangeEvent<HTMLInputElement>) => setName(e.target.value)} 
                  label={t("fullName")} icon={<User size={14} />} 
                />
              )}

              <FloatingInput 
                id="tour-input-email" type="email" value={email} 
                onChange={(e: ChangeEvent<HTMLInputElement>) => setEmail(e.target.value)} 
                label={t("email")} icon={<Mail size={14} />} 
              />

              <FloatingInput 
                id="tour-input-password" type="password" value={password} 
                onChange={(e: ChangeEvent<HTMLInputElement>) => setPassword(e.target.value)} 
                label={t("password")} icon={<Lock size={14} />} 
              />

              <div className="flex flex-col gap-2 mt-6">
                <Button 
                  id="tour-submit-btn" 
                  type="submit" 
                  disabled={isLoading} 
                  className="cursor-pointer w-full h-12 bg-lime-600 hover:bg-lime-700 text-white font-bold text-base rounded-xl shadow-lg shadow-lime-600/20 transition-all disabled:opacity-50"
                >
                  {isLoading ? "Processing..." : isLogin ? t("logIn") : t("signUp")}
                </Button>
                <Button 
                  id="tour-demo-btn" 
                  type="button" 
                  onClick={() => router.push("/demo")} 
                  variant="ghost" 
                  className="w-full h-10 text-lime-700 dark:text-lime-400 font-semibold hover:bg-lime-100 dark:hover:bg-[#121A14] rounded-xl transition-all flex cursor-pointer items-center justify-center gap-2"
                >
                  <PlayCircle size={18} /> {t("tryDemo")}
                </Button>
              </div>
            </motion.form>
          </AnimatePresence>
        </div>

        <div className="relative flex items-center py-2 mt-2">
          <div className="flex-grow border-t border-lime-500/20"></div>
          <span className="flex-shrink-0 mx-4 text-lime-700/60 dark:text-lime-300/60 text-[10px] sm:text-xs font-bold uppercase tracking-wider">{t("orContinue")}</span>
          <div className="flex-grow border-t border-lime-500/20"></div>
        </div>

        <div className="grid grid-cols-2 gap-3 mt-2">
          <Button 
            id="tour-google-btn" 
            type="button" 
            onClick={handleGoogleAuth} 
            disabled={isLoading} 
            variant="secondary" 
            className="cursor-pointer border-lime-500/30 dark:border-lime-500/20 bg-[#f4fbf5]/50 dark:bg-[#050806] hover:bg-white dark:hover:bg-[#121A14] text-lime-950 dark:text-white font-semibold rounded-xl h-11 shadow-sm flex items-center justify-center gap-2 disabled:opacity-50"
          >
            <svg className="w-5 h-5" viewBox="0 0 24 24"><path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/><path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/><path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/><path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/></svg> Google
          </Button>
          <Button 
            id="tour-passkey-btn" 
            type="button" 
            onClick={handlePasskeyAuth} 
            disabled={isLoading} 
            variant="secondary" 
            className="cursor-pointer border-lime-500/30 dark:border-lime-500/20 bg-[#f4fbf5]/50 dark:bg-[#050806] hover:bg-white dark:hover:bg-[#121A14] text-lime-950 dark:text-white font-semibold rounded-xl h-11 shadow-sm disabled:opacity-50"
          >
            <Fingerprint size={18} className="mr-2" /> Passkey
          </Button>
        </div>
        
      </motion.div>
      
      {/* 👇 GAMIFIED ERROR MODAL */}
      <AnimatePresence>
        {errorState && (
          <motion.div 
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
          >
            <motion.div 
              initial={{ scale: 0.9, y: 20 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.9, y: 20 }}
              className={`relative w-full max-w-sm bg-white dark:bg-[#121A14] rounded-3xl p-6 shadow-2xl border text-center ${
                errorState.type === 'server' ? 'border-orange-500/30' :
                errorState.type === 'suspended' ? 'border-red-500/30' :
                errorState.type === 'exists' ? 'border-rose-500/30' :
                errorState.type === 'missing' ? 'border-yellow-500/30' :
                'border-amber-500/30'
              }`}
            >
              <button onClick={() => setErrorState(null)} className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200">
                <X size={20} />
              </button>
              
              <div className={`w-16 h-16 mx-auto rounded-full flex items-center justify-center mb-4 ${
                errorState.type === 'server' ? 'bg-orange-100 text-orange-500' :
                errorState.type === 'suspended' ? 'bg-red-100 text-red-500' :
                errorState.type === 'exists' ? 'bg-rose-100 text-rose-500' :
                errorState.type === 'missing' ? 'bg-yellow-100 text-yellow-500' :
                'bg-amber-100 text-amber-500'
              }`}>
                {errorState.type === 'server' && <ServerCrash size={32} />}
                {errorState.type === 'suspended' && <ShieldAlert size={32} />}
                {errorState.type === 'exists' && <UserX size={32} />}
                {errorState.type === 'missing' && <AlertCircle size={32} />}
                {errorState.type === 'auth' && <KeyRound size={32} />}
              </div>
              
              <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-2">{errorState.title}</h2>
              <p className="text-sm text-gray-500 dark:text-gray-400 mb-6">{errorState.message}</p>
              
              <Button onClick={() => setErrorState(null)} className="w-full bg-lime-600 hover:bg-lime-700 text-white font-bold h-11 rounded-xl">
                Got it
              </Button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

    </div>
  );
}
// // app/login/page.tsx
// "use client";

// import { useState, useEffect, useMemo, useRef, ChangeEvent } from "react";
// import { useRouter } from "next/navigation";
// import { motion, AnimatePresence } from "framer-motion";
// import { useDevModal } from "@/components/providers/DevModalProvider";
// import { useTheme } from "next-themes";
// import HeaderActions from "@/components/HeaderActions";
// import { signInWithPopup, getRedirectResult, signInWithCustomToken, GoogleAuthProvider } from "firebase/auth";
// import { startAuthentication } from "@simplewebauthn/browser";
// import { auth } from "@/lib/firebase-client";
// import { loginWithEmail, registerWithEmail, loginWithFirebase } from "@/app/actions/auth";
// import { getAuthenticationOptions, verifyAuthentication } from "@/app/actions/webauthn";
// import { Button } from "@/components/ui/Button";
// import { useTranslations } from "next-intl"; 
// import { 
//   Fingerprint, Mail, Lock, User, PlayCircle, ChevronLeft, ChevronRight, 
//   Sparkles, X, Eye, EyeOff, ShieldAlert, KeyRound, ServerCrash, UserX, AlertCircle
// } from "lucide-react";

// const WATERMARK_SYMBOLS = [
//   "$", "€", "£", "¥", "₦", "₹", "₩", "₪", "₫", "₴", "₭", "₮", "₱", "฿", "₲", "₵", "₡", "₸", "₼", "₾", "֏", "؋", "৳", "៛", "₥", "₣", "₤", "₧", "₯", "₰", "₳", "₢", "₠", "₨", "₶", "₷", "₺", "₻", "₽", "₿", "C$", "A$", "R$", "S$", "HK$", "NT$", "NZ$", "CHF", "kr", "zł", "Kč", "Ft", "lei", "лв", "din", "ден", "L", "Q", "B/.", "₡", "₲", "Gs", "S/.", "Bs.", "$U", "RD$", "J$", "TT$", "Bds$", "EC$", "FJ$", "WS$", "T$", "VT", "K", "T", "₭", "₮", "៛", "₫", "Rp", "RM", "S$", "฿",
//   "Ξ", "Ð", "Ł", "Ƀ", "ȿ", "Μ", "◎", "Ꞩ", "✕", "ⓩ", "⧫", "Ɖ", "ɱ", "Ꝟ", "Ꝑ", "Ⓝ", "Ⓞ", "Ⓣ", "Ⓡ", "Ⓢ", "Ⓤ", "Ⓐ", "Ⓥ", "Ⓔ", "Ⓛ", "Ⓜ", "Ⓟ", "Ⓠ", "Ⓦ", "Ⓧ", "Ⓨ", "Ⓩ", "⓪", "①", "②", "③", "④", "⑤", "⑥", "⑦", "⑧", "⑨", "⑩", "♦", "◈", "⬡", "⬢", "◊", "⟁", "⧉", "⧈", "⌬", "⎔", "⏣", "⏥", "⏦", "✕", "✖", "☰", "⛓", "🔗", "🌐", "⚙️", "🧩", "🧮", "📈", "📉", "⚖️", "🛡️", "🔑", "🗝️", "🧊", "🔥", "💧", "🌪️", "🌍", "🪐", "☄️", "🛰️",
//   "🐕", "🐶", "🐱", "🐸", "🐵", "🦍", "🦊", "🐺", "🐻", "🐼", "🐨", "🐷", "🐮", "🐔", "🐧", "🦅", "🦄", "🐳", "🐋", "🦈", "🐙", "🦑", "🦀", "🦞", "🦐", "🐡", "🐠", "🐟", "🌙", "🚀", "💎", "🙌", "🔥", "🌕", "⭐", "🌟", "✨", "⚡", "💥", "💫", "🪙", "💰", "💸", "💵", "💴", "💶", "💷", "🍌", "🍕", "🍻", "🍼", "🧠", "👽", "🤖", "👻", "💀", "🤡", "🐂", "🐻", "🦍", "🐕‍🦺", "🦴", "🥩", "🍗", "🧀", "🌮", "🍔", "🍟", "🥑"
// ];

// type ErrorState = {
//   title: string;
//   message: string;
//   type: "auth" | "server" | "missing" | "suspended" | "exists";
// } | null;

// interface FloatingInputProps {
//   id: string;
//   type: string;
//   value: string;
//   onChange: (e: ChangeEvent<HTMLInputElement>) => void;
//   label: string;
//   icon: React.ReactNode;
// }

// const FloatingInput = ({ id, type, value, onChange, label, icon }: FloatingInputProps) => {
//   const [showPassword, setShowPassword] = useState(false);
//   const isPassword = type === "password";
//   const inputType = isPassword && showPassword ? "text" : type;

//   return (
//     <div id={id} className="relative">
//       <input 
//         type={inputType} 
//         id={id} 
//         value={value} 
//         onChange={onChange} 
//         placeholder=" " 
//         required 
//         className="peer w-full bg-[#f4fbf5] dark:bg-[#0a0f0b] border-2 border-lime-500/30 dark:border-lime-500/20 rounded-xl px-4 pr-12 pt-6 pb-2 text-lime-950 dark:text-white focus:outline-none focus:border-lime-500 transition-colors font-medium"
//       />
//       <label 
//         htmlFor={id} 
//         className="absolute left-3 top-4 text-lime-700/60 dark:text-lime-300/60 transition-all duration-200 pointer-events-none 
//                    peer-focus:-top-3 peer-focus:text-xs peer-focus:bg-[#f4fbf5] dark:peer-focus:bg-[#0a0f0b] peer-focus:px-1 peer-focus:text-lime-600
//                    peer-[:not(:placeholder-shown)]:-top-3 peer-[:not(:placeholder-shown)]:text-xs peer-[:not(:placeholder-shown)]:bg-[#f4fbf5] dark:peer-[:not(:placeholder-shown)]:bg-[#0a0f0b] peer-[:not(:placeholder-shown)]:px-1"
//       >
//         <div className="flex items-center gap-2">{icon} {label}</div>
//       </label>

//       {isPassword && (
//         <button
//           type="button"
//           onClick={() => setShowPassword(!showPassword)}
//           className="absolute right-4 top-1/2 -translate-y-1/2 text-lime-700/50 hover:text-lime-600 dark:text-lime-300/50 dark:hover:text-lime-400 transition-colors z-10"
//           aria-label={showPassword ? "Hide password" : "Show password"}
//         >
//           {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
//         </button>
//       )}
//     </div>
//   );
// };

// export default function LoginPage() {
//   const t = useTranslations("Login");
//   const router = useRouter();
//   const redirectHandled = useRef(false);
//   const { theme, setTheme } = useTheme();
//   const { openModal } = useDevModal();
//   const [mounted, setMounted] = useState(false);

//   const [isLogin, setIsLogin] = useState(true);
//   const [email, setEmail] = useState("");
//   const [password, setPassword] = useState("");
//   const [name, setName] = useState("");
//   const [isLoading, setIsLoading] = useState(false);
  
//   const [errorState, setErrorState] = useState<ErrorState>(null);

//   const [tourStep, setTourStep] = useState(-1);
//   const [tourElementRect, setTourElementRect] = useState<DOMRect | null>(null);
//   const [showWelcomeModal, setShowWelcomeModal] = useState(false);

//   // ... (Tour logic, watermarks, and handleRedirect remain exactly as provided before) ...

//   return (
//     <div className="relative min-h-screen flex flex-col items-center justify-center font-sans bg-[#f0fdf4] dark:bg-[#050806] overflow-hidden px-4 py-8 transition-colors duration-300">
//       {/* ... Watermarks ... */}
      
//       {/* ... Tour Overlay ... */}

//       {/* ... Welcome Modal ... */}

//       <motion.div layout className="relative z-10 w-full max-w-md p-6 sm:p-8 bg-[#f4fbf5]/90 dark:bg-[#0a0f0b]/90 backdrop-blur-2xl border border-lime-500/20 dark:border-lime-500/10 rounded-3xl shadow-[0_8px_32px_0_rgba(132,204,22,0.15)] dark:shadow-[0_8px_32px_0_rgba(0,0,0,0.5)] transition-colors duration-300">
        
//         <div className="flex items-center justify-between mb-8 gap-4">
//           <div className="relative flex p-1 flex-1 bg-lime-100/50 dark:bg-[#050806]/80 rounded-full border border-lime-500/20 dark:border-lime-500/10 shadow-inner">
//             <motion.div className="absolute top-1 bottom-1 w-[calc(50%-4px)] bg-white dark:bg-[#121A14] rounded-full shadow-md" animate={{ x: isLogin ? 0 : "100%" }} transition={{ type: "spring", stiffness: 300, damping: 30 }} />
//             <button id="tour-toggle-login" type="button" onClick={() => { setIsLogin(true); setErrorState(null); }} className={`flex-1 relative z-10 py-2 text-sm font-bold transition-colors ${isLogin ? "text-lime-950 dark:text-lime-100" : "text-lime-700/60 dark:text-lime-400/60"}`}>{t("logIn")}</button>
//             <button id="tour-toggle-signup" type="button" onClick={() => { setIsLogin(false); setErrorState(null); }} className={`flex-1 relative z-10 py-2 text-sm font-bold transition-colors ${!isLogin ? "text-lime-950 dark:text-lime-100" : "text-lime-700/60 dark:text-lime-400/60"}`}>{t("signUp")}</button>
//           </div>

//           <HeaderActions 
//             hideNotifications={false} 
//             helpId="tour-play-btn"
//             themeId="tour-theme-btn"
//             userId="tour-user-icon"
//             onHelpClick={() => {}} 
//             onUserClick={() => openModal("User Profile")}
//             forceOpen={tourStep >= 0 && tourStep <= 2} 
//           />
//         </div>

//         <div className="text-center mb-6">
//           <h1 className="text-2xl font-extrabold text-lime-950 dark:text-[#ecfdf5] tracking-tight">{isLogin ? t("welcomeBack") : t("createAccount")}</h1>
//           <p className="text-sm text-lime-800/70 dark:text-lime-200/50 mt-1 font-medium">{isLogin ? t("enterDetails") : t("joinExchange")}</p>
//         </div>

//         <div className="relative overflow-hidden">
//           <AnimatePresence mode="wait" initial={false}>
//             <motion.form key={isLogin ? "login" : "signup"} initial={{ opacity: 0, x: isLogin ? -50 : 50 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: isLogin ? 50 : -50 }} transition={{ duration: 0.3, ease: "easeInOut" }} onSubmit={(e) => { /* handleEmailAuth(e) */ }} className="space-y-4 pt-2 pb-4">
              
//               {!isLogin && (
//                 <FloatingInput 
//                   id="name" type="text" value={name} 
//                   onChange={(e: ChangeEvent<HTMLInputElement>) => setName(e.target.value)} 
//                   label={t("fullName")} icon={<User size={14} />} 
//                 />
//               )}

//               <FloatingInput 
//                 id="tour-input-email" type="email" value={email} 
//                 onChange={(e: ChangeEvent<HTMLInputElement>) => setEmail(e.target.value)} 
//                 label={t("email")} icon={<Mail size={14} />} 
//               />

//               <FloatingInput 
//                 id="tour-input-password" type="password" value={password} 
//                 onChange={(e: ChangeEvent<HTMLInputElement>) => setPassword(e.target.value)} 
//                 label={t("password")} icon={<Lock size={14} />} 
//               />

//               <div className="flex flex-col gap-2 mt-6">
//                 <Button id="tour-submit-btn" type="submit" disabled={isLoading} className="cursor-pointer w-full h-12 bg-lime-600 hover:bg-lime-700 text-white font-bold text-base rounded-xl shadow-lg shadow-lime-600/20 transition-all">{isLoading ? "Processing..." : isLogin ? t("logIn") : t("signUp")}</Button>
//                 <Button id="tour-demo-btn" type="button" onClick={() => {}} variant="ghost" className="w-full h-10 text-lime-700 dark:text-lime-400  font-semibold hover:bg-lime-100 dark:hover:bg-[#121A14] rounded-xl transition-all flex cursor-pointer items-center justify-center gap-2"><PlayCircle size={18} /> {t("tryDemo")}</Button>
//               </div>
//             </motion.form>
//           </AnimatePresence>
//         </div>

//         <div className="relative flex items-center py-2 mt-2">
//           <div className="flex-grow border-t border-lime-500/20"></div>
//           <span className="flex-shrink-0 mx-4 text-lime-700/60 dark:text-lime-300/60 text-[10px] sm:text-xs font-bold uppercase tracking-wider">{t("orContinue")}</span>
//           <div className="flex-grow border-t border-lime-500/20"></div>
//         </div>

//         <div className="grid grid-cols-2 gap-3 mt-2">
//           <Button id="tour-google-btn" type="button" onClick={() => {}} disabled={isLoading} variant="secondary" className="cursor-pointer border-lime-500/30 dark:border-lime-500/20 bg-[#f4fbf5]/50 dark:bg-[#050806] hover:bg-white dark:hover:bg-[#121A14] text-lime-950 dark:text-white font-semibold rounded-xl h-11 shadow-sm flex items-center justify-center gap-2">
//             <svg className="w-5 h-5" viewBox="0 0 24 24"><path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/><path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/><path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/><path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/></svg> Google
//           </Button>
//           <Button id="tour-passkey-btn" type="button" onClick={() => {}} disabled={isLoading} variant="secondary" className="cursor-pointer border-lime-500/30 dark:border-lime-500/20 bg-[#f4fbf5]/50 dark:bg-[#050806] hover:bg-white dark:hover:bg-[#121A14] text-lime-950 dark:text-white font-semibold rounded-xl h-11 shadow-sm"><Fingerprint size={18} className="mr-2" /> Passkey</Button>
//         </div>
        
//       </motion.div>
      
//       {/* 👇 GAMIFIED ERROR MODAL */}
//       <AnimatePresence>
//         {errorState && (
//           <motion.div 
//             initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
//             className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
//           >
//             <motion.div 
//               initial={{ scale: 0.9, y: 20 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.9, y: 20 }}
//               className={`relative w-full max-w-sm bg-white dark:bg-[#121A14] rounded-3xl p-6 shadow-2xl border text-center ${
//                 errorState.type === 'server' ? 'border-orange-500/30' :
//                 errorState.type === 'suspended' ? 'border-red-500/30' :
//                 errorState.type === 'exists' ? 'border-rose-500/30' :
//                 errorState.type === 'missing' ? 'border-yellow-500/30' :
//                 'border-amber-500/30'
//               }`}
//             >
//               <button onClick={() => setErrorState(null)} className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200">
//                 <X size={20} />
//               </button>
              
//               <div className={`w-16 h-16 mx-auto rounded-full flex items-center justify-center mb-4 ${
//                 errorState.type === 'server' ? 'bg-orange-100 text-orange-500' :
//                 errorState.type === 'suspended' ? 'bg-red-100 text-red-500' :
//                 errorState.type === 'exists' ? 'bg-rose-100 text-rose-500' :
//                 errorState.type === 'missing' ? 'bg-yellow-100 text-yellow-500' :
//                 'bg-amber-100 text-amber-500'
//               }`}>
//                 {errorState.type === 'server' && <ServerCrash size={32} />}
//                 {errorState.type === 'suspended' && <ShieldAlert size={32} />}
//                 {errorState.type === 'exists' && <UserX size={32} />}
//                 {errorState.type === 'missing' && <AlertCircle size={32} />}
//                 {errorState.type === 'auth' && <KeyRound size={32} />}
//               </div>
              
//               <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-2">{errorState.title}</h2>
//               <p className="text-sm text-gray-500 dark:text-gray-400 mb-6">{errorState.message}</p>
              
//               <Button onClick={() => setErrorState(null)} className="w-full bg-lime-600 hover:bg-lime-700 text-white font-bold h-11 rounded-xl">
//                 Got it
//               </Button>
//             </motion.div>
//           </motion.div>
//         )}
//       </AnimatePresence>

//     </div>
//   );
// }

// // app/login/page.tsx
// "use client";

// import { useState, useEffect, useMemo, useRef, ChangeEvent } from "react";
// import { useRouter } from "next/navigation";
// import SettingsModal from "@/components/SettingsModal";
// import { motion, AnimatePresence } from "framer-motion";
// import { useDevModal } from "@/components/providers/DevModalProvider";
// import { useTheme } from "next-themes";
// import HeaderActions from "@/components/HeaderActions";
// import { signInWithPopup, getRedirectResult, signInWithCustomToken, GoogleAuthProvider } from "firebase/auth";
// import { startAuthentication } from "@simplewebauthn/browser";
// import { auth } from "@/lib/firebase-client";
// import { loginWithEmail, registerWithEmail, loginWithFirebase } from "@/app/actions/auth";
// import { getAuthenticationOptions, verifyAuthentication } from "@/app/actions/webauthn";
// import { Button } from "@/components/ui/Button";
// import { useTranslations } from "next-intl"; // 👈 Imported
// import { 
//   Fingerprint, Mail, Lock, User, PlayCircle, ChevronLeft, ChevronRight, 
//   Sparkles, X, Eye, EyeOff, ShieldAlert, KeyRound, ServerCrash, UserX, AlertCircle
// } from "lucide-react";

// const WATERMARK_SYMBOLS = [
//   "$", "€", "£", "¥", "₦", "₹", "₩", "₪", "₫", "₴", "₭", "₮", "₱", "฿", "₲", "₵", "₡", "₸", "₼", "₾", "֏", "؋", "৳", "៛", "₥", "₣", "₤", "₧", "₯", "₰", "₳", "₢", "₠", "₨", "₶", "₷", "₺", "₻", "₽", "₿", "C$", "A$", "R$", "S$", "HK$", "NT$", "NZ$", "CHF", "kr", "zł", "Kč", "Ft", "lei", "лв", "din", "ден", "L", "Q", "B/.", "₡", "₲", "Gs", "S/.", "Bs.", "$U", "RD$", "J$", "TT$", "Bds$", "EC$", "FJ$", "WS$", "T$", "VT", "K", "T", "₭", "₮", "៛", "₫", "Rp", "RM", "S$", "฿",
//   "Ξ", "Ð", "Ł", "Ƀ", "ȿ", "Μ", "◎", "Ꞩ", "✕", "ⓩ", "⧫", "Ɖ", "ɱ", "Ꝟ", "Ꝑ", "Ⓝ", "Ⓞ", "Ⓣ", "Ⓡ", "Ⓢ", "Ⓤ", "Ⓐ", "Ⓥ", "Ⓔ", "Ⓛ", "Ⓜ", "Ⓟ", "Ⓠ", "Ⓦ", "Ⓧ", "Ⓨ", "Ⓩ", "⓪", "①", "②", "③", "④", "⑤", "⑥", "⑦", "⑧", "⑨", "⑩", "♦", "◈", "⬡", "⬢", "◊", "⟁", "⧉", "⧈", "⌬", "⎔", "⏣", "⏥", "⏦", "✕", "✖", "☰", "⛓", "🔗", "🌐", "⚙️", "🧩", "🧮", "📈", "📉", "⚖️", "🛡️", "🔑", "🗝️", "🧊", "🔥", "💧", "🌪️", "🌍", "🪐", "☄️", "🛰️",
//   "🐕", "🐶", "🐱", "🐸", "🐵", "🦍", "🦊", "🐺", "🐻", "🐼", "🐨", "🐷", "🐮", "🐔", "🐧", "🦅", "🦄", "🐳", "🐋", "🦈", "🐙", "🦑", "🦀", "🦞", "🦐", "🐡", "🐠", "🐟", "🌙", "🚀", "💎", "🙌", "🔥", "🌕", "⭐", "🌟", "✨", "⚡", "💥", "💫", "🪙", "💰", "💸", "💵", "💴", "💶", "💷", "🍌", "🍕", "🍻", "🍼", "🧠", "👽", "🤖", "👻", "💀", "🤡", "🐂", "🐻", "🦍", "🐕‍🦺", "🦴", "🥩", "🍗", "🧀", "🌮", "🍔", "🍟", "🥑"
// ];

// // 👇 Types for the Gamified Error Modal
// type ErrorState = {
//   title: string;
//   message: string;
//   type: "auth" | "server" | "missing" | "suspended" | "exists";
// } | null;

// interface FloatingInputProps {
//   id: string;
//   type: string;
//   value: string;
//   onChange: (e: ChangeEvent<HTMLInputElement>) => void;
//   label: string;
//   icon: React.ReactNode;
// }

// const FloatingInput = ({ id, type, value, onChange, label, icon }: FloatingInputProps) => {
//   const [showPassword, setShowPassword] = useState(false);
//   const isPassword = type === "password";
//   const inputType = isPassword && showPassword ? "text" : type;

//   return (
//     <div id={id} className="relative">
//       <input 
//         type={inputType} 
//         id={id} 
//         value={value} 
//         onChange={onChange} 
//         placeholder=" " 
//         required 
//         className="peer w-full bg-[#f4fbf5] dark:bg-[#0a0f0b] border-2 border-lime-500/30 dark:border-lime-500/20 rounded-xl px-4 pr-12 pt-6 pb-2 text-lime-950 dark:text-white focus:outline-none focus:border-lime-500 transition-colors font-medium"
//       />
//       <label 
//         htmlFor={id} 
//         className="absolute left-3 top-4 text-lime-700/60 dark:text-lime-300/60 transition-all duration-200 pointer-events-none 
//                    peer-focus:-top-3 peer-focus:text-xs peer-focus:bg-[#f4fbf5] dark:peer-focus:bg-[#0a0f0b] peer-focus:px-1 peer-focus:text-lime-600
//                    peer-[:not(:placeholder-shown)]:-top-3 peer-[:not(:placeholder-shown)]:text-xs peer-[:not(:placeholder-shown)]:bg-[#f4fbf5] dark:peer-[:not(:placeholder-shown)]:bg-[#0a0f0b] peer-[:not(:placeholder-shown)]:px-1"
//       >
//         <div className="flex items-center gap-2">{icon} {label}</div>
//       </label>

//       {isPassword && (
//         <button
//           type="button"
//           onClick={() => setShowPassword(!showPassword)}
//           className="absolute right-4 top-1/2 -translate-y-1/2 text-lime-700/50 hover:text-lime-600 dark:text-lime-300/50 dark:hover:text-lime-400 transition-colors z-10"
//           aria-label={showPassword ? "Hide password" : "Show password"}
//         >
//           {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
//         </button>
//       )}
//     </div>
//   );
// };

// export default function LoginPage() {
//   const t = useTranslations("Login"); // 👈 Init translations
//   const [isSettingsOpen, setIsSettingsOpen] = useState(false);
//   const router = useRouter();
//   const redirectHandled = useRef(false);
//   const { theme, setTheme } = useTheme();
//   const { openModal } = useDevModal();
//   const [mounted, setMounted] = useState(false);

//   const [isLogin, setIsLogin] = useState(true);
//   const [email, setEmail] = useState("");
//   const [password, setPassword] = useState("");
//   const [name, setName] = useState("");
//   const [isLoading, setIsLoading] = useState(false);
  
//   const [errorState, setErrorState] = useState<ErrorState>(null);

//   const [tourStep, setTourStep] = useState(-1);
//   const [tourElementRect, setTourElementRect] = useState<DOMRect | null>(null);
//   const [showWelcomeModal, setShowWelcomeModal] = useState(false);

//   // ... (Tour logic, watermarks, and handleRedirect remain exactly as provided before) ...
//   // For brevity, I am keeping the logic intact but not repeating it here in the explanation.
//   // The full code is in the previous message.

//   return (
//     <div className="relative min-h-screen flex flex-col items-center justify-center font-sans bg-[#f0fdf4] dark:bg-[#050806] overflow-hidden px-4 py-8 transition-colors duration-300">
//       {/* ... Watermarks ... */}
      
//       {/* ... Tour Overlay ... */}

//       {/* ... Welcome Modal ... */}

//       <motion.div layout className="relative z-10 w-full max-w-md p-6 sm:p-8 bg-[#f4fbf5]/90 dark:bg-[#0a0f0b]/90 backdrop-blur-2xl border border-lime-500/20 dark:border-lime-500/10 rounded-3xl shadow-[0_8px_32px_0_rgba(132,204,22,0.15)] dark:shadow-[0_8px_32px_0_rgba(0,0,0,0.5)] transition-colors duration-300">
        
//         <div className="flex items-center justify-between mb-8 gap-4">
//           <div className="relative flex p-1 flex-1 bg-lime-100/50 dark:bg-[#050806]/80 rounded-full border border-lime-500/20 dark:border-lime-500/10 shadow-inner">
//             <motion.div className="absolute top-1 bottom-1 w-[calc(50%-4px)] bg-white dark:bg-[#121A14] rounded-full shadow-md" animate={{ x: isLogin ? 0 : "100%" }} transition={{ type: "spring", stiffness: 300, damping: 30 }} />
//             <button id="tour-toggle-login" type="button" onClick={() => { setIsLogin(true); setErrorState(null); }} className={`flex-1 relative z-10 py-2 text-sm font-bold transition-colors ${isLogin ? "text-lime-950 dark:text-lime-100" : "text-lime-700/60 dark:text-lime-400/60"}`}>{t("logIn")}</button>
//             <button id="tour-toggle-signup" type="button" onClick={() => { setIsLogin(false); setErrorState(null); }} className={`flex-1 relative z-10 py-2 text-sm font-bold transition-colors ${!isLogin ? "text-lime-950 dark:text-lime-100" : "text-lime-700/60 dark:text-lime-400/60"}`}>{t("signUp")}</button>
//           </div>

//           <HeaderActions 
//             hideNotifications={false} 
//             helpId="tour-play-btn"
//             themeId="tour-theme-btn"
//             userId="tour-user-icon"
//             onHelpClick={() => {}} // Tour logic here
//             onUserClick={() => openModal("User Profile")}
//             onSettingsClick={() => setIsSettingsOpen(true)} // 👈 Opens Settings
//             forceOpen={tourStep >= 0 && tourStep <= 2} 
//           />
//         </div>

//         <div className="text-center mb-6">
//           <h1 className="text-2xl font-extrabold text-lime-950 dark:text-[#ecfdf5] tracking-tight">{isLogin ? t("welcomeBack") : t("createAccount")}</h1>
//           <p className="text-sm text-lime-800/70 dark:text-lime-200/50 mt-1 font-medium">{isLogin ? t("enterDetails") : t("joinExchange")}</p>
//         </div>

//         <div className="relative overflow-hidden">
//           <AnimatePresence mode="wait" initial={false}>
//             <motion.form key={isLogin ? "login" : "signup"} initial={{ opacity: 0, x: isLogin ? -50 : 50 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: isLogin ? 50 : -50 }} transition={{ duration: 0.3, ease: "easeInOut" }} onSubmit={(e) => { /* handleEmailAuth(e) */ }} className="space-y-4 pt-2 pb-4">
              
//               {!isLogin && (
//                 <FloatingInput 
//                   id="name" type="text" value={name} 
//                   onChange={(e: ChangeEvent<HTMLInputElement>) => setName(e.target.value)} 
//                   label={t("fullName")} icon={<User size={14} />} 
//                 />
//               )}

//               <FloatingInput 
//                 id="tour-input-email" type="email" value={email} 
//                 onChange={(e: ChangeEvent<HTMLInputElement>) => setEmail(e.target.value)} 
//                 label={t("email")} icon={<Mail size={14} />} 
//               />

//               <FloatingInput 
//                 id="tour-input-password" type="password" value={password} 
//                 onChange={(e: ChangeEvent<HTMLInputElement>) => setPassword(e.target.value)} 
//                 label={t("password")} icon={<Lock size={14} />} 
//               />

//               <div className="flex flex-col gap-2 mt-6">
//                 <Button id="tour-submit-btn" type="submit" disabled={isLoading} className="cursor-pointer w-full h-12 bg-lime-600 hover:bg-lime-700 text-white font-bold text-base rounded-xl shadow-lg shadow-lime-600/20 transition-all">{isLoading ? "Processing..." : isLogin ? t("logIn") : t("signUp")}</Button>
//                 <Button id="tour-demo-btn" type="button" onClick={() => {}} variant="ghost" className="w-full h-10 text-lime-700 dark:text-lime-400  font-semibold hover:bg-lime-100 dark:hover:bg-[#121A14] rounded-xl transition-all flex cursor-pointer items-center justify-center gap-2"><PlayCircle size={18} /> {t("tryDemo")}</Button>
//               </div>
//             </motion.form>
//           </AnimatePresence>
//         </div>

//         <div className="relative flex items-center py-2 mt-2">
//           <div className="flex-grow border-t border-lime-500/20"></div>
//           <span className="flex-shrink-0 mx-4 text-lime-700/60 dark:text-lime-300/60 text-[10px] sm:text-xs font-bold uppercase tracking-wider">{t("orContinue")}</span>
//           <div className="flex-grow border-t border-lime-500/20"></div>
//         </div>

//         <div className="grid grid-cols-2 gap-3 mt-2">
//           <Button id="tour-google-btn" type="button" onClick={() => {}} disabled={isLoading} variant="secondary" className="cursor-pointer border-lime-500/30 dark:border-lime-500/20 bg-[#f4fbf5]/50 dark:bg-[#050806] hover:bg-white dark:hover:bg-[#121A14] text-lime-950 dark:text-white font-semibold rounded-xl h-11 shadow-sm flex items-center justify-center gap-2">
//             <svg className="w-5 h-5" viewBox="0 0 24 24"><path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/><path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/><path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/><path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/></svg> Google
//           </Button>
//           <Button id="tour-passkey-btn" type="button" onClick={() => {}} disabled={isLoading} variant="secondary" className="cursor-pointer border-lime-500/30 dark:border-lime-500/20 bg-[#f4fbf5]/50 dark:bg-[#050806] hover:bg-white dark:hover:bg-[#121A14] text-lime-950 dark:text-white font-semibold rounded-xl h-11 shadow-sm"><Fingerprint size={18} className="mr-2" /> Passkey</Button>
//         </div>
        
//       </motion.div>

//       {/* 👇 Settings Modal is now properly wired */}
//       <SettingsModal 
//         isOpen={isSettingsOpen} 
//         onClose={() => setIsSettingsOpen(false)} 
//       />
      
//       {/* 👇 GAMIFIED ERROR MODAL */}
//       <AnimatePresence>
//         {errorState && (
//           <motion.div 
//             initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
//             className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
//           >
//             <motion.div 
//               initial={{ scale: 0.9, y: 20 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.9, y: 20 }}
//               className={`relative w-full max-w-sm bg-white dark:bg-[#121A14] rounded-3xl p-6 shadow-2xl border text-center ${
//                 errorState.type === 'server' ? 'border-orange-500/30' :
//                 errorState.type === 'suspended' ? 'border-red-500/30' :
//                 errorState.type === 'exists' ? 'border-rose-500/30' :
//                 errorState.type === 'missing' ? 'border-yellow-500/30' :
//                 'border-amber-500/30'
//               }`}
//             >
//               <button onClick={() => setErrorState(null)} className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200">
//                 <X size={20} />
//               </button>
              
//               <div className={`w-16 h-16 mx-auto rounded-full flex items-center justify-center mb-4 ${
//                 errorState.type === 'server' ? 'bg-orange-100 text-orange-500' :
//                 errorState.type === 'suspended' ? 'bg-red-100 text-red-500' :
//                 errorState.type === 'exists' ? 'bg-rose-100 text-rose-500' :
//                 errorState.type === 'missing' ? 'bg-yellow-100 text-yellow-500' :
//                 'bg-amber-100 text-amber-500'
//               }`}>
//                 {errorState.type === 'server' && <ServerCrash size={32} />}
//                 {errorState.type === 'suspended' && <ShieldAlert size={32} />}
//                 {errorState.type === 'exists' && <UserX size={32} />}
//                 {errorState.type === 'missing' && <AlertCircle size={32} />}
//                 {errorState.type === 'auth' && <KeyRound size={32} />}
//               </div>
              
//               <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-2">{errorState.title}</h2>
//               <p className="text-sm text-gray-500 dark:text-gray-400 mb-6">{errorState.message}</p>
              
//               <Button onClick={() => setErrorState(null)} className="w-full bg-lime-600 hover:bg-lime-700 text-white font-bold h-11 rounded-xl">
//                 Got it
//               </Button>
//             </motion.div>
//           </motion.div>
//         )}
//       </AnimatePresence>

//     </div>
//   );
// }