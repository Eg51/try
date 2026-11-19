// app/admin/analytics/loading.tsx
export default function AdminAnalyticsLoading() {
  return (
    <div className="max-w-6xl mx-auto space-y-6 animate-pulse pt-4 sm:pt-8 px-2 sm:px-4">
      <div className="space-y-2">
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 rounded-full bg-lime-500/20"></div>
          <div className="h-8 w-48 bg-lime-500/20 rounded-lg"></div>
        </div>
        <div className="h-4 w-72 bg-lime-500/10 rounded"></div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="h-32 rounded-3xl bg-[#0a0f0b] border border-lime-500/20"></div>
        <div className="h-32 rounded-3xl bg-[#0a0f0b] border border-lime-500/20"></div>
      </div>

      <div className="h-[400px] rounded-3xl bg-[#0a0f0b] border border-lime-500/20"></div>
    </div>
  );
}