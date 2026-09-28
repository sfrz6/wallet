"use client";

import { useFormStatus } from "react-dom";
import { cn } from "@/lib/cn";
import { useI18n } from "@/lib/i18n/provider";

type Variant = "primary" | "secondary" | "ghost" | "danger";

const VARIANT_CLASS: Record<Variant, string> = {
  primary: "btn-primary",
  secondary: "btn-secondary",
  ghost: "btn-ghost",
  danger: "btn-danger",
};

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  fullWidth?: boolean;
}

export function Button({
  variant = "primary",
  fullWidth,
  className,
  children,
  ...rest
}: ButtonProps) {
  return (
    <button
      className={cn("btn", VARIANT_CLASS[variant], fullWidth && "w-full", className)}
      {...rest}
    >
      {children}
    </button>
  );
}

/** Submit button that disables and shows a saving state while the form is pending. */
export function SubmitButton({
  variant = "primary",
  fullWidth,
  className,
  children,
  pendingLabel,
}: {
  variant?: Variant;
  fullWidth?: boolean;
  className?: string;
  children: React.ReactNode;
  pendingLabel?: string;
}) {
  const { pending } = useFormStatus();
  const { t } = useI18n();
  return (
    <button
      type="submit"
      disabled={pending}
      aria-busy={pending}
      className={cn("btn", VARIANT_CLASS[variant], fullWidth && "w-full", className)}
    >
      {pending ? (pendingLabel ?? t("common.saving")) : children}
    </button>
  );
}
