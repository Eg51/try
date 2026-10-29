// app/dashboard/profile/page.tsx
import { getServerSession } from "@/lib/session";
import { redirect } from "next/navigation";
import { connection } from "next/server";
import ProfileClient from "./ProfileClient";

export const instant = false;

export default async function ProfilePage() {
  await connection();
  
  const session = await getServerSession();
  if (!session) redirect("/login");

  return <ProfileClient session={session} />;
}