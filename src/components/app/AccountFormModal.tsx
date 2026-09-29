"use client";

import { useActionState, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { createAccountAction, updateAccountAction } from "@/app/(app)/actions";
import { Modal } from "@/components/ui/Modal";
import { Button, SubmitButton } from "@/components/ui/Button";
import { SelectField, TextField } from "@/components/ui/fields";
import { Alert } from "@/components/ui/Alert";
import { BankSelect } from "@/components/app/BankSelect";
import { useI18n } from "@/lib/i18n/provider";

export interface EditableAccount {
  id: string;
  name: string;
  type: "debit" | "credit" | "jamiya";
  bank: string | null;
  openingBalance: string;
  creditLimit: string | null;
}

export function AccountFormModal({
  mode,
  account,
  triggerLabel,
  triggerVariant = "primary",
  triggerClassName,
}: {
  mode: "create" | "edit";
  account?: EditableAccount;
  triggerLabel: string;
  triggerVariant?: "primary" | "secondary" | "ghost";
  triggerClassName?: string;
}) {
  const { t } = useI18n();
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(false);
  const action = mode === "create" ? createAccountAction : updateAccountAction;
  const [state, formAction] = useActionState(action, null);
  const [type, setType] = useState<"debit" | "credit" | "jamiya">(account?.type ?? "debit");

  useEffect(() => {
    if (state?.ok) {
      setIsOpen(false);
      router.refresh();
    }
  }, [state, router]);

  return (
    <>
      <Button
        variant={triggerVariant}
        className={triggerClassName}
        onClick={() => {
          setType(account?.type ?? "debit");
          setIsOpen(true);
        }}
      >
        {triggerLabel}
      </Button>
      <Modal
        open={isOpen}
        onClose={() => setIsOpen(false)}
        title={mode === "create" ? t("accounts.newAccount") : t("accounts.editAccount")}
      >
        <form action={formAction} className="space-y-4">
          {mode === "edit" && account && <input type="hidden" name="id" value={account.id} />}
          {state && !state.ok && <Alert tone="error">{t(state.error)}</Alert>}

          <TextField
            label={t("accounts.name")}
            name="name"
            required
            maxLength={60}
            defaultValue={account?.name}
          />

          {mode === "create" && (
            <SelectField
              label={t("accounts.type")}
              name="type"
              value={type}
              onChange={(e) => setType(e.target.value as "debit" | "credit" | "jamiya")}
              options={[
                { value: "debit", label: t("accountTypes.debit") },
                { value: "credit", label: t("accountTypes.credit") },
                { value: "jamiya", label: t("accountTypes.jamiya") },
              ]}
            />
          )}

          <BankSelect
            label={t("accounts.bankOptional")}
            name="bank"
            defaultValue={account?.bank ?? ""}
          />

          <TextField
            label={type === "credit" ? t("accounts.openingOutstanding") : t("accounts.openingBalance")}
            name="openingBalance"
            inputMode="decimal"
            placeholder="0.000"
            defaultValue={account?.openingBalance ?? "0"}
            hint={
              type === "credit"
                ? t("accounts.openingOutstandingHint")
                : t("accounts.openingBalanceHint")
            }
          />

          {type === "credit" && (
            <TextField
              label={t("accounts.creditLimit")}
              name="creditLimit"
              inputMode="decimal"
              placeholder="0.000"
              defaultValue={account?.creditLimit ?? ""}
            />
          )}

          <div className="flex justify-end gap-2 pt-1">
            <Button type="button" variant="ghost" onClick={() => setIsOpen(false)}>
              {t("common.cancel")}
            </Button>
            <SubmitButton>{t("common.save")}</SubmitButton>
          </div>
        </form>
      </Modal>
    </>
  );
}
