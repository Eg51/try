// components/ui/Button.tsx
import * as React from "react"
import { cn } from "@/lib/utils"

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
  isLoading?: boolean;
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = 'primary', size = 'md', isLoading, children, ...props }, ref) => {
    
    // Base styles (transitions, focus rings, etc.)
    const baseStyles = "inline-flex items-center justify-center rounded-md font-semibold transition-all active:scale-[0.98] disabled:opacity-50 disabled:pointer-events-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--gold)]";

    // The 3-tier system we agreed on
    const variants = {
      primary: "bg-[var(--gold)] text-black hover:opacity-90 shadow-[0_0_15px_rgba(232,181,75,0.2)]",
      secondary: "bg-[var(--surface)] text-[var(--text-1)] border border-[var(--border)] hover:bg-[var(--hover)]",
      ghost: "bg-transparent text-[var(--text-2)] hover:bg-[var(--hover)] hover:text-[var(--text-1)]",
    };

    const sizes = {
      sm: "h-8 px-3 text-xs",
      md: "h-10 px-4 text-sm",
      lg: "h-12 px-6 text-base",
    };

    return (
      <button
        ref={ref}
        className={cn(baseStyles, variants[variant], sizes[size], className)}
        disabled={isLoading || props.disabled}
        {...props}
      >
        {isLoading ? (
          <span className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
        ) : null}
        {children}
      </button>
    )
  }
)
Button.displayName = "Button"