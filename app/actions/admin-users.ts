// app/actions/admin-users.ts
"use server";

import { getServerSession } from "@/lib/session";
import connectDB from "@/lib/db";
import User, { IUser } from "@/lib/models/User";
import { createSystemNotification } from "@/lib/models/Notification"; 
import { revalidatePath } from "next/cache";

export type AdminUserView = {
  id: string;
  displayName: string;
  email: string;
  country?: string; // 👈 ADDED THIS
  phone?: string;   // 👈 ADDED THIS
  role: 'user' | 'admin';
  status: 'active' | 'suspended' | 'closed';
  kycTier: number;
  createdAt: string;
  lockedUntil?: string; 
};

export async function getAllUsers(): Promise<AdminUserView[]> {
  const session = await getServerSession();
  if (!session || session.role !== 'admin') throw new Error("Unauthorized");

  await connectDB();
  const users = await User.find().sort({ createdAt: -1 }).limit(100).lean();

  return users.map((user) => {
    const u = user as unknown as IUser;
    return {
      id: u._id.toString(),
      displayName: u.displayName,
      email: u.email,
      country: u.country, // 👈 ADDED THIS
      phone: u.phone,     // 👈 ADDED THIS
      role: u.role,
      status: u.status,
      kycTier: u.kycTier,
      createdAt: new Date(u.createdAt).toLocaleDateString(),
      lockedUntil: u.lockedUntil ? u.lockedUntil.toLocaleString() : undefined,
    };
  });
}

export async function updateUserStatus(userId: string, newStatus: 'active' | 'suspended') {
  const session = await getServerSession();
  if (!session || session.role !== 'admin') return { error: "Unauthorized" };
  if (session.id === userId) return { error: "You cannot change your own status." };

  await connectDB();
  await User.findByIdAndUpdate(userId, { status: newStatus });

  if (newStatus === "suspended") {
    await createSystemNotification(userId, "alert", "Account Suspended", "Your account has been suspended by an administrator. Please contact support for more information.", "/dashboard");
  } else if (newStatus === "active") {
    await createSystemNotification(userId, "system", "Account Reinstated", "Your account has been reinstated. You can now resume trading.", "/dashboard");
  }
  
  revalidatePath('/admin/users');
  return { success: true };
}

export async function updateUserRole(userId: string, newRole: 'user' | 'admin') {
  const session = await getServerSession();
  if (!session || session.role !== 'admin') return { error: "Unauthorized" };
  if (session.id === userId) return { error: "You cannot change your own role." };

  await connectDB();
  await User.findByIdAndUpdate(userId, { role: newRole });
  
  revalidatePath('/admin/users');
  return { success: true };
}

export async function lockUserAccount(email: string, durationHours: number) {
  const session = await getServerSession();
  if (!session || session.role !== 'admin') return { error: "Unauthorized" };

  await connectDB();
  const user = await User.findOne({ email });
  if (!user) return { error: "User not found." };

  const lockedUntil = durationHours === -1 
    ? new Date("2099-12-31") 
    : new Date(Date.now() + durationHours * 60 * 60 * 1000);

  await User.findOneAndUpdate({ email }, { lockedUntil });
  
  await createSystemNotification(
    user._id.toString(), 
    "alert", 
    "Account Locked", 
    `Your account has been temporarily locked until ${lockedUntil.toLocaleString()}. Please contact support if you believe this is a mistake.`, 
    "/dashboard"
  );

  revalidatePath('/admin/users');
  return { success: true, message: `User locked until ${lockedUntil.toLocaleString()}` };
}





// // app/actions/admin-users.ts
// "use server";

// import { getServerSession } from "@/lib/session";
// import connectDB from "@/lib/db";
// import User, { IUser } from "@/lib/models/User";
// import { createSystemNotification } from "@/lib/models/Notification"; 
// import { revalidatePath } from "next/cache";

// export type AdminUserView = {
//   id: string;
//   displayName: string;
//   email: string;
//   role: 'user' | 'admin';
//   status: 'active' | 'suspended' | 'closed';
//   kycTier: number;
//   createdAt: string;
//   lockedUntil?: string; // 👈 FIXED: Added here
// };

// export async function getAllUsers(): Promise<AdminUserView[]> {
//   const session = await getServerSession();
//   if (!session || session.role !== 'admin') throw new Error("Unauthorized");

//   await connectDB();
//   const users = await User.find().sort({ createdAt: -1 }).limit(100).lean();

//   return users.map((user) => {
//     const u = user as unknown as IUser;
//     return {
//       id: u._id.toString(),
//       displayName: u.displayName,
//       email: u.email,
//       role: u.role,
//       status: u.status,
//       kycTier: u.kycTier,
//       createdAt: new Date(u.createdAt).toLocaleDateString(),
//       // 👇 FIXED: Added u.lockedUntil
//       lockedUntil: u.lockedUntil ? u.lockedUntil.toLocaleString() : undefined,
//     };
//   });
// }

// export async function updateUserStatus(userId: string, newStatus: 'active' | 'suspended') {
//   const session = await getServerSession();
//   if (!session || session.role !== 'admin') return { error: "Unauthorized" };
//   if (session.id === userId) return { error: "You cannot change your own status." };

//   await connectDB();
//   await User.findByIdAndUpdate(userId, { status: newStatus });

//   if (newStatus === "suspended") {
//     await createSystemNotification(userId, "alert", "Account Suspended", "Your account has been suspended by an administrator. Please contact support for more information.", "/dashboard");
//   } else if (newStatus === "active") {
//     await createSystemNotification(userId, "system", "Account Reinstated", "Your account has been reinstated. You can now resume trading.", "/dashboard");
//   }
  
//   revalidatePath('/admin/users');
//   return { success: true };
// }

// export async function updateUserRole(userId: string, newRole: 'user' | 'admin') {
//   const session = await getServerSession();
//   if (!session || session.role !== 'admin') return { error: "Unauthorized" };
//   if (session.id === userId) return { error: "You cannot change your own role." };

//   await connectDB();
//   await User.findByIdAndUpdate(userId, { role: newRole });
  
//   revalidatePath('/admin/users');
//   return { success: true };
// }

// export async function lockUserAccount(email: string, durationHours: number) {
//   const session = await getServerSession();
//   if (!session || session.role !== 'admin') return { error: "Unauthorized" };

//   await connectDB();
//   const user = await User.findOne({ email });
//   if (!user) return { error: "User not found." };

//   const lockedUntil = durationHours === -1 
//     ? new Date("2099-12-31") 
//     : new Date(Date.now() + durationHours * 60 * 60 * 1000);

//   await User.findOneAndUpdate({ email }, { lockedUntil });
  
//   await createSystemNotification(
//     user._id.toString(), 
//     "alert", 
//     "Account Locked", 
//     `Your account has been temporarily locked until ${lockedUntil.toLocaleString()}. Please contact support if you believe this is a mistake.`, 
//     "/dashboard"
//   );

//   revalidatePath('/admin/users');
//   return { success: true, message: `User locked until ${lockedUntil.toLocaleString()}` };
// }


