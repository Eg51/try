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
import { getSystemAccount, SUPPORTED_ASSETS } from "@/lib/ledger-helper";

type AuthResult = 
  | { success: true; customToken?: string; error?: never }
  | { success?: false; customToken?: never; error: string };

async function bootstrapUser(email: string, name: string, firebaseUid: string, passwordHash?: string) {
  const user = await User.create({
    firebaseUid, email, passwordHash, displayName: name, role: "user", status: "active", kycTier: 0, displayCurrency: { assetId: "USD", selectedAt: new Date() },
  });

  // 1. Create user's ledger accounts
  await Promise.all(SUPPORTED_ASSETS.map(asset => 
    LedgerAccount.create({ userId: user._id, assetId: asset, type: "available", cachedBalance: 0 })
  ));

  // 2. Ensure System Ledger Accounts exist
  await Promise.all(SUPPORTED_ASSETS.map(asset => getSystemAccount(asset)));

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
      if (error.code === 'auth/email-already-exists') return { error: "A user with this mail already exists." };
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
    let { uid, email, name } = decodedToken;

    if (!email) {
      try {
        const userRecord = await adminAuth.getUser(uid);
        email = userRecord.email;
        if (!name) name = userRecord.displayName;
      } catch (err) {
        console.error("Failed to fetch user from Firebase Admin:", err);
      }
    }

    await connectDB();
    let user = await User.findOne({ firebaseUid: uid });

    if (!user) {
      if (!email) return { error: "Email required. Please ensure your Google account has an email." };
      if (await User.findOne({ email })) return { error: "An account with this email already exists." };
      
      user = await bootstrapUser(email, name || email.split("@")[0], uid);
    } else {
      if (!email) {
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