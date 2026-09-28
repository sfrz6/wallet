"use client";

import { useActionState } from "react";
import Link from "next/link";
import { loginAction } from "../actions";
import { SubmitButton } from "@/components/ui/Button";
import { TextField } from "@/components/ui/fields";
import { Alert } from "@/components/ui/Alert";
import { useI18n } from "@/lib/i18n/provider";

export function LoginForm() {
  const { t } = useI18n();
  const [state, formAction] = useActionState(loginAction, null);

  return (
    <div className="card p-6">
      <h1 className="text-xl font-semibold">{t("auth.signIn")}</h1>
      <p className="mt-1 text-sm text-[color:var(--color-muted)]">{t("auth.loginSubtitle")}</p>

      <form action={formAction} className="mt-5 space-y-4">
        {state && !state.ok && <Alert tone="error">{t(state.error)}</Alert>}
        <TextField
          label={t("auth.identifier")}
          name="identifier"
          autoComplete="username"
          required
          error={state && !state.ok ? state.fieldErrors?.identifier && t(state.fieldErrors.identifier) : undefined}
        />
        <TextField
          label={t("auth.password")}
          name="password"
          type="password"
          autoComplete="current-password"
          required
          error={state && !state.ok ? state.fieldErrors?.password && t(state.fieldErrors.password) : undefined}
        />
        <SubmitButton fullWidth>{t("auth.signIn")}</SubmitButton>
      </form>

      <p className="mt-5 text-center text-sm text-[color:var(--color-muted)]">
        {t("auth.noAccount")}{" "}
        <Link href="/signup" className="font-semibold text-[color:var(--color-primary)]">
          {t("auth.signUpHere")}
        </Link>
      </p>
    </div>
  );
}
