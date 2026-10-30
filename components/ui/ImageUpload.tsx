// components/ui/ImageUpload.tsx
"use client";

import { useState, useRef, useEffect } from "react";
import { UploadCloud, X, Loader2, Image as ImageIcon, Sparkles, Camera } from "lucide-react";
import { useDevModal } from "@/components/providers/DevModalProvider";

interface ImageUploadProps {
  label: string;
  onChange: (base64: string) => void;
  isSelfie?: boolean; // Tells the camera to use the front lens
}

export default function ImageUpload({ label, onChange, isSelfie = false }: ImageUploadProps) {
  const [preview, setPreview] = useState<string | null>(null);
  const [pendingFile, setPendingFile] = useState<File | null>(null);
  const [isCompressing, setIsCompressing] = useState(false);
  const [showMenu, setShowMenu] = useState(false);
  
  const fileInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  const { openModal } = useDevModal();

  // Close menu when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setShowMenu(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setShowMenu(false); // Close menu after selection

    if (!file.type.startsWith("image/")) {
      openModal("Invalid File", "Please upload a valid image file (JPG, PNG).", "warning");
      return;
    }

    // If it's under 100KB, process immediately
    if (file.size <= 100 * 1024) {
      processFile(file);
    } else {
      // Otherwise, hold it in state and prompt for compression
      setPendingFile(file);
      setPreview(null);
      if (fileInputRef.current) fileInputRef.current.value = "";
      if (cameraInputRef.current) cameraInputRef.current.value = "";
    }
  };

  const processFile = (file: File) => {
    const reader = new FileReader();
    reader.onloadend = () => {
      const base64String = reader.result as string;
      setPreview(base64String);
      onChange(base64String);
      setPendingFile(null);
    };
    reader.readAsDataURL(file);
  };

  // 👇 The Canvas Compression Engine 👇
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

          // 1. Downscale if the image is massive (max 1200px width/height)
          const MAX_DIMENSION = 1200;
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

          // 2. Reduce JPEG quality until under 100KB
          let quality = 0.9;
          let dataUrl = canvas.toDataURL("image/jpeg", quality);
          
          const MAX_LENGTH = 136533;

          while (dataUrl.length > MAX_LENGTH && quality > 0.1) {
            quality -= 0.1;
            dataUrl = canvas.toDataURL("image/jpeg", quality);
          }

          setPreview(dataUrl);
          onChange(dataUrl);
          setPendingFile(null);
          setIsCompressing(false);
        };
      };
    } catch (error) {
      openModal("Compression Failed", "Failed to compress the image. Please try a different file.", "error");
      setIsCompressing(false);
    }
  };

  const handleRemove = (e: React.MouseEvent) => {
    e.stopPropagation();
    setPreview(null);
    setPendingFile(null);
    onChange("");
    if (fileInputRef.current) fileInputRef.current.value = "";
    if (cameraInputRef.current) cameraInputRef.current.value = "";
  };

  return (
    <div className="relative" ref={menuRef}>
      {/* 👇 Hidden Inputs: One for Gallery, One for Camera 👇 */}
      <input 
        type="file" 
        accept="image/*" 
        className="hidden" 
        ref={fileInputRef}
        onChange={handleFileChange}
      />
      <input 
        type="file" 
        accept="image/*" 
        capture={isSelfie ? "user" : "environment"} 
        className="hidden" 
        ref={cameraInputRef}
        onChange={handleFileChange}
      />
      
      {preview ? (
        <div className="relative border-2 border-lime-500/50 rounded-2xl p-2 bg-lime-500/5 h-[120px] flex items-center justify-center overflow-hidden group">
          <img src={preview} alt="Preview" className="h-full object-contain rounded-xl" />
          <button 
            type="button" 
            onClick={handleRemove}
            className="absolute top-2 right-2 p-1.5 bg-red-500 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity shadow-lg"
          >
            <X size={14} />
          </button>
        </div>
      ) : pendingFile ? (
        // 👇 The Compression UI Prompt 👇
        <div className="border-2 border-amber-500/50 rounded-2xl p-4 text-center bg-amber-500/10 h-[120px] flex flex-col justify-center items-center">
          <ImageIcon className="text-amber-500 mb-1" size={24} />
          <p className="text-xs font-bold text-amber-600 dark:text-amber-400 mb-2">
            Image is {(pendingFile.size / 1024 / 1024).toFixed(1)}MB (Max 100KB)
          </p>
          <button
            type="button"
            onClick={handleCompress}
            disabled={isCompressing}
            className="px-4 py-1.5 bg-amber-500 text-white text-xs font-bold rounded-lg hover:bg-amber-600 transition-colors flex items-center gap-1.5 shadow-md"
          >
            {isCompressing ? <Loader2 size={14} className="animate-spin" /> : <Sparkles size={14} />}
            {isCompressing ? "Compressing..." : "Compress Image"}
          </button>
        </div>
      ) : (
        <div className="relative">
          <div 
            onClick={() => setShowMenu(!showMenu)}
            className="border-2 border-dashed border-lime-500/30 hover:border-lime-500/60 transition-colors rounded-2xl p-6 text-center cursor-pointer bg-lime-500/5 flex flex-col justify-center h-[120px]"
          >
            <div className="mx-auto text-lime-500 mb-2 flex justify-center"><UploadCloud size={24} /></div>
            <p className="text-xs font-semibold text-lime-950 dark:text-white">{label}</p>
            <p className="text-[10px] text-lime-800/50 dark:text-lime-200/40 mt-1">Max 100KB (JPG, PNG)</p>
          </div>

          {/* 👇 THE POPUP MENU 👇 */}
          {showMenu && (
            <div className="absolute z-50 bottom-full mb-2 left-1/2 -translate-x-1/2 w-48 bg-white dark:bg-[#121A14] border border-lime-500/30 rounded-xl shadow-2xl p-2 flex flex-col gap-1">
              <button 
                type="button" 
                onClick={() => cameraInputRef.current?.click()} 
                className="flex items-center gap-3 p-2 hover:bg-lime-500/10 rounded-lg text-sm font-bold text-lime-950 dark:text-white transition-colors"
              >
                <Camera size={16} className="text-lime-500" /> Take Photo
              </button>
              <button 
                type="button" 
                onClick={() => fileInputRef.current?.click()} 
                className="flex items-center gap-3 p-2 hover:bg-lime-500/10 rounded-lg text-sm font-bold text-lime-950 dark:text-white transition-colors"
              >
                <ImageIcon size={16} className="text-blue-500" /> Choose File
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}// // components/ui/ImageUpload.tsx
// "use client";

// import { useState, useRef } from "react";
// import { UploadCloud, X, Loader2, Image as ImageIcon, Sparkles } from "lucide-react";
// import { useDevModal } from "@/components/providers/DevModalProvider";

// interface ImageUploadProps {
//   label: string;
//   onChange: (base64: string) => void;
// }

// export default function ImageUpload({ label, onChange }: ImageUploadProps) {
//   const [preview, setPreview] = useState<string | null>(null);
//   const [pendingFile, setPendingFile] = useState<File | null>(null);
//   const [isCompressing, setIsCompressing] = useState(false);
//   const fileInputRef = useRef<HTMLInputElement>(null);
//   const { openModal } = useDevModal();

//   const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
//     const file = e.target.files?.[0];
//     if (!file) return;

//     if (!file.type.startsWith("image/")) {
//       openModal("Invalid File", "Please upload a valid image file (JPG, PNG).", "warning");
//       return;
//     }

//     // If it's under 100KB, process immediately
//     if (file.size <= 100 * 1024) {
//       processFile(file);
//     } else {
//       // Otherwise, hold it in state and prompt for compression
//       setPendingFile(file);
//       setPreview(null);
//       if (fileInputRef.current) fileInputRef.current.value = "";
//     }
//   };

//   const processFile = (file: File) => {
//     const reader = new FileReader();
//     reader.onloadend = () => {
//       const base64String = reader.result as string;
//       setPreview(base64String);
//       onChange(base64String);
//       setPendingFile(null);
//     };
//     reader.readAsDataURL(file);
//   };

//   // 👇 The Canvas Compression Engine 👇
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

//           // 1. Downscale if the image is massive (max 1200px width/height)
//           const MAX_DIMENSION = 1200;
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

//           // 2. Reduce JPEG quality until under 100KB
//           let quality = 0.9;
//           let dataUrl = canvas.toDataURL("image/jpeg", quality);
          
//           // Base64 string length is roughly 4/3 of actual bytes
//           // 100KB = 102400 bytes -> ~136533 characters
//           const MAX_LENGTH = 136533;

//           while (dataUrl.length > MAX_LENGTH && quality > 0.1) {
//             quality -= 0.1;
//             dataUrl = canvas.toDataURL("image/jpeg", quality);
//           }

//           setPreview(dataUrl);
//           onChange(dataUrl);
//           setPendingFile(null);
//           setIsCompressing(false);
//         };
//       };
//     } catch (error) {
//       openModal("Compression Failed", "Failed to compress the image. Please try a different file.", "error");
//       setIsCompressing(false);
//     }
//   };

//   const handleRemove = (e: React.MouseEvent) => {
//     e.stopPropagation();
//     setPreview(null);
//     setPendingFile(null);
//     onChange("");
//     if (fileInputRef.current) fileInputRef.current.value = "";
//   };

//   return (
//     <div className="relative">
//       <input 
//         type="file" 
//         accept="image/*" 
//         className="hidden" 
//         ref={fileInputRef}
//         onChange={handleFileChange}
//       />
      
//       {preview ? (
//         <div className="relative border-2 border-lime-500/50 rounded-2xl p-2 bg-lime-500/5 h-[120px] flex items-center justify-center overflow-hidden group">
//           <img src={preview} alt="Preview" className="h-full object-contain rounded-xl" />
//           <button 
//             type="button" 
//             onClick={handleRemove}
//             className="absolute top-2 right-2 p-1.5 bg-red-500 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity shadow-lg"
//           >
//             <X size={14} />
//           </button>
//         </div>
//       ) : pendingFile ? (
//         // 👇 The Compression UI Prompt 👇
//         <div className="border-2 border-amber-500/50 rounded-2xl p-4 text-center bg-amber-500/10 h-[120px] flex flex-col justify-center items-center">
//           <ImageIcon className="text-amber-500 mb-1" size={24} />
//           <p className="text-xs font-bold text-amber-600 dark:text-amber-400 mb-2">
//             Image file is {(pendingFile.size / 1024 / 1024).toFixed(1)}MB (Max 100KB)
//           </p>
//           <button
//             type="button"
//             onClick={handleCompress}
//             disabled={isCompressing}
//             className="px-4 py-1.5 bg-amber-500 text-white text-xs font-bold rounded-lg hover:bg-amber-600 transition-colors flex items-center gap-1.5 shadow-md"
//           >
//             {isCompressing ? <Loader2 size={14} className="animate-spin" /> : <Sparkles size={14} />}
//             {isCompressing ? "Compressing..." : "Compress Image"}
//           </button>
//         </div>
//       ) : (
//         <div 
//           onClick={() => fileInputRef.current?.click()}
//           className="border-2 border-dashed border-lime-500/30 hover:border-lime-500/60 transition-colors rounded-2xl p-6 text-center cursor-pointer bg-lime-500/5 flex flex-col justify-center h-[120px]"
//         >
//           <div className="mx-auto text-lime-500 mb-2 flex justify-center"><UploadCloud size={24} /></div>
//           <p className="text-xs font-semibold text-lime-950 dark:text-white">{label}</p>
//           <p className="text-[10px] text-lime-800/50 dark:text-lime-200/40 mt-1">Max 100KB (JPG, PNG)</p>
//         </div>
//       )}
//     </div>
//   );
// }