import { getDb } from "@/db";
import { requireOnboardedUser } from "@/lib/auth/current-user";
import { getI18n } from "@/lib/i18n/server";
import { listAccounts } from "@/domain/accounts";
import { getDebtWithRepayments, listDebts, type DebtWithProgress } from "@/domain/loans";
import type { DebtRepayment, DebtStatus } from "@/db/schema";
import { deleteDebtAction } from "../actions";
import { formatDate } from "@/lib/date";
import { numericToMinor } from "@/lib/money";
import { PageHeader, EmptyState } from "@/components/ui/layout";
import { AmountText } from "@/components/AmountText";
import { AddTransactionButton } from "@/components/app/AddTransactionButton";
import { RepaymentModal } from "@/components/app/RepaymentModal";
import { ConfirmAction } from "@/components/app/ConfirmAction";
import type { AppLocale } from "@/lib/i18n/config";
import type { TFunction } from "@/lib/i18n/translate";
import type { AccountLite } from "@/components/app/types";

function statusMeta(status: DebtStatus, t: TFunction) {
  if (status === "paid") return { cls: "badge-positive", label: t("debts.settled") };
  if (status === "partially_paid") return { cls: "badge-warning", label: t("debts.partiallyPaid") };
  return { cls: "", label: t("debts.open") };
}

function DebtCard({
  entry,
  repayments,
  direction,
  debitAccounts,
  locale,
  currency,
  t,
}: {
  entry: DebtWithProgress;
  repayments: DebtRepayment[];
  direction: "lent" | "borrowed";
  debitAccounts: AccountLite[];
  locale: AppLocale;
  currency: string;
  t: TFunction;
}) {
  const { debt } = entry;
  const meta = statusMeta(debt.status, t);
  return (
    <div className="card p-4">
      <div className="flex items-start justify-between gap-3">
        <div>
          <div className="font-medium">{debt.personName}</div>
          <div className="text-xs text-[color:var(--color-muted)]">
            {formatDate(debt.occurredOn, locale)}
            {debt.dueDate ? ` · ${t("debts.dueDate")}: ${formatDate(debt.dueDate, locale)}` : ""}
          </div>
        </div>
        <span className={`badge ${meta.cls}`}>{meta.label}</span>
      </div>

      <div className="mt-3 grid grid-cols-3 gap-2 text-center">
        <div>
          <div className="text-xs text-[color:var(--color-muted)]">{t("debts.original")}</div>
          <AmountText
            minor={entry.principalMinor}
            locale={locale}
            currency={currency}
            className="text-sm font-semibold"
          />
        </div>
        <div>
          <div className="text-xs text-[color:var(--color-muted)]">{t("debts.paid")}</div>
          <AmountText
            minor={entry.paidMinor}
            locale={locale}
            currency={currency}
            className="text-sm font-semibold"
          />
        </div>
        <div>
          <div className="text-xs text-[color:var(--color-muted)]">{t("debts.remaining")}</div>
          <AmountText
            minor={entry.remainingMinor}
            locale={locale}
            currency={currency}
            tone={entry.remainingMinor > 0n ? "negative" : "positive"}
            className="text-sm font-semibold"
          />
        </div>
      </div>

      {repayments.length > 0 && (
        <details className="mt-3">
          <summary className="cursor-pointer text-xs font-medium text-[color:var(--color-primary)]">
            {t("debts.repaymentHistory")}
          </summary>
          <ul className="mt-2 space-y-1">
            {repayments.map((r) => (
              <li key={r.id} className="flex justify-between text-xs text-[color:var(--color-muted)]">
                <span>{formatDate(r.occurredOn, locale)}</span>
                <AmountText minor={numericToMinor(r.amount)} locale={locale} currency={currency} />
              </li>
            ))}
          </ul>
        </details>
      )}

      <div className="mt-3 flex items-center justify-end gap-1">
        {entry.remainingMinor > 0n && (
          <RepaymentModal
            debtId={debt.id}
            direction={direction}
            debitAccounts={debitAccounts}
            trigger={(open) => (
              <button type="button" onClick={open} className="btn btn-secondary text-sm">
                {t("debts.recordRepayment")}
              </button>
            )}
          />
        )}
        <ConfirmAction id={debt.id} action={deleteDebtAction} confirmKey="debts.deleteConfirm">
          {t("common.delete")}
        </ConfirmAction>
      </div>
    </div>
  );
}

export default async function DebtsPage() {
  const user = await requireOnboardedUser();
  const { locale, t } = await getI18n();
  const currency = t("common.currency");
  const db = getDb();

  const [lent, borrowed, accounts] = await Promise.all([
    listDebts(db, user.id, { direction: "lent" }),
    listDebts(db, user.id, { direction: "borrowed" }),
    listAccounts(db, user.id),
  ]);

  const debitAccounts: AccountLite[] = accounts
    .filter((a) => a.type === "debit")
    .map((a) => ({ id: a.id, name: a.name, type: a.type }));

  const allEntries = [...lent, ...borrowed];
  const historyList = await Promise.all(
    allEntries.map((e) => getDebtWithRepayments(db, user.id, e.debt.id)),
  );
  const historyById = new Map(historyList.map((h) => [h.debt.id, h.repayments]));

  return (
    <>
      <PageHeader
        title={t("debts.title")}
        action={
          <div className="flex gap-2">
            <AddTransactionButton
              type="lend"
              variant="secondary"
              label={t("debts.lend")}
              className="hidden sm:inline-flex"
            />
            <AddTransactionButton
              type="borrow"
              variant="secondary"
              label={t("debts.borrow")}
              className="hidden sm:inline-flex"
            />
          </div>
        }
      />

      <div className="grid gap-6 lg:grid-cols-2">
        <div>
          <h2 className="mb-3 text-base font-semibold">{t("debts.owedToMe")}</h2>
          {lent.length === 0 ? (
            <EmptyState
              title={t("debts.emptyOwed")}
              action={<AddTransactionButton type="lend" variant="secondary" label={t("debts.lend")} />}
            />
          ) : (
            <div className="space-y-3">
              {lent.map((e) => (
                <DebtCard
                  key={e.debt.id}
                  entry={e}
                  repayments={historyById.get(e.debt.id) ?? []}
                  direction="lent"
                  debitAccounts={debitAccounts}
                  locale={locale}
                  currency={currency}
                  t={t}
                />
              ))}
            </div>
          )}
        </div>

        <div>
          <h2 className="mb-3 text-base font-semibold">{t("debts.iOwe")}</h2>
          {borrowed.length === 0 ? (
            <EmptyState
              title={t("debts.emptyOwe")}
              action={
                <AddTransactionButton type="borrow" variant="secondary" label={t("debts.borrow")} />
              }
            />
          ) : (
            <div className="space-y-3">
              {borrowed.map((e) => (
                <DebtCard
                  key={e.debt.id}
                  entry={e}
                  repayments={historyById.get(e.debt.id) ?? []}
                  direction="borrowed"
                  debitAccounts={debitAccounts}
                  locale={locale}
                  currency={currency}
                  t={t}
                />
              ))}
            </div>
          )}
        </div>
      </div>
    </>
  );
}
