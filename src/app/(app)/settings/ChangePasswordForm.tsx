"use client";

import { useActionState, useEffect, useRef } from "react";
import { changePasswordAction } from "../actions";
import { SubmitButton } from "@/components/ui/Button";
import { TextField } from "@/components/ui/fields";
import { Alert } from "@/components/ui/Alert";
import { useI18n } from "@/lib/i18n/provider";

export function ChangePasswordForm() {
  const { t } = useI18n();
  const [state, formAction] = useActionState(changePasswordAction, null);
  const formRef = useRef<HTMLFormElement>(null);

  useEffect(() => {
    if (state?.ok) formRef.current?.reset();
  }, [state]);

  return (
    <form ref={formRef} action={formAction} className="space-y-4">
      {state && !state.ok && <Alert tone="error">{t(state.error)}</Alert>}
      {state?.ok && <Alert tone="success">{t("settings.passwordUpdated")}</Alert>}
      <TextField
        label={t("settings.currentPassword")}
        name="currentPassword"
        type="password"
        autoComplete="current-password"
        required
      />
      <TextField
        label={t("settings.newPassword")}
        name="newPassword"
        type="password"
        autoComplete="new-password"
        required
        hint={t("auth.passwordHint")}
      />
      <TextField
        label={t("settings.confirmNewPassword")}
        name="confirmPassword"
        type="password"
        autoComplete="new-password"
        required
      />
      <SubmitButton>{t("settings.updatePassword")}</SubmitButton>
    </form>
  );
}
