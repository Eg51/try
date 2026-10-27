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
type AuthResult = 
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
      if (error.code === 'auth/email-already-exists') return { error: "a user with this mail already exist." };
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

// 🔥 THIS IS THE FUNCTION THAT WAS MISSING/FAILING
// export async function loginWithFirebase(rawData: unknown): Promise<AuthResult> {
//   try {
//     const parsed = z.object({ token: z.string() }).safeParse(rawData);
//     if (!parsed.success) return { error: "Invalid token." };

//     const decodedToken = await adminAuth.verifyIdToken(parsed.data.token);
//     console.log("🔥 SERVER: Decoded Firebase Token:", decodedToken);

//     let { uid, email, name } = decodedToken;

//     // FIX: If Google Auth doesn't provide an email in the token, fetch it directly
//     if (!email) {
//       try {
//         console.log("⚠️ SERVER: Email missing from token. Fetching from Firebase Admin...");
//         const userRecord = await adminAuth.getUser(uid);
//         email = userRecord.email;
//         if (!name) name = userRecord.displayName;
//         console.log("✅ SERVER: Retrieved email from Firebase Admin:", email);
//       } catch (err) {
//         console.error("Failed to fetch user from Firebase Admin:", err);
//       }
//     }

//     await connectDB();
//     let user = await User.findOne({ firebaseUid: uid });

//     if (!user) {
//       console.log("⚠️ SERVER: User not found in MongoDB by UID. Attempting to create...");
//       if (!email) {
//         console.log("❌ SERVER: Email is missing, cannot bootstrap user.");
//         return { error: "Email required. Please ensure your Google account has an email." };
//       }
      
//       if (await User.findOne({ email })) return { error: "An account with this email already exists." };
//       user = await bootstrapUser(email, name || email.split("@")[0], uid);
//       console.log("✅ SERVER: New user created in MongoDB.");
//     } else {
//       console.log("✅ SERVER: User found in MongoDB:", user.email);
//       user.lastSeenAt = new Date();
//       await user.save();
//     }

//     const expiresIn = 60 * 60 * 24 * 5 * 1000;
//     const sessionCookie = await adminAuth.createSessionCookie(parsed.data.token, { expiresIn });

//     const cookieStore = await cookies();
//     cookieStore.set("session", sessionCookie, { maxAge: expiresIn / 1000, httpOnly: true, secure: process.env.NODE_ENV === "production", path: "/", sameSite: "lax" });

//     console.log("🍪 SERVER: Session cookie set successfully!");
//     return { success: true };
//   } catch (error) {
//     console.error("❌ SERVER: Auth Error:", error);
//     return { error: "Authentication failed." };
//   }
// }
export async function loginWithFirebase(rawData: unknown): Promise<AuthResult> {
  try {
    const parsed = z.object({ token: z.string() }).safeParse(rawData);
    if (!parsed.success) return { error: "Invalid token." };

    const decodedToken = await adminAuth.verifyIdToken(parsed.data.token);
    console.log("🔥 SERVER: Decoded Firebase Token:", decodedToken);

    let { uid, email, name } = decodedToken;

    // FIX: Fetch email from Firebase Admin if missing from token
    if (!email) {
      try {
        console.log("⚠️ SERVER: Email missing from token. Fetching from Firebase Admin...");
        const userRecord = await adminAuth.getUser(uid);
        email = userRecord.email;
        if (!name) name = userRecord.displayName;
        console.log("✅ SERVER: Retrieved email from Firebase Admin:", email);
      } catch (err) {
        console.error("Failed to fetch user from Firebase Admin:", err);
      }
    }

    await connectDB();
    let user = await User.findOne({ firebaseUid: uid });

    if (!user) {
      console.log("⚠️ SERVER: User not found in MongoDB by UID. Attempting to create...");
      
      if (!email) {
        console.log("❌ SERVER: Email is missing even after Firebase fetch, cannot bootstrap user.");
        return { error: "Email required. Please ensure your Google account has an email." };
      }
      
      if (await User.findOne({ email })) return { error: "An account with this email already exists." };
      user = await bootstrapUser(email, name || email.split("@")[0], uid);
      console.log("✅ SERVER: New user created in MongoDB.");
    } else {
      console.log("✅ SERVER: User found in MongoDB:", user.email);
      
      // RESTORED: Your original fallback logic to sync Mongo email back to Firebase
      if (!email) {
        console.log("⚠️ SERVER: Token has no email, but user exists in Mongo. Updating Firebase user...");
        try {
          await adminAuth.updateUser(uid, { email: user.email });
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