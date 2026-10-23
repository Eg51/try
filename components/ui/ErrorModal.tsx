// components/ui/ErrorModal.tsx
"use client";

import { Button } from "./Button";

export type ErrorCode = "NETWORK_OFFLINE" | "AUTH_EXPIRED" | "VALIDATION_FAILED" | "SERVER_ERROR";

const ERROR_MAP: Record<ErrorCode, { title: string; message: string; icon: string }> = {
  NETWORK_OFFLINE: {
    title: "Connection Lost",
    message: "Your internet is playing hide and seek. Check your connection and try again.",
    icon: "📡", // Replace with your SVG meme vector
  },
  AUTH_EXPIRED: {
    title: "Session Expired",
    message: "You've been logged out to keep your account secure. Please sign in again.",
    icon: "🔒",
  },
  VALIDATION_FAILED: {
    title: "Check Your Inputs",
    message: "Some of the information provided doesn't look right.",
    icon: "📝",
  },
  SERVER_ERROR: {
    title: "Something Went Wrong",
    message: "Our servers are taking a quick nap. We're looking into it.",
    icon: "🤖",
  },
};

export function ErrorModal({ code, onClose }: { code: ErrorCode, onClose: () => void }) {
  const content = ERROR_MAP[code] || ERROR_MAP.SERVER_ERROR;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <div className="flex w-full max-w-md flex-col items-center gap-4 rounded-xl border border-[var(--border)] bg-[var(--surface)] p-6 text-center shadow-2xl">
        <div className="text-6xl">{content.icon}</div>
        <h2 className="text-xl font-bold text-[var(--text-1)]">{content.title}</h2>
        <p className="text-sm text-[var(--text-2)]">{content.message}</p>
        <Button onClick={onClose} className="mt-4 w-full">
          Got it
        </Button>
      </div>
    </div>
  );
}