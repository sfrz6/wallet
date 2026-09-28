"use client";

import { useActionState } from "react";
import Link from "next/link";
import { signupAction } from "../actions";
import { SubmitButton } from "@/components/ui/Button";
import { TextField } from "@/components/ui/fields";
import { Alert } from "@/components/ui/Alert";
import { useI18n } from "@/lib/i18n/provider";

export function SignupForm() {
  const { t } = useI18n();
  const [state, formAction] = useActionState(signupAction, null);
  const fe = state && !state.ok ? state.fieldErrors : undefined;

  return (
    <div className="card p-6">
      <h1 className="text-xl font-semibold">{t("auth.signUp")}</h1>
      <p className="mt-1 text-sm text-[color:var(--color-muted)]">{t("auth.signupSubtitle")}</p>

      <form action={formAction} className="mt-5 space-y-4">
        {state && !state.ok && !fe && <Alert tone="error">{t(state.error)}</Alert>}
        <TextField
          label={t("auth.username")}
          name="username"
          autoComplete="username"
          required
          error={fe?.username && t(fe.username)}
        />
        <TextField
          label={t("auth.email")}
          name="email"
          type="email"
          autoComplete="email"
          required
          error={fe?.email && t(fe.email)}
        />
        <TextField
          label={t("auth.password")}
          name="password"
          type="password"
          autoComplete="new-password"
          required
          hint={t("auth.passwordHint")}
          error={fe?.password && t(fe.password)}
        />
        <TextField
          label={t("auth.confirmPassword")}
          name="confirmPassword"
          type="password"
          autoComplete="new-password"
          required
          error={fe?.confirmPassword && t(fe.confirmPassword)}
        />
        {state && !state.ok && fe && <Alert tone="error">{t(state.error)}</Alert>}
        <SubmitButton fullWidth>{t("auth.createAccount")}</SubmitButton>
      </form>

      <p className="mt-5 text-center text-sm text-[color:var(--color-muted)]">
        {t("auth.alreadyHaveAccount")}{" "}
        <Link href="/login" className="font-semibold text-[color:var(--color-primary)]">
          {t("auth.signInHere")}
        </Link>
      </p>
    </div>
  );
}
