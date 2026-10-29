// app/dashboard/rewards/page.tsx
import { Suspense } from "react";
import { connection } from "next/server";
import RewardsClient from "./RewardsClient";
// app/dashboard/rewards/page.tsx
export const instant = false;

// A tiny component that only signals "make this route dynamic."
// It renders nothing, so it can't be mistaken for blocking UI.
async function ConnectionMarker() {
  await connection();
  return null;
}

export default function RewardsPage() {
  return (
    <>
      {/* The marker forces dynamic rendering. It has its own Suspense
          boundary so the static shell can still be emitted. */}
      <Suspense fallback={null}>
        <ConnectionMarker />
      </Suspense>

      {/* This is your actual page content. It can now be rendered
          without triggering the prerender guard. */}
      <RewardsClient />
    </>
  );
}