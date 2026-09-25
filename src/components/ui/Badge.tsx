import React from "react";
import { cn } from "./cn";

type BadgeVariant = "default" | "neutral" | "info" | "success" | "warning" | "destructive";

const variants: Record<BadgeVariant, string> = {
  default: "bg-indigo-50 text-indigo-700",
  neutral: "bg-slate-100 text-slate-700",
  info: "bg-info/10 text-info",
  success: "bg-success/10 text-success",
  warning: "bg-warning/15 text-warning",
  destructive: "bg-danger/10 text-danger",
};

export interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: BadgeVariant;
}

export function Badge({ className, variant = "default", ...props }: BadgeProps) {
  return <span className={cn("inline-flex items-center rounded-full px-2.5 py-1 text-xs font-medium", variants[variant], className)} {...props} />;
}
