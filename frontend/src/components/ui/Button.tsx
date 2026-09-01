"use client";

import { ButtonHTMLAttributes, forwardRef } from "react";
import clsx from "clsx";

type Variant = "primary" | "success" | "warning" | "danger" | "ghost";

const VARIANT_CLASSES: Record<Variant, string> = {
  primary: "bg-accent text-white hover:bg-blue-600",
  success: "bg-success text-white hover:bg-emerald-600",
  warning: "bg-warning text-slate-900 hover:bg-amber-600",
  danger: "bg-danger text-white hover:bg-red-600",
  ghost: "bg-transparent text-slate-200 hover:bg-surface-raised border border-border",
};

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = "primary", disabled, ...props }, ref) => (
    <button ref={ref} disabled={disabled} className={clsx("inline-flex items-center justify-center gap-2 rounded-md px-4 py-2 text-sm font-medium transition-colors", "disabled:cursor-not-allowed disabled:opacity-40", VARIANT_CLASSES[variant], className)} {...props} />
  )
);
Button.displayName = "Button";
