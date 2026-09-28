"use client";

import { useActionState, useState, useTransition } from "react";
import { resendCodeAction, verifyAction } from "../actions";
import { SubmitButton } from "@/components/ui/Button";
import { TextField } from "@/components/ui/fields";
import { Alert } from "@/components/ui/Alert";
import { useI18n } from "@/lib/i18n/provider";

export function VerifyForm({ email, devHint }: { email: string; devHint: boolean }) {
  const { t } = useI18n();
  const [state, formAction] = useActionState(verifyAction, null);
  const [resent, setResent] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  function resend() {
    setResent(null);
    startTransition(async () => {
      const res = await resendCodeAction();
      setResent(res.ok ? "auth.codeResent" : res.error);
    });
  }

  return (
    <div className="card p-6">
      <h1 className="text-xl font-semibold">{t("auth.verifyEmail")}</h1>
      <p className="mt-1 text-sm text-[color:var(--color-muted)]">
        {t("auth.verifyDescription", { email })}
      </p>
      {devHint && (
        <p className="mt-3">
          <Alert tone="info">{t("auth.devCodeHint")}</Alert>
        </p>
      )}

      <form action={formAction} className="mt-5 space-y-4">
        {state && !state.ok && <Alert tone="error">{t(state.error)}</Alert>}
        {resent && <Alert tone={resent === "auth.codeResent" ? "success" : "error"}>{t(resent)}</Alert>}
        <TextField
          label={t("auth.verificationCode")}
          name="code"
          inputMode="numeric"
          autoComplete="one-time-code"
          maxLength={6}
          required
          className="tabular text-center text-lg tracking-[0.4em]"
        />
        <SubmitButton fullWidth>{t("auth.verify")}</SubmitButton>
      </form>

      <button
        type="button"
        onClick={resend}
        disabled={pending}
        className="btn btn-ghost mt-4 w-full"
      >
        {t("auth.resendCode")}
      </button>
    </div>
  );
}
