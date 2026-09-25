import React from "react";
import { cn } from "./cn";

type ButtonVariant = "default" | "outline" | "secondary" | "ghost" | "success" | "destructive";
type ButtonSize = "sm" | "default" | "lg" | "icon";

const variants: Record<ButtonVariant, string> = {
  default: "bg-primary text-white hover:bg-primary-strong",
  outline: "border border-border bg-surface text-muted hover:border-primary/30 hover:text-primary-strong",
  secondary: "bg-slate-100 text-slate-700 hover:bg-slate-200",
  ghost: "text-slate-500 hover:bg-slate-100 hover:text-slate-800",
  success: "bg-success text-white hover:bg-success/90",
  destructive: "bg-danger text-white hover:bg-danger/90",
};

const sizes: Record<ButtonSize, string> = {
  sm: "h-8 rounded-lg px-3 text-xs",
  default: "h-9 rounded-lg px-4 text-sm",
  lg: "h-10 rounded-lg px-5 text-sm",
  icon: "h-9 w-9 rounded-lg p-0",
};

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  loading?: boolean;
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = "default", size = "default", loading = false, disabled, children, ...props }, ref) => (
    <button
      ref={ref}
      type="button"
      disabled={disabled || loading}
      className={cn(
        "inline-flex items-center justify-center gap-2 font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50",
        variants[variant],
        sizes[size],
        className,
      )}
      {...props}
    >
      {loading ? "Cargando..." : children}
    </button>
  ),
);
Button.displayName = "Button";
