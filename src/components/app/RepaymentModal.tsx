"use client";

import { useActionState, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { addRepaymentAction } from "@/app/(app)/actions";
import { Modal } from "@/components/ui/Modal";
import { Button, SubmitButton } from "@/components/ui/Button";
import { SelectField, TextField } from "@/components/ui/fields";
import { Alert } from "@/components/ui/Alert";
import { useI18n } from "@/lib/i18n/provider";
import { clientId } from "@/lib/id";
import type { AccountLite } from "./types";

function todayIso(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(
    d.getDate(),
  ).padStart(2, "0")}`;
}

export function RepaymentModal({
  debtId,
  direction,
  debitAccounts,
  triggerLabel,
  triggerVariant = "secondary",
  triggerClassName,
}: {
  debtId: string;
  direction: "lent" | "borrowed";
  debitAccounts: AccountLite[];
  triggerLabel: string;
  triggerVariant?: "primary" | "secondary" | "ghost";
  triggerClassName?: string;
}) {
  const { t } = useI18n();
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(false);
  const [requestId, setRequestId] = useState(() => clientId());
  const [state, formAction] = useActionState(addRepaymentAction, null);

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
          setRequestId(clientId());
          setIsOpen(true);
        }}
      >
        {triggerLabel}
      </Button>
      <Modal open={isOpen} onClose={() => setIsOpen(false)} title={t("debts.recordRepayment")}>
        <form action={formAction} className="space-y-4">
          <input type="hidden" name="debtId" value={debtId} />
          <input type="hidden" name="clientRequestId" value={requestId} />
          {state && !state.ok && <Alert tone="error">{t(state.error)}</Alert>}

          <TextField
            label={t("debts.repaymentAmount")}
            name="amount"
            inputMode="decimal"
            placeholder="0.000"
            required
            className="tabular"
          />
          <SelectField
            label={direction === "lent" ? t("debts.destinationAccount") : t("debts.sourceAccount")}
            name="accountId"
            required
            placeholder={t("transactions.selectAccount")}
            options={debitAccounts.map((a) => ({ value: a.id, label: a.name }))}
          />
          <TextField
            label={t("common.date")}
            name="occurredOn"
            type="date"
            defaultValue={todayIso()}
            required
          />
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
