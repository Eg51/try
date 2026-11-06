// app/dashboard/notifications/page.tsx
import type { Metadata } from "next";
import { connection } from "next/server";
import { getUserNotifications } from "@/app/actions/notifications";
import NotificationsClient, { type AppNotification } from "@/app/dashboard/notifications/NotificationsClient";

export const instant = false;
export const metadata: Metadata = { title: "Notifications" };

export default async function NotificationsPage() {
  // 1. Force dynamic rendering
  await connection();
  
  // 2. Fetch real data from MongoDB
  const rawNotifications = await getUserNotifications();

  // 3. Map MongoDB shape to the frontend shape
  const notifications: AppNotification[] = rawNotifications.map((n: any) => ({
    id: n._id,
    type: n.type,
    title: n.title,
    message: n.message,
    timestamp: n.createdAt,
    read: n.read,
    href: n.href,
    meta: n.meta,
  }));

  return <NotificationsClient initialNotifications={notifications} />;
}
// // app/dashboard/notifications/page.tsx
// import type { Metadata } from "next";
// import NotificationsClient, { type AppNotification } from "@/app/dashboard/notifications/NotificationsClient";

// export const instant = false;
// export const metadata: Metadata = { title: "Notifications" };

// // 👇 Replace with `await getNotifications()` from your server action.
// const MOCK_NOTIFICATIONS: AppNotification[] = [
//   {
//     id: "n1",
//     type: "trade",
//     title: "Long position filled",
//     message: "Your BTC/USD long order for 0.5 BTC was filled at $64,200.",
//     timestamp: new Date(Date.now() - 1000 * 60 * 4).toISOString(),
//     read: false,
//     href: "/dashboard/markets/btc",
//     meta: [
//       { label: "Size", value: "0.5 BTC", tone: "neutral" },
//       { label: "P&L", value: "+$1,615 (+2.5%)", tone: "up" },
//     ],
//   },
//   {
//     id: "n2",
//     type: "alert",
//     title: "BTC crossed $67,000",
//     message: "Your price alert for BTC/USD at $67,000 has been triggered.",
//     timestamp: new Date(Date.now() - 1000 * 60 * 12).toISOString(),
//     read: false,
//     href: "/dashboard/markets/btc",
//   },
//   {
//     id: "n3",
//     type: "wallet",
//     title: "Deposit confirmed",
//     message: "Your deposit of $250.00 has been credited to your wallet.",
//     timestamp: new Date(Date.now() - 1000 * 60 * 60 * 2).toISOString(),
//     read: false,
//     href: "/dashboard/wallet",
//     meta: [{ label: "Amount", value: "+$250.00", tone: "up" }],
//   },
//   {
//     id: "n4",
//     type: "promo",
//     title: "Weekly rewards unlocked",
//     message: "You earned 500 XP this week. Keep trading to reach Level 5.",
//     timestamp: new Date(Date.now() - 1000 * 60 * 60 * 5).toISOString(),
//     read: false,
//     href: "/dashboard/rewards",
//   },
//   {
//     id: "n5",
//     type: "system",
//     title: "New device sign-in",
//     message: "A new sign-in was detected from Chrome on Windows. If this wasn't you, secure your account.",
//     timestamp: new Date(Date.now() - 1000 * 60 * 60 * 26).toISOString(),
//     read: true,
//     href: "/dashboard/settings/security",
//   },
//   {
//     id: "n6",
//     type: "system",
//     title: "KYC verification approved",
//     message: "Your identity has been verified. You now have full access to trading.",
//     timestamp: new Date(Date.now() - 1000 * 60 * 60 * 30).toISOString(),
//     read: true,
//     href: "/dashboard/profile",
//   },
//   {
//     id: "n7",
//     type: "wallet",
//     title: "Withdrawal processed",
//     message: "Your withdrawal of $120.00 has been sent to your linked account.",
//     timestamp: new Date(Date.now() - 1000 * 60 * 60 * 24 * 3).toISOString(),
//     read: true,
//     href: "/dashboard/wallet",
//     meta: [{ label: "Amount", value: "-$120.00", tone: "down" }],
//   },
// ];

// export default async function NotificationsPage() {
//   const notifications = MOCK_NOTIFICATIONS;
//   return <NotificationsClient initialNotifications={notifications} />;
// }