import { LanguageToggle } from "@/components/LanguageToggle";
import { getI18n } from "@/lib/i18n/server";

export default async function AuthLayout({ children }: { children: React.ReactNode }) {
  const { t } = await getI18n();
  return (
    <div className="flex min-h-screen flex-col">
      <header className="flex items-center justify-between px-5 py-4">
        <div className="flex items-baseline gap-2">
          <span className="text-lg font-bold text-[color:var(--color-primary)]">
            {t("app.name")}
          </span>
          <span className="text-xs text-[color:var(--color-muted)]">{t("app.latin")}</span>
        </div>
        <LanguageToggle />
      </header>
      <main className="flex flex-1 items-center justify-center px-4 pb-12">
        <div className="w-full max-w-md">{children}</div>
      </main>
    </div>
  );
}
