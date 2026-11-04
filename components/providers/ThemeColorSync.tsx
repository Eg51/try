// components/providers/ThemeColorSync.tsx
"use client";

import { useTheme } from "next-themes";
import { useEffect } from "react";

export function ThemeColorSync() {
  const { resolvedTheme } = useTheme();

  useEffect(() => {
    let metaThemeColor = document.querySelector("meta[name='theme-color']");
    if (!metaThemeColor) {
      metaThemeColor = document.createElement("meta");
      metaThemeColor.setAttribute("name", "theme-color");
      document.head.appendChild(metaThemeColor);
    }

    if (resolvedTheme === "dark") {
      metaThemeColor.setAttribute("content", "#050806");
    } else {
      metaThemeColor.setAttribute("content", "#f0fdf4");
    }
  }, [resolvedTheme]);

  return null;
}