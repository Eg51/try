// app/admin/settings/loading.tsx
export default function AdminSettingsLoading() {
  return (
    <div className="max-w-4xl mx-auto space-y-6 animate-pulse pt-4 sm:pt-8 px-2 sm:px-4">
      
      {/* 👇 PAGE HEADER SKELETON */}
      <div className="space-y-2">
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 rounded-full bg-surface-700"></div>
          <div className="h-8 w-56 bg-surface-700 rounded-lg"></div>
        </div>
        <div className="h-4 w-72 bg-surface-700/50 rounded"></div>
      </div>

      {/* 👇 FORM CONTAINER SKELETON */}
      <div className="space-y-6 max-w-2xl">
        
        {/* Toggles Section */}
        <div className="space-y-4">
          
          {/* Toggle 1: Maintenance Mode */}
          <div className="flex items-center justify-between p-4 bg-white/5 rounded-xl border border-white/10 h-[76px]">
            <div className="space-y-2">
              <div className="h-5 w-40 bg-surface-700 rounded"></div>
              <div className="h-3 w-64 bg-surface-700/50 rounded"></div>
            </div>
            {/* Toggle Pill */}
            <div className="w-12 h-6 rounded-full bg-surface-700 flex items-center px-1">
              <div className="w-4 h-4 rounded-full bg-surface-600"></div>
            </div>
          </div>

          {/* Toggle 2: Allow Registration */}
          <div className="flex items-center justify-between p-4 bg-white/5 rounded-xl border border-white/10 h-[76px]">
            <div className="space-y-2">
              <div className="h-5 w-44 bg-surface-700 rounded"></div>
              <div className="h-3 w-56 bg-surface-700/50 rounded"></div>
            </div>
            {/* Toggle Pill */}
            <div className="w-12 h-6 rounded-full bg-surface-700 flex items-center px-1">
              <div className="w-4 h-4 rounded-full bg-surface-600"></div>
            </div>
          </div>

        </div>

        {/* Platform Fee Input Section */}
        <div className="p-4 bg-white/5 rounded-xl border border-white/10 h-[100px] flex flex-col justify-center gap-2">
          <div className="h-4 w-32 bg-surface-700 rounded"></div>
          <div className="h-12 w-full bg-[#050806] border border-white/20 rounded-lg"></div>
        </div>

        {/* Submit Button */}
        <div className="h-12 w-full bg-lime-600/20 rounded-xl mt-2"></div>

      </div>
    </div>
  );
}