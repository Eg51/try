// app/dashboard/profile/loading.tsx
export default function ProfileLoading() {
  return (
    <div className="max-w-4xl mx-auto space-y-8 pb-12 pt-4 sm:pt-8 px-2 sm:px-4 animate-pulse">
      
      {/* 👇 PAGE TITLE SKELETON */}
      <div className="space-y-3">
        <div className="h-9 w-64 bg-lime-500/20 rounded-xl"></div>
        <div className="h-4 w-80 bg-lime-500/10 rounded-lg"></div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        
        {/* 👇 LEFT COLUMN: Identity Card */}
        <div className="md:col-span-1 flex flex-col gap-6">
          
          {/* Avatar & Basic Info Skeleton */}
          <div className="bg-white/80 dark:bg-[#0a0f0b]/80 backdrop-blur-xl border border-lime-500/20 rounded-3xl p-8 shadow-2xl flex flex-col items-center text-center relative overflow-hidden h-[320px]">
            <div className="absolute top-0 left-0 w-full h-24 bg-lime-500/10"></div>
            
            {/* Avatar Circle */}
            <div className="w-24 h-24 rounded-full bg-lime-500/20 border-4 border-white dark:border-[#0a0f0b] mb-4 z-10 mt-6"></div>
            
            {/* Name & Email */}
            <div className="space-y-3 w-full flex flex-col items-center mb-6 z-10">
              <div className="h-6 w-40 bg-lime-500/20 rounded-lg"></div>
              <div className="h-4 w-48 bg-lime-500/10 rounded-md"></div>
            </div>

            {/* Tier Badge */}
            <div className="w-full h-12 bg-lime-500/10 border border-lime-500/20 rounded-xl mt-auto z-10"></div>
          </div>

          {/* Quick Actions Skeleton */}
          <div className="bg-white/80 dark:bg-[#0a0f0b]/80 backdrop-blur-xl border border-lime-500/20 rounded-3xl p-4 shadow-2xl flex flex-col gap-2 h-[180px]">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="flex items-center gap-3 w-full p-3 rounded-xl">
                <div className="w-5 h-5 rounded-full bg-lime-500/20"></div>
                <div className="h-4 w-32 bg-lime-500/20 rounded"></div>
              </div>
            ))}
          </div>
        </div>

        {/* 👇 RIGHT COLUMN: Settings Forms */}
        <div className="md:col-span-2 space-y-6">
          
          {/* Personal Details Skeleton */}
          <div className="bg-white/80 dark:bg-[#0a0f0b]/80 backdrop-blur-xl border border-lime-500/20 rounded-3xl p-6 sm:p-8 shadow-2xl h-[220px]">
            <div className="flex items-center gap-2 mb-6">
              <div className="w-5 h-5 rounded-full bg-lime-500/20"></div>
              <div className="h-6 w-40 bg-lime-500/20 rounded-lg"></div>
            </div>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Display Name Input */}
              <div className="h-[54px] w-full bg-[#f4fbf5] dark:bg-[#0a0f0b] border-2 border-lime-500/30 rounded-xl"></div>
              {/* Email Input */}
              <div className="h-[54px] w-full bg-[#f4fbf5]/50 dark:bg-[#0a0f0b]/50 border-2 border-lime-500/10 rounded-xl"></div>
            </div>
            
            {/* Save Button */}
            <div className="h-11 w-36 bg-lime-500/20 rounded-xl mt-6"></div>
          </div>

          {/* Preferences Skeleton */}
          <div className="bg-white/80 dark:bg-[#0a0f0b]/80 backdrop-blur-xl border border-lime-500/20 rounded-3xl p-6 sm:p-8 shadow-2xl h-[150px]">
            <div className="flex items-center gap-2 mb-6">
              <div className="w-5 h-5 rounded-full bg-lime-500/20"></div>
              <div className="h-6 w-32 bg-lime-500/20 rounded-lg"></div>
            </div>
            
            <div className="flex items-center justify-between p-4 rounded-xl border border-lime-500/20 bg-lime-500/5">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-lg bg-lime-500/20"></div>
                <div className="space-y-2">
                  <div className="h-4 w-32 bg-lime-500/20 rounded"></div>
                  <div className="h-3 w-40 bg-lime-500/10 rounded"></div>
                </div>
              </div>
              {/* Manage Button */}
              <div className="h-9 w-24 bg-lime-500/20 rounded-lg"></div>
            </div>
          </div>

          {/* Active Sessions Skeleton */}
          <div className="bg-white/80 dark:bg-[#0a0f0b]/80 backdrop-blur-xl border border-lime-500/20 rounded-3xl p-6 sm:p-8 shadow-2xl h-[160px]">
            <div className="flex items-center gap-2 mb-6">
              <div className="w-5 h-5 rounded-full bg-lime-500/20"></div>
              <div className="h-6 w-40 bg-lime-500/20 rounded-lg"></div>
            </div>
            
            <div className="flex items-center justify-between p-4 rounded-xl border border-lime-500/20 bg-lime-500/5">
              <div className="flex items-center gap-3">
                <div className="w-2.5 h-2.5 rounded-full bg-lime-500/30"></div>
                <div className="space-y-2">
                  <div className="h-4 w-36 bg-lime-500/20 rounded"></div>
                  <div className="h-3 w-48 bg-lime-500/10 rounded"></div>
                </div>
              </div>
              <div className="h-4 w-14 bg-lime-500/20 rounded"></div>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}