"use client";

import { cn } from "@/lib/cn";

type Tone = "error" | "success" | "info";

const TONE_CLASS: Record<Tone, string> = {
  error: "bg-[color:var(--color-negative-soft)] text-[color:var(--color-negative)]",
  success: "bg-[color:var(--color-positive-soft)] text-[color:var(--color-positive)]",
  info: "bg-[color:var(--color-accent-soft)] text-[color:var(--color-primary)]",
};

export function Alert({ tone = "info", children }: { tone?: Tone; children: React.ReactNode }) {
  if (!children) return null;
  return (
    <div className={cn("rounded-md px-3 py-2 text-sm font-medium", TONE_CLASS[tone])} role="alert">
      {children}
    </div>
  );
}
