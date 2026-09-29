"use client";

import { useEffect, useState } from "react";
import { setThemeAction } from "@/app/actions/theme";
import { useI18n } from "@/lib/i18n/provider";
import { MoonIcon, SunIcon } from "@/components/app/icons";
import { cn } from "@/lib/cn";
import type { Theme } from "@/lib/theme";

function currentTheme(): Theme {
  if (typeof document === "undefined") return "light";
  const explicit = document.documentElement.dataset.theme;
  if (explicit === "dark") return "dark";
  if (explicit === "light") return "light";
  // No explicit choice: follow the system preference.
  return window.matchMedia?.("(prefers-color-scheme: dark)").matches ? "dark" : "light";
}

export function ThemeToggle({ className }: { className?: string }) {
  const { t } = useI18n();
  const [mounted, setMounted] = useState(false);
  const [theme, setTheme] = useState<Theme>("light");

  useEffect(() => {
    setTheme(currentTheme());
    setMounted(true);
  }, []);

  function toggle() {
    const next: Theme = theme === "dark" ? "light" : "dark";
    document.documentElement.dataset.theme = next;
    setTheme(next);
    void setThemeAction(next);
  }

  const label = t(theme === "dark" ? "settings.lightMode" : "settings.darkMode");

  return (
    <button
      type="button"
      onClick={toggle}
      aria-label={label}
      title={label}
      className={cn(
        "btn btn-secondary h-9 w-9 justify-center p-0",
        className,
      )}
    >
      {mounted && theme === "dark" ? <SunIcon width={18} height={18} /> : <MoonIcon width={18} height={18} />}
    </button>
  );
}
