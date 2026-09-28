"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { setLocaleAction } from "@/app/actions/locale";
import { useI18n } from "@/lib/i18n/provider";
import { cn } from "@/lib/cn";

export function LanguageToggle({ className }: { className?: string }) {
  const { locale } = useI18n();
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  function switchTo(next: "ar" | "en") {
    if (next === locale || pending) return;
    startTransition(async () => {
      await setLocaleAction(next);
      router.refresh();
    });
  }

  return (
    <div
      className={cn(
        "inline-flex overflow-hidden rounded-md border border-[color:var(--color-border-strong)] text-sm",
        className,
      )}
    >
      <button
        type="button"
        onClick={() => switchTo("ar")}
        aria-pressed={locale === "ar"}
        className={cn(
          "px-3 py-1.5 font-medium transition-colors",
          locale === "ar"
            ? "bg-[color:var(--color-primary)] text-white"
            : "bg-[color:var(--color-surface)] text-[color:var(--color-muted)]",
        )}
      >
        العربية
      </button>
      <button
        type="button"
        onClick={() => switchTo("en")}
        aria-pressed={locale === "en"}
        className={cn(
          "px-3 py-1.5 font-medium transition-colors",
          locale === "en"
            ? "bg-[color:var(--color-primary)] text-white"
            : "bg-[color:var(--color-surface)] text-[color:var(--color-muted)]",
        )}
      >
        English
      </button>
    </div>
  );
}
