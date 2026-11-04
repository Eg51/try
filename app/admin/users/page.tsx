// app/admin/users/page.tsx
import { getAllUsers } from "@/app/actions/admin-users";
import { UserTable } from "./UserTable"; // 👈 Matches your named export
import { Users } from "lucide-react";
import { connection } from "next/server";

export const instant = false;

export default async function AdminUsersPage() {
  await connection();
  
  // Fetch the safe, typed user data
  const users = await getAllUsers();

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white tracking-tight flex items-center gap-2">
          <Users size={24} className="text-lime-500" /> User Management
        </h1>
        <p className="text-gray-400 text-sm mt-1">Manage platform access, roles, and status.</p>
      </div>
      
      {/* Pass the data directly to your client component */}
      <UserTable users={users} />
    </div>
  );
}