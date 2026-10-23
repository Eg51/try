"use client";

import { useEffect } from "react";
import { Button } from "@/components/ui/Button";
import { AlertTriangle } from "lucide-react";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Log the error to an error reporting service like Sentry
    console.error(error);
  }, [error]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-surface-900 px-4">
      <div className="w-full max-w-md p-8 border border-surface-700 rounded-2xl bg-surface-800 shadow-2xl text-center space-y-6">
        <div className="w-20 h-20 mx-auto bg-danger/10 rounded-full flex items-center justify-center">
          <AlertTriangle size={40} className="text-danger" />
        </div>
        
        <div>
          <h2 className="text-2xl font-bold text-text-primary mb-2">Whoops! Something broke.</h2>
          <p className="text-text-muted text-sm">
            Our servers hit a snag. Don't worry, your funds are safe. Our team has been notified.
          </p>
        </div>

        <div className="flex gap-3 justify-center">
          <Button onClick={() => reset()} variant="primary" className="bg-brand-500 text-black">
            Try Again
          </Button>
          <Button onClick={() => window.location.href = "/dashboard"} variant="secondary">
            click to return
          </Button>
        </div>
      </div>
    </div>
  );
}