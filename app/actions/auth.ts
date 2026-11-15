// app/actions/auth.ts
"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { z } from "zod";
import bcrypt from "bcryptjs";
import crypto from "crypto";
import { adminAuth } from "@/lib/firebase-admin";
import connectDB from "@/lib/db";
import User from "@/lib/models/User";
import Settings from "@/lib/models/Settings";
import { LedgerAccount } from "@/lib/models/Ledger";
import { getSystemAccount, SUPPORTED_ASSETS } from "@/lib/ledger-helper";
import { createSystemNotification } from "@/lib/models/Notification";
import { checkRateLimit } from "@/lib/rate-limit";
import { getDeviceDetails } from "@/lib/device";

// 👇 UPDATED: Added role to AuthResult
type AuthResult = 
  | { success: true; customToken?: string; role?: string; error?: never }
  | { success?: false; customToken?: never; role?: never; error: string };

// ==========================================
// HELPER: BOOTSTRAP NEW USER
// ==========================================
async function bootstrapUser(email: string, name: string, firebaseUid: string, deviceId: string, passwordHash?: string) {
  const user = await User.create({
    firebaseUid, 
    email, 
    passwordHash, 
    displayName: name, 
    deviceIds: [deviceId], 
    role: "user", 
    status: "active", 
    kycTier: 0, 
    displayCurrency: { assetId: "USD", selectedAt: new Date() },
    failedOtpAttempts: 0,
    isResetBlocked: false,
  });

  // Create Ledger Accounts
  await Promise.all(SUPPORTED_ASSETS.map(asset => 
    LedgerAccount.updateOne(
      { userId: user._id, assetId: asset, type: "available" }, 
      { $setOnInsert: { cachedBalance: 0 } }, 
      { upsert: true }
    )
  ));

  // Ensure System Accounts Exist
  await Promise.all(SUPPORTED_ASSETS.map(asset => getSystemAccount(asset)));

  // Welcome Notification
  await createSystemNotification(
    user._id.toString(), 
    "system", 
    "Welcome to Quantix Solaris!", 
    "Your account has been created successfully. Complete your KYC to unlock trading.", 
    "/dashboard"
  );

  return user;
}

// ==========================================
// 1. REGISTER WITH EMAIL
// ==========================================
const registerSchema = z.object({ name: z.string().min(2), email: z.string().email(), password: z.string().min(6) });

export async function registerWithEmail(rawData: unknown): Promise<AuthResult> {
  try {
    const { deviceId, ip } = await getDeviceDetails(); 
    
    // 🛡️ RATE LIMIT: Max 3 registrations per hour per IP
    const limit = await checkRateLimit(`register:${ip}`, 3, 3600);
    if (!limit.success) return { error: "Too many accounts created from this network. Please try again later." };

    const parsed = registerSchema.safeParse(rawData);
    if (!parsed.success) return { error: parsed.error.issues[0].message };

    await connectDB();

    // 🛡️ DEVICE LIMIT: Max 2 accounts created per device
    const signupsOnDevice = await User.countDocuments({ deviceIds: deviceId });
    if (signupsOnDevice >= 2) return { error: "Maximum signup limit reached for this device." };

    // Check global settings
    const settings = await Settings.findOne().lean();
    if (settings && settings.allowRegistration === false) return { error: "Registration is currently disabled by the administrator." };

    if (await User.findOne({ email: parsed.data.email })) return { error: "Email already in use." };

    // Create Firebase User First
    let firebaseUid = "";
    try {
      const fbUser = await adminAuth.createUser({ email: parsed.data.email, displayName: parsed.data.name });
      firebaseUid = fbUser.uid;
    } catch (error: any) {
      if (error.code === 'auth/email-already-exists') return { error: "A user with this mail already exists." };
      throw error;
    }

    // Hash Password (12 rounds)
    const passwordHash = await bcrypt.hash(parsed.data.password, 12);
    const user = await bootstrapUser(parsed.data.email, parsed.data.name, firebaseUid, deviceId, passwordHash);

    const customToken = await adminAuth.createCustomToken(user.firebaseUid);
    return { success: true, customToken, role: user.role }; // 👈 ADDED role
  } catch (error: any) {
    console.error("❌ REGISTER ERROR:", error);
    return { error: "Registration failed." };
  }
}

// ==========================================
// 2. LOGIN WITH EMAIL
// ==========================================
const loginSchema = z.object({ email: z.string().email(), password: z.string() });

export async function loginWithEmail(rawData: unknown): Promise<AuthResult> {
  try {
    const { deviceId, ip } = await getDeviceDetails(); 
    const parsed = loginSchema.safeParse(rawData);
    if (!parsed.success) return { error: "Invalid login data." };

    await connectDB();
    const user = await User.findOne({ email: parsed.data.email });
    
    const isAdmin = user?.role === 'admin';
    
    // 🛡️ RATE LIMIT: Admins get 3 attempts, Users get 5 attempts.
    const maxAttempts = isAdmin ? 3 : 5;
    const limit = await checkRateLimit(`login:${ip}:${parsed.data.email}`, maxAttempts, 900);
    
    if (!limit.success) {
      return { error: "Too many failed attempts. For your security, please try again in 15 minutes." };
    }

    if (!user || !user.passwordHash) {
      return { error: "Invalid email or password." };
    }

    if (!(await bcrypt.compare(parsed.data.password, user.passwordHash))) {
      return { error: "Invalid email or password." };
    }

    // 🛡️ DEVICE LIMIT: Admins get 1 device, Users get 3 devices.
    if (!user.deviceIds.includes(deviceId)) {
      const maxDevices = isAdmin ? 1 : 3;
      const accountsOnDevice = await User.countDocuments({ deviceIds: deviceId });
      if (accountsOnDevice >= maxDevices) {
        return { error: "Maximum account limit reached for this device. Please use a different device." };
      }
      user.deviceIds.push(deviceId); 
    }

    user.lastSeenAt = new Date();
    await user.save();

    // Sync Firebase UID if missing
    try {
      await adminAuth.getUser(user.firebaseUid);
    } catch (error: any) {
      if (error.code === 'auth/user-not-found') {
        const fbUser = await adminAuth.createUser({ email: user.email, displayName: user.displayName });
        user.firebaseUid = fbUser.uid;
        await user.save();
      }
    }

    // 🛡️ ADMIN ALERT
    if (isAdmin) {
      await createSystemNotification(
        user._id.toString(),
        "alert",
        "Admin Login Detected",
        `An admin login was detected from IP: ${ip}. If this wasn't you, secure your account immediately.`,
        "/admin/settings"
      );
    }

    const customToken = await adminAuth.createCustomToken(user.firebaseUid);
    return { success: true, customToken, role: user.role }; // 👈 ADDED role
  } catch (error: any) {
    console.error("❌ LOGIN WITH EMAIL ERROR:", error);
    return { error: "Login failed." };
  }
}

// ==========================================
// 3. LOGIN WITH FIREBASE (Google)
// ==========================================
export async function loginWithFirebase(rawData: unknown): Promise<AuthResult> {
  try {
    const { deviceId, ip } = await getDeviceDetails(); 
    const parsed = z.object({ token: z.string() }).safeParse(rawData);
    if (!parsed.success) return { error: "Invalid token." };

    const decodedToken = await adminAuth.verifyIdToken(parsed.data.token);
    let { uid, email, name } = decodedToken;

    await connectDB();
    let user = await User.findOne({ firebaseUid: uid });

    if (!user) {
      if (!email) return { error: "Email required. Please ensure your Google account has an email." };
      
      const existingUser = await User.findOne({ email });
      if (existingUser) {
        const isAdmin = existingUser.role === 'admin';
        if (!existingUser.deviceIds.includes(deviceId)) {
          const maxDevices = isAdmin ? 1 : 3;
          const accountsOnDevice = await User.countDocuments({ deviceIds: deviceId });
          if (accountsOnDevice >= maxDevices) return { error: "Maximum account limit reached for this device." };
          existingUser.deviceIds.push(deviceId);
        }
        existingUser.firebaseUid = uid;
        existingUser.lastSeenAt = new Date();
        await existingUser.save();
        user = existingUser;
      } else {
        const settings = await Settings.findOne().lean();
        if (settings && settings.allowRegistration === false) return { error: "Registration is currently disabled by the administrator." };

        const signupsOnDevice = await User.countDocuments({ deviceIds: deviceId });
        if (signupsOnDevice >= 2) return { error: "Maximum signup limit reached for this device." };

        user = await bootstrapUser(email, name || email.split("@")[0], uid, deviceId);
      }
    } else {
      const isAdmin = user.role === 'admin';
      if (!user.deviceIds.includes(deviceId)) {
        const maxDevices = isAdmin ? 1 : 3;
        const accountsOnDevice = await User.countDocuments({ deviceIds: deviceId });
        if (accountsOnDevice >= maxDevices) return { error: "Maximum account limit reached for this device." };
        user.deviceIds.push(deviceId);
      }
      user.lastSeenAt = new Date();
      await user.save();
    }

    // 🛡️ ADMIN ALERT
    if (user.role === 'admin') {
      await createSystemNotification(
        user._id.toString(),
        "alert",
        "Admin Login Detected (Google)",
        `An admin login was detected from IP: ${ip}. If this wasn't you, secure your account immediately.`,
        "/admin/settings"
      );
    }

    const expiresIn = 60 * 60 * 24 * 5 * 1000; // 5 days
    const sessionCookie = await adminAuth.createSessionCookie(parsed.data.token, { expiresIn });

    const cookieStore = await cookies();
    cookieStore.set("session", sessionCookie, { 
      maxAge: expiresIn / 1000, 
      httpOnly: true, 
      secure: process.env.NODE_ENV === "production", 
      path: "/", 
      sameSite: "lax" 
    });
    
    cookieStore.delete("kyc_skipped");
    return { success: true, role: user.role }; // 👈 ADDED role
  } catch (error: any) {
    console.error("❌ LOGIN WITH FIREBASE ERROR:", error); 
    return { error: error.message || "Authentication failed." };
  }
}

// ==========================================
// 4. LOGOUT
// ==========================================
export async function logout() {
  const cookieStore = await cookies();
  cookieStore.delete("session");
  cookieStore.delete("kyc_skipped"); 
  redirect("/login");
}

// ==========================================
// 5. PASSWORD RESET (STRICT OTP LOGIC)
// ==========================================
const forgotSchema = z.object({ email: z.string().email() });

export async function requestPasswordReset(rawData: unknown) {
  try {
    const { ip } = await getDeviceDetails();
    const parsed = forgotSchema.safeParse(rawData);
    if (!parsed.success) return { error: "Invalid email format." };

    const limit = await checkRateLimit(`reset:${ip}`, 3, 3600);
    if (!limit.success) return { error: "Too many requests. Please try again later." };

    await connectDB();
    const user = await User.findOne({ email: parsed.data.email });

    // 🛡️ SECURITY: Generic success message if email doesn't exist
    if (!user) return { success: true };

    // 🛡️ PERMANENT BLOCK CHECK
    if (user.isResetBlocked) {
      return { error: "Your account is permanently blocked from resetting passwords. Please contact admin." };
    }

    // 🛡️ 3-MINUTE COOLDOWN
    if (user.resetPasswordExpires && user.resetPasswordExpires.getTime() > Date.now()) {
      return { error: "A code has already been sent. Please check your email and wait 3 minutes." };
    }

    // Generate 6-digit numeric OTP
    const otp = crypto.randomInt(100000, 999999).toString();
    const hashedOtp = crypto.createHash("sha256").update(otp).digest("hex");
    
    user.resetPasswordToken = hashedOtp;
    user.resetPasswordExpires = new Date(Date.now() + 3 * 60 * 1000); // 3 minutes
    user.failedOtpAttempts = 0;
    await user.save();

    // 🚨 TODO: SEND EMAIL HERE
    console.log(`\n=========================================`);
    console.log(`🔐 OTP FOR ${user.email}: ${otp}`);
    console.log(`⏰ Expires in 3 minutes.`);
    console.log(`=========================================\n`);

    return { success: true };
  } catch (error) {
    console.error("Password reset request error:", error);
    return { error: "Failed to process request." };
  }
}

const resetSchema = z.object({
  email: z.string().email(),
  otp: z.string().length(6, "OTP must be exactly 6 digits"),
  newPassword: z.string().min(6, "Password must be at least 6 characters"),
});

export async function resetPasswordWithOTP(rawData: unknown) {
  try {
    const { ip } = await getDeviceDetails();
    const parsed = resetSchema.safeParse(rawData);
    if (!parsed.success) return { error: parsed.error.issues[0].message };

    const limit = await checkRateLimit(`reset_verify:${ip}`, 5, 900);
    if (!limit.success) return { error: "Too many verification attempts. Please try again in 15 minutes." };

    const { email, otp, newPassword } = parsed.data;
    const hashedOtp = crypto.createHash("sha256").update(otp).digest("hex");

    await connectDB();
    const user = await User.findOne({ email });

    if (!user) return { error: "Invalid or expired OTP." };

    if (user.isResetBlocked) {
      return { error: "Your account is permanently blocked. Please contact admin." };
    }

    if (
      user.resetPasswordToken !== hashedOtp || 
      !user.resetPasswordExpires || 
      user.resetPasswordExpires.getTime() < Date.now()
    ) {
      user.failedOtpAttempts += 1;

      if (user.failedOtpAttempts >= 2) {
        user.isResetBlocked = true;
        user.resetPasswordToken = undefined;
        user.resetPasswordExpires = undefined;
        await user.save();
        return { error: "Too many failed reset attempts. Your account has been permanently blocked. Please contact admin." };
      }

      await user.save();
      return { error: `Invalid or expired OTP. You have ${2 - user.failedOtpAttempts} attempt(s) left.` };
    }

    // ✅ OTP IS CORRECT: Update Password
    const passwordHash = await bcrypt.hash(newPassword, 12);
    user.passwordHash = passwordHash;
    
    user.resetPasswordToken = undefined;
    user.resetPasswordExpires = undefined;
    user.failedOtpAttempts = 0;
    await user.save();

    try {
      await adminAuth.revokeRefreshTokens(user.firebaseUid);
    } catch (e) {
      console.error("Failed to revoke Firebase tokens:", e);
    }

    await createSystemNotification(
      user._id.toString(),
      "alert",
      "Password Changed",
      "Your password was successfully reset. If you didn't do this, contact support immediately.",
      "/dashboard/settings"
    );

    return { success: true };
  } catch (error) {
    console.error("Reset password error:", error);
    return { error: "Failed to reset password." };
  }
}









// // app/actions/auth.ts
// "use server";

// import { cookies } from "next/headers";
// import { redirect } from "next/navigation";
// import { z } from "zod";
// import bcrypt from "bcryptjs";
// import crypto from "crypto";
// import { adminAuth } from "@/lib/firebase-admin";
// import connectDB from "@/lib/db";
// import User from "@/lib/models/User";
// import Settings from "@/lib/models/Settings";
// import { LedgerAccount } from "@/lib/models/Ledger";
// import { getSystemAccount, SUPPORTED_ASSETS } from "@/lib/ledger-helper";
// import { createSystemNotification } from "@/lib/models/Notification";
// import { checkRateLimit } from "@/lib/rate-limit";
// import { getDeviceDetails } from "@/lib/device";

// type AuthResult = 
//   | { success: true; customToken?: string; error?: never }
//   | { success?: false; customToken?: never; error: string };

// // ==========================================
// // HELPER: BOOTSTRAP NEW USER
// // ==========================================
// async function bootstrapUser(email: string, name: string, firebaseUid: string, deviceId: string, passwordHash?: string) {
//   const user = await User.create({
//     firebaseUid, 
//     email, 
//     passwordHash, 
//     displayName: name, 
//     deviceIds: [deviceId], 
//     role: "user", 
//     status: "active", 
//     kycTier: 0, 
//     displayCurrency: { assetId: "USD", selectedAt: new Date() },
//     failedOtpAttempts: 0,
//     isResetBlocked: false,
//   });

//   // Create Ledger Accounts
//   await Promise.all(SUPPORTED_ASSETS.map(asset => 
//     LedgerAccount.updateOne(
//       { userId: user._id, assetId: asset, type: "available" }, 
//       { $setOnInsert: { cachedBalance: 0 } }, 
//       { upsert: true }
//     )
//   ));

//   // Ensure System Accounts Exist
//   await Promise.all(SUPPORTED_ASSETS.map(asset => getSystemAccount(asset)));

//   // Welcome Notification
//   await createSystemNotification(
//     user._id.toString(), 
//     "system", 
//     "Welcome to Quantix Solaris!", 
//     "Your account has been created successfully. Complete your KYC to unlock trading.", 
//     "/dashboard"
//   );

//   return user;
// }

// // ==========================================
// // 1. REGISTER WITH EMAIL
// // ==========================================
// const registerSchema = z.object({ name: z.string().min(2), email: z.string().email(), password: z.string().min(6) });

// export async function registerWithEmail(rawData: unknown): Promise<AuthResult> {
//   try {
//     const { deviceId, ip } = await getDeviceDetails(); 
    
//     // 🛡️ RATE LIMIT: Max 3 registrations per hour per IP
//     const limit = await checkRateLimit(`register:${ip}`, 3, 3600);
//     if (!limit.success) return { error: "Too many accounts created from this network. Please try again later." };

//     const parsed = registerSchema.safeParse(rawData);
//     if (!parsed.success) return { error: parsed.error.issues[0].message };

//     await connectDB();

//     // 🛡️ DEVICE LIMIT: Max 2 accounts created per device
//     const signupsOnDevice = await User.countDocuments({ deviceIds: deviceId });
//     if (signupsOnDevice >= 2) return { error: "Maximum signup limit reached for this device." };

//     // Check global settings
//     const settings = await Settings.findOne().lean();
//     if (settings && settings.allowRegistration === false) return { error: "Registration is currently disabled by the administrator." };

//     if (await User.findOne({ email: parsed.data.email })) return { error: "Email already in use." };

//     // Create Firebase User First
//     let firebaseUid = "";
//     try {
//       const fbUser = await adminAuth.createUser({ email: parsed.data.email, displayName: parsed.data.name });
//       firebaseUid = fbUser.uid;
//     } catch (error: any) {
//       if (error.code === 'auth/email-already-exists') return { error: "A user with this mail already exists." };
//       throw error;
//     }

//     // Hash Password (12 rounds)
//     const passwordHash = await bcrypt.hash(parsed.data.password, 12);
//     const user = await bootstrapUser(parsed.data.email, parsed.data.name, firebaseUid, deviceId, passwordHash);

//     const customToken = await adminAuth.createCustomToken(user.firebaseUid);
//     return { success: true, customToken };
//   } catch (error: any) {
//     console.error("❌ REGISTER ERROR:", error);
//     return { error: "Registration failed." };
//   }
// }

// // ==========================================
// // 2. LOGIN WITH EMAIL
// // ==========================================
// const loginSchema = z.object({ email: z.string().email(), password: z.string() });

// export async function loginWithEmail(rawData: unknown): Promise<AuthResult> {
//   try {
//     const { deviceId, ip } = await getDeviceDetails(); 
//     const parsed = loginSchema.safeParse(rawData);
//     if (!parsed.success) return { error: "Invalid login data." };

//     await connectDB();
//     const user = await User.findOne({ email: parsed.data.email });
    
//     const isAdmin = user?.role === 'admin';
    
//     // 🛡️ RATE LIMIT: Admins get 3 attempts, Users get 5 attempts.
//     const maxAttempts = isAdmin ? 3 : 5;
//     const limit = await checkRateLimit(`login:${ip}:${parsed.data.email}`, maxAttempts, 900);
    
//     if (!limit.success) {
//       return { error: "Too many failed attempts. For your security, please try again in 15 minutes." };
//     }

//     if (!user || !user.passwordHash) {
//       return { error: "Invalid email or password." };
//     }

//     if (!(await bcrypt.compare(parsed.data.password, user.passwordHash))) {
//       return { error: "Invalid email or password." };
//     }

//     // 🛡️ DEVICE LIMIT: Admins get 1 device, Users get 3 devices.
//     if (!user.deviceIds.includes(deviceId)) {
//       const maxDevices = isAdmin ? 1 : 3;
//       const accountsOnDevice = await User.countDocuments({ deviceIds: deviceId });
//       if (accountsOnDevice >= maxDevices) {
//         return { error: "Maximum account limit reached for this device. Please use a different device." };
//       }
//       user.deviceIds.push(deviceId); 
//     }

//     user.lastSeenAt = new Date();
//     await user.save();

//     // Sync Firebase UID if missing
//     try {
//       await adminAuth.getUser(user.firebaseUid);
//     } catch (error: any) {
//       if (error.code === 'auth/user-not-found') {
//         const fbUser = await adminAuth.createUser({ email: user.email, displayName: user.displayName });
//         user.firebaseUid = fbUser.uid;
//         await user.save();
//       }
//     }

//     // 🛡️ ADMIN ALERT
//     if (isAdmin) {
//       await createSystemNotification(
//         user._id.toString(),
//         "alert",
//         "Admin Login Detected",
//         `An admin login was detected from IP: ${ip}. If this wasn't you, secure your account immediately.`,
//         "/admin/settings"
//       );
//     }

//     const customToken = await adminAuth.createCustomToken(user.firebaseUid);
//     return { success: true, customToken };
//   } catch (error: any) {
//     console.error("❌ LOGIN WITH EMAIL ERROR:", error);
//     return { error: "Login failed." };
//   }
// }

// // ==========================================
// // 3. LOGIN WITH FIREBASE (Google)
// // ==========================================
// export async function loginWithFirebase(rawData: unknown): Promise<AuthResult> {
//   try {
//     const { deviceId, ip } = await getDeviceDetails(); 
//     const parsed = z.object({ token: z.string() }).safeParse(rawData);
//     if (!parsed.success) return { error: "Invalid token." };

//     const decodedToken = await adminAuth.verifyIdToken(parsed.data.token);
//     let { uid, email, name } = decodedToken;

//     await connectDB();
//     let user = await User.findOne({ firebaseUid: uid });

//     if (!user) {
//       if (!email) return { error: "Email required. Please ensure your Google account has an email." };
      
//       const existingUser = await User.findOne({ email });
//       if (existingUser) {
//         const isAdmin = existingUser.role === 'admin';
//         if (!existingUser.deviceIds.includes(deviceId)) {
//           const maxDevices = isAdmin ? 1 : 3;
//           const accountsOnDevice = await User.countDocuments({ deviceIds: deviceId });
//           if (accountsOnDevice >= maxDevices) return { error: "Maximum account limit reached for this device." };
//           existingUser.deviceIds.push(deviceId);
//         }
//         existingUser.firebaseUid = uid;
//         existingUser.lastSeenAt = new Date();
//         await existingUser.save();
//         user = existingUser;
//       } else {
//         const settings = await Settings.findOne().lean();
//         if (settings && settings.allowRegistration === false) return { error: "Registration is currently disabled by the administrator." };

//         const signupsOnDevice = await User.countDocuments({ deviceIds: deviceId });
//         if (signupsOnDevice >= 2) return { error: "Maximum signup limit reached for this device." };

//         user = await bootstrapUser(email, name || email.split("@")[0], uid, deviceId);
//       }
//     } else {
//       const isAdmin = user.role === 'admin';
//       if (!user.deviceIds.includes(deviceId)) {
//         const maxDevices = isAdmin ? 1 : 3;
//         const accountsOnDevice = await User.countDocuments({ deviceIds: deviceId });
//         if (accountsOnDevice >= maxDevices) return { error: "Maximum account limit reached for this device." };
//         user.deviceIds.push(deviceId);
//       }
//       user.lastSeenAt = new Date();
//       await user.save();
//     }

//     // 🛡️ ADMIN ALERT
//     if (user.role === 'admin') {
//       await createSystemNotification(
//         user._id.toString(),
//         "alert",
//         "Admin Login Detected (Google)",
//         `An admin login was detected from IP: ${ip}. If this wasn't you, secure your account immediately.`,
//         "/admin/settings"
//       );
//     }

//     const expiresIn = 60 * 60 * 24 * 5 * 1000; // 5 days
//     const sessionCookie = await adminAuth.createSessionCookie(parsed.data.token, { expiresIn });

//     const cookieStore = await cookies();
//     cookieStore.set("session", sessionCookie, { 
//       maxAge: expiresIn / 1000, 
//       httpOnly: true, 
//       secure: process.env.NODE_ENV === "production", 
//       path: "/", 
//       sameSite: "lax" 
//     });
    
//     cookieStore.delete("kyc_skipped");
//     return { success: true };
//   } catch (error: any) {
//     console.error("❌ LOGIN WITH FIREBASE ERROR:", error); 
//     return { error: error.message || "Authentication failed." };
//   }
// }

// // ==========================================
// // 4. LOGOUT
// // ==========================================
// export async function logout() {
//   const cookieStore = await cookies();
//   cookieStore.delete("session");
//   cookieStore.delete("kyc_skipped"); 
//   redirect("/login");
// }

// // ==========================================
// // 5. PASSWORD RESET (STRICT OTP LOGIC)
// // ==========================================
// const forgotSchema = z.object({ email: z.string().email() });

// export async function requestPasswordReset(rawData: unknown) {
//   try {
//     const { ip } = await getDeviceDetails();
//     const parsed = forgotSchema.safeParse(rawData);
//     if (!parsed.success) return { error: "Invalid email format." };

//     const limit = await checkRateLimit(`reset:${ip}`, 3, 3600);
//     if (!limit.success) return { error: "Too many requests. Please try again later." };

//     await connectDB();
//     const user = await User.findOne({ email: parsed.data.email });

//     // 🛡️ SECURITY: Generic success message if email doesn't exist
//     if (!user) return { success: true };

//     // 🛡️ PERMANENT BLOCK CHECK
//     if (user.isResetBlocked) {
//       return { error: "Your account is permanently blocked from resetting passwords. Please contact admin." };
//     }

//     // 🛡️ 3-MINUTE COOLDOWN
//     if (user.resetPasswordExpires && user.resetPasswordExpires.getTime() > Date.now()) {
//       return { error: "A code has already been sent. Please check your email and wait 3 minutes." };
//     }

//     // Generate 6-digit numeric OTP
//     const otp = crypto.randomInt(100000, 999999).toString();
//     const hashedOtp = crypto.createHash("sha256").update(otp).digest("hex");
    
//     user.resetPasswordToken = hashedOtp;
//     user.resetPasswordExpires = new Date(Date.now() + 3 * 60 * 1000); // 3 minutes
//     user.failedOtpAttempts = 0;
//     await user.save();

//     // 🚨 TODO: SEND EMAIL HERE
//     console.log(`\n=========================================`);
//     console.log(`🔐 OTP FOR ${user.email}: ${otp}`);
//     console.log(`⏰ Expires in 3 minutes.`);
//     console.log(`=========================================\n`);

//     return { success: true };
//   } catch (error) {
//     console.error("Password reset request error:", error);
//     return { error: "Failed to process request." };
//   }
// }

// const resetSchema = z.object({
//   email: z.string().email(),
//   otp: z.string().length(6, "OTP must be exactly 6 digits"),
//   newPassword: z.string().min(6, "Password must be at least 6 characters"),
// });

// export async function resetPasswordWithOTP(rawData: unknown) {
//   try {
//     const { ip } = await getDeviceDetails();
//     const parsed = resetSchema.safeParse(rawData);
//     if (!parsed.success) return { error: parsed.error.issues[0].message };

//     const limit = await checkRateLimit(`reset_verify:${ip}`, 5, 900);
//     if (!limit.success) return { error: "Too many verification attempts. Please try again in 15 minutes." };

//     const { email, otp, newPassword } = parsed.data;
//     const hashedOtp = crypto.createHash("sha256").update(otp).digest("hex");

//     await connectDB();
//     const user = await User.findOne({ email });

//     if (!user) return { error: "Invalid or expired OTP." };

//     if (user.isResetBlocked) {
//       return { error: "Your account is permanently blocked. Please contact admin." };
//     }

//     if (
//       user.resetPasswordToken !== hashedOtp || 
//       !user.resetPasswordExpires || 
//       user.resetPasswordExpires.getTime() < Date.now()
//     ) {
//       user.failedOtpAttempts += 1;

//       if (user.failedOtpAttempts >= 2) {
//         user.isResetBlocked = true;
//         user.resetPasswordToken = undefined;
//         user.resetPasswordExpires = undefined;
//         await user.save();
//         return { error: "Too many failed reset attempts. Your account has been permanently blocked. Please contact admin." };
//       }

//       await user.save();
//       return { error: `Invalid or expired OTP. You have ${2 - user.failedOtpAttempts} attempt(s) left.` };
//     }

//     // ✅ OTP IS CORRECT: Update Password
//     const passwordHash = await bcrypt.hash(newPassword, 12);
//     user.passwordHash = passwordHash;
    
//     user.resetPasswordToken = undefined;
//     user.resetPasswordExpires = undefined;
//     user.failedOtpAttempts = 0;
//     await user.save();

//     try {
//       await adminAuth.revokeRefreshTokens(user.firebaseUid);
//     } catch (e) {
//       console.error("Failed to revoke Firebase tokens:", e);
//     }

//     await createSystemNotification(
//       user._id.toString(),
//       "alert",
//       "Password Changed",
//       "Your password was successfully reset. If you didn't do this, contact support immediately.",
//       "/dashboard/settings"
//     );

//     return { success: true };
//   } catch (error) {
//     console.error("Reset password error:", error);
//     return { error: "Failed to reset password." };
//   }
// }