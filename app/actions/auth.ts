// app/actions/auth.ts
"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { z } from "zod";
import bcrypt from "bcryptjs";
import { adminAuth } from "@/lib/firebase-admin";
import connectDB from "@/lib/db";
import User from "@/lib/models/User";
import { LedgerAccount } from "@/lib/models/Ledger";

// Define a strict type for our Server Action responses
export type AuthResult = 
  | { success: true; customToken?: string; error?: never }
  | { success?: false; customToken?: never; error: string };

async function bootstrapUser(email: string, name: string, firebaseUid: string, passwordHash?: string) {
  const user = await User.create({
    firebaseUid, email, passwordHash, displayName: name, role: "user", status: "active", kycTier: 0, displayCurrency: { assetId: "USD", selectedAt: new Date() },
  });
  await Promise.all(["USD", "BTC", "ETH", "DOGE"].map(asset => LedgerAccount.create({ userId: user._id, assetId: asset, type: "available", cachedBalance: 0 })));
  return user;
}

const registerSchema = z.object({ name: z.string().min(2), email: z.string().email(), password: z.string().min(6) });
export async function registerWithEmail(rawData: unknown): Promise<AuthResult> {
  try {
    const parsed = registerSchema.safeParse(rawData);
    if (!parsed.success) return { error: "Invalid registration data." };

    await connectDB();
    if (await User.findOne({ email: parsed.data.email })) return { error: "Email already in use." };

    let firebaseUid = "";
    try {
      const fbUser = await adminAuth.createUser({ email: parsed.data.email, displayName: parsed.data.name });
      firebaseUid = fbUser.uid;
    } catch (error: any) {
      if (error.code === 'auth/email-already-exists') return { error: "Email already in use in Firebase." };
      throw error;
    }

    const passwordHash = await bcrypt.hash(parsed.data.password, 10);
    const user = await bootstrapUser(parsed.data.email, parsed.data.name, firebaseUid, passwordHash);

    const customToken = await adminAuth.createCustomToken(user.firebaseUid);
    return { success: true, customToken };
  } catch (error) {
    return { error: "Registration failed." };
  }
}

const loginSchema = z.object({ email: z.string().email(), password: z.string() });
export async function loginWithEmail(rawData: unknown): Promise<AuthResult> {
  try {
    const parsed = loginSchema.safeParse(rawData);
    if (!parsed.success) return { error: "Invalid login data." };

    await connectDB();
    const user = await User.findOne({ email: parsed.data.email });
    if (!user || !user.passwordHash) return { error: "Invalid credentials." };

    if (!(await bcrypt.compare(parsed.data.password, user.passwordHash))) return { error: "Invalid credentials." };

    user.lastSeenAt = new Date();
    await user.save();

    // Ensure the user exists in Firebase (fixes previous mock users)
    try {
      await adminAuth.getUser(user.firebaseUid);
    } catch (error: any) {
      if (error.code === 'auth/user-not-found') {
        const fbUser = await adminAuth.createUser({ email: user.email, displayName: user.displayName });
        user.firebaseUid = fbUser.uid;
        await user.save();
      }
    }

    const customToken = await adminAuth.createCustomToken(user.firebaseUid);
    return { success: true, customToken };
  } catch (error) {
    return { error: "Login failed." };
  }
}

export async function loginWithFirebase(rawData: unknown): Promise<AuthResult> {
  try {
    const parsed = z.object({ token: z.string() }).safeParse(rawData);
    if (!parsed.success) return { error: "Invalid token." };

    const decodedToken = await adminAuth.verifyIdToken(parsed.data.token);
    
    // ADDED LOGGING HERE
    console.log("🔥 SERVER: Decoded Firebase Token:", decodedToken);

    const { uid, email, name } = decodedToken;

    await connectDB();
    let user = await User.findOne({ firebaseUid: uid });

    if (!user) {
      console.log("⚠️ SERVER: User not found in MongoDB by UID. Attempting to create...");
      
      if (!email) {
        console.log("❌ SERVER: Email is missing from token, cannot bootstrap user.");
        return { error: "Email required." };
      }
      
      if (await User.findOne({ email })) return { error: "An account with this email already exists." };
      user = await bootstrapUser(email, name || email.split("@")[0], uid);
      console.log("✅ SERVER: New user created in MongoDB.");
    } else {
      console.log("✅ SERVER: User found in MongoDB:", user.email);
      
      // Check if Firebase user actually has an email
      if (!email) {
        console.log("⚠️ SERVER: Token has no email, but user exists in Mongo. Updating Firebase user...");
        try {
          await adminAuth.updateUser(uid, { email: user.email });
          // Note: The current ID token will still lack an email until the client refreshes it, 
          // but we can bypass the email check below since we found the user by UID.
        } catch (e) {
          console.error("Failed to update Firebase user with email", e);
        }
      }

      user.lastSeenAt = new Date();
      await user.save();
    }

    const expiresIn = 60 * 60 * 24 * 5 * 1000;
    const sessionCookie = await adminAuth.createSessionCookie(parsed.data.token, { expiresIn });

    const cookieStore = await cookies();
    cookieStore.set("session", sessionCookie, { maxAge: expiresIn / 1000, httpOnly: true, secure: process.env.NODE_ENV === "production", path: "/", sameSite: "lax" });

    console.log("🍪 SERVER: Session cookie set successfully!");
    return { success: true };
  } catch (error) {
    console.error("❌ SERVER: Auth Error:", error);
    return { error: "Authentication failed." };
  }
}
export async function logout() {
  const cookieStore = await cookies();
  cookieStore.delete("session");
  redirect("/login");
}
// // app/actions/auth.ts
// "use server";

// import { cookies } from "next/headers";
// import { redirect } from "next/navigation";
// import { z } from "zod";
// import bcrypt from "bcryptjs";
// import { adminAuth } from "@/lib/firebase-admin";
// import connectDB from "@/lib/db";
// import User from "@/lib/models/User";
// import { LedgerAccount } from "@/lib/models/Ledger";

// // --- SHARED HELPER: Bootstrap User & Wallet ---
// async function bootstrapUser(email: string, name: string, passwordHash?: string) {
//   const firebaseUid = `email_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;
  
//   const user = await User.create({
//     firebaseUid,
//     email,
//     passwordHash,
//     displayName: name,
//     role: "user",
//     status: "active",
//     kycTier: 0,
//     displayCurrency: { assetId: "USD", selectedAt: new Date() },
//   });

//   const initialAssets = ["USD", "BTC", "ETH", "DOGE"];
//   await Promise.all(
//     initialAssets.map((asset) =>
//       LedgerAccount.create({
//         userId: user._id,
//         assetId: asset,
//         type: "available",
//         cachedBalance: 0,
//       })
//     )
//   );
//   return user;
// }

// // --- 1. REGISTRATION (Email/Password) ---
// const registerSchema = z.object({
//   name: z.string().min(2),
//   email: z.string().email(),
//   password: z.string().min(6),
// });

// export async function registerWithEmail(rawData: unknown) {
//   try {
//     const parsed = registerSchema.safeParse(rawData);
//     if (!parsed.success) return { error: "Invalid registration data." };

//     await connectDB();
//     const existing = await User.findOne({ email: parsed.data.email });
//     if (existing) return { error: "Email already in use." };

//     const passwordHash = await bcrypt.hash(parsed.data.password, 10);
//     const user = await bootstrapUser(parsed.data.email, parsed.data.name, passwordHash);

//     // Return custom token to the client
//     const customToken = await adminAuth.createCustomToken(user.firebaseUid);
//     return { success: true, customToken };
//   } catch (error) {
//     console.error(error);
//     return { error: "Registration failed." };
//   }
// }

// // --- 2. LOGIN (Email/Password) ---
// const loginSchema = z.object({
//   email: z.string().email(),
//   password: z.string(),
// });

// export async function loginWithEmail(rawData: unknown) {
//   try {
//     const parsed = loginSchema.safeParse(rawData);
//     if (!parsed.success) return { error: "Invalid login data." };

//     await connectDB();
//     const user = await User.findOne({ email: parsed.data.email });
//     if (!user || !user.passwordHash) return { error: "Invalid credentials." };

//     const isValid = await bcrypt.compare(parsed.data.password, user.passwordHash);
//     if (!isValid) return { error: "Invalid credentials." };

//     user.lastSeenAt = new Date();
//     await user.save();

//     // Return custom token to the client
//     const customToken = await adminAuth.createCustomToken(user.firebaseUid);
//     return { success: true, customToken };
//   } catch (error) {
//     console.error(error);
//     return { error: "Login failed." };
//   }
// }

// // --- 3. LOGIN (Google via Firebase ID Token) ---
// export async function loginWithFirebase(rawData: unknown) {
//   try {
//     const parsed = z.object({ token: z.string() }).safeParse(rawData);
//     if (!parsed.success) return { error: "Invalid token." };

//     const decodedToken = await adminAuth.verifyIdToken(parsed.data.token);
//     const { uid, email, name } = decodedToken;

//     if (!email) return { error: "Email required." };

//     await connectDB();
//     let user = await User.findOne({ firebaseUid: uid });

//     if (!user) {
//       const existingEmail = await User.findOne({ email });
//       if (existingEmail) return { error: "An account with this email already exists." };
//       user = await bootstrapUser(email, name || email.split("@")[0]);
//     } else {
//       user.lastSeenAt = new Date();
//       await user.save();
//     }

//     const expiresIn = 60 * 60 * 24 * 5 * 1000;
//     // This works because we are passing an ID Token, not a Custom Token
//     const sessionCookie = await adminAuth.createSessionCookie(parsed.data.token, { expiresIn });

//     const cookieStore = await cookies();
//     cookieStore.set("session", sessionCookie, {
//       maxAge: expiresIn / 1000,
//       httpOnly: true,
//       secure: process.env.NODE_ENV === "production",
//       path: "/",
//       sameSite: "lax",
//     });

//     return { success: true };
//   } catch (error) {
//     console.error(error);
//     return { error: "Authentication failed." };
//   }
// }

// export async function logout() {
//   const cookieStore = await cookies();
//   cookieStore.delete("session");
//   redirect("/login");
// }