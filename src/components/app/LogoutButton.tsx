"use client";

import { logoutAction } from "@/app/(auth)/actions";
import { useI18n } from "@/lib/i18n/provider";
import { LogoutIcon } from "./icons";

export function LogoutButton({ compact }: { compact?: boolean }) {
  const { t } = useI18n();
  return (
    <form action={logoutAction}>
      <button
        type="submit"
        className="btn btn-ghost w-full justify-start gap-3 px-3"
        aria-label={t("nav.logout")}
      >
        <LogoutIcon />
        {!compact && <span>{t("nav.logout")}</span>}
      </button>
    </form>
  );
}
