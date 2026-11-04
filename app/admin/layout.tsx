// app/admin/layout.tsx
import { getServerSession } from "@/lib/session";
import { redirect } from "next/navigation";
import Link from "next/link";
import { ShieldAlert, LayoutDashboard, Users, FileText, ArrowRightLeft, Settings, LogOut, ArrowLeft } from "lucide-react";
import { logout } from "@/app/actions/auth";

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const session = await getServerSession();

  if (!session || session.role !== 'admin') redirect("/dashboard");

  return (
    <div className="flex h-screen bg-[#050505] text-gray-100 font-sans">
      <aside className="w-64 border-r border-white/10 bg-[#0a0f0b] flex-col hidden md:flex">
        <div className="h-16 flex items-center px-6 border-b border-white/10 gap-3">
          <ShieldAlert className="text-lime-500" size={24} />
          <span className="font-bold tracking-wider text-white">ADMIN OS</span>
        </div>
        
        <nav className="flex-1 p-4 space-y-2">
          <NavItem href="/admin" icon={<LayoutDashboard size={18} />} label="Overview" />
          <NavItem href="/admin/users" icon={<Users size={18} />} label="Users" />
          <NavItem href="/admin/kyc" icon={<FileText size={18} />} label="KYC Queue" />
          <NavItem href="/admin/ledger" icon={<ArrowRightLeft size={18} />} label="Ledger" />
        </nav>

        <div className="p-4 border-t border-white/10 space-y-2">
          <Link href="/dashboard" className="flex items-center gap-3 px-3 py-2 rounded-lg text-sm text-gray-400 hover:text-white transition-colors">
            <ArrowLeft size={16} /> Exit Admin
          </Link>
          <form action={logout}>
            <button type="submit" className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm text-red-500 hover:bg-red-500/10 font-bold transition-colors">
              <LogOut size={16} /> Sign Out
            </button>
          </form>
        </div>
      </aside>

      <main className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <header className="h-16 border-b border-white/10 bg-[#0a0f0b]/50 flex items-center justify-between px-6 shrink-0">
          <div className="text-xs font-mono text-gray-400">Status: <span className="text-lime-500">Online</span></div>
          <div className="flex items-center gap-2 text-xs text-gray-400">
            <span>Admin: {session.displayName}</span>
            <div className="w-8 h-8 rounded-full bg-lime-500/20 text-lime-500 flex items-center justify-center font-bold">
              {session.displayName.charAt(0).toUpperCase()}
            </div>
          </div>
        </header>
        <div className="flex-1 overflow-y-auto p-6">{children}</div>
      </main>
    </div>
  );
}

function NavItem({ href, icon, label }: { href: string; icon: React.ReactNode; label: string }) {
  return (
    <Link href={href} className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-gray-400 hover:text-lime-400 hover:bg-white/5 transition-all">
      {icon} <span className="text-sm font-semibold">{label}</span>
    </Link>
  );
}