// components/dashboard/UserAvatar.tsx
"use client";

import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Camera, Trash2, Maximize2, X, Loader2, Sparkles, Image as ImageIcon, Sun, Sunrise, Sunset, Moon } from "lucide-react";
import { updateUserAvatar, deleteUserAvatar } from "@/app/actions/profile";
import { useDevModal } from "@/components/providers/DevModalProvider";

export default function UserAvatar({ 
  initialImage, 
  userName 
}: { 
  initialImage: string; 
  userName: string;
}) {
  const [avatar, setAvatar] = useState(initialImage);
  const [isLoading, setIsLoading] = useState(false);
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);
  const [showMenu, setShowMenu] = useState(false);
  
  const [pendingFile, setPendingFile] = useState<File | null>(null);
  const [isCompressing, setIsCompressing] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const { openModal } = useDevModal();

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setShowMenu(false);

    if (!file.type.startsWith("image/")) {
      openModal("Invalid File", "Please upload a valid image file.", "warning");
      return;
    }

    if (file.size <= 100 * 1024) {
      processFile(file);
    } else {
      setPendingFile(file);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  const processFile = (file: File) => {
    setIsLoading(true);
    const reader = new FileReader();
    reader.onloadend = async () => {
      const base64String = reader.result as string;
      const res = await updateUserAvatar(base64String);
      
      if (res.success) {
        setAvatar(base64String);
        openModal("Success", "Profile picture updated successfully.", "success");
      } else {
        openModal("Error", res.error || "Failed to update.", "error");
      }
      setIsLoading(false);
      setPendingFile(null);
    };
    reader.readAsDataURL(file);
  };

  const handleCompress = async () => {
    if (!pendingFile) return;
    setIsCompressing(true);

    try {
      const reader = new FileReader();
      reader.readAsDataURL(pendingFile);
      reader.onload = (event) => {
        const img = new Image();
        img.src = event.target?.result as string;
        
        img.onload = () => {
          const canvas = document.createElement("canvas");
          let width = img.width;
          let height = img.height;

          const MAX_DIMENSION = 400;
          if (width > MAX_DIMENSION || height > MAX_DIMENSION) {
            if (width > height) {
              height *= MAX_DIMENSION / width;
              width = MAX_DIMENSION;
            } else {
              width *= MAX_DIMENSION / height;
              height = MAX_DIMENSION;
            }
          }

          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext("2d");
          ctx?.drawImage(img, 0, 0, width, height);

          let quality = 0.9;
          let dataUrl = canvas.toDataURL("image/jpeg", quality);
          const MAX_LENGTH = 136533;

          while (dataUrl.length > MAX_LENGTH && quality > 0.1) {
            quality -= 0.1;
            dataUrl = canvas.toDataURL("image/jpeg", quality);
          }

          const saveCompressed = async () => {
            setIsLoading(true);
            const res = await updateUserAvatar(dataUrl);
            if (res.success) {
              setAvatar(dataUrl);
              openModal("Success", "Image compressed and updated successfully.", "success");
            } else {
              openModal("Error", res.error || "Failed to update.", "error");
            }
            setIsLoading(false);
            setPendingFile(null);
            setIsCompressing(false);
          };
          
          saveCompressed();
        };
      };
    } catch (error) {
      openModal("Compression Failed", "Failed to compress the image. Please try a different file.", "error");
      setIsCompressing(false);
    }
  };

  const handleDelete = async () => {
    setIsLoading(true);
    const res = await deleteUserAvatar();
    if (res.success) {
      setAvatar("");
      setShowMenu(false);
      openModal("Removed", "Profile picture has been removed.", "info");
    } else {
      openModal("Error", res.error || "Failed to remove.", "error");
    }
    setIsLoading(false);
  };

  return (
    <>
      <input type="file" accept="image/*" className="hidden" ref={fileInputRef} onChange={handleFileChange} />

      <div 
        className="relative w-16 h-16 sm:w-20 sm:h-20 rounded-full cursor-pointer group"
        onClick={() => !isCompressing && setShowMenu(!showMenu)}
      >
        <div className="w-full h-full rounded-full overflow-hidden border-2 border-lime-500/30 bg-lime-500/10 flex items-center justify-center shadow-lg">
          {isLoading || isCompressing ? (
            <Loader2 className="animate-spin text-lime-500" size={24} />
          ) : avatar ? (
            <img src={avatar} alt="User Avatar" className="w-full h-full object-cover" />
          ) : (
            <span className="text-2xl font-bold text-lime-600 dark:text-lime-400">
              {userName.charAt(0).toUpperCase()}
            </span>
          )}
        </div>

        <div className={`absolute inset-0 bg-black/40 rounded-full transition-opacity flex items-center justify-center pointer-events-none ${showMenu || isCompressing ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'}`}>
          <Camera className="text-white" size={20} />
        </div>

        <AnimatePresence>
          {pendingFile && !isCompressing && (
            <motion.div 
              initial={{ opacity: 0, y: 10, scale: 0.95 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }}
              className="absolute top-full left-1/2 -translate-x-1/2 mt-2 w-52 bg-amber-500/10 dark:bg-amber-900/20 backdrop-blur-xl border border-amber-500/50 rounded-xl shadow-2xl p-3 z-50 flex flex-col items-center text-center"
              onClick={(e) => e.stopPropagation()}
            >
              <ImageIcon className="text-amber-500 mb-1" size={24} />
              <p className="text-[10px] font-bold text-amber-600 dark:text-amber-400 mb-2">
                Image is {(pendingFile.size / 1024 / 1024).toFixed(1)}MB (Max 100KB)
              </p>
              <button
                type="button"
                onClick={handleCompress}
                className="w-full py-1.5 bg-amber-500 text-white text-xs font-bold rounded-lg hover:bg-amber-600 transition-colors flex items-center justify-center gap-1.5 shadow-md"
              >
                <Sparkles size={14} /> Compress & Save
              </button>
              <button type="button" onClick={() => setPendingFile(null)} className="mt-2 text-[10px] text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 underline">
                Cancel
              </button>
            </motion.div>
          )}
        </AnimatePresence>

        <AnimatePresence>
          {showMenu && !pendingFile && (
            <motion.div 
              initial={{ opacity: 0, y: 10, scale: 0.95 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: 10, scale: 0.95 }}
              className="absolute top-full left-1/2 -translate-x-1/2 mt-2 w-40 bg-white/95 dark:bg-[#0a0f0b]/95 backdrop-blur-xl border border-lime-500/30 rounded-xl shadow-2xl p-2 z-50 flex flex-col gap-1"
              onClick={(e) => e.stopPropagation()}
            >
              <button onClick={() => fileInputRef.current?.click()} className="flex items-center gap-2 p-2 hover:bg-lime-500/10 rounded-lg text-xs font-bold text-lime-950 dark:text-white transition-colors">
                <Camera size={14} className="text-lime-500" /> Replace Image
              </button>
              
              {avatar && (
                <>
                  <button onClick={() => { setIsPreviewOpen(true); setShowMenu(false); }} className="flex items-center gap-2 p-2 hover:bg-lime-500/10 rounded-lg text-xs font-bold text-lime-950 dark:text-white transition-colors">
                    <Maximize2 size={14} className="text-blue-500" /> View Full
                  </button>
                  <button onClick={handleDelete} className="flex items-center gap-2 p-2 hover:bg-red-500/10 rounded-lg text-xs font-bold text-red-500 transition-colors">
                    <Trash2 size={14} /> Remove
                  </button>
                </>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <AnimatePresence>
        {isPreviewOpen && (
          <motion.div 
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setIsPreviewOpen(false)}
            className="fixed inset-0 z-[300] bg-black/90 backdrop-blur-sm flex items-center justify-center p-4 cursor-zoom-out"
          >
            <motion.div initial={{ scale: 0.9 }} animate={{ scale: 1 }} exit={{ scale: 0.9 }} className="relative max-w-2xl w-full max-h-[80vh] rounded-2xl overflow-hidden shadow-2xl border border-lime-500/30">
              <img src={avatar} alt="Full Avatar" className="w-full h-full object-contain" />
              <button onClick={() => setIsPreviewOpen(false)} className="absolute top-4 right-4 p-2 bg-black/50 text-white rounded-full hover:bg-black/80 transition-colors">
                <X size={20} />
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}

// 👇 NEW COMPONENT: Animated Time Greeting
export function TimeGreeting({ userName }: { userName: string }) {
  const [greeting, setGreeting] = useState({
    text: "Hello",
    icon: <Sun size={20} fill="currentColor" />,
    color: "text-amber-500"
  });

  useEffect(() => {
    const hour = new Date().getHours();
    if (hour >= 5 && hour < 12) {
      setGreeting({ text: "Good morning", icon: <Sunrise size={20} fill="currentColor" />, color: "text-amber-500" });
    } else if (hour >= 12 && hour < 17) {
      setGreeting({ text: "Good afternoon", icon: <Sun size={20} fill="currentColor" />, color: "text-orange-500" });
    } else if (hour >= 17 && hour < 21) {
      setGreeting({ text: "Good evening", icon: <Sunset size={20} fill="currentColor" />, color: "text-rose-500" });
    } else {
      setGreeting({ text: "Good night", icon: <Moon size={20} fill="currentColor" />, color: "text-indigo-400" });
    }
  }, []);

  return (
    <div className="flex flex-col">
      <motion.div 
        initial={{ opacity: 0, y: -10 }} 
        animate={{ opacity: 1, y: 0 }} 
        className="flex items-center gap-2 mb-1"
      >
        {/* Floating Icon */}
        <motion.div
          animate={{ y: [0, -3, 0] }}
          transition={{ repeat: Infinity, duration: 3, ease: "easeInOut" }}
          className={`p-1.5 rounded-full bg-white/50 dark:bg-[#121A14]/50 backdrop-blur-md border border-lime-500/20 shadow-sm ${greeting.color}`}
        >
          {greeting.icon}
        </motion.div>
        <span className="text-sm font-bold text-lime-800/70 dark:text-lime-200/50 uppercase tracking-widest">
          {greeting.text},
        </span>
      </motion.div>
      
      {/* Animated Name */}
      <motion.h1 
        initial={{ opacity: 0, x: -10 }} 
        animate={{ opacity: 1, x: 0 }} 
        transition={{ delay: 0.1 }}
        className="text-2xl font-extrabold text-lime-950 dark:text-white tracking-tight"
      >
        {userName}
      </motion.h1>
    </div>
  );
}
// // dashboard/UserAvatar.tsx
// "use client";

// import { useState, useRef } from "react";
// import { motion, AnimatePresence } from "framer-motion";
// import { Camera, Trash2, Maximize2, X, Loader2, Sparkles, Image as ImageIcon } from "lucide-react";
// import { updateUserAvatar, deleteUserAvatar } from "@/app/actions/profile";
// import { useDevModal } from "@/components/providers/DevModalProvider";

// export default function UserAvatar({ 
//   initialImage, 
//   userName 
// }: { 
//   initialImage: string; 
//   userName: string;
// }) {
//   const [avatar, setAvatar] = useState(initialImage);
//   const [isLoading, setIsLoading] = useState(false);
//   const [isPreviewOpen, setIsPreviewOpen] = useState(false);
//   const [showMenu, setShowMenu] = useState(false);
  
//   // 👇 New states for compression
//   const [pendingFile, setPendingFile] = useState<File | null>(null);
//   const [isCompressing, setIsCompressing] = useState(false);

//   const fileInputRef = useRef<HTMLInputElement>(null);
//   const { openModal } = useDevModal();

//   const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
//     const file = e.target.files?.[0];
//     if (!file) return;
//     setShowMenu(false);

//     if (!file.type.startsWith("image/")) {
//       openModal("Invalid File", "Please upload a valid image file.", "warning");
//       return;
//     }

//     // 👇 Check size before processing
//     if (file.size <= 100 * 1024) {
//       processFile(file);
//     } else {
//       // Hold it for compression
//       setPendingFile(file);
//       if (fileInputRef.current) fileInputRef.current.value = "";
//     }
//   };

//   const processFile = (file: File) => {
//     setIsLoading(true);
//     const reader = new FileReader();
//     reader.onloadend = async () => {
//       const base64String = reader.result as string;
//       const res = await updateUserAvatar(base64String);
      
//       if (res.success) {
//         setAvatar(base64String);
//         openModal("Success", "Profile picture updated successfully.", "success");
//       } else {
//         openModal("Error", res.error || "Failed to update.", "error");
//       }
//       setIsLoading(false);
//       setPendingFile(null);
//     };
//     reader.readAsDataURL(file);
//   };

//   // 👇 The Canvas Compression Engine
//   const handleCompress = async () => {
//     if (!pendingFile) return;
//     setIsCompressing(true);

//     try {
//       const reader = new FileReader();
//       reader.readAsDataURL(pendingFile);
//       reader.onload = (event) => {
//         const img = new Image();
//         img.src = event.target?.result as string;
        
//         img.onload = () => {
//           const canvas = document.createElement("canvas");
//           let width = img.width;
//           let height = img.height;

//           const MAX_DIMENSION = 400; // Avatars don't need to be massive
//           if (width > MAX_DIMENSION || height > MAX_DIMENSION) {
//             if (width > height) {
//               height *= MAX_DIMENSION / width;
//               width = MAX_DIMENSION;
//             } else {
//               width *= MAX_DIMENSION / height;
//               height = MAX_DIMENSION;
//             }
//           }

//           canvas.width = width;
//           canvas.height = height;
//           const ctx = canvas.getContext("2d");
//           ctx?.drawImage(img, 0, 0, width, height);

//           let quality = 0.9;
//           let dataUrl = canvas.toDataURL("image/jpeg", quality);
//           const MAX_LENGTH = 136533; // ~100KB

//           while (dataUrl.length > MAX_LENGTH && quality > 0.1) {
//             quality -= 0.1;
//             dataUrl = canvas.toDataURL("image/jpeg", quality);
//           }

//           // Once compressed, save it immediately
//           const saveCompressed = async () => {
//             setIsLoading(true);
//             const res = await updateUserAvatar(dataUrl);
//             if (res.success) {
//               setAvatar(dataUrl);
//               openModal("Success", "Image compressed and updated successfully.", "success");
//             } else {
//               openModal("Error", res.error || "Failed to update.", "error");
//             }
//             setIsLoading(false);
//             setPendingFile(null);
//             setIsCompressing(false);
//           };
          
//           saveCompressed();
//         };
//       };
//     } catch (error) {
//       openModal("Compression Failed", "Failed to compress the image. Please try a different file.", "error");
//       setIsCompressing(false);
//     }
//   };

//   const handleDelete = async () => {
//     setIsLoading(true);
//     const res = await deleteUserAvatar();
//     if (res.success) {
//       setAvatar("");
//       setShowMenu(false);
//       openModal("Removed", "Profile picture has been removed.", "info");
//     } else {
//       openModal("Error", res.error || "Failed to remove.", "error");
//     }
//     setIsLoading(false);
//   };

//   return (
//     <>
//       <input 
//         type="file" 
//         accept="image/*" 
//         className="hidden" 
//         ref={fileInputRef}
//         onChange={handleFileChange}
//       />

//       {/* 👇 The Avatar Circle Container 👇 */}
//       <div 
//         className="relative w-16 h-16 sm:w-20 sm:h-20 rounded-full cursor-pointer group"
//         onClick={() => !isCompressing && setShowMenu(!showMenu)}
//       >
//         <div className="w-full h-full rounded-full overflow-hidden border-2 border-lime-500/30 bg-lime-500/10 flex items-center justify-center shadow-lg">
//           {isLoading || isCompressing ? (
//             <Loader2 className="animate-spin text-lime-500" size={24} />
//           ) : avatar ? (
//             <img src={avatar} alt="User Avatar" className="w-full h-full object-cover" />
//           ) : (
//             <span className="text-2xl font-bold text-lime-600 dark:text-lime-400">
//               {userName.charAt(0).toUpperCase()}
//             </span>
//           )}
//         </div>

//         {/* Hover Overlay */}
//         <div className={`absolute inset-0 bg-black/40 rounded-full transition-opacity flex items-center justify-center pointer-events-none ${showMenu || isCompressing ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'}`}>
//           <Camera className="text-white" size={20} />
//         </div>

//         {/* 👇 The Compression Prompt (Replaces Menu) 👇 */}
//         <AnimatePresence>
//           {pendingFile && !isCompressing && (
//             <motion.div 
//               initial={{ opacity: 0, y: 10, scale: 0.95 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }}
//               className="absolute top-full left-1/2 -translate-x-1/2 mt-2 w-52 bg-amber-500/10 dark:bg-amber-900/20 backdrop-blur-xl border border-amber-500/50 rounded-xl shadow-2xl p-3 z-50 flex flex-col items-center text-center"
//               onClick={(e) => e.stopPropagation()}
//             >
//               <ImageIcon className="text-amber-500 mb-1" size={24} />
//               <p className="text-[10px] font-bold text-amber-600 dark:text-amber-400 mb-2">
//                 Image is {(pendingFile.size / 1024 / 1024).toFixed(1)}MB (Max 100KB)
//               </p>
//               <button
//                 type="button"
//                 onClick={handleCompress}
//                 className="w-full py-1.5 bg-amber-500 text-white text-xs font-bold rounded-lg hover:bg-amber-600 transition-colors flex items-center justify-center gap-1.5 shadow-md"
//               >
//                 <Sparkles size={14} /> Compress & Save
//               </button>
//               <button 
//                 type="button"
//                 onClick={() => setPendingFile(null)}
//                 className="mt-2 text-[10px] text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 underline"
//               >
//                 Cancel
//               </button>
//             </motion.div>
//           )}
//         </AnimatePresence>

//         {/* 👇 The Normal Dropdown Menu 👇 */}
//         <AnimatePresence>
//           {showMenu && !pendingFile && (
//             <motion.div 
//               initial={{ opacity: 0, y: 10, scale: 0.95 }}
//               animate={{ opacity: 1, y: 0, scale: 1 }}
//               exit={{ opacity: 0, y: 10, scale: 0.95 }}
//               className="absolute top-full left-1/2 -translate-x-1/2 mt-2 w-40 bg-white/95 dark:bg-[#0a0f0b]/95 backdrop-blur-xl border border-lime-500/30 rounded-xl shadow-2xl p-2 z-50 flex flex-col gap-1"
//               onClick={(e) => e.stopPropagation()}
//             >
//               <button 
//                 onClick={() => fileInputRef.current?.click()}
//                 className="flex items-center gap-2 p-2 hover:bg-lime-500/10 rounded-lg text-xs font-bold text-lime-950 dark:text-white transition-colors"
//               >
//                 <Camera size={14} className="text-lime-500" /> Replace Image
//               </button>
              
//               {avatar && (
//                 <>
//                   <button 
//                     onClick={() => { setIsPreviewOpen(true); setShowMenu(false); }}
//                     className="flex items-center gap-2 p-2 hover:bg-lime-500/10 rounded-lg text-xs font-bold text-lime-950 dark:text-white transition-colors"
//                   >
//                     <Maximize2 size={14} className="text-blue-500" /> View Full
//                   </button>
//                   <button 
//                     onClick={handleDelete}
//                     className="flex items-center gap-2 p-2 hover:bg-red-500/10 rounded-lg text-xs font-bold text-red-500 transition-colors"
//                   >
//                     <Trash2 size={14} /> Remove
//                   </button>
//                 </>
//               )}
//             </motion.div>
//           )}
//         </AnimatePresence>
//       </div>

//       {/* 👇 Full Screen Preview Modal 👇 */}
//       <AnimatePresence>
//         {isPreviewOpen && (
//           <motion.div 
//             initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
//             onClick={() => setIsPreviewOpen(false)}
//             className="fixed inset-0 z-[300] bg-black/90 backdrop-blur-sm flex items-center justify-center p-4 cursor-zoom-out"
//           >
//             <motion.div 
//               initial={{ scale: 0.9 }} animate={{ scale: 1 }} exit={{ scale: 0.9 }}
//               className="relative max-w-2xl w-full max-h-[80vh] rounded-2xl overflow-hidden shadow-2xl border border-lime-500/30"
//             >
//               <img src={avatar} alt="Full Avatar" className="w-full h-full object-contain" />
//               <button 
//                 onClick={() => setIsPreviewOpen(false)}
//                 className="absolute top-4 right-4 p-2 bg-black/50 text-white rounded-full hover:bg-black/80 transition-colors"
//               >
//                 <X size={20} />
//               </button>
//             </motion.div>
//           </motion.div>
//         )}
//       </AnimatePresence>
//     </>
//   );
// }