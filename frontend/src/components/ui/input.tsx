import { forwardRef, InputHTMLAttributes } from "react";
import { cn } from "@/lib/utils";

export interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  error?: boolean;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ className, error, ...props }, ref) => {
    return (
      <input
        ref={ref}
        aria-invalid={error}
        className={cn(
          "h-10 w-full rounded-sm border bg-surface px-3 text-sm text-ink placeholder:text-ink-muted transition-colors",
          "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary",
          "disabled:cursor-not-allowed disabled:bg-neutral-100 disabled:text-ink-muted",
          error
            ? "border-danger focus-visible:ring-danger"
            : "border-border",
          className
        )}
        {...props}
      />
    );
  }
);
Input.displayName = "Input";
