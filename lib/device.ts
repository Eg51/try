// lib/device.ts
import { cookies, headers } from "next/headers";
import crypto from "crypto";

export async function getDeviceDetails() {
  const cookieStore = await cookies();
  let deviceId = cookieStore.get("device_id")?.value;

  // If no device ID exists, create one and set it as a secure HTTP-only cookie
  if (!deviceId) {
    deviceId = crypto.randomUUID();
    cookieStore.set("device_id", deviceId, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
      maxAge: 60 * 60 * 24 * 365, // 1 year
      path: "/",
    });
  }

  // 👇 FIXED: Added `await` before headers()
  const headersList = await headers();
  const ip = headersList.get("x-forwarded-for") || "unknown-ip";
  
  return { deviceId, ip };
}