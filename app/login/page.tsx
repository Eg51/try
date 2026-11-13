// app/login/page.tsx
"use client";

import { useState, useEffect, useRef, ChangeEvent } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { useDevModal } from "@/components/providers/DevModalProvider";
import HeaderActions from "@/components/HeaderActions";
import WatermarkBackground from "@/components/WatermarkBackground";
import { signInWithPopup, getRedirectResult, signInWithCustomToken, GoogleAuthProvider } from "firebase/auth";
import { startAuthentication } from "@simplewebauthn/browser";
import { auth } from "@/lib/firebase-client";
import { loginWithEmail, registerWithEmail, loginWithFirebase } from "@/app/actions/auth";
import { getAuthenticationOptions, verifyAuthentication } from "@/app/actions/webauthn";
import { Button } from "@/components/ui/Button";
import { useTranslations } from "next-intl"; 
import { 
  Fingerprint, Mail, Lock, User, PlayCircle, 
  Sparkles, X, Eye, EyeOff, ShieldAlert, KeyRound, ServerCrash, UserX, AlertCircle,
  LineChart, Gamepad2, ShieldCheck, ArrowRight,
  Bitcoin, Gem, Hexagon, CheckCircle2
} from "lucide-react";

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
        className="peer w-full bg-[#f4fbf5] dark:bg-[#0a0f0b] border-2 border-lime-500/30 dark:border-lime-500/20 rounded-xl px-4 pr-12 pt-6 pb-2 text-lime-950 dark:text-white focus:outline-none focus:border-lime-500 transition-colors font-medium shadow-sm
                   [&:-webkit-autofill]:[-webkit-text-fill-color:#052e16]
                   [&:-webkit-autofill]:[-webkit-box-shadow:0_0_0_30px_#f4fbf5_inset]
                   dark:[&:-webkit-autofill]:[-webkit-text-fill-color:#ffffff]
                   dark:[&:-webkit-autofill]:[-webkit-box-shadow:0_0_0_30px_#0a0f0b_inset]
                   [&:-webkit-autofill]:[transition:background-color_5000s_ease-in-out_0s]"
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
  const [isSuccess, setIsSuccess] = useState(false);
  
  const [errorState, setErrorState] = useState<ErrorState>(null);

  const [tourStep, setTourStep] = useState(-1);
  const [showWelcomeModal, setShowWelcomeModal] = useState(false);

  useEffect(() => setMounted(true), []);

  // Helper: Map Firebase errors to user-friendly messages
  const getFriendlyError = (errorCode: string) => {
    switch (errorCode) {
      case "auth/invalid-credential":
      case "auth/user-not-found":
      case "auth/wrong-password":
        return "Invalid email or password. Please try again.";
      case "auth/email-already-in-use":
        return "An account with this email already exists.";
      case "auth/weak-password":
        return "Password must be at least 6 characters long.";
      case "auth/too-many-requests":
        return "Too many failed attempts. Please try again later.";
      case "auth/popup-closed-by-user":
        return "Sign-in popup was closed before completion.";
      default:
        return "An unexpected error occurred. Please try again.";
    }
  };

  // Helper: Handle successful login and redirect
  const handleSuccess = () => {
    setIsSuccess(true);
    setTimeout(() => {
      router.push("/dashboard");
    }, 1000);
  };

  useEffect(() => {
    getRedirectResult(auth)
      .then(async (result) => {
        if (result?.user && !redirectHandled.current) {
          redirectHandled.current = true;
          setIsLoading(true);
          const idToken = await result.user.getIdToken();
          const res = await loginWithFirebase({ token: idToken });
          if (res.success) {
            handleSuccess();
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

  const handleEmailAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorState(null);

    // Validation
    if (!email.includes("@")) {
      setErrorState({ title: "Invalid Email", message: "Please enter a valid email address.", type: "auth" });
      return;
    }
    if (password.length < 6) {
      setErrorState({ title: "Weak Password", message: "Password must be at least 6 characters.", type: "auth" });
      return;
    }

    setIsLoading(true);

    try {
      const action = isLogin ? loginWithEmail : registerWithEmail;
      const payload = isLogin ? { email, password } : { email, password, name };
      
      const res = await action(payload);

      if (res.error) {
        setErrorState({ title: isLogin ? "Login Failed" : "Registration Failed", message: res.error, type: "auth" });
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
        handleSuccess();
      }
    } catch (error: any) {
      setErrorState({ title: "System Error", message: getFriendlyError(error.code), type: "server" });
      setIsLoading(false);
    }
  };

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
      handleSuccess();
    } catch (error: any) {
      setErrorState({ title: "Google Auth Failed", message: getFriendlyError(error.code), type: "auth" });
      setIsLoading(false);
    }
  };

  const handlePasskeyAuth = async () => {
    setIsLoading(true);
    setErrorState(null);
    try {
      const options = await getAuthenticationOptions();
      const assertion = await startAuthentication({ optionsJSON: options as any });
      const res = await verifyAuthentication(assertion);
      
      if (!res.success) {
        setErrorState({ title: "Passkey Failed", message: res.error, type: "auth" });
        setIsLoading(false);
        return;
      }

      const userCredential = await signInWithCustomToken(auth, res.customToken);
      const idToken = await userCredential.user.getIdToken();
      const finalRes = await loginWithFirebase({ token: idToken });
      if (finalRes.error) {
        setErrorState({ title: "Session Error", message: finalRes.error, type: "server" });
        setIsLoading(false);
        return;
      }
      handleSuccess();
    } catch (error: any) {
      if (error.name === "NotAllowedError") {
        setErrorState({ title: "Cancelled", message: "Biometric prompt was cancelled.", type: "auth" });
      } else {
        setErrorState({ title: "Passkey Error", message: "Failed to authenticate with Passkey.", type: "auth" });
      }
      setIsLoading(false);
    }
  };

  if (!mounted) return null;

  return (
    <div className="relative min-h-screen w-full flex flex-col md:flex-row bg-[#f0fdf4] dark:bg-[#050806] overflow-hidden">
      
      {/* 👇 1. DIAGONAL BACKGROUND SPLIT & ANIMATED ICONS */}
      <div 
        className="hidden md:block absolute inset-0 z-0 pointer-events-none"
        // style={{ clipPath: 'polygon(65% 28%, 90% 0, 100% 100%, 0 110%)' }}
        style={{ clipPath: 'polygon(100% 0, 100% 100%, 0 100%)' }}
      >
        <div className="absolute inset-0 bg-[#0a0f0b]">
          {/* Abstract Background Graphics */}
          <div className="absolute -top-40 -right-40 w-[800px] h-[800px] bg-lime-500/10 rounded-full blur-[100px]"></div>
          <div className="absolute -bottom-40 -left-40 w-[800px] h-[800px] bg-green-500/10 rounded-full blur-[100px]"></div>
          <div className="absolute inset-0 bg-[linear-gradient(to_right,#84cc1615_1px,transparent_1px),linear-gradient(to_bottom,#84cc1615_1px,transparent_1px)] bg-[size:4rem_4rem] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_50%,#000_70%,transparent_100%)]"></div>
          
          {/* Smooth glowing edge along the diagonal */}
          <div className="absolute top-0 bottom-0 left-0 w-[3px] bg-gradient-to-b from-lime-500/80 via-green-500/30 to-transparent shadow-[0_0_20px_rgba(132,204,22,0.5)]"></div>

          {/* ANIMATED REACT ICONS */}
          <motion.div animate={{ y: [0, -30, 0], rotate: [0, 10, 0] }} transition={{ repeat: Infinity, duration: 8, ease: "easeInOut" }} className="absolute top-[15%] right-[15%] text-lime-500/10">
            <Bitcoin size={160} />
          </motion.div>
          <motion.div animate={{ y: [0, 40, 0], rotate: [0, -15, 0] }} transition={{ repeat: Infinity, duration: 10, ease: "easeInOut", delay: 1 }} className="absolute bottom-[20%] right-[5%] text-green-500/10">
            <Gem size={180} />
          </motion.div>
          <motion.div animate={{ y: [0, -20, 0], x: [0, 20, 0] }} transition={{ repeat: Infinity, duration: 7, ease: "easeInOut", delay: 2 }} className="absolute top-[40%] right-[35%] text-lime-400/10">
            <LineChart size={140} />
          </motion.div>
          <motion.div animate={{ scale: [1, 1.1, 1], rotate: [0, 45, 0] }} transition={{ repeat: Infinity, duration: 12, ease: "easeInOut", delay: 0.5 }} className="absolute bottom-[10%] left-[25%] text-green-400/10">
            <Hexagon size={130} />
          </motion.div>
        </div>
      </div>

      {/* 👇 2. WATERMARK BACKGROUND (Spans Entire Screen over the diagonal) */}
      <div className="absolute inset-0 z-[1] pointer-events-none">
         <WatermarkBackground />
      </div>

      {/* 👇 3. HEADER ACTIONS (Completely transparent) */}
      <div className="absolute top-4 right-4 sm:top-8 sm:right-8 z-50">
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

      {/* 👇 4. LEFT SIDE: FORM */}
      <div className="flex-1 flex flex-col items-center justify-center p-4 sm:p-8 relative z-10 py-12 md:py-0 min-h-screen md:min-h-0 w-full md:w-[55%]">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="w-full max-w-md p-6 sm:p-8 bg-[#f4fbf5]/95 dark:bg-[#0a0f0b]/95 backdrop-blur-3xl border border-lime-500/20 dark:border-lime-500/10 rounded-3xl shadow-[0_8px_32px_0_rgba(132,204,22,0.15)] dark:shadow-[0_8px_32px_0_rgba(0,0,0,0.5)] transition-colors duration-300"
        >
          
          <div className="relative flex p-1 mb-8 bg-lime-100/50 dark:bg-[#050806]/80 rounded-full border border-lime-500/20 dark:border-lime-500/10 shadow-inner">
            <motion.div className="absolute top-1 bottom-1 w-[calc(50%-4px)] bg-white dark:bg-[#121A14] rounded-full shadow-md" animate={{ x: isLogin ? 0 : "100%" }} transition={{ type: "spring", stiffness: 300, damping: 30 }} />
            <button id="tour-toggle-login" type="button" onClick={() => { setIsLogin(true); setErrorState(null); }} className={`flex-1 relative z-10 py-2 text-sm font-bold transition-colors ${isLogin ? "text-lime-950 dark:text-lime-100" : "text-lime-700/60 dark:text-lime-400/60"}`}>{t("logIn")}</button>
            <button id="tour-toggle-signup" type="button" onClick={() => { setIsLogin(false); setErrorState(null); }} className={`flex-1 relative z-10 py-2 text-sm font-bold transition-colors ${!isLogin ? "text-lime-950 dark:text-lime-100" : "text-lime-700/60 dark:text-lime-400/60"}`}>{t("signUp")}</button>
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
                    disabled={isLoading || isSuccess} 
                    className={`cursor-pointer w-full h-12 text-white font-bold text-base rounded-xl shadow-lg transition-all disabled:opacity-70 flex items-center justify-center gap-2 ${
                      isSuccess ? "bg-green-500 shadow-green-500/20" : "bg-lime-600 hover:bg-lime-700 shadow-lime-600/20"
                    }`}
                  >
                    {isSuccess ? (
                      <><CheckCircle2 size={20} /> Success! Redirecting...</>
                    ) : isLoading ? (
                      "Processing..."
                    ) : (
                      isLogin ? t("logIn") : t("signUp")
                    )}
                  </Button>
                  <Button 
                    id="tour-demo-btn" 
                    type="button" 
                    onClick={() => router.push("/demo")} 
                    variant="ghost" 
                    disabled={isLoading || isSuccess}
                    className="w-full h-10 text-lime-700 dark:text-lime-400 font-semibold hover:bg-lime-100 dark:hover:bg-[#121A14] rounded-xl transition-all flex cursor-pointer items-center justify-center gap-2 disabled:opacity-50"
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
              disabled={isLoading || isSuccess} 
              variant="secondary" 
              className="cursor-pointer border-lime-500/30 dark:border-lime-500/20 bg-[#f4fbf5]/50 dark:bg-[#050806] hover:bg-white dark:hover:bg-[#121A14] text-lime-950 dark:text-white font-semibold rounded-xl h-11 shadow-sm flex items-center justify-center gap-2 disabled:opacity-50"
            >
              <svg className="w-5 h-5" viewBox="0 0 24 24"><path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/><path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/><path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/><path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/></svg> Google
            </Button>
            <Button 
              id="tour-passkey-btn" 
              type="button" 
              onClick={handlePasskeyAuth} 
              disabled={isLoading || isSuccess} 
              variant="secondary" 
              className="cursor-pointer border-lime-500/30 dark:border-lime-500/20 bg-[#f4fbf5]/50 dark:bg-[#050806] hover:bg-white dark:hover:bg-[#121A14] text-lime-950 dark:text-white font-semibold rounded-xl h-11 shadow-sm disabled:opacity-50"
            >
              <Fingerprint size={18} className="mr-2" /> Passkey
            </Button>
          </div>
          
        </motion.div>
      </div>

      {/* 👇 5. RIGHT SIDE: TEXT CONTENT */}
      <div className="hidden md:flex w-[45%] relative z-10 flex-col justify-center px-8 lg:px-12 xl:px-16">
        <motion.div 
          initial={{ opacity: 0, x: 50 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.8, ease: "easeOut" }}
          className="relative z-10 max-w-md ml-auto w-full"
        >
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-none border-none text-lime-400 text-xs font-bold uppercase tracking-widest mb-6">
            <Sparkles size={14} /> The Future of Trading
          </div>
          
          <h1 className="text-3xl lg:text-4xl xl:text-5xl font-extrabold bg-clip-text bg-gradient-to-r from-lime-400 to-green-500 to-lime-400 tracking-tight leading-[1.1] mb-6">
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-lime-400 to-green-500">
              Build your wealth
            </span><br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-lime-400 to-green-500">
              faster and safer.
            </span>
          </h1>
          
          <p className="text-sm lg:text-base text-lime-400 font-bold mb-10 leading-relaxed">
            Experience up to 2x throughput, enhanced scalability, and unmatched resilience on the world's first gamified commodity exchange.
          </p>

          <div className="space-y-6">
            <div className="flex items-start gap-4">
              <div className="p-2 bg-white/5 rounded-xl border border-white/10 text-lime-400 shrink-0">
                <LineChart size={20} />
              </div>
              <div>
                <h3 className="text-white font-bold text-sm lg:text-base mb-1">Institutional Grade Markets</h3>
                <p className="text-xs lg:text-sm text-gray-400">Trade crypto, commodities, and local goods with deep liquidity.</p>
              </div>
            </div>

            <div className="flex items-start gap-4">
              <div className="p-2 bg-white/5 rounded-xl border border-white/10 text-lime-400 shrink-0">
                <Gamepad2 size={20} />
              </div>
              <div>
                <h3 className="text-white font-bold text-sm lg:text-base mb-1">Gamified Earning</h3>
                <p className="text-xs lg:text-sm text-gray-400">Earn XP, unlock rewards, and level up your trading journey.</p>
              </div>
            </div>

            <div className="flex items-start gap-4">
              <div className="p-2 bg-white/5 rounded-xl border border-white/10 text-lime-400 shrink-0">
                <ShieldCheck size={20} />
              </div>
              <div>
                <h3 className="text-white font-bold text-sm lg:text-base mb-1">Bank-Level Security</h3>
                <p className="text-xs lg:text-sm text-gray-400">Protected by Passkeys, 2FA, and advanced encryption protocols.</p>
              </div>
            </div>
          </div>

          <div className="mt-12">
            <button className="flex items-center gap-2 text-sm font-bold text-lime-400 hover:text-lime-300 transition-colors group">
              Explore the platform 
              <ArrowRight size={16} className="group-hover:translate-x-1 transition-transform" />
            </button>
          </div>
        </motion.div>
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

// import { useState, useEffect, useRef, ChangeEvent } from "react";
// import { useRouter } from "next/navigation";
// import { motion, AnimatePresence } from "framer-motion";
// import { useDevModal } from "@/components/providers/DevModalProvider";
// import HeaderActions from "@/components/HeaderActions";
// import WatermarkBackground from "@/components/WatermarkBackground"; // 👈 Imported here
// import { signInWithPopup, getRedirectResult, signInWithCustomToken, GoogleAuthProvider } from "firebase/auth";
// import { startAuthentication } from "@simplewebauthn/browser";
// import { auth } from "@/lib/firebase-client";
// import { loginWithEmail, registerWithEmail, loginWithFirebase } from "@/app/actions/auth";
// import { getAuthenticationOptions, verifyAuthentication } from "@/app/actions/webauthn";
// import { Button } from "@/components/ui/Button";
// import { useTranslations } from "next-intl"; 
// import { 
//   Fingerprint, Mail, Lock, User, PlayCircle, 
//   Sparkles, X, Eye, EyeOff, ShieldAlert, KeyRound, ServerCrash, UserX, AlertCircle,
//   TrendingUp, Globe
// } from "lucide-react";

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
//         className="peer w-full bg-[#f4fbf5] dark:bg-[#0a0f0b] border-2 border-lime-500/30 dark:border-lime-500/20 rounded-xl px-4 pr-12 pt-6 pb-2 text-lime-950 dark:text-white focus:outline-none focus:border-lime-500 transition-colors font-medium shadow-sm"
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
//   const { openModal } = useDevModal();
//   const [mounted, setMounted] = useState(false);

//   const [isLogin, setIsLogin] = useState(true);
//   const [email, setEmail] = useState("");
//   const [password, setPassword] = useState("");
//   const [name, setName] = useState("");
//   const [isLoading, setIsLoading] = useState(false);
  
//   const [errorState, setErrorState] = useState<ErrorState>(null);

//   const [tourStep, setTourStep] = useState(-1);
//   const [showWelcomeModal, setShowWelcomeModal] = useState(false);

//   useEffect(() => setMounted(true), []);

//   // 👇 HANDLE FIREBASE REDIRECT RESULT (For Google Sign-in on mobile)
//   useEffect(() => {
//     getRedirectResult(auth)
//       .then(async (result) => {
//         if (result?.user && !redirectHandled.current) {
//           redirectHandled.current = true;
//           setIsLoading(true);
//           const idToken = await result.user.getIdToken();
//           const res = await loginWithFirebase({ token: idToken });
//           if (res.success) {
//             router.push("/dashboard");
//           } else {
//             setErrorState({ title: "Redirect Login Failed", message: res.error || "Please try again.", type: "auth" });
//             setIsLoading(false);
//           }
//         }
//       })
//       .catch((err) => {
//         console.error("Redirect error:", err);
//         setIsLoading(false);
//       });
//   }, [router]);

//   // 👇 SHOW WELCOME MODAL FOR FIRST-TIME VISITORS
//   useEffect(() => {
//     if (!mounted) return;
//     const hasSeenWelcome = localStorage.getItem("quantix_welcome_seen");
//     if (!hasSeenWelcome) {
//       const timer = setTimeout(() => setShowWelcomeModal(true), 1500);
//       return () => clearTimeout(timer);
//     }
//   }, [mounted]);

//   const dismissWelcome = () => {
//     setShowWelcomeModal(false);
//     localStorage.setItem("quantix_welcome_seen", "true");
//   };

//   // 👇 EMAIL / PASSWORD AUTH
//   const handleEmailAuth = async (e: React.FormEvent) => {
//     e.preventDefault();
//     setIsLoading(true);
//     setErrorState(null);

//     try {
//       const action = isLogin ? loginWithEmail : registerWithEmail;
//       const payload = isLogin ? { email, password } : { email, password, name };
      
//       const res = await action(payload);

//       if (res.error) {
//         setErrorState({ 
//           title: isLogin ? "Login Failed" : "Registration Failed", 
//           message: res.error, 
//           type: "auth" 
//         });
//         setIsLoading(false);
//         return;
//       }

//       if (res.customToken) {
//         const userCredential = await signInWithCustomToken(auth, res.customToken);
//         const idToken = await userCredential.user.getIdToken();
        
//         const finalRes = await loginWithFirebase({ token: idToken });
        
//         if (finalRes.error) {
//           setErrorState({ title: "Session Error", message: finalRes.error, type: "server" });
//           setIsLoading(false);
//           return;
//         }

//         router.push("/dashboard");
//       }
//     } catch (error: any) {
//       setErrorState({ 
//         title: "System Error", 
//         message: error.message || "An unexpected error occurred.", 
//         type: "server" 
//       });
//       setIsLoading(false);
//     }
//   };

//   // 👇 GOOGLE AUTH
//   const handleGoogleAuth = async () => {
//     setIsLoading(true);
//     setErrorState(null);
//     try {
//       const provider = new GoogleAuthProvider();
//       const result = await signInWithPopup(auth, provider);
//       const idToken = await result.user.getIdToken();
      
//       const res = await loginWithFirebase({ token: idToken });
      
//       if (res.error) {
//         setErrorState({ title: "Google Auth Failed", message: res.error, type: "auth" });
//         setIsLoading(false);
//         return;
//       }
//       router.push("/dashboard");
//     } catch (error: any) {
//       setErrorState({ 
//         title: "Google Auth Failed", 
//         message: error.message || "Popup closed before completion.", 
//         type: "auth" 
//       });
//       setIsLoading(false);
//     }
//   };

//  // 👇 PASSKEY (WEBAUTHN) AUTH
//   const handlePasskeyAuth = async () => {
//     setIsLoading(true);
//     setErrorState(null);
//     try {
//       const options = await getAuthenticationOptions();
//       const assertion = await startAuthentication({ optionsJSON: options as any });
//       const res = await verifyAuthentication(assertion);
      
//       if (!res.success) {
//         setErrorState({ 
//           title: "Passkey Failed", 
//           message: res.error, 
//           type: "auth" 
//         });
//         setIsLoading(false);
//         return;
//       }

//       const userCredential = await signInWithCustomToken(auth, res.customToken);
//       const idToken = await userCredential.user.getIdToken();
      
//       const finalRes = await loginWithFirebase({ token: idToken });
//       if (finalRes.error) {
//         setErrorState({ title: "Session Error", message: finalRes.error, type: "server" });
//         setIsLoading(false);
//         return;
//       }
//       router.push("/dashboard");
//     } catch (error: any) {
//       if (error.name === "NotAllowedError") {
//         setErrorState({ title: "Cancelled", message: "Biometric prompt was cancelled.", type: "auth" });
//       } else {
//         setErrorState({ title: "Passkey Error", message: error.message || "Failed to authenticate.", type: "auth" });
//       }
//       setIsLoading(false);
//     }
//   };

//   if (!mounted) return null;

//   return (
//     <div className="relative min-h-screen flex flex-col lg:flex-row font-sans bg-[#f0fdf4] dark:bg-[#050806] transition-colors duration-300 overflow-hidden">
      
//       {/* 👇 NEW ANIMATED WATERMARK BACKGROUND */}
//       <WatermarkBackground />

//       {/* 👇 HEADER ACTIONS (Moved to global top-right) */}
//       <div className="absolute top-4 right-4 sm:top-8 sm:right-8 z-50">
//         <HeaderActions 
//           hideNotifications={false} 
//           helpId="tour-play-btn"
//           themeId="tour-theme-btn"
//           userId="tour-user-icon"
//           onHelpClick={() => {}} 
//           onUserClick={() => openModal("User Profile")}
//           forceOpen={tourStep >= 0 && tourStep <= 2} 
//         />
//       </div>

//       {/* 👇 LEFT SIDE: BRANDING (Hidden on Mobile) */}
//       <div className="hidden lg:flex w-1/2 relative z-10 flex-col justify-center px-12 xl:px-24">
//         <motion.div
//            initial={{ opacity: 0, x: -50 }}
//            animate={{ opacity: 1, x: 0 }}
//            transition={{ duration: 0.6, ease: "easeOut" }}
//         >
//           <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-lime-500/10 border border-lime-500/20 text-lime-600 dark:text-lime-400 text-xs font-bold uppercase tracking-widest mb-6">
//             <Sparkles size={14} /> The Future of Trading
//           </div>
//           <h1 className="text-5xl xl:text-7xl font-extrabold text-lime-950 dark:text-white tracking-tight leading-[1.1] mb-6">
//             Quantix <br />
//             <span className="text-transparent bg-clip-text bg-gradient-to-r from-lime-500 to-green-600">
//               Solaris
//             </span>
//           </h1>
//           <p className="text-lg text-lime-800/70 dark:text-lime-200/60 font-medium max-w-md mb-8 leading-relaxed">
//             The world's first highly gamified commodity and crypto exchange. Start with local goods, earn XP, and unlock institutional-grade markets.
//           </p>

//           <div className="flex gap-4">
//             <div className="flex items-center gap-3 bg-white/50 dark:bg-[#121A14]/50 p-3 rounded-2xl border border-lime-500/10 backdrop-blur-sm">
//                <div className="p-2 bg-lime-500/20 rounded-xl text-lime-600 dark:text-lime-400">
//                  <TrendingUp size={20} />
//                </div>
//                <div>
//                  <p className="text-sm font-bold text-lime-950 dark:text-white">$2.4B+</p>
//                  <p className="text-xs text-lime-800/60 dark:text-lime-200/50">Volume Traded</p>
//                </div>
//             </div>
//             <div className="flex items-center gap-3 bg-white/50 dark:bg-[#121A14]/50 p-3 rounded-2xl border border-lime-500/10 backdrop-blur-sm">
//                <div className="p-2 bg-lime-500/20 rounded-xl text-lime-600 dark:text-lime-400">
//                  <Globe size={20} />
//                </div>
//                <div>
//                  <p className="text-sm font-bold text-lime-950 dark:text-white">150+</p>
//                  <p className="text-xs text-lime-800/60 dark:text-lime-200/50">Countries</p>
//                </div>
//             </div>
//           </div>
//         </motion.div>
//       </div>

//       {/* 👇 RIGHT SIDE: LOGIN CARD */}
//       <div className="flex-1 flex flex-col items-center justify-center p-4 sm:p-8 relative z-10 min-h-screen lg:min-h-0 py-12 lg:py-0">
//         <motion.div 
//           initial={{ opacity: 0, y: 20 }}
//           animate={{ opacity: 1, y: 0 }}
//           transition={{ duration: 0.5 }}
//           className="w-full max-w-md p-6 sm:p-8 bg-[#f4fbf5]/90 dark:bg-[#0a0f0b]/90 backdrop-blur-2xl border border-lime-500/20 dark:border-lime-500/10 rounded-3xl shadow-[0_8px_32px_0_rgba(132,204,22,0.15)] dark:shadow-[0_8px_32px_0_rgba(0,0,0,0.5)] transition-colors duration-300"
//         >
          
//           {/* Toggle */}
//           <div className="relative flex p-1 mb-8 bg-lime-100/50 dark:bg-[#050806]/80 rounded-full border border-lime-500/20 dark:border-lime-500/10 shadow-inner">
//             <motion.div className="absolute top-1 bottom-1 w-[calc(50%-4px)] bg-white dark:bg-[#121A14] rounded-full shadow-md" animate={{ x: isLogin ? 0 : "100%" }} transition={{ type: "spring", stiffness: 300, damping: 30 }} />
//             <button id="tour-toggle-login" type="button" onClick={() => { setIsLogin(true); setErrorState(null); }} className={`flex-1 relative z-10 py-2 text-sm font-bold transition-colors ${isLogin ? "text-lime-950 dark:text-lime-100" : "text-lime-700/60 dark:text-lime-400/60"}`}>{t("logIn")}</button>
//             <button id="tour-toggle-signup" type="button" onClick={() => { setIsLogin(false); setErrorState(null); }} className={`flex-1 relative z-10 py-2 text-sm font-bold transition-colors ${!isLogin ? "text-lime-950 dark:text-lime-100" : "text-lime-700/60 dark:text-lime-400/60"}`}>{t("signUp")}</button>
//           </div>

//           <div className="text-center mb-6">
//             <h1 className="text-2xl font-extrabold text-lime-950 dark:text-[#ecfdf5] tracking-tight">{isLogin ? t("welcomeBack") : t("createAccount")}</h1>
//             <p className="text-sm text-lime-800/70 dark:text-lime-200/50 mt-1 font-medium">{isLogin ? t("enterDetails") : t("joinExchange")}</p>
//           </div>

//           <div className="relative overflow-hidden">
//             <AnimatePresence mode="wait" initial={false}>
//               <motion.form 
//                 key={isLogin ? "login" : "signup"} 
//                 initial={{ opacity: 0, x: isLogin ? -50 : 50 }} 
//                 animate={{ opacity: 1, x: 0 }} 
//                 exit={{ opacity: 0, x: isLogin ? 50 : -50 }} 
//                 transition={{ duration: 0.3, ease: "easeInOut" }} 
//                 onSubmit={handleEmailAuth} 
//                 className="space-y-4 pt-2 pb-4"
//               >
                
//                 {!isLogin && (
//                   <FloatingInput 
//                     id="name" type="text" value={name} 
//                     onChange={(e: ChangeEvent<HTMLInputElement>) => setName(e.target.value)} 
//                     label={t("fullName")} icon={<User size={14} />} 
//                   />
//                 )}

//                 <FloatingInput 
//                   id="tour-input-email" type="email" value={email} 
//                   onChange={(e: ChangeEvent<HTMLInputElement>) => setEmail(e.target.value)} 
//                   label={t("email")} icon={<Mail size={14} />} 
//                 />

//                 <FloatingInput 
//                   id="tour-input-password" type="password" value={password} 
//                   onChange={(e: ChangeEvent<HTMLInputElement>) => setPassword(e.target.value)} 
//                   label={t("password")} icon={<Lock size={14} />} 
//                 />

//                 <div className="flex flex-col gap-2 mt-6">
//                   <Button 
//                     id="tour-submit-btn" 
//                     type="submit" 
//                     disabled={isLoading} 
//                     className="cursor-pointer w-full h-12 bg-lime-600 hover:bg-lime-700 text-white font-bold text-base rounded-xl shadow-lg shadow-lime-600/20 transition-all disabled:opacity-50"
//                   >
//                     {isLoading ? "Processing..." : isLogin ? t("logIn") : t("signUp")}
//                   </Button>
//                   <Button 
//                     id="tour-demo-btn" 
//                     type="button" 
//                     onClick={() => router.push("/demo")} 
//                     variant="ghost" 
//                     className="w-full h-10 text-lime-700 dark:text-lime-400 font-semibold hover:bg-lime-100 dark:hover:bg-[#121A14] rounded-xl transition-all flex cursor-pointer items-center justify-center gap-2"
//                   >
//                     <PlayCircle size={18} /> {t("tryDemo")}
//                   </Button>
//                 </div>
//               </motion.form>
//             </AnimatePresence>
//           </div>

//           <div className="relative flex items-center py-2 mt-2">
//             <div className="flex-grow border-t border-lime-500/20"></div>
//             <span className="flex-shrink-0 mx-4 text-lime-700/60 dark:text-lime-300/60 text-[10px] sm:text-xs font-bold uppercase tracking-wider">{t("orContinue")}</span>
//             <div className="flex-grow border-t border-lime-500/20"></div>
//           </div>

//           <div className="grid grid-cols-2 gap-3 mt-2">
//             <Button 
//               id="tour-google-btn" 
//               type="button" 
//               onClick={handleGoogleAuth} 
//               disabled={isLoading} 
//               variant="secondary" 
//               className="cursor-pointer border-lime-500/30 dark:border-lime-500/20 bg-[#f4fbf5]/50 dark:bg-[#050806] hover:bg-white dark:hover:bg-[#121A14] text-lime-950 dark:text-white font-semibold rounded-xl h-11 shadow-sm flex items-center justify-center gap-2 disabled:opacity-50"
//             >
//               <svg className="w-5 h-5" viewBox="0 0 24 24"><path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/><path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/><path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/><path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/></svg> Google
//             </Button>
//             <Button 
//               id="tour-passkey-btn" 
//               type="button" 
//               onClick={handlePasskeyAuth} 
//               disabled={isLoading} 
//               variant="secondary" 
//               className="cursor-pointer border-lime-500/30 dark:border-lime-500/20 bg-[#f4fbf5]/50 dark:bg-[#050806] hover:bg-white dark:hover:bg-[#121A14] text-lime-950 dark:text-white font-semibold rounded-xl h-11 shadow-sm disabled:opacity-50"
//             >
//               <Fingerprint size={18} className="mr-2" /> Passkey
//             </Button>
//           </div>
          
//         </motion.div>
//       </div>

//       {/* 👇 WELCOME MODAL */}
//       <AnimatePresence>
//         {showWelcomeModal && (
//           <motion.div
//             initial={{ opacity: 0 }}
//             animate={{ opacity: 1 }}
//             exit={{ opacity: 0 }}
//             className="fixed inset-0 z-[150] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
//           >
//             <motion.div
//               initial={{ scale: 0.9, y: 20 }}
//               animate={{ scale: 1, y: 0 }}
//               exit={{ scale: 0.9, y: 20 }}
//               className="relative w-full max-w-md bg-[#f4fbf5]/95 dark:bg-[#0a0f0b]/95 backdrop-blur-2xl border border-lime-500/30 rounded-3xl p-8 shadow-2xl text-center"
//             >
//               <button onClick={dismissWelcome} className="absolute top-4 right-4 text-lime-600 hover:text-red-500 transition-colors">
//                 <X size={20} />
//               </button>
//               <div className="w-16 h-16 mx-auto bg-lime-500/20 rounded-2xl flex items-center justify-center mb-4">
//                 <Sparkles className="text-lime-600 dark:text-lime-400" size={32} />
//               </div>
//               <h2 className="text-2xl font-extrabold text-lime-950 dark:text-white mb-2">Welcome to Quantix Solaris</h2>
//               <p className="text-sm text-lime-800/70 dark:text-lime-200/60 mb-6 font-medium">
//                 The world's first highly gamified commodity and crypto exchange. Start with local goods, earn XP, and unlock institutional-grade markets.
//               </p>
//               <Button onClick={dismissWelcome} className="w-full h-12 bg-lime-600 hover:bg-lime-700 text-white font-bold rounded-xl shadow-lg shadow-lime-600/20">
//                 Let&apos;s Go!
//               </Button>
//             </motion.div>
//           </motion.div>
//         )}
//       </AnimatePresence>
      
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
// import { motion, AnimatePresence } from "framer-motion";
// import { useDevModal } from "@/components/providers/DevModalProvider";
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
//   Sparkles, X, Eye, EyeOff, ShieldAlert, KeyRound, ServerCrash, UserX, AlertCircle,
//   TrendingUp, Globe, Zap
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
//         className="peer w-full bg-[#f4fbf5] dark:bg-[#0a0f0b] border-2 border-lime-500/30 dark:border-lime-500/20 rounded-xl px-4 pr-12 pt-6 pb-2 text-lime-950 dark:text-white focus:outline-none focus:border-lime-500 transition-colors font-medium shadow-sm"
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
//   const { openModal } = useDevModal();
//   const [mounted, setMounted] = useState(false);

//   const [isLogin, setIsLogin] = useState(true);
//   const [email, setEmail] = useState("");
//   const [password, setPassword] = useState("");
//   const [name, setName] = useState("");
//   const [isLoading, setIsLoading] = useState(false);
  
//   const [errorState, setErrorState] = useState<ErrorState>(null);

//   const [tourStep, setTourStep] = useState(-1);
//   const [showWelcomeModal, setShowWelcomeModal] = useState(false);

//   // 👇 WATERMARK GENERATION (deterministic, no hydration errors)
//   const watermarks = useMemo(() => {
//     return Array.from({ length: 64 }).map((_, i) => ({
//       symbol: WATERMARK_SYMBOLS[i % WATERMARK_SYMBOLS.length],
//       rotation: ((i * 15) % 60) - 30,
//     }));
//   }, []);

//   useEffect(() => setMounted(true), []);

//   // 👇 HANDLE FIREBASE REDIRECT RESULT (For Google Sign-in on mobile)
//   useEffect(() => {
//     getRedirectResult(auth)
//       .then(async (result) => {
//         if (result?.user && !redirectHandled.current) {
//           redirectHandled.current = true;
//           setIsLoading(true);
//           const idToken = await result.user.getIdToken();
//           const res = await loginWithFirebase({ token: idToken });
//           if (res.success) {
//             router.push("/dashboard");
//           } else {
//             setErrorState({ title: "Redirect Login Failed", message: res.error || "Please try again.", type: "auth" });
//             setIsLoading(false);
//           }
//         }
//       })
//       .catch((err) => {
//         console.error("Redirect error:", err);
//         setIsLoading(false);
//       });
//   }, [router]);

//   // 👇 SHOW WELCOME MODAL FOR FIRST-TIME VISITORS
//   useEffect(() => {
//     if (!mounted) return;
//     const hasSeenWelcome = localStorage.getItem("quantix_welcome_seen");
//     if (!hasSeenWelcome) {
//       const timer = setTimeout(() => setShowWelcomeModal(true), 1500);
//       return () => clearTimeout(timer);
//     }
//   }, [mounted]);

//   const dismissWelcome = () => {
//     setShowWelcomeModal(false);
//     localStorage.setItem("quantix_welcome_seen", "true");
//   };

//   // 👇 EMAIL / PASSWORD AUTH
//   const handleEmailAuth = async (e: React.FormEvent) => {
//     e.preventDefault();
//     setIsLoading(true);
//     setErrorState(null);

//     try {
//       const action = isLogin ? loginWithEmail : registerWithEmail;
//       const payload = isLogin ? { email, password } : { email, password, name };
      
//       const res = await action(payload);

//       if (res.error) {
//         setErrorState({ 
//           title: isLogin ? "Login Failed" : "Registration Failed", 
//           message: res.error, 
//           type: "auth" 
//         });
//         setIsLoading(false);
//         return;
//       }

//       if (res.customToken) {
//         const userCredential = await signInWithCustomToken(auth, res.customToken);
//         const idToken = await userCredential.user.getIdToken();
        
//         const finalRes = await loginWithFirebase({ token: idToken });
        
//         if (finalRes.error) {
//           setErrorState({ title: "Session Error", message: finalRes.error, type: "server" });
//           setIsLoading(false);
//           return;
//         }

//         router.push("/dashboard");
//       }
//     } catch (error: any) {
//       setErrorState({ 
//         title: "System Error", 
//         message: error.message || "An unexpected error occurred.", 
//         type: "server" 
//       });
//       setIsLoading(false);
//     }
//   };

//   // 👇 GOOGLE AUTH
//   const handleGoogleAuth = async () => {
//     setIsLoading(true);
//     setErrorState(null);
//     try {
//       const provider = new GoogleAuthProvider();
//       const result = await signInWithPopup(auth, provider);
//       const idToken = await result.user.getIdToken();
      
//       const res = await loginWithFirebase({ token: idToken });
      
//       if (res.error) {
//         setErrorState({ title: "Google Auth Failed", message: res.error, type: "auth" });
//         setIsLoading(false);
//         return;
//       }
//       router.push("/dashboard");
//     } catch (error: any) {
//       setErrorState({ 
//         title: "Google Auth Failed", 
//         message: error.message || "Popup closed before completion.", 
//         type: "auth" 
//       });
//       setIsLoading(false);
//     }
//   };

//  // 👇 PASSKEY (WEBAUTHN) AUTH — CLEAN VERSION
//   const handlePasskeyAuth = async () => {
//     setIsLoading(true);
//     setErrorState(null);
//     try {
//       // 1. Get challenge from server (throws on error → caught below)
//       const options = await getAuthenticationOptions();

//       // 2. Trigger biometric prompt
//       const assertion = await startAuthentication({ optionsJSON: options as any });
      
//       // 3. Verify with server — returns a discriminated union
//       const res = await verifyAuthentication(assertion);
      
//       // 👇 TypeScript now narrows perfectly on res.success
//       if (!res.success) {
//         setErrorState({ 
//           title: "Passkey Failed", 
//           message: res.error, 
//           type: "auth" 
//         });
//         setIsLoading(false);
//         return;
//       }

//       // 👇 res.success === true → res.customToken is guaranteed to exist
//       const userCredential = await signInWithCustomToken(auth, res.customToken);
//       const idToken = await userCredential.user.getIdToken();
      
//       const finalRes = await loginWithFirebase({ token: idToken });
//       if (finalRes.error) {
//         setErrorState({ title: "Session Error", message: finalRes.error, type: "server" });
//         setIsLoading(false);
//         return;
//       }
//       router.push("/dashboard");
//     } catch (error: any) {
//       if (error.name === "NotAllowedError") {
//         setErrorState({ title: "Cancelled", message: "Biometric prompt was cancelled.", type: "auth" });
//       } else {
//         setErrorState({ title: "Passkey Error", message: error.message || "Failed to authenticate.", type: "auth" });
//       }
//       setIsLoading(false);
//     }
//   };

//   if (!mounted) return null;

//   return (
//     <div className="relative min-h-screen flex flex-col lg:flex-row font-sans bg-[#f0fdf4] dark:bg-[#050806] transition-colors duration-300 overflow-hidden">
      
//       {/* 👇 WATERMARKS BACKGROUND */}
//       <div className="absolute inset-0 pointer-events-none overflow-hidden select-none z-0 grid grid-cols-4 md:grid-cols-6 lg:grid-cols-12 gap-8 p-4 place-items-center opacity-10 dark:opacity-5">
//         {watermarks.map((wm, i) => (
//           <span 
//             key={i} 
//             className="text-4xl md:text-6xl font-bold text-lime-900 dark:text-lime-100" 
//             style={{ transform: `rotate(${wm.rotation}deg)` }}
//           >
//             {wm.symbol}
//           </span>
//         ))}
//       </div>

//       {/* 👇 HEADER ACTIONS (Moved to global top-right) */}
//       <div className="absolute top-4 right-4 sm:top-8 sm:right-8 z-50">
//         <HeaderActions 
//           hideNotifications={false} 
//           helpId="tour-play-btn"
//           themeId="tour-theme-btn"
//           userId="tour-user-icon"
//           onHelpClick={() => {}} 
//           onUserClick={() => openModal("User Profile")}
//           forceOpen={tourStep >= 0 && tourStep <= 2} 
//         />
//       </div>

//       {/* 👇 LEFT SIDE: BRANDING (Hidden on Mobile) */}
//       <div className="hidden lg:flex w-1/2 relative z-10 flex-col justify-center px-12 xl:px-24">
//         <motion.div
//            initial={{ opacity: 0, x: -50 }}
//            animate={{ opacity: 1, x: 0 }}
//            transition={{ duration: 0.6, ease: "easeOut" }}
//         >
//           <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-lime-500/10 border border-lime-500/20 text-lime-600 dark:text-lime-400 text-xs font-bold uppercase tracking-widest mb-6">
//             <Sparkles size={14} /> The Future of Trading
//           </div>
//           <h1 className="text-5xl xl:text-7xl font-extrabold text-lime-950 dark:text-white tracking-tight leading-[1.1] mb-6">
//             Quantix <br />
//             <span className="text-transparent bg-clip-text bg-gradient-to-r from-lime-500 to-green-600">
//               Solaris
//             </span>
//           </h1>
//           <p className="text-lg text-lime-800/70 dark:text-lime-200/60 font-medium max-w-md mb-8 leading-relaxed">
//             The world's first highly gamified commodity and crypto exchange. Start with local goods, earn XP, and unlock institutional-grade markets.
//           </p>

//           <div className="flex gap-4">
//             <div className="flex items-center gap-3 bg-white/50 dark:bg-[#121A14]/50 p-3 rounded-2xl border border-lime-500/10 backdrop-blur-sm">
//                <div className="p-2 bg-lime-500/20 rounded-xl text-lime-600 dark:text-lime-400">
//                  <TrendingUp size={20} />
//                </div>
//                <div>
//                  <p className="text-sm font-bold text-lime-950 dark:text-white">$2.4B+</p>
//                  <p className="text-xs text-lime-800/60 dark:text-lime-200/50">Volume Traded</p>
//                </div>
//             </div>
//             <div className="flex items-center gap-3 bg-white/50 dark:bg-[#121A14]/50 p-3 rounded-2xl border border-lime-500/10 backdrop-blur-sm">
//                <div className="p-2 bg-lime-500/20 rounded-xl text-lime-600 dark:text-lime-400">
//                  <Globe size={20} />
//                </div>
//                <div>
//                  <p className="text-sm font-bold text-lime-950 dark:text-white">150+</p>
//                  <p className="text-xs text-lime-800/60 dark:text-lime-200/50">Countries</p>
//                </div>
//             </div>
//           </div>
//         </motion.div>
//       </div>

//       {/* 👇 RIGHT SIDE: LOGIN CARD */}
//       <div className="flex-1 flex flex-col items-center justify-center p-4 sm:p-8 relative z-10 min-h-screen lg:min-h-0 py-12 lg:py-0">
//         <motion.div 
//           initial={{ opacity: 0, y: 20 }}
//           animate={{ opacity: 1, y: 0 }}
//           transition={{ duration: 0.5 }}
//           className="w-full max-w-md p-6 sm:p-8 bg-[#f4fbf5]/90 dark:bg-[#0a0f0b]/90 backdrop-blur-2xl border border-lime-500/20 dark:border-lime-500/10 rounded-3xl shadow-[0_8px_32px_0_rgba(132,204,22,0.15)] dark:shadow-[0_8px_32px_0_rgba(0,0,0,0.5)] transition-colors duration-300"
//         >
          
//           {/* Toggle */}
//           <div className="relative flex p-1 mb-8 bg-lime-100/50 dark:bg-[#050806]/80 rounded-full border border-lime-500/20 dark:border-lime-500/10 shadow-inner">
//             <motion.div className="absolute top-1 bottom-1 w-[calc(50%-4px)] bg-white dark:bg-[#121A14] rounded-full shadow-md" animate={{ x: isLogin ? 0 : "100%" }} transition={{ type: "spring", stiffness: 300, damping: 30 }} />
//             <button id="tour-toggle-login" type="button" onClick={() => { setIsLogin(true); setErrorState(null); }} className={`flex-1 relative z-10 py-2 text-sm font-bold transition-colors ${isLogin ? "text-lime-950 dark:text-lime-100" : "text-lime-700/60 dark:text-lime-400/60"}`}>{t("logIn")}</button>
//             <button id="tour-toggle-signup" type="button" onClick={() => { setIsLogin(false); setErrorState(null); }} className={`flex-1 relative z-10 py-2 text-sm font-bold transition-colors ${!isLogin ? "text-lime-950 dark:text-lime-100" : "text-lime-700/60 dark:text-lime-400/60"}`}>{t("signUp")}</button>
//           </div>

//           <div className="text-center mb-6">
//             <h1 className="text-2xl font-extrabold text-lime-950 dark:text-[#ecfdf5] tracking-tight">{isLogin ? t("welcomeBack") : t("createAccount")}</h1>
//             <p className="text-sm text-lime-800/70 dark:text-lime-200/50 mt-1 font-medium">{isLogin ? t("enterDetails") : t("joinExchange")}</p>
//           </div>

//           <div className="relative overflow-hidden">
//             <AnimatePresence mode="wait" initial={false}>
//               <motion.form 
//                 key={isLogin ? "login" : "signup"} 
//                 initial={{ opacity: 0, x: isLogin ? -50 : 50 }} 
//                 animate={{ opacity: 1, x: 0 }} 
//                 exit={{ opacity: 0, x: isLogin ? 50 : -50 }} 
//                 transition={{ duration: 0.3, ease: "easeInOut" }} 
//                 onSubmit={handleEmailAuth} 
//                 className="space-y-4 pt-2 pb-4"
//               >
                
//                 {!isLogin && (
//                   <FloatingInput 
//                     id="name" type="text" value={name} 
//                     onChange={(e: ChangeEvent<HTMLInputElement>) => setName(e.target.value)} 
//                     label={t("fullName")} icon={<User size={14} />} 
//                   />
//                 )}

//                 <FloatingInput 
//                   id="tour-input-email" type="email" value={email} 
//                   onChange={(e: ChangeEvent<HTMLInputElement>) => setEmail(e.target.value)} 
//                   label={t("email")} icon={<Mail size={14} />} 
//                 />

//                 <FloatingInput 
//                   id="tour-input-password" type="password" value={password} 
//                   onChange={(e: ChangeEvent<HTMLInputElement>) => setPassword(e.target.value)} 
//                   label={t("password")} icon={<Lock size={14} />} 
//                 />

//                 <div className="flex flex-col gap-2 mt-6">
//                   <Button 
//                     id="tour-submit-btn" 
//                     type="submit" 
//                     disabled={isLoading} 
//                     className="cursor-pointer w-full h-12 bg-lime-600 hover:bg-lime-700 text-white font-bold text-base rounded-xl shadow-lg shadow-lime-600/20 transition-all disabled:opacity-50"
//                   >
//                     {isLoading ? "Processing..." : isLogin ? t("logIn") : t("signUp")}
//                   </Button>
//                   <Button 
//                     id="tour-demo-btn" 
//                     type="button" 
//                     onClick={() => router.push("/demo")} 
//                     variant="ghost" 
//                     className="w-full h-10 text-lime-700 dark:text-lime-400 font-semibold hover:bg-lime-100 dark:hover:bg-[#121A14] rounded-xl transition-all flex cursor-pointer items-center justify-center gap-2"
//                   >
//                     <PlayCircle size={18} /> {t("tryDemo")}
//                   </Button>
//                 </div>
//               </motion.form>
//             </AnimatePresence>
//           </div>

//           <div className="relative flex items-center py-2 mt-2">
//             <div className="flex-grow border-t border-lime-500/20"></div>
//             <span className="flex-shrink-0 mx-4 text-lime-700/60 dark:text-lime-300/60 text-[10px] sm:text-xs font-bold uppercase tracking-wider">{t("orContinue")}</span>
//             <div className="flex-grow border-t border-lime-500/20"></div>
//           </div>

//           <div className="grid grid-cols-2 gap-3 mt-2">
//             <Button 
//               id="tour-google-btn" 
//               type="button" 
//               onClick={handleGoogleAuth} 
//               disabled={isLoading} 
//               variant="secondary" 
//               className="cursor-pointer border-lime-500/30 dark:border-lime-500/20 bg-[#f4fbf5]/50 dark:bg-[#050806] hover:bg-white dark:hover:bg-[#121A14] text-lime-950 dark:text-white font-semibold rounded-xl h-11 shadow-sm flex items-center justify-center gap-2 disabled:opacity-50"
//             >
//               <svg className="w-5 h-5" viewBox="0 0 24 24"><path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/><path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/><path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/><path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/></svg> Google
//             </Button>
//             <Button 
//               id="tour-passkey-btn" 
//               type="button" 
//               onClick={handlePasskeyAuth} 
//               disabled={isLoading} 
//               variant="secondary" 
//               className="cursor-pointer border-lime-500/30 dark:border-lime-500/20 bg-[#f4fbf5]/50 dark:bg-[#050806] hover:bg-white dark:hover:bg-[#121A14] text-lime-950 dark:text-white font-semibold rounded-xl h-11 shadow-sm disabled:opacity-50"
//             >
//               <Fingerprint size={18} className="mr-2" /> Passkey
//             </Button>
//           </div>
          
//         </motion.div>
//       </div>

//       {/* 👇 WELCOME MODAL */}
//       <AnimatePresence>
//         {showWelcomeModal && (
//           <motion.div
//             initial={{ opacity: 0 }}
//             animate={{ opacity: 1 }}
//             exit={{ opacity: 0 }}
//             className="fixed inset-0 z-[150] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
//           >
//             <motion.div
//               initial={{ scale: 0.9, y: 20 }}
//               animate={{ scale: 1, y: 0 }}
//               exit={{ scale: 0.9, y: 20 }}
//               className="relative w-full max-w-md bg-[#f4fbf5]/95 dark:bg-[#0a0f0b]/95 backdrop-blur-2xl border border-lime-500/30 rounded-3xl p-8 shadow-2xl text-center"
//             >
//               <button onClick={dismissWelcome} className="absolute top-4 right-4 text-lime-600 hover:text-red-500 transition-colors">
//                 <X size={20} />
//               </button>
//               <div className="w-16 h-16 mx-auto bg-lime-500/20 rounded-2xl flex items-center justify-center mb-4">
//                 <Sparkles className="text-lime-600 dark:text-lime-400" size={32} />
//               </div>
//               <h2 className="text-2xl font-extrabold text-lime-950 dark:text-white mb-2">Welcome to Quantix Solaris</h2>
//               <p className="text-sm text-lime-800/70 dark:text-lime-200/60 mb-6 font-medium">
//                 The world's first highly gamified commodity and crypto exchange. Start with local goods, earn XP, and unlock institutional-grade markets.
//               </p>
//               <Button onClick={dismissWelcome} className="w-full h-12 bg-lime-600 hover:bg-lime-700 text-white font-bold rounded-xl shadow-lg shadow-lime-600/20">
//                 Let&apos;s Go!
//               </Button>
//             </motion.div>
//           </motion.div>
//         )}
//       </AnimatePresence>
      
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
//   const { openModal } = useDevModal();
//   const [mounted, setMounted] = useState(false);

//   const [isLogin, setIsLogin] = useState(true);
//   const [email, setEmail] = useState("");
//   const [password, setPassword] = useState("");
//   const [name, setName] = useState("");
//   const [isLoading, setIsLoading] = useState(false);
  
//   const [errorState, setErrorState] = useState<ErrorState>(null);

//   const [tourStep, setTourStep] = useState(-1);
//   const [showWelcomeModal, setShowWelcomeModal] = useState(false);

//   // 👇 WATERMARK GENERATION (deterministic, no hydration errors)
//   const watermarks = useMemo(() => {
//     return Array.from({ length: 48 }).map((_, i) => ({
//       symbol: WATERMARK_SYMBOLS[i % WATERMARK_SYMBOLS.length],
//       rotation: ((i * 15) % 60) - 30,
//     }));
//   }, []);

//   useEffect(() => setMounted(true), []);

//   // 👇 HANDLE FIREBASE REDIRECT RESULT (For Google Sign-in on mobile)
//   useEffect(() => {
//     getRedirectResult(auth)
//       .then(async (result) => {
//         if (result?.user && !redirectHandled.current) {
//           redirectHandled.current = true;
//           setIsLoading(true);
//           const idToken = await result.user.getIdToken();
//           const res = await loginWithFirebase({ token: idToken });
//           if (res.success) {
//             router.push("/dashboard");
//           } else {
//             setErrorState({ title: "Redirect Login Failed", message: res.error || "Please try again.", type: "auth" });
//             setIsLoading(false);
//           }
//         }
//       })
//       .catch((err) => {
//         console.error("Redirect error:", err);
//         setIsLoading(false);
//       });
//   }, [router]);

//   // 👇 SHOW WELCOME MODAL FOR FIRST-TIME VISITORS
//   useEffect(() => {
//     if (!mounted) return;
//     const hasSeenWelcome = localStorage.getItem("quantix_welcome_seen");
//     if (!hasSeenWelcome) {
//       const timer = setTimeout(() => setShowWelcomeModal(true), 1500);
//       return () => clearTimeout(timer);
//     }
//   }, [mounted]);

//   const dismissWelcome = () => {
//     setShowWelcomeModal(false);
//     localStorage.setItem("quantix_welcome_seen", "true");
//   };

//   // 👇 EMAIL / PASSWORD AUTH
//   const handleEmailAuth = async (e: React.FormEvent) => {
//     e.preventDefault();
//     setIsLoading(true);
//     setErrorState(null);

//     try {
//       const action = isLogin ? loginWithEmail : registerWithEmail;
//       const payload = isLogin ? { email, password } : { email, password, name };
      
//       const res = await action(payload);

//       if (res.error) {
//         setErrorState({ 
//           title: isLogin ? "Login Failed" : "Registration Failed", 
//           message: res.error, 
//           type: "auth" 
//         });
//         setIsLoading(false);
//         return;
//       }

//       if (res.customToken) {
//         const userCredential = await signInWithCustomToken(auth, res.customToken);
//         const idToken = await userCredential.user.getIdToken();
        
//         const finalRes = await loginWithFirebase({ token: idToken });
        
//         if (finalRes.error) {
//           setErrorState({ title: "Session Error", message: finalRes.error, type: "server" });
//           setIsLoading(false);
//           return;
//         }

//         router.push("/dashboard");
//       }
//     } catch (error: any) {
//       setErrorState({ 
//         title: "System Error", 
//         message: error.message || "An unexpected error occurred.", 
//         type: "server" 
//       });
//       setIsLoading(false);
//     }
//   };

//   // 👇 GOOGLE AUTH
//   const handleGoogleAuth = async () => {
//     setIsLoading(true);
//     setErrorState(null);
//     try {
//       const provider = new GoogleAuthProvider();
//       const result = await signInWithPopup(auth, provider);
//       const idToken = await result.user.getIdToken();
      
//       const res = await loginWithFirebase({ token: idToken });
      
//       if (res.error) {
//         setErrorState({ title: "Google Auth Failed", message: res.error, type: "auth" });
//         setIsLoading(false);
//         return;
//       }
//       router.push("/dashboard");
//     } catch (error: any) {
//       setErrorState({ 
//         title: "Google Auth Failed", 
//         message: error.message || "Popup closed before completion.", 
//         type: "auth" 
//       });
//       setIsLoading(false);
//     }
//   };

//  // 👇 PASSKEY (WEBAUTHN) AUTH — CLEAN VERSION
//   const handlePasskeyAuth = async () => {
//     setIsLoading(true);
//     setErrorState(null);
//     try {
//       // 1. Get challenge from server (throws on error → caught below)
//       const options = await getAuthenticationOptions();

//       // 2. Trigger biometric prompt
//       const assertion = await startAuthentication({ optionsJSON: options as any });
      
//       // 3. Verify with server — returns a discriminated union
//       const res = await verifyAuthentication(assertion);
      
//       // 👇 TypeScript now narrows perfectly on res.success
//       if (!res.success) {
//         setErrorState({ 
//           title: "Passkey Failed", 
//           message: res.error, 
//           type: "auth" 
//         });
//         setIsLoading(false);
//         return;
//       }

//       // 👇 res.success === true → res.customToken is guaranteed to exist
//       const userCredential = await signInWithCustomToken(auth, res.customToken);
//       const idToken = await userCredential.user.getIdToken();
      
//       const finalRes = await loginWithFirebase({ token: idToken });
//       if (finalRes.error) {
//         setErrorState({ title: "Session Error", message: finalRes.error, type: "server" });
//         setIsLoading(false);
//         return;
//       }
//       router.push("/dashboard");
//     } catch (error: any) {
//       if (error.name === "NotAllowedError") {
//         setErrorState({ title: "Cancelled", message: "Biometric prompt was cancelled.", type: "auth" });
//       } else {
//         setErrorState({ title: "Passkey Error", message: error.message || "Failed to authenticate.", type: "auth" });
//       }
//       setIsLoading(false);
//     }
//   };

//   if (!mounted) return null;

//   return (
//     <div className="relative min-h-screen flex flex-col items-center justify-center font-sans bg-[#f0fdf4] dark:bg-[#050806] overflow-hidden px-4 py-8 transition-colors duration-300">
      
//       {/* 👇 WATERMARKS */}
//       <div className="absolute inset-0 pointer-events-none overflow-hidden select-none z-0 grid grid-cols-4 md:grid-cols-6 lg:grid-cols-8 gap-8 p-4 place-items-center opacity-10 dark:opacity-5">
//         {watermarks.map((wm, i) => (
//           <span 
//             key={i} 
//             className="text-4xl md:text-6xl font-bold text-lime-900 dark:text-lime-100" 
//             style={{ transform: `rotate(${wm.rotation}deg)` }}
//           >
//             {wm.symbol}
//           </span>
//         ))}
//       </div>

//       {/* 👇 WELCOME MODAL */}
//       <AnimatePresence>
//         {showWelcomeModal && (
//           <motion.div
//             initial={{ opacity: 0 }}
//             animate={{ opacity: 1 }}
//             exit={{ opacity: 0 }}
//             className="fixed inset-0 z-[150] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
//           >
//             <motion.div
//               initial={{ scale: 0.9, y: 20 }}
//               animate={{ scale: 1, y: 0 }}
//               exit={{ scale: 0.9, y: 20 }}
//               className="relative w-full max-w-md bg-[#f4fbf5]/95 dark:bg-[#0a0f0b]/95 backdrop-blur-2xl border border-lime-500/30 rounded-3xl p-8 shadow-2xl text-center"
//             >
//               <button onClick={dismissWelcome} className="absolute top-4 right-4 text-lime-600 hover:text-red-500 transition-colors">
//                 <X size={20} />
//               </button>
//               <div className="w-16 h-16 mx-auto bg-lime-500/20 rounded-2xl flex items-center justify-center mb-4">
//                 <Sparkles className="text-lime-600 dark:text-lime-400" size={32} />
//               </div>
//               <h2 className="text-2xl font-extrabold text-lime-950 dark:text-white mb-2">Welcome to Quantix Solaris</h2>
//               <p className="text-sm text-lime-800/70 dark:text-lime-200/60 mb-6 font-medium">
//                 The world's first highly gamified commodity and crypto exchange. Start with local goods, earn XP, and unlock institutional-grade markets.
//               </p>
//               <Button onClick={dismissWelcome} className="w-full h-12 bg-lime-600 hover:bg-lime-700 text-white font-bold rounded-xl shadow-lg shadow-lime-600/20">
//                 Let&apos;s Go!
//               </Button>
//             </motion.div>
//           </motion.div>
//         )}
//       </AnimatePresence>

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
//             <motion.form 
//               key={isLogin ? "login" : "signup"} 
//               initial={{ opacity: 0, x: isLogin ? -50 : 50 }} 
//               animate={{ opacity: 1, x: 0 }} 
//               exit={{ opacity: 0, x: isLogin ? 50 : -50 }} 
//               transition={{ duration: 0.3, ease: "easeInOut" }} 
//               onSubmit={handleEmailAuth} 
//               className="space-y-4 pt-2 pb-4"
//             >
              
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
//                 <Button 
//                   id="tour-submit-btn" 
//                   type="submit" 
//                   disabled={isLoading} 
//                   className="cursor-pointer w-full h-12 bg-lime-600 hover:bg-lime-700 text-white font-bold text-base rounded-xl shadow-lg shadow-lime-600/20 transition-all disabled:opacity-50"
//                 >
//                   {isLoading ? "Processing..." : isLogin ? t("logIn") : t("signUp")}
//                 </Button>
//                 <Button 
//                   id="tour-demo-btn" 
//                   type="button" 
//                   onClick={() => router.push("/demo")} 
//                   variant="ghost" 
//                   className="w-full h-10 text-lime-700 dark:text-lime-400 font-semibold hover:bg-lime-100 dark:hover:bg-[#121A14] rounded-xl transition-all flex cursor-pointer items-center justify-center gap-2"
//                 >
//                   <PlayCircle size={18} /> {t("tryDemo")}
//                 </Button>
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
//           <Button 
//             id="tour-google-btn" 
//             type="button" 
//             onClick={handleGoogleAuth} 
//             disabled={isLoading} 
//             variant="secondary" 
//             className="cursor-pointer border-lime-500/30 dark:border-lime-500/20 bg-[#f4fbf5]/50 dark:bg-[#050806] hover:bg-white dark:hover:bg-[#121A14] text-lime-950 dark:text-white font-semibold rounded-xl h-11 shadow-sm flex items-center justify-center gap-2 disabled:opacity-50"
//           >
//             <svg className="w-5 h-5" viewBox="0 0 24 24"><path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/><path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/><path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/><path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/></svg> Google
//           </Button>
//           <Button 
//             id="tour-passkey-btn" 
//             type="button" 
//             onClick={handlePasskeyAuth} 
//             disabled={isLoading} 
//             variant="secondary" 
//             className="cursor-pointer border-lime-500/30 dark:border-lime-500/20 bg-[#f4fbf5]/50 dark:bg-[#050806] hover:bg-white dark:hover:bg-[#121A14] text-lime-950 dark:text-white font-semibold rounded-xl h-11 shadow-sm disabled:opacity-50"
//           >
//             <Fingerprint size={18} className="mr-2" /> Passkey
//           </Button>
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