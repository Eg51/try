"use client";
import { useState, useEffect, useMemo, useRef, ChangeEvent } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { useDevModal } from "@/components/providers/DevModalProvider";
import { useTheme } from "next-themes";
import { 
  signInWithPopup, 
  signInWithRedirect, 
  getRedirectResult, 
  signInWithCustomToken, 
  GoogleAuthProvider 
} from "firebase/auth";
import { startAuthentication } from "@simplewebauthn/browser";
import { auth } from "@/lib/firebase-client";
import { loginWithEmail, registerWithEmail, loginWithFirebase } from "@/app/actions/auth";
import { getAuthenticationOptions, verifyAuthentication } from "@/app/actions/webauthn";
import { Button } from "@/components/ui/Button";
import { Fingerprint, Mail, Lock, User, Sun, Moon, PlayCircle, ChevronLeft, ChevronRight, HelpCircle, Sparkles, X } from "lucide-react";


const WATERMARK_SYMBOLS = [
  // ==============================
  // 1. GLOBAL FIAT
  // ==============================
  "$", "€", "£", "¥", "₦", "₹", "₩", "₪", "₫", "₴", "₭", "₮", "₱", "฿", "₲", "₵", "₡", "₸", "₼", "₾", "֏", "؋", "৳", "៛", "₥", "₣", "₤", "₧", "₯", "₰", "₳", "₢", "₠", "₨", "₶", "₷", "₺", "₻", "₽", "₿", "C$", "A$", "R$", "S$", "HK$", "NT$", "NZ$", "CHF", "kr", "zł", "Kč", "Ft", "lei", "₤", "₦", "₱", "₲", "₵", "₡", "₸",

  // ==============================
  // 2. CRYPTO & WEB3
  // ==============================
  "Ξ", "Ð", "Ł", "Ƀ", "ȿ", "Μ", "◎", "Ꞩ", "✕", "ⓩ", "⧫", "Ɖ", "ɱ", "Ꝟ", "Ꝑ", "Ⓝ", "Ⓞ", "Ⓣ", "Ⓡ", "Ⓢ", "Ⓤ", "Ⓐ", "Ⓥ", "Ⓔ", "Ⓛ", "Ⓜ", "Ⓟ", "Ⓠ", "Ⓦ", "Ⓧ", "Ⓨ", "Ⓩ", "⓪", "①", "②", "③", "④", "⑤", "⑥", "⑦", "⑧", "⑨", "⑩", "♦", "◈", "⬡", "⬢", "◊", "⟁", "⧉", "⧈", "⌬", "⎔", "⏣", "⏥", "⏦",

  // ==============================
  // 3. MEME COINS & COMMUNITY
  // ==============================
  "🐕", "🐶", "🐱", "🐸", "🐵", "🦍", "🦊", "🐺", "🐻", "🐼", "🐨", "🐷", "🐮", "🐔", "🐧", "🦅", "🦄", "🐳", "🐋", "🦈", "🐙", "🦑", "🦀", "🦞", "🦐", "🐡", "🐠", "🐟", "🌙", "🚀", "💎", "🙌", "🔥", "🚀", "🌕", "⭐", "🌟", "✨", "⚡", "💥", "💫", "🪙", "💰", "💸", "💵", "💴", "💶", "💷", "🪙"
];

const TOUR_STEPS = [
  { id: "tour-play-btn", title: "Demo Tour", text: "Click this icon anytime to replay this guided tour of the login screen." },
  { id: "tour-theme-btn", title: "Theme Toggle", text: "Switch between a light, vibrant interface and a sleek dark mode." },
  { id: "tour-user-icon", title: "Profile", text: "Manage your account settings and security preferences here." },
  { id: "tour-toggle-login", title: "Log In", text: "Select this tab if you already have an account and want to sign in." },
  { id: "tour-toggle-signup", title: "Sign Up", text: "Select this tab to create a new account and join the exchange." },
  { id: "tour-input-email", title: "Email Address", text: "Enter the email address associated with your account." },
  { id: "tour-input-password", title: "Password", text: "Enter your secure password. We encrypt this before sending it." },
  { id: "tour-submit-btn", title: "Submit", text: "Click here to securely log in and access your trading dashboard." },
  { id: "tour-demo-btn", title: "Try Demo", text: "No account? Click here to instantly fill in demo credentials." },
  { id: "tour-google-btn", title: "Google Login", text: "Instantly authenticate using your existing Google account." },
  { id: "tour-passkey-btn", title: "Passkey Login", text: "Use FaceID, TouchID, or Windows Hello for passwordless biometric login." },
];

interface FloatingInputProps {
  id: string;
  type: string;
  value: string;
  onChange: (e: ChangeEvent<HTMLInputElement>) => void;
  label: string;
  icon: React.ReactNode;
}

const FloatingInput = ({ id, type, value, onChange, label, icon }: FloatingInputProps) => (
  <div id={id} className="relative">
    <input 
      type={type} 
      id={id} 
      value={value} 
      onChange={onChange} 
      placeholder=" " 
      required 
      className="peer w-full bg-[#f4fbf5] dark:bg-[#0a0f0b] border-2 border-lime-500/30 dark:border-lime-500/20 rounded-xl px-4 pt-6 pb-2 text-lime-950 dark:text-white focus:outline-none focus:border-lime-500 transition-colors font-medium"
    />
    <label 
      htmlFor={id} 
      className="absolute left-3 top-4 text-lime-700/60 dark:text-lime-300/60 transition-all duration-200 pointer-events-none 
                 peer-focus:-top-3 peer-focus:text-xs peer-focus:bg-[#f4fbf5] dark:peer-focus:bg-[#0a0f0b] peer-focus:px-1 peer-focus:text-lime-600
                 peer-[:not(:placeholder-shown)]:-top-3 peer-[:not(:placeholder-shown)]:text-xs peer-[:not(:placeholder-shown)]:bg-[#f4fbf5] dark:peer-[:not(:placeholder-shown)]:bg-[#0a0f0b] peer-[:not(:placeholder-shown)]:px-1"
    >
      <div className="flex items-center gap-2">{icon} {label}</div>
    </label>
  </div>
);

export default function LoginPage() {
  const router = useRouter();
   const redirectHandled = useRef(false);
  const { theme, setTheme } = useTheme();
  const { openModal } = useDevModal();
  const [mounted, setMounted] = useState(false);

  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  
  const [tourStep, setTourStep] = useState(-1);
  const [tourElementRect, setTourElementRect] = useState<DOMRect | null>(null);
  const [showWelcomeModal, setShowWelcomeModal] = useState(false);

  useEffect(() => {
    setMounted(true);
    const hasVisited = localStorage.getItem("hasVisited");
    if (!hasVisited) setShowWelcomeModal(true);
  }, []);

  const watermarks = useMemo(() => {
    return WATERMARK_SYMBOLS.flatMap((symbol, i) => {
      return Array.from({ length: 5 }).map((_, j) => ({
        symbol,
        rotation: ((i * 13 + j * 7) % 60) - 30,
        top: `${((i * 17 + j * 23) % 100)}%`,
        left: `${((i * 29 + j * 11) % 100)}%`,
        scale: 1 + ((i + j) % 3) * 0.4
      }));
    });
  }, []);

  useEffect(() => {
    if (tourStep >= 0) {
      const el = document.getElementById(TOUR_STEPS[tourStep].id);
      if (el) {
        setTourElementRect(el.getBoundingClientRect());
        if (tourStep === 4) setIsLogin(false); 
        if (tourStep >= 5 && tourStep <= 8) setIsLogin(true); 
      }
    }
  }, [tourStep]);

  const startTour = () => {
    setShowWelcomeModal(false);
    localStorage.setItem("hasVisited", "true");
    setIsLogin(true); 
    setTourStep(0);
  };

  const closeWelcomeModal = () => {
    setShowWelcomeModal(false);
    localStorage.setItem("hasVisited", "true");
  };

  const nextTourStep = () => {
    if (tourStep < TOUR_STEPS.length - 1) setTourStep(tourStep + 1);
    else setTourStep(-1);
  };

  const prevTourStep = () => {
    if (tourStep > 0) setTourStep(tourStep - 1);
  };

  const fillDemoCredentials = () => {
    setEmail("demo-user@gmail.com");
    setPassword("#demo123456");
    setIsLogin(true);
    setTourStep(-1);
    window.location.href = "/demo";
  };

  // useEffect(() => {
  //   async function handleRedirectResult() {
  //     try {
  //       const result = await getRedirectResult(auth);
  //       if (result) {
  //         setIsLoading(true);
  //         const token = await result.user.getIdToken();
  //         const response = await loginWithFirebase({ token });
  //         if ("error" in response && response.error) {
  //           setError(response.error);
  //           setIsLoading(false);
  //         } else {
  //            window.location.href = "/dashboard";
  //           router.refresh();
  //         }
  //       }
  //     } catch (err: any) {
  //       setError("authentication failed.");
  //       setIsLoading(false);
  //     }
  //   }
  //   handleRedirectResult();
  // }, [router]);
    useEffect(() => {
    async function handleRedirectResult() {
      console.log("🟢 [1. CLIENT] useEffect triggered. Checking for Google Redirect...");
      
      if (redirectHandled.current) return;
      redirectHandled.current = true;

      try {
        const result = await getRedirectResult(auth);
        console.log("🟢 [1. CLIENT] getRedirectResult returned:", result);

        if (result) {
          console.log("🟢 [1. CLIENT] Redirect result found! Getting ID token...");
          setIsLoading(true);
          const token = await result.user.getIdToken();
          
          console.log("🟢 [1. CLIENT] ID Token obtained. Sending to server action...");
          const response = await loginWithFirebase({ token });
          
          console.log("🟢 [1. CLIENT] Server action response:", response);
          
          if ("error" in response && response.error) {
            setError(response.error);
            setIsLoading(false);
          } else {
            console.log("🟢 [1. CLIENT] Success! Forcing window redirect to /dashboard...");
            window.location.href = "/dashboard"; 
          }
        } else {
          console.log("🟡 [1. CLIENT] No redirect result found (normal page load).");
        }
      } catch (err: any) {
        console.error("🔴 [1. CLIENT] Redirect error:", err);
        setError(err.message || "Authentication failed.");
        setIsLoading(false);
      }
    }
    handleRedirectResult();
  }, []);

  async function handleEmailAuth(e: React.FormEvent) {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    let result;
    if (isLogin) result = await loginWithEmail({ email, password });
    else result = await registerWithEmail({ name, email, password });

    if ("error" in result && result.error) {
      setError(result.error);
      setIsLoading(false);
      return;
    }

    if ("success" in result && result.success && result.customToken) {
      try {
        const userCredential = await signInWithCustomToken(auth, result.customToken);
        const idToken = await userCredential.user.getIdToken();
        const finalRes = await loginWithFirebase({ token: idToken });
        if ("error" in finalRes && finalRes.error) {
          setError(finalRes.error);
          setIsLoading(false);
        } else {
          router.push("/dashboard");
          router.refresh();
        }
      } catch (err: any) {
        setError("Failed to establish secure session.");
        setIsLoading(false);
      }
    }
  }

  // async function handleGoogleLogin() {
  //   setIsLoading(true);
  //   setError(null);
  //   try {
  //     const provider = new GoogleAuthProvider();
      
  //     // FIXED: Always use Redirect to avoid COOP errors
  //     await signInWithRedirect(auth, provider);
      
  //   } catch (err: any) {
  //     setError(err.message);
  //     setIsLoading(false);
  //   }
  // }
  async function handleGoogleLogin() {
    setIsLoading(true);
    setError(null);
    try {
      const provider = new GoogleAuthProvider();
      
      // 👇 ADDED THESE TWO LINES 👇
      provider.addScope('email');
      provider.addScope('profile');
      
      // Use Popup instead of Redirect. It bypasses the iframe cookie issue entirely.
      const result = await signInWithPopup(auth, provider);
      
      // Once the popup closes successfully, grab the token immediately
      const token = await result.user.getIdToken();
      
      // Send it to your server action
      const response = await loginWithFirebase({ token });
      
      if ("error" in response && response.error) {
        setError(response.error);
        setIsLoading(false);
      } else {
        // Force a hard redirect so the proxy sees the new cookie
        window.location.href = "/dashboard";
      }
    } catch (err: any) {
      console.error("Google Login Error:", err);
      if (err.code === 'auth/popup-closed-by-user') {
        setError("Login cancelled.");
      } else {
        setError(err.message);
      }
      setIsLoading(false);
    }
  }
  async function handleBiometricLogin() {
    setIsLoading(true);
    setError(null);
    try {
      const options = await getAuthenticationOptions();
      
      // We use `as any` here because Next.js serializes the options (Uint8Array -> string)
      const authResp = await startAuthentication({ optionsJSON: options as any });
      
      const verification = await verifyAuthentication(authResp);
      
      if (verification.success && verification.customToken) {
        // 1. Sign in with the custom token generated by the server
        const userCredential = await signInWithCustomToken(auth, verification.customToken);
        
        // 2. Extract the ID token from the `user` object
        const idToken = await userCredential.user.getIdToken(); // <--- FIXED HERE
        
        // 3. Send the ID token to the server to create the secure session cookie
        const finalRes = await loginWithFirebase({ token: idToken });
        
        if ("error" in finalRes && finalRes.error) {
          setError(finalRes.error);
          setIsLoading(false);
        } else {
          router.push("/dashboard");
          router.refresh();
        }
      } else {
        setError("Biometric authentication failed.");
        setIsLoading(false);
      }
    } catch (err: any) {
      setError(err.message || "Biometric login failed.");
      setIsLoading(false);
    }
  }

  const getTooltipStyle = () => {
    if (!tourElementRect) return {};
    const isBottomHalf = tourElementRect.top > window.innerHeight / 2;
    return {
      top: isBottomHalf ? tourElementRect.top - 160 : tourElementRect.bottom + 20,
      left: Math.max(16, Math.min(tourElementRect.left - 20, window.innerWidth - 320)),
    };
  };

  if (!mounted) return null;

  return (
    <div className="relative min-h-screen flex items-center justify-center font-sans bg-[#f0fdf4] dark:bg-[#050806] overflow-hidden px-4 py-8 transition-colors duration-300">
      
      <div className="absolute inset-0 pointer-events-none overflow-hidden select-none z-0">
        {watermarks.map((wm, idx) => (
          <span key={idx} className="absolute text-5xl md:text-7xl font-bold text-lime-900/[0.04] dark:text-lime-100/[0.02]"
            style={{ transform: `rotate(${wm.rotation}deg) scale(${wm.scale})`, top: wm.top, left: wm.left }}>
            {wm.symbol}
          </span>
        ))}
      </div>

      <div className="absolute top-[-10%] left-[-10%] w-[60%] md:w-[40%] h-[40%] bg-lime-300/40 dark:bg-lime-900/10 blur-[120px] rounded-full pointer-events-none z-0"></div>
      <div className="absolute bottom-[-10%] right-[-10%] w-[60%] md:w-[40%] h-[40%] bg-green-300/30 dark:bg-green-900/10 blur-[120px] rounded-full pointer-events-none z-0"></div>

      <div className="absolute top-6 right-6 flex items-center gap-3 z-50">
        <div className="relative group">
          <button id="tour-play-btn" onClick={startTour} className="p-2 rounded-full bg-white/40 dark:bg-[#121A14]/60 border border-lime-500/20 text-lime-800 dark:text-lime-200 hover:bg-white/60 dark:hover:bg-[#121A14] transition-all shadow-sm backdrop-blur-md cursor-pointer">
            <HelpCircle size={20} />
          </button>
          <div className="absolute top-full mt-2 right-0 px-2 py-1 bg-gray-900 text-white text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none">
            Play demo
          </div>
        </div>

        <div className="relative group">
          <button id="tour-theme-btn" onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')} className="p-2 rounded-full bg-white/40 dark:bg-[#121A14]/60 border border-lime-500/20 text-lime-800 dark:text-lime-200 hover:bg-white/60 dark:hover:bg-[#121A14] transition-all shadow-sm backdrop-blur-md cursor-pointer">
            {theme === 'dark' ? <Sun className="text-amber-600" size={20} /> : <Moon className="text-gray-700" size={20} />}
          </button>
          <div className="absolute top-full mt-2 right-0 px-2 py-1 bg-gray-900 text-white text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none">
            Toggle theme
          </div>
        </div>

        <div className="relative group">
          <button id="tour-user-icon" onClick={() => openModal("User Profile")} className="p-2 rounded-full bg-white/40 dark:bg-[#121A14]/60 border border-lime-500/20 text-lime-800 dark:text-lime-200 hover:bg-white/60 dark:hover:bg-[#121A14] transition-all shadow-sm backdrop-blur-md cursor-pointer">
           <User size={20} />
          </button>
          <div className="absolute top-full mt-2 right-0 px-2 py-1 bg-gray-900 text-white text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none">
            Sign in for details
          </div>
        </div>
      </div>

      <AnimatePresence>
        {tourStep >= 0 && tourElementRect && (
          <>
            <motion.div 
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="fixed inset-0 z-40 bg-black/60 pointer-events-none"
              style={{
                backdropFilter: "blur(8px)", WebkitBackdropFilter: "blur(8px)",
                clipPath: `polygon(0% 0%, 0% 100%, ${tourElementRect.left - 12}px 100%, ${tourElementRect.left - 12}px ${tourElementRect.top - 12}px, ${tourElementRect.right + 12}px ${tourElementRect.top - 12}px, ${tourElementRect.right + 12}px ${tourElementRect.bottom + 12}px, ${tourElementRect.left - 12}px ${tourElementRect.bottom + 12}px, ${tourElementRect.left - 12}px 100%, 100% 100%, 100% 0%)`
              }}
            />
            <motion.div
              animate={{ top: tourElementRect.top - 12, left: tourElementRect.left - 12, width: tourElementRect.width + 24, height: tourElementRect.height + 24 }}
              transition={{ type: "spring", stiffness: 200, damping: 25 }}
              className="fixed z-50 rounded-xl border-2 border-lime-500 pointer-events-none"
            />
            <motion.div
              key={tourStep}
              initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }}
              className="fixed z-[60] w-72 bg-white dark:bg-[#121A14] p-4 rounded-xl shadow-2xl border border-lime-500/30 pointer-events-auto"
              style={getTooltipStyle()}
            >
              <h4 className="font-bold text-lime-950 dark:text-lime-100 mb-1">{TOUR_STEPS[tourStep].title}</h4>
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">{TOUR_STEPS[tourStep].text}</p>
              <div className="flex justify-between items-center">
                <button onClick={() => setTourStep(-1)} className="text-xs text-gray-400 hover:text-gray-600 dark:hover:text-gray-200">Skip</button>
                <div className="flex gap-2">
                  <Button onClick={prevTourStep} disabled={tourStep === 0} variant="secondary" className="h-8 px-2 text-xs border-lime-500/30 bg-white/50 dark:bg-[#0B120D] text-lime-950 dark:text-white"><ChevronLeft size={14} /> Prev</Button>
                  <Button onClick={nextTourStep} className="h-8 px-3 text-xs bg-lime-600 hover:bg-lime-700 text-white">{tourStep === TOUR_STEPS.length - 1 ? "Finish" : "Next"} <ChevronRight size={14} /></Button>
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {showWelcomeModal && (
          <motion.div 
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
          >
            <motion.div 
              initial={{ scale: 0.9, y: 20 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.9, y: 20 }}
              className="relative w-full max-w-sm bg-white dark:bg-[#121A14] rounded-3xl p-6 shadow-2xl border border-lime-500/20 text-center"
            >
              <button onClick={closeWelcomeModal} className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200">
                <X size={20} />
              </button>
              
              <div className="w-16 h-16 mx-auto bg-lime-100 dark:bg-lime-900/50 rounded-full flex items-center justify-center mb-4">
                <Sparkles className="text-lime-600 dark:text-lime-400" size={32} />
              </div>
              
              <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-2">Welcome to Quantix!</h2>
              <p className="text-sm text-gray-500 dark:text-gray-400 mb-6">
                Would you like a quick guided tour to learn how to use the platform?
              </p>
              
              <div className="space-y-3">
                <Button onClick={startTour} className="w-full bg-lime-600 hover:bg-lime-700 text-white font-bold h-11 rounded-xl flex items-center justify-center gap-2">
                  <PlayCircle size={18} /> Start Guided Tour
                </Button>
                <Button onClick={closeWelcomeModal} variant="ghost" className="w-full text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 h-11">
                  I'll explore myself
                </Button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <motion.div layout className="relative z-10 w-full max-w-md p-6 sm:p-8 bg-[#f4fbf5]/90 dark:bg-[#0a0f0b]/90 backdrop-blur-2xl border border-lime-500/20 dark:border-lime-500/10 rounded-3xl shadow-[0_8px_32px_0_rgba(132,204,22,0.15)] dark:shadow-[0_8px_32px_0_rgba(0,0,0,0.5)] transition-colors duration-300">
        
        <div className="relative flex p-1 mb-8 bg-lime-100/50 dark:bg-[#050806]/80 rounded-full border border-lime-500/20 dark:border-lime-500/10 shadow-inner">
          <motion.div className="absolute top-1 bottom-1 w-[calc(50%-4px)] bg-white dark:bg-[#121A14] rounded-full shadow-md" animate={{ x: isLogin ? 0 : "100%" }} transition={{ type: "spring", stiffness: 300, damping: 30 }} />
          <button id="tour-toggle-login" type="button" onClick={() => { setIsLogin(true); setError(null); }} className={`flex-1 relative z-10 py-2 text-sm font-bold transition-colors ${isLogin ? "text-lime-950 dark:text-lime-100" : "text-lime-700/60 dark:text-lime-400/60"}`}>Log In</button>
          <button id="tour-toggle-signup" type="button" onClick={() => { setIsLogin(false); setError(null); }} className={`flex-1 relative z-10 py-2 text-sm font-bold transition-colors ${!isLogin ? "text-lime-950 dark:text-lime-100" : "text-lime-700/60 dark:text-lime-400/60"}`}>Sign Up</button>
        </div>

        <div className="text-center mb-6">
          <h1 className="text-2xl font-extrabold text-lime-950 dark:text-[#ecfdf5] tracking-tight">{isLogin ? "Welcome Back" : "Create an Account"}</h1>
          <p className="text-sm text-lime-800/70 dark:text-lime-200/50 mt-1 font-medium">{isLogin ? "Enter your details to access your account." : "Join the premier trading exchange."}</p>
        </div>

        {error && (
          <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="mb-4 p-3 text-sm text-red-700 dark:text-red-300 bg-red-100/50 dark:bg-red-900/30 border border-red-500/20 rounded-xl text-center font-medium shadow-sm">{error}</motion.div>
        )}

        <div className="relative overflow-hidden">
          <AnimatePresence mode="wait" initial={false}>
            <motion.form key={isLogin ? "login" : "signup"} initial={{ opacity: 0, x: isLogin ? -50 : 50 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: isLogin ? 50 : -50 }} transition={{ duration: 0.3, ease: "easeInOut" }} onSubmit={handleEmailAuth} className="space-y-4 pt-2 pb-4">
              
              {!isLogin && (
                <FloatingInput 
                  id="name" 
                  type="text" 
                  value={name} 
                  onChange={(e: ChangeEvent<HTMLInputElement>) => setName(e.target.value)} 
                  label="Full Name" 
                  icon={<User size={14} />} 
                />
              )}

              <FloatingInput 
                id="tour-input-email" 
                type="email" 
                value={email} 
                onChange={(e: ChangeEvent<HTMLInputElement>) => setEmail(e.target.value)} 
                label="Email" 
                icon={<Mail size={14} />} 
              />

              <FloatingInput 
                id="tour-input-password" 
                type="password" 
                value={password} 
                onChange={(e: ChangeEvent<HTMLInputElement>) => setPassword(e.target.value)} 
                label="Password" 
                icon={<Lock size={14} />} 
              />

              <div className="flex flex-col gap-2 mt-6">
                <Button id="tour-submit-btn" type="submit" disabled={isLoading} className="cursor-pointer w-full h-12 bg-lime-600 hover:bg-lime-700 text-white font-bold text-base rounded-xl shadow-lg shadow-lime-600/20 transition-all">{isLoading ? "Processing..." : isLogin ? "Log In" : "Sign Up"}</Button>
                <Button id="tour-demo-btn" type="button" onClick={fillDemoCredentials} variant="ghost" className="w-full h-10 text-lime-700 dark:text-lime-400  font-semibold hover:bg-lime-100 dark:hover:bg-[#121A14] rounded-xl transition-all flex cursor-pointer items-center justify-center gap-2"><PlayCircle size={18} /> Try a Demo Account</Button>
              </div>
            </motion.form>
          </AnimatePresence>
        </div>

        <div className="relative flex items-center py-2 mt-2">
          <div className="flex-grow border-t border-lime-500/20"></div>
          <span className="flex-shrink-0 mx-4 text-lime-700/60 dark:text-lime-300/60 text-[10px] sm:text-xs font-bold uppercase tracking-wider">Or continue with</span>
          <div className="flex-grow border-t border-lime-500/20"></div>
        </div>

        <div className="grid grid-cols-2 gap-3 mt-2">
          <Button id="tour-google-btn" type="button" onClick={handleGoogleLogin} disabled={isLoading} variant="secondary" className="cursor-pointer border-lime-500/30 dark:border-lime-500/20 bg-[#f4fbf5]/50 dark:bg-[#050806] hover:bg-white dark:hover:bg-[#121A14] text-lime-950 dark:text-white font-semibold rounded-xl h-11 shadow-sm flex items-center justify-center gap-2">
            <svg className="w-5 h-5" viewBox="0 0 24 24"><path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/><path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/><path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/><path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/></svg> Google
          </Button>
          <Button id="tour-passkey-btn" type="button" onClick={handleBiometricLogin} disabled={isLoading} variant="secondary" className="cursor-pointer border-lime-500/30 dark:border-lime-500/20 bg-[#f4fbf5]/50 dark:bg-[#050806] hover:bg-white dark:hover:bg-[#121A14] text-lime-950 dark:text-white font-semibold rounded-xl h-11 shadow-sm"><Fingerprint size={18} className="mr-2" /> Passkey</Button>
        </div>
        
      </motion.div>
    </div>
  );
}