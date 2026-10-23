// app/admin/layout.tsx
import Link from "next/link";
import { LayoutDashboard, Users, ShieldAlert, FileText, Settings, ArrowLeft, LogOut } from "lucide-react";
import { getServerSession } from "@/lib/session";
import { redirect } from "next/navigation";
import { logout } from "@/app/actions/auth";
import { connection } from "next/server";

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  // FIX: Tells Next.js 16 to render this dynamically at request time
  await connection();

  const session = await getServerSession();
  
  // SECURITY: If no session, or user is not an admin, kick them out
  if (!session || session.role !== 'admin') {
    redirect("/dashboard");
  }

  return (
    <div className="flex h-screen overflow-hidden bg-[#050505]">
      {/* Admin Sidebar */}
      <aside className="w-64 border-r border-surface-700 bg-surface-900 flex-col hidden md:flex">
        <div className="h-16 flex items-center px-6 border-b border-surface-700 gap-3">
          <ShieldAlert className="text-brand-500" size={24} />
          <span className="text-text-primary font-bold tracking-wider">ADMIN OS</span>
        </div>
        
        <nav className="flex-1 p-4 space-y-2">
          <NavItem href="/admin" icon={<LayoutDashboard size={20} />} label="Command Center" />
          <NavItem href="/admin/users" icon={<Users size={20} />} label="User Management" />
          <NavItem href="/admin/kyc" icon={<FileText size={20} />} label="KYC Review Queue" />
          <NavItem href="/admin/ledger" icon={<ShieldAlert size={20} />} label="Ledger Audit" />
          <NavItem href="/admin/settings" icon={<Settings size={20} />} label="Platform Settings" />
        </nav>

        <div className="p-4 border-t border-surface-700">
          <Link href="/dashboard" className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-text-muted hover:text-brand-500 transition-all text-sm mb-4">
            <ArrowLeft size={16} /> Exit Admin Mode
          </Link>
          <form action={logout}>
            <button type="submit" className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-danger hover:bg-danger/10 transition-colors text-sm font-semibold">
              <LogOut size={16} /> Sign Out
            </button>
          </form>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <header className="h-16 border-b border-surface-700 bg-surface-900/50 backdrop-blur-md flex items-center justify-between px-6">
          <div className="text-sm font-mono text-text-muted">System Status: <span className="text-success">Operational</span></div>
          <div className="flex items-center gap-3">
             <span className="text-xs text-text-muted">Admin: {session.displayName}</span>
             <div className="w-8 h-8 rounded-full bg-brand-500/20 border border-brand-500/50 flex items-center justify-center text-brand-500 font-bold">
              {session.displayName.charAt(0).toUpperCase()}
            </div>
          </div>
        </header>
        <div className="flex-1 overflow-y-auto p-6 md:p-8">
          {children}
        </div>
      </main>
    </div>
  );
}

function NavItem({ href, icon, label }: { href: string, icon: React.ReactNode, label: string }) {
  return (
    <Link href={href} className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-text-secondary hover:text-brand-500 hover:bg-surface-800 transition-all group">
      <span className="text-text-muted group-hover:text-brand-500 transition-colors">{icon}</span>
      <span className="font-medium text-sm">{label}</span>
    </Link>
  );
}