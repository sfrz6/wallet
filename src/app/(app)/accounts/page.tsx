import Link from "next/link";
import { getDb } from "@/db";
import { requireOnboardedUser } from "@/lib/auth/current-user";
import { getI18n } from "@/lib/i18n/server";
import { getAccountsWithBalances } from "@/domain/accounts";
import { archiveAccountAction } from "../actions";
import { PageHeader, EmptyState } from "@/components/ui/layout";
import { AmountText } from "@/components/AmountText";
import { BankBadge } from "@/components/app/BankBadge";
import { AccountFormModal } from "@/components/app/AccountFormModal";
import { ConfirmAction } from "@/components/app/ConfirmAction";
import { Button } from "@/components/ui/Button";

export default async function AccountsPage({
  searchParams,
}: {
  searchParams: Promise<{ archived?: string }>;
}) {
  const user = await requireOnboardedUser();
  const { locale, t } = await getI18n();
  const currency = t("common.currency");
  const sp = await searchParams;
  const includeArchived = sp.archived === "1";

  const balances = await getAccountsWithBalances(getDb(), user.id, { includeArchived });

  return (
    <>
      <PageHeader
        title={t("accounts.title")}
        action={
          <AccountFormModal
            mode="create"
            trigger={(open) => (
              <Button onClick={open}>{t("accounts.newAccount")}</Button>
            )}
          />
        }
      />

      <div className="mb-4">
        <Link
          href={includeArchived ? "/accounts" : "/accounts?archived=1"}
          className="text-sm font-medium text-[color:var(--color-primary)]"
        >
          {includeArchived ? t("common.all") : t("accounts.showArchived")}
        </Link>
      </div>

      {balances.length === 0 ? (
        <EmptyState
          title={t("accounts.empty")}
          description={t("accounts.emptyDesc")}
          action={
            <AccountFormModal
              mode="create"
              trigger={(open) => <Button onClick={open}>{t("accounts.newAccount")}</Button>}
            />
          }
        />
      ) : (
        <div className="grid gap-3 sm:grid-cols-2">
          {balances.map((b) => (
            <div key={b.account.id} className="card p-4">
              <div className="flex items-start justify-between gap-3">
                <div className="flex min-w-0 items-center gap-3">
                  <BankBadge bank={b.account.bank} fallbackName={b.account.name} size={40} />
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="truncate font-medium">{b.account.name}</span>
                      {b.account.isArchived && (
                        <span className="badge">{t("accounts.archived")}</span>
                      )}
                    </div>
                    <div className="text-xs text-[color:var(--color-muted)]">
                      {t(`accountTypes.${b.account.type}`)}
                      {b.account.bank ? ` · ${t(`banks.${b.account.bank}`)}` : ""}
                    </div>
                  </div>
                </div>
              </div>

              <div className="mt-3 flex items-end justify-between">
                <div>
                  <div className="text-xs text-[color:var(--color-muted)]">
                    {b.account.type === "credit" ? t("accounts.outstanding") : t("accounts.balance")}
                  </div>
                  <AmountText
                    minor={b.balanceMinor}
                    locale={locale}
                    currency={currency}
                    tone={
                      b.account.type === "credit" && b.balanceMinor > 0n ? "negative" : "neutral"
                    }
                    className="text-lg font-semibold"
                  />
                </div>
                <div className="flex items-center gap-1">
                  <Link
                    href={`/transactions?accountId=${b.account.id}`}
                    className="btn btn-ghost text-sm"
                  >
                    {t("accounts.viewTransactions")}
                  </Link>
                  <AccountFormModal
                    mode="edit"
                    account={{
                      id: b.account.id,
                      name: b.account.name,
                      type: b.account.type,
                      bank: b.account.bank,
                      openingBalance: b.account.openingBalance,
                      creditLimit: b.account.creditLimit,
                    }}
                    trigger={(open) => (
                      <button type="button" onClick={open} className="btn btn-ghost text-sm">
                        {t("common.edit")}
                      </button>
                    )}
                  />
                  {!b.account.isArchived && (
                    <ConfirmAction
                      id={b.account.id}
                      action={archiveAccountAction}
                      confirmKey="accounts.archiveConfirm"
                    >
                      {t("common.archive")}
                    </ConfirmAction>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </>
  );
}
