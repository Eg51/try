// app/admin/users/page.tsx
import { getAllUsers } from "@/app/actions/admin-users";
import { UserTable } from "./UserTable";
import { Users } from "lucide-react";
export const instant = false;

export default async function AdminUsersPage() {
  const users = await getAllUsers();

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
            <Users size={24} className="text-brand-500" /> User Management
          </h1>
          <p className="text-text-secondary mt-1">View, ban, or promote users on the platform.</p>
        </div>
        <span className="bg-surface-800 border border-surface-700 px-4 py-2 rounded-lg text-sm font-mono text-text-muted">
          {users.length} Users Total
        </span>
      </div>

      <UserTable users={users} />
    </div>
  );
}