"use client";

import { useActionState, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { addTransactionAction } from "@/app/(app)/actions";
import { SubmitButton } from "@/components/ui/Button";
import { SelectField, TextArea, TextField, type Option } from "@/components/ui/fields";
import { Alert } from "@/components/ui/Alert";
import { useI18n } from "@/lib/i18n/provider";
import { cn } from "@/lib/cn";
import { clientId } from "@/lib/id";
import type { AccountLite, CategoryLite, TxKind } from "./types";

function todayIso(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(
    d.getDate(),
  ).padStart(2, "0")}`;
}

const TYPE_ORDER: TxKind[] = [
  "expense",
  "income",
  "transfer",
  "credit_card_payment",
  "lend",
  "borrow",
];

export function TransactionForm({
  accounts,
  categories,
  initialType,
  onDone,
}: {
  accounts: AccountLite[];
  categories: CategoryLite[];
  initialType?: TxKind;
  onDone: () => void;
}) {
  const { t } = useI18n();
  const router = useRouter();
  const [type, setType] = useState<TxKind | null>(initialType ?? null);
  const [requestId, setRequestId] = useState(() => clientId());
  const [state, formAction] = useActionState(addTransactionAction, null);

  useEffect(() => {
    if (state?.ok) {
      onDone();
      router.refresh();
    }
  }, [state, onDone, router]);

  const debitAccounts = useMemo(() => accounts.filter((a) => a.type === "debit"), [accounts]);
  const creditAccounts = useMemo(() => accounts.filter((a) => a.type === "credit"), [accounts]);
  // Asset accounts (debit + committee) can be transfer endpoints. Expenses can
  // come from debit or credit cards, but never from a locked committee.
  const assetAccounts = useMemo(() => accounts.filter((a) => a.type !== "credit"), [accounts]);
  const expenseAccounts = useMemo(() => accounts.filter((a) => a.type !== "jamiya"), [accounts]);
  const expenseCats = useMemo(
    () => categories.filter((c) => c.kind === "expense" || c.kind === "both"),
    [categories],
  );
  const incomeCats = useMemo(
    () => categories.filter((c) => c.kind === "income" || c.kind === "both"),
    [categories],
  );

  const accountOptions = (list: AccountLite[]): Option[] =>
    list.map((a) => ({ value: a.id, label: a.name }));
  const catOptions = (list: CategoryLite[]): Option[] =>
    list.map((c) => ({ value: c.id, label: c.name }));

  const typeLabel: Record<TxKind, string> = {
    expense: t("transactions.expense"),
    income: t("transactions.income"),
    transfer: t("transactions.transfer"),
    credit_card_payment: t("transactions.creditCardPayment"),
    lend: t("transactions.lend"),
    borrow: t("transactions.borrow"),
  };
  const typeDesc: Record<TxKind, string> = {
    expense: t("transactions.expenseDesc"),
    income: t("transactions.incomeDesc"),
    transfer: t("transactions.transferDesc"),
    credit_card_payment: t("transactions.payCardDesc"),
    lend: t("transactions.lendDesc"),
    borrow: t("transactions.borrowDesc"),
  };

  if (!type) {
    return (
      <div>
        <p className="mb-3 text-sm text-[color:var(--color-muted)]">{t("transactions.chooseType")}</p>
        <div className="grid grid-cols-2 gap-2">
          {TYPE_ORDER.map((k) => (
            <button
              key={k}
              type="button"
              onClick={() => {
                setRequestId(clientId());
                setType(k);
              }}
              className="card p-3 text-start transition-colors hover:bg-[color:var(--color-surface-2)]"
            >
              <div className="font-semibold">{typeLabel[k]}</div>
              <div className="mt-0.5 text-xs text-[color:var(--color-muted)]">{typeDesc[k]}</div>
            </button>
          ))}
        </div>
      </div>
    );
  }

  const needsCredit = type === "credit_card_payment";
  const isTransferLike = type === "transfer" || type === "credit_card_payment";
  const isDebt = type === "lend" || type === "borrow";

  return (
    <form action={formAction} className="space-y-4">
      <input type="hidden" name="kind" value={type} />
      <input type="hidden" name="clientRequestId" value={requestId} />

      <div className="flex items-center justify-between">
        <span className="badge">{typeLabel[type]}</span>
        {!initialType && (
          <button
            type="button"
            onClick={() => setType(null)}
            className="text-xs font-medium text-[color:var(--color-primary)]"
          >
            {t("common.back")}
          </button>
        )}
      </div>

      {state && !state.ok && <Alert tone="error">{t(state.error)}</Alert>}

      {isDebt && (
        <TextField label={t("transactions.person")} name="personName" required maxLength={80} />
      )}

      {/* Account fields */}
      {type === "expense" && (
        <SelectField
          label={t("transactions.account")}
          name="accountId"
          required
          placeholder={t("transactions.selectAccount")}
          options={accountOptions(expenseAccounts)}
        />
      )}
      {type === "income" && (
        <SelectField
          label={t("transactions.account")}
          name="accountId"
          required
          placeholder={t("transactions.selectAccount")}
          options={accountOptions(debitAccounts)}
        />
      )}
      {isTransferLike && (
        <>
          <SelectField
            label={t("transactions.fromAccount")}
            name="fromAccountId"
            required
            placeholder={t("transactions.selectAccount")}
            options={accountOptions(needsCredit ? debitAccounts : assetAccounts)}
          />
          <SelectField
            label={needsCredit ? t("transactions.creditCard") : t("transactions.toAccount")}
            name={needsCredit ? "creditAccountId" : "toAccountId"}
            required
            placeholder={t("transactions.selectAccount")}
            options={accountOptions(needsCredit ? creditAccounts : assetAccounts)}
          />
        </>
      )}
      {type === "lend" && (
        <SelectField
          label={t("transactions.fromAccount")}
          name="fromAccountId"
          required
          placeholder={t("transactions.selectAccount")}
          options={accountOptions(debitAccounts)}
        />
      )}
      {type === "borrow" && (
        <SelectField
          label={t("transactions.toAccount")}
          name="toAccountId"
          required
          placeholder={t("transactions.selectAccount")}
          options={accountOptions(debitAccounts)}
        />
      )}

      {/* Category fields */}
      {type === "expense" && (
        <SelectField
          label={t("transactions.category")}
          name="categoryId"
          required
          placeholder={t("transactions.selectCategory")}
          options={catOptions(expenseCats)}
        />
      )}
      {type === "income" && (
        <SelectField
          label={`${t("transactions.category")} (${t("common.optional")})`}
          name="categoryId"
          placeholder={t("common.none")}
          options={catOptions(incomeCats)}
        />
      )}

      <div className={cn("grid gap-4", isDebt ? "grid-cols-1 sm:grid-cols-2" : "grid-cols-2")}>
        <TextField
          label={t("common.amount")}
          name="amount"
          inputMode="decimal"
          placeholder="0.000"
          required
          className="tabular"
        />
        <TextField label={t("common.date")} name="occurredOn" type="date" defaultValue={todayIso()} required />
      </div>

      {isDebt && (
        <TextField label={t("debts.dueDate")} name="dueDate" type="date" />
      )}

      <TextArea label={`${t("common.note")} (${t("common.optional")})`} name="note" maxLength={500} />

      <SubmitButton fullWidth>{t("common.save")}</SubmitButton>
    </form>
  );
}
