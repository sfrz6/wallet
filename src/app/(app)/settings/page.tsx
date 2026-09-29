import Link from "next/link";
import { requireOnboardedUser } from "@/lib/auth/current-user";
import { getI18n } from "@/lib/i18n/server";
import { PageHeader, SectionCard } from "@/components/ui/layout";
import { LanguageToggle } from "@/components/LanguageToggle";
import { ThemeToggle } from "@/components/ThemeToggle";
import { LogoutButton } from "@/components/app/LogoutButton";
import { ChangePasswordForm } from "./ChangePasswordForm";

export default async function SettingsPage() {
  const user = await requireOnboardedUser();
  const { t } = await getI18n();

  return (
    <>
      <PageHeader title={t("settings.title")} />

      <div className="grid gap-4 lg:grid-cols-2">
        <SectionCard title={t("settings.language")}>
          <LanguageToggle />
        </SectionCard>

        <SectionCard title={t("settings.theme")}>
          <div className="flex items-center justify-between">
            <span className="text-sm text-[color:var(--color-muted)]">{t("settings.theme")}</span>
            <ThemeToggle />
          </div>
        </SectionCard>

        <SectionCard title={t("settings.profile")}>
          <dl className="space-y-2 text-sm">
            <div className="flex justify-between">
              <dt className="text-[color:var(--color-muted)]">{t("settings.username")}</dt>
              <dd className="font-medium">{user.usernameDisplay}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-[color:var(--color-muted)]">{t("settings.email")}</dt>
              <dd className="font-medium">{user.email}</dd>
            </div>
          </dl>
        </SectionCard>

        <SectionCard title={t("settings.manageData")}>
          <p className="mb-3 text-sm text-[color:var(--color-muted)]">
            {t("settings.manageDataDesc")}
          </p>
          <div className="flex gap-2">
            <Link href="/accounts" className="btn btn-secondary text-sm">
              {t("nav.accounts")}
            </Link>
            <Link href="/categories" className="btn btn-secondary text-sm">
              {t("nav.categories")}
            </Link>
          </div>
        </SectionCard>

        <SectionCard title={t("settings.security")}>
          <ChangePasswordForm />
          <div className="mt-5 border-t border-[color:var(--color-border)] pt-4">
            <LogoutButton />
          </div>
        </SectionCard>
      </div>
    </>
  );
}
