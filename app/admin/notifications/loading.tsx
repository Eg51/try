// app/admin/notifications/loading.tsx
export default function AdminNotificationsLoading() {
  return (
    <div className="max-w-4xl mx-auto space-y-6 animate-pulse pt-4 sm:pt-8 px-2 sm:px-4">
      
      {/* 👇 PAGE HEADER SKELETON */}
      <div className="space-y-2">
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 rounded-full bg-surface-700"></div>
          <div className="h-8 w-56 bg-surface-700 rounded-lg"></div>
        </div>
        <div className="h-4 w-80 bg-surface-700/50 rounded"></div>
      </div>

      {/* 👇 FORM CONTAINER SKELETON */}
      <div className="bg-[#0a0f0b] border border-white/10 rounded-2xl p-6 space-y-6">
        
        {/* Row 1: Grid (Type & Target) */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          
          {/* Notification Type */}
          <div className="space-y-2">
            <div className="h-3 w-32 bg-surface-700 rounded"></div>
            <div className="h-[46px] w-full bg-black border border-white/10 rounded-xl"></div>
          </div>
          
          {/* Target Audience */}
          <div className="space-y-2">
            <div className="h-3 w-32 bg-surface-700 rounded"></div>
            <div className="h-[46px] w-full bg-black border border-white/10 rounded-xl"></div>
          </div>
          
        </div>

        {/* Row 2: Title Input */}
        <div className="space-y-2">
          <div className="h-3 w-16 bg-surface-700 rounded"></div>
          <div className="h-[46px] w-full bg-black border border-white/10 rounded-xl"></div>
        </div>

        {/* Row 3: Message Textarea */}
        <div className="space-y-2">
          <div className="h-3 w-20 bg-surface-700 rounded"></div>
          <div className="h-[120px] w-full bg-black border border-white/10 rounded-xl"></div>
        </div>

        {/* Row 4: Submit Button */}
        <div className="h-[50px] w-full bg-lime-600/20 rounded-xl"></div>

      </div>
    </div>
  );
}