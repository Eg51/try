"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { AdminUserView, updateUserStatus, updateUserRole } from "@/app/actions/admin-users";
import { Shield, ShieldAlert, Ban, CheckCircle2, X } from "lucide-react";
import { Button } from "@/components/ui/Button";

export function UserTable({ users }: { users: AdminUserView[] }) {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState<string | null>(null);
  
  // Custom Modal State instead of confirm()
  const [confirmAction, setConfirmAction] = useState<{ type: 'status' | 'role', userId: string, currentValue: string } | null>(null);

  async function executeAction() {
    if (!confirmAction) return;
    setIsLoading(confirmAction.userId);
    
    let res;
    if (confirmAction.type === 'status') {
      const newStatus = confirmAction.currentValue === 'active' ? 'suspended' : 'active';
      res = await updateUserStatus(confirmAction.userId, newStatus);
    } else {
      const newRole = confirmAction.currentValue === 'admin' ? 'user' : 'admin';
      res = await updateUserRole(confirmAction.userId, newRole);
    }
    
    if (res.error) alert(res.error);
    else router.refresh();
    
    setIsLoading(null);
    setConfirmAction(null);
  }

  return (
    <>
      <div className="bg-surface-800 border border-surface-700 rounded-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-surface-900/50 border-b border-surface-700 text-text-muted">
              <tr>
                <th className="p-4 font-medium">User</th>
                <th className="p-4 font-medium">Role</th>
                <th className="p-4 font-medium">Tier</th>
                <th className="p-4 font-medium">Status</th>
                <th className="p-4 font-medium text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-surface-700/50">
              {users.map((user) => (
                <tr key={user.id} className="hover:bg-surface-700/30 transition-colors">
                  <td className="p-4">
                    <p className="font-semibold text-text-primary">{user.displayName}</p>
                    <p className="text-xs text-text-muted">{user.email}</p>
                  </td>
                  <td className="p-4">
                    <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-md text-xs font-bold ${user.role === 'admin' ? 'bg-brand-500/10 text-brand-500' : 'bg-surface-900 text-text-muted'}`}>
                      {user.role === 'admin' ? <Shield size={12} /> : null} {user.role.toUpperCase()}
                    </span>
                  </td>
                  <td className="p-4 font-mono text-text-secondary">Tier {user.kycTier}</td>
                  <td className="p-4">
                    <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-md text-xs font-bold ${user.status === 'active' ? 'bg-success/10 text-success' : 'bg-danger/10 text-danger'}`}>
                      {user.status.toUpperCase()}
                    </span>
                  </td>
                  <td className="p-4 text-right space-x-2">
                    <button 
                      onClick={() => setConfirmAction({ type: 'role', userId: user.id, currentValue: user.role })}
                      disabled={isLoading === user.id}
                      className="p-2 rounded-lg bg-surface-900 border border-surface-700 hover:border-brand-500 text-text-secondary hover:text-brand-500 transition-colors"
                      title="Toggle Admin Role"
                    >
                      <ShieldAlert size={16} />
                    </button>
                    <button 
                      onClick={() => setConfirmAction({ type: 'status', userId: user.id, currentValue: user.status })}
                      disabled={isLoading === user.id}
                      className={`p-2 rounded-lg bg-surface-900 border border-surface-700 transition-colors ${user.status === 'active' ? 'hover:border-danger hover:text-danger' : 'hover:border-success hover:text-success'}`}
                      title={user.status === 'active' ? "Ban User" : "Unban User"}
                    >
                      {user.status === 'active' ? <Ban size={16} /> : <CheckCircle2 size={16} />}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Custom Confirmation Modal */}
      {confirmAction && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="w-full max-w-sm bg-surface-800 border border-surface-700 rounded-2xl p-6 shadow-2xl">
            <h3 className="text-lg font-bold text-text-primary mb-2">Confirm Action</h3>
            <p className="text-sm text-text-secondary mb-6">
              Are you sure you want to change this user's {confirmAction.type}?
            </p>
            <div className="flex gap-3">
              <Button onClick={() => setConfirmAction(null)} variant="ghost" className="flex-1">Cancel</Button>
              <Button onClick={executeAction} disabled={isLoading !== null} className="flex-1 bg-danger text-white hover:bg-danger/90">
                {isLoading ? "Updating..." : "Confirm"}
              </Button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}