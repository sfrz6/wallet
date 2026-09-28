import Link from "next/link";
import { getDb } from "@/db";
import { requireOnboardedUser } from "@/lib/auth/current-user";
import { getI18n } from "@/lib/i18n/server";
import { listAccounts } from "@/domain/accounts";
import { listCategories } from "@/domain/categories";
import { listTransactions, type TransactionFilter } from "@/domain/transactions";
import type { TransactionType } from "@/db/schema";
import { deleteTransactionAction } from "../actions";
import { PageHeader, SectionCard, EmptyState } from "@/components/ui/layout";
import { AddTransactionButton } from "@/components/app/AddTransactionButton";
import { TransactionRow } from "@/components/app/TransactionRow";
import { ConfirmAction } from "@/components/app/ConfirmAction";

const TX_TYPES: TransactionType[] = [
  "expense",
  "income",
  "transfer",
  "credit_card_payment",
  "loan_disbursement",
  "borrow",
  "loan_repayment_received",
  "debt_repayment_paid",
];

export default async function TransactionsPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | undefined>>;
}) {
  const user = await requireOnboardedUser();
  const { locale, t } = await getI18n();
  const currency = t("common.currency");
  const db = getDb();
  const sp = await searchParams;

  const filter: TransactionFilter = {
    type: (TX_TYPES as string[]).includes(sp.type ?? "")
      ? (sp.type as TransactionType)
      : undefined,
    accountId: sp.accountId || undefined,
    categoryId: sp.categoryId || undefined,
    from: sp.from || undefined,
    to: sp.to || undefined,
    limit: 100,
  };

  const [accounts, categories, items] = await Promise.all([
    listAccounts(db, user.id, { includeArchived: true }),
    listCategories(db, user.id, { includeArchived: true }),
    listTransactions(db, user.id, filter),
  ]);

  return (
    <>
      <PageHeader
        title={t("transactions.title")}
        action={<AddTransactionButton className="hidden sm:inline-flex" />}
      />

      <form method="get" className="card mb-4 grid gap-3 p-4 sm:grid-cols-2 lg:grid-cols-5">
        <div>
          <label htmlFor="f-type" className="field-label">
            {t("transactions.type")}
          </label>
          <select id="f-type" name="type" defaultValue={sp.type ?? ""} className="select">
            <option value="">{t("transactions.allTypes")}</option>
            {TX_TYPES.map((ty) => (
              <option key={ty} value={ty}>
                {t(`transactions.typeLabels.${ty}`)}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label htmlFor="f-account" className="field-label">
            {t("transactions.account")}
          </label>
          <select id="f-account" name="accountId" defaultValue={sp.accountId ?? ""} className="select">
            <option value="">{t("transactions.allAccounts")}</option>
            {accounts.map((a) => (
              <option key={a.id} value={a.id}>
                {a.name}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label htmlFor="f-category" className="field-label">
            {t("transactions.category")}
          </label>
          <select
            id="f-category"
            name="categoryId"
            defaultValue={sp.categoryId ?? ""}
            className="select"
          >
            <option value="">{t("transactions.allCategories")}</option>
            {categories.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label htmlFor="f-from" className="field-label">
            {t("transactions.dateFrom")}
          </label>
          <input id="f-from" type="date" name="from" defaultValue={sp.from ?? ""} className="input" />
        </div>
        <div>
          <label htmlFor="f-to" className="field-label">
            {t("transactions.dateTo")}
          </label>
          <input id="f-to" type="date" name="to" defaultValue={sp.to ?? ""} className="input" />
        </div>
        <div className="flex items-end gap-2 sm:col-span-2 lg:col-span-5">
          <button type="submit" className="btn btn-primary">
            {t("reports.apply")}
          </button>
          <Link href="/transactions" className="btn btn-ghost">
            {t("common.all")}
          </Link>
        </div>
      </form>

      <SectionCard>
        {items.length === 0 ? (
          <EmptyState
            title={t("transactions.empty")}
            description={t("transactions.emptyDesc")}
            action={<AddTransactionButton />}
          />
        ) : (
          <div className="divide-y divide-[color:var(--color-border)]">
            {items.map((item) => {
              const deletable =
                item.transaction.type !== "loan_disbursement" &&
                item.transaction.type !== "borrow";
              return (
                <TransactionRow
                  key={item.transaction.id}
                  item={item}
                  locale={locale}
                  currency={currency}
                  t={t}
                  action={
                    deletable ? (
                      <ConfirmAction
                        id={item.transaction.id}
                        action={deleteTransactionAction}
                        confirmKey="transactions.deleteConfirm"
                        className="px-2"
                      >
                        {t("common.delete")}
                      </ConfirmAction>
                    ) : null
                  }
                />
              );
            })}
          </div>
        )}
      </SectionCard>
    </>
  );
}
