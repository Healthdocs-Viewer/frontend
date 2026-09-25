import React from "react";
import type { LucideIcon } from "lucide-react";
import { Button, type ButtonProps } from "./Button";

export interface IconButtonProps extends Omit<ButtonProps, "children" | "size" | "aria-label"> {
  icon: LucideIcon;
  label: string;
  size?: "sm" | "default";
}

export function IconButton({ icon: Icon, label, size = "default", ...props }: IconButtonProps) {
  return <Button {...props} size={size === "sm" ? "sm" : "icon"} aria-label={label}><Icon className={size === "sm" ? "h-4 w-4" : "h-4 w-4"} /></Button>;
}
