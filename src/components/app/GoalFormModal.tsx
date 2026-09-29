"use client";

import { useActionState, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { createGoalAction, updateGoalAction } from "@/app/(app)/actions";
import { Modal } from "@/components/ui/Modal";
import { Button, SubmitButton } from "@/components/ui/Button";
import { SelectField, TextField } from "@/components/ui/fields";
import { Alert } from "@/components/ui/Alert";
import { useI18n } from "@/lib/i18n/provider";
import type { AccountLite } from "./types";

export interface EditableGoal {
  id: string;
  name: string;
  targetAmount: string;
  accountId: string | null;
}

export function GoalFormModal({
  mode,
  goal,
  debitAccounts,
  triggerLabel,
  triggerVariant = "primary",
  triggerClassName,
}: {
  mode: "create" | "edit";
  goal?: EditableGoal;
  debitAccounts: AccountLite[];
  triggerLabel: string;
  triggerVariant?: "primary" | "secondary" | "ghost";
  triggerClassName?: string;
}) {
  const { t } = useI18n();
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(false);
  const action = mode === "create" ? createGoalAction : updateGoalAction;
  const [state, formAction] = useActionState(action, null);

  useEffect(() => {
    if (state?.ok) {
      setIsOpen(false);
      router.refresh();
    }
  }, [state, router]);

  return (
    <>
      <Button variant={triggerVariant} className={triggerClassName} onClick={() => setIsOpen(true)}>
        {triggerLabel}
      </Button>
      <Modal
        open={isOpen}
        onClose={() => setIsOpen(false)}
        title={mode === "create" ? t("goals.newGoal") : t("goals.editGoal")}
      >
        <form action={formAction} className="space-y-4">
          {mode === "edit" && goal && <input type="hidden" name="id" value={goal.id} />}
          {state && !state.ok && <Alert tone="error">{t(state.error)}</Alert>}

          <TextField
            label={t("goals.name")}
            name="name"
            required
            maxLength={80}
            placeholder={t("goals.namePlaceholder")}
            defaultValue={goal?.name}
          />
          <TextField
            label={t("goals.target")}
            name="targetAmount"
            inputMode="decimal"
            placeholder="0.000"
            required
            className="tabular"
            defaultValue={goal?.targetAmount}
          />
          <SelectField
            label={t("goals.linkedAccount")}
            name="accountId"
            placeholder={t("goals.allCash")}
            defaultValue={goal?.accountId ?? ""}
            options={debitAccounts.map((a) => ({ value: a.id, label: a.name }))}
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
