"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/cn";
import { useI18n } from "@/lib/i18n/provider";
import { LanguageToggle } from "@/components/LanguageToggle";
import { ThemeToggle } from "@/components/ThemeToggle";
import { Logo } from "@/components/Logo";
import { LogoutButton } from "./LogoutButton";
import { useQuickAdd } from "./QuickAddProvider";
import {
  AccountsIcon,
  CategoriesIcon,
  DashboardIcon,
  DebtsIcon,
  GoalsIcon,
  MenuIcon,
  PlusIcon,
  ReportsIcon,
  SettingsIcon,
  TransactionsIcon,
} from "./icons";

interface NavItem {
  href: string;
  key: string;
  Icon: (p: React.SVGProps<SVGSVGElement>) => React.JSX.Element;
}

const NAV: NavItem[] = [
  { href: "/dashboard", key: "nav.dashboard", Icon: DashboardIcon },
  { href: "/transactions", key: "nav.transactions", Icon: TransactionsIcon },
  { href: "/accounts", key: "nav.accounts", Icon: AccountsIcon },
  { href: "/categories", key: "nav.categories", Icon: CategoriesIcon },
  { href: "/debts", key: "nav.debts", Icon: DebtsIcon },
  { href: "/goals", key: "nav.goals", Icon: GoalsIcon },
  { href: "/reports", key: "nav.reports", Icon: ReportsIcon },
  { href: "/settings", key: "nav.settings", Icon: SettingsIcon },
];

export function AppShell({ children, userName }: { children: React.ReactNode; userName: string }) {
  const { t } = useI18n();
  const pathname = usePathname();
  const quickAdd = useQuickAdd();
  const [drawerOpen, setDrawerOpen] = useState(false);

  const isActive = (href: string) => pathname === href || pathname.startsWith(`${href}/`);

  const navLinks = (onClick?: () => void) =>
    NAV.map(({ href, key, Icon }) => (
      <Link
        key={href}
        href={href}
        onClick={onClick}
        aria-current={isActive(href) ? "page" : undefined}
        className={cn(
          "flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors",
          isActive(href)
            ? "bg-[color:var(--color-accent-soft)] text-[color:var(--color-primary)]"
            : "text-[color:var(--color-muted)] hover:bg-[color:var(--color-surface-2)] hover:text-[color:var(--color-fg)]",
        )}
      >
        <Icon />
        <span>{t(key)}</span>
      </Link>
    ));

  const brand = (
    <Link href="/dashboard" aria-label="Mahfazati" className="inline-flex">
      <Logo size={34} />
    </Link>
  );

  return (
    <div className="min-h-screen lg:flex">
      {/* Desktop sidebar */}
      <aside className="hidden w-64 shrink-0 flex-col border-e border-[color:var(--color-border)] bg-[color:var(--color-surface)] p-4 lg:flex">
        <div className="px-2 py-2">{brand}</div>
        <button
          type="button"
          onClick={() => quickAdd.open()}
          className="btn btn-primary mt-4 w-full"
        >
          <PlusIcon />
          {t("nav.addTransaction")}
        </button>
        <nav className="mt-5 flex flex-1 flex-col gap-1">{navLinks()}</nav>
        <div className="mt-4 space-y-3 border-t border-[color:var(--color-border)] pt-4">
          <div className="flex items-center gap-2">
            <LanguageToggle className="flex-1" />
            <ThemeToggle />
          </div>
          <div className="px-2 text-xs text-[color:var(--color-muted)]">{userName}</div>
          <LogoutButton />
        </div>
      </aside>

      {/* Mobile top bar */}
      <header
        className="sticky top-0 z-30 flex items-center justify-between border-b border-[color:var(--color-border)] bg-[color:var(--color-surface)] px-4 py-3 lg:hidden"
        style={{ paddingTop: "max(0.75rem, env(safe-area-inset-top))" }}
      >
        {brand}
        <div className="flex items-center gap-2">
          <ThemeToggle />
          <button
            type="button"
            aria-label={t("nav.menu")}
            onClick={() => setDrawerOpen(true)}
            className="btn btn-ghost px-2"
          >
            <MenuIcon />
          </button>
        </div>
      </header>

      {/* Mobile drawer */}
      {drawerOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/40 lg:hidden"
          onMouseDown={(e) => {
            if (e.target === e.currentTarget) setDrawerOpen(false);
          }}
        >
          <div className="absolute inset-y-0 end-0 flex w-72 max-w-[85%] flex-col bg-[color:var(--color-surface)] p-4">
            <div className="flex items-center justify-between px-2 py-1">
              {brand}
              <button
                type="button"
                aria-label={t("common.close")}
                onClick={() => setDrawerOpen(false)}
                className="btn btn-ghost px-2 text-lg"
              >
                &times;
              </button>
            </div>
            <nav className="mt-4 flex flex-1 flex-col gap-1">
              {navLinks(() => setDrawerOpen(false))}
            </nav>
            <div className="mt-4 space-y-3 border-t border-[color:var(--color-border)] pt-4">
              <div className="flex items-center gap-2">
                <LanguageToggle className="flex-1" />
                <ThemeToggle />
              </div>
              <div className="px-2 text-xs text-[color:var(--color-muted)]">{userName}</div>
              <LogoutButton />
            </div>
          </div>
        </div>
      )}

      {/* Main content */}
      <main className="flex-1 px-4 py-6 pb-24 sm:px-6 lg:px-8 lg:pb-8">
        <div className="mx-auto w-full max-w-5xl">{children}</div>
      </main>

      {/* Mobile floating add button */}
      <button
        type="button"
        onClick={() => quickAdd.open()}
        aria-label={t("nav.addTransaction")}
        className="btn btn-primary fixed end-5 z-30 h-14 w-14 rounded-full p-0 shadow-[var(--shadow-pop)] lg:hidden"
        style={{ bottom: "max(1.25rem, calc(env(safe-area-inset-bottom) + 0.75rem))" }}
      >
        <PlusIcon width={24} height={24} />
      </button>
    </div>
  );
}
