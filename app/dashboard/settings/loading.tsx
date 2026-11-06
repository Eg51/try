// app/dashboard/settings/loading.tsx
export default function SettingsLoading() {
  return (
    <div className="max-w-4xl mx-auto space-y-8 pb-12 pt-4 sm:pt-8 px-2 sm:px-4 animate-pulse">
      
      {/* 👇 PAGE HEADER SKELETON */}
      <div className="space-y-2">
        <div className="h-9 w-32 bg-lime-500/20 rounded-xl"></div>
        <div className="h-4 w-80 bg-lime-500/10 rounded-lg"></div>
      </div>

      <div className="space-y-6">
        
        {/* 👇 1. PROFILE SECTION SKELETON */}
        <section className="bg-white/80 dark:bg-[#0a0f0b]/80 backdrop-blur-xl border border-lime-500/20 rounded-3xl overflow-hidden shadow-2xl h-[230px]">
          <div className="p-4 sm:p-6 border-b border-lime-500/20 bg-white/50 dark:bg-[#121A14]/50 flex items-center gap-2">
            <div className="w-5 h-5 rounded-full bg-lime-500/20"></div>
            <div className="h-6 w-40 bg-lime-500/20 rounded-lg"></div>
          </div>
          <div className="p-6 space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              
              {/* Display Name Input */}
              <div className="space-y-2">
                <div className="h-3 w-24 bg-lime-500/10 rounded"></div>
                <div className="h-[46px] w-full bg-[#f4fbf5] dark:bg-[#121A14] border border-lime-500/20 rounded-xl"></div>
              </div>
              
              {/* Account Tier Input */}
              <div className="space-y-2">
                <div className="h-3 w-20 bg-lime-500/10 rounded"></div>
                <div className="h-[46px] w-full bg-[#f4fbf5] dark:bg-[#121A14] border border-lime-500/20 rounded-xl"></div>
              </div>

            </div>
            
            {/* Edit Profile Link */}
            <div className="pt-2 flex justify-end">
              <div className="h-4 w-24 bg-lime-500/20 rounded"></div>
            </div>
          </div>
        </section>

        {/* 👇 2. APP PREFERENCES SKELETON */}
        <section className="bg-white/80 dark:bg-[#0a0f0b]/80 backdrop-blur-xl border border-lime-500/20 rounded-3xl overflow-hidden shadow-2xl h-[160px]">
          <div className="p-4 sm:p-6 border-b border-lime-500/20 bg-white/50 dark:bg-[#121A14]/50 flex items-center gap-2">
            <div className="w-5 h-5 rounded-full bg-lime-500/20"></div>
            <div className="h-6 w-40 bg-lime-500/20 rounded-lg"></div>
          </div>
          <div className="p-6 flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="space-y-3 w-full sm:w-auto">
              <div className="h-5 w-64 bg-lime-500/20 rounded"></div>
              <div className="h-4 w-full max-w-sm bg-lime-500/10 rounded"></div>
            </div>
            {/* Open Preferences Button */}
            <div className="h-11 w-full sm:w-48 bg-lime-500/20 rounded-xl shrink-0 mt-2 sm:mt-0"></div>
          </div>
        </section>

        {/* 👇 3. SECURITY SECTION SKELETON */}
        <section className="bg-white/80 dark:bg-[#0a0f0b]/80 backdrop-blur-xl border border-lime-500/20 rounded-3xl overflow-hidden shadow-2xl h-[160px]">
          <div className="p-4 sm:p-6 border-b border-lime-500/20 bg-white/50 dark:bg-[#121A14]/50 flex items-center gap-2">
            <div className="w-5 h-5 rounded-full bg-lime-500/20"></div>
            <div className="h-6 w-56 bg-lime-500/20 rounded-lg"></div>
          </div>
          <div className="p-6">
            {/* Mocking the WebAuthnSetup card */}
            <div className="flex items-center justify-between p-4 bg-[#f4fbf5]/50 dark:bg-[#121A14]/50 border border-lime-500/20 rounded-xl h-[72px]">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-lime-500/20"></div>
                <div className="space-y-2">
                  <div className="h-4 w-32 bg-lime-500/20 rounded"></div>
                  <div className="h-3 w-48 bg-lime-500/10 rounded"></div>
                </div>
              </div>
              <div className="h-10 w-24 bg-lime-500/20 rounded-lg"></div>
            </div>
          </div>
        </section>

      </div>
    </div>
  );
}
// // app/dashboard/settings/loading.tsx
// export default function SettingsLoading() {
//   return (
//     <div className="max-w-4xl mx-auto space-y-8 animate-pulse pt-4 sm:pt-8 px-2 sm:px-4">
      
//       {/* Page Header */}
//       <div className="space-y-2">
//         <div className="h-8 w-32 bg-surface-700 rounded-lg"></div>
//         <div className="h-4 w-64 bg-surface-700/50 rounded"></div>
//       </div>

//       <div className="space-y-6">
        
//         {/* 1. Profile Section Skeleton */}
//         <section className="bg-surface-800 border border-surface-700 rounded-xl overflow-hidden">
//           <div className="p-4 border-b border-surface-700 bg-surface-900/50 flex items-center gap-2">
//             <div className="w-5 h-5 rounded-full bg-surface-700"></div>
//             <div className="h-5 w-40 bg-surface-700 rounded"></div>
//           </div>
//           <div className="p-6 space-y-4">
//             <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              
//               {/* Display Name Input */}
//               <div className="space-y-2">
//                 <div className="h-3 w-24 bg-surface-700/50 rounded"></div>
//                 <div className="h-11 w-full bg-surface-900 border border-surface-700 rounded-lg"></div>
//               </div>
              
//               {/* Account Tier Input */}
//               <div className="space-y-2">
//                 <div className="h-3 w-20 bg-surface-700/50 rounded"></div>
//                 <div className="h-11 w-full bg-surface-900 border border-surface-700 rounded-lg"></div>
//               </div>

//             </div>
//           </div>
//         </section>

//         {/* 2. Security Section Skeleton */}
//         <section className="bg-surface-800 border border-surface-700 rounded-xl overflow-hidden">
//           <div className="p-4 border-b border-surface-700 bg-surface-900/50 flex items-center gap-2">
//             <div className="w-5 h-5 rounded-full bg-surface-700"></div>
//             <div className="h-5 w-56 bg-surface-700 rounded"></div>
//           </div>
//           <div className="p-6">
//             {/* Mocking the WebAuthnSetup card */}
//             <div className="flex items-center justify-between p-4 bg-surface-900 border border-surface-700 rounded-lg">
//               <div className="flex items-center gap-3">
//                 <div className="w-10 h-10 rounded-lg bg-surface-700"></div>
//                 <div className="space-y-2">
//                   <div className="h-4 w-32 bg-surface-700 rounded"></div>
//                   <div className="h-3 w-48 bg-surface-700/50 rounded"></div>
//                 </div>
//               </div>
//               <div className="h-10 w-20 bg-surface-700 rounded-lg"></div>
//             </div>
//           </div>
//         </section>

//         {/* 3. Display Preferences Section Skeleton */}
//         <section className="bg-surface-800 border border-surface-700 rounded-xl overflow-hidden">
//           <div className="p-4 border-b border-surface-700 bg-surface-900/50 flex items-center gap-2">
//             <div className="w-5 h-5 rounded-full bg-surface-700"></div>
//             <div className="h-5 w-44 bg-surface-700 rounded"></div>
//           </div>
//           <div className="p-6 space-y-6">
//             <div>
//               <div className="h-5 w-32 bg-surface-700 rounded mb-2"></div>
//               <div className="h-3 w-full max-w-md bg-surface-700/50 rounded mb-4"></div>
              
//               {/* Currency Selector Dropdown */}
//               <div className="h-12 w-full max-w-xs bg-surface-900 border border-surface-700 rounded-lg"></div>
//             </div>
//           </div>
//         </section>

//       </div>
//     </div>
//   );
// }