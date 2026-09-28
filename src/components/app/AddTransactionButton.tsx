"use client";

import { useQuickAdd } from "./QuickAddProvider";
import { useI18n } from "@/lib/i18n/provider";
import { PlusIcon } from "./icons";
import { cn } from "@/lib/cn";
import type { TxKind } from "./types";

export function AddTransactionButton({
  type,
  variant = "primary",
  label,
  className,
}: {
  type?: TxKind;
  variant?: "primary" | "secondary" | "ghost";
  label?: string;
  className?: string;
}) {
  const { open } = useQuickAdd();
  const { t } = useI18n();
  return (
    <button
      type="button"
      onClick={() => open(type)}
      className={cn("btn", `btn-${variant}`, className)}
    >
      <PlusIcon />
      {label ?? t("nav.addTransaction")}
    </button>
  );
}
