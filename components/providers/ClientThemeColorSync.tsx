// components/providers/ClientThemeColorSync.tsx
"use client";

import dynamic from "next/dynamic";

const ThemeColorSync = dynamic(
  () =>
    import("@/components/providers/ThemeColorSync").then((m) => m.ThemeColorSync),
  { ssr: false }
);

export function ClientThemeColorSync() {
  return <ThemeColorSync />;
}