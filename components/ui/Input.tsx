// components/ui/Input.tsx
import * as React from "react";
import { cn } from "@/lib/utils";

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  error?: boolean;
}

export const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, type, error, ...props }, ref) => {
    return (
      <input
        type={type}
        className={cn(
          "flex h-10 w-full rounded-md border bg-[var(--surface)] px-3 py-2 text-sm text-[var(--text-1)]",
          "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--gold)]",
          "disabled:cursor-not-allowed disabled:opacity-50",
          error ? "border-red-500" : "border-[var(--border)]",
          className
        )}
        ref={ref}
        // SECURITY: Prevent browser from caching sensitive values unless explicitly allowed
        autoComplete={props.autoComplete || "off"} 
        {...props}
      />
    );
  }
);
Input.displayName = "Input";