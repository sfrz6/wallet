"use client";

import { useActionState, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { createCategoryAction, updateCategoryAction } from "@/app/(app)/actions";
import { Modal } from "@/components/ui/Modal";
import { Button, SubmitButton } from "@/components/ui/Button";
import { SelectField, TextField } from "@/components/ui/fields";
import { Alert } from "@/components/ui/Alert";
import { useI18n } from "@/lib/i18n/provider";

export interface EditableCategory {
  id: string;
  name: string;
  kind: "expense" | "income" | "both";
}

export function CategoryFormModal({
  mode,
  category,
  triggerLabel,
  triggerVariant = "primary",
  triggerClassName,
}: {
  mode: "create" | "edit";
  category?: EditableCategory;
  triggerLabel: string;
  triggerVariant?: "primary" | "secondary" | "ghost";
  triggerClassName?: string;
}) {
  const { t } = useI18n();
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(false);
  const action = mode === "create" ? createCategoryAction : updateCategoryAction;
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
        title={mode === "create" ? t("categories.newCategory") : t("categories.editCategory")}
      >
        <form action={formAction} className="space-y-4">
          {mode === "edit" && category && <input type="hidden" name="id" value={category.id} />}
          {state && !state.ok && <Alert tone="error">{t(state.error)}</Alert>}
          <TextField
            label={t("categories.name")}
            name="name"
            required
            maxLength={60}
            defaultValue={category?.name}
          />
          <SelectField
            label={t("categories.kind")}
            name="kind"
            defaultValue={category?.kind ?? "expense"}
            options={[
              { value: "expense", label: t("categories.expense") },
              { value: "income", label: t("categories.income") },
              { value: "both", label: t("categories.both") },
            ]}
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
