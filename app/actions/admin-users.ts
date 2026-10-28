// app/actions/admin-users.ts
"use server";

import { getServerSession } from "@/lib/session";
import connectDB from "@/lib/db";
import User, { IUser } from "@/lib/models/User"; // <--- Imported IUser
import { revalidatePath } from "next/cache";
import mongoose from "mongoose";

export type AdminUserView = {
  id: string;
  displayName: string;
  email: string;
  role: 'user' | 'admin';
  status: 'active' | 'suspended' | 'closed';
  kycTier: number;
  createdAt: string;
};

export async function getAllUsers(): Promise<AdminUserView[]> {
  const session = await getServerSession();
  
  // TypeScript now recognizes session.role
  if (!session || session.role !== 'admin') throw new Error("Unauthorized");

  await connectDB();
  const users = await User.find().sort({ createdAt: -1 }).limit(100).lean();

  return users.map((user) => {
    // FIX: Cast to IUser so TS knows the properties exist
    const u = user as unknown as IUser;
    return {
      id: u._id.toString(),
      displayName: u.displayName,
      email: u.email,
      role: u.role,
      status: u.status,
      kycTier: u.kycTier,
      createdAt: new Date(u.createdAt).toLocaleDateString(),
    };
  });
}

export async function updateUserStatus(userId: string, newStatus: 'active' | 'suspended') {
  const session = await getServerSession();
  if (!session || session.role !== 'admin') return { error: "Unauthorized" };

  // Prevent admins from banning themselves
  if (session.id === userId) return { error: "You cannot change your own status." };

  await connectDB();
  await User.findByIdAndUpdate(userId, { status: newStatus });
  
  revalidatePath('/admin/users');
  return { success: true };
}

export async function updateUserRole(userId: string, newRole: 'user' | 'admin') {
  const session = await getServerSession();
  if (!session || session.role !== 'admin') return { error: "Unauthorized" };

  // Prevent admins from demoting themselves (so you don't lock yourself out)
  if (session.id === userId) return { error: "You cannot change your own role." };

  await connectDB();
  await User.findByIdAndUpdate(userId, { role: newRole });
  
  revalidatePath('/admin/users');
  return { success: true };
}