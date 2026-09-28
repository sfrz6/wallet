import Link from "next/link";
import { getDb } from "@/db";
import { requireOnboardedUser } from "@/lib/auth/current-user";
import { getI18n } from "@/lib/i18n/server";
import { todayIso, monthRange } from "@/lib/date";
import { getDashboardSummary } from "@/domain/reports";
import { getAccountsWithBalances } from "@/domain/accounts";
import { PageHeader, SectionCard, StatCard, EmptyState } from "@/components/ui/layout";
import { AmountText } from "@/components/AmountText";
import { AddTransactionButton } from "@/components/app/AddTransactionButton";
import { TransactionRow } from "@/components/app/TransactionRow";
import { BankBadge } from "@/components/app/BankBadge";

export default async function DashboardPage() {
  const user = await requireOnboardedUser();
  const { locale, t } = await getI18n();
  const currency = t("common.currency");
  const db = getDb();
  const range = monthRange(todayIso());

  const [summary, balances] = await Promise.all([
    getDashboardSummary(db, user.id, range),
    getAccountsWithBalances(db, user.id),
  ]);

  const maxCat = summary.spendingByCategory.reduce(
    (m, c) => (c.amountMinor > m ? c.amountMinor : m),
    0n,
  );

  return (
    <>
      <PageHeader
        title={t("dashboard.title")}
        subtitle={t("dashboard.welcome", { name: user.usernameDisplay })}
        action={<AddTransactionButton className="hidden sm:inline-flex" />}
      />

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <StatCard label={t("dashboard.totalCash")}>
          <AmountText minor={summary.totalDebitCashMinor} locale={locale} currency={currency} />
        </StatCard>
        <StatCard label={t("dashboard.creditOutstanding")}>
          <AmountText
            minor={summary.totalCreditOutstandingMinor}
            locale={locale}
            currency={currency}
            tone={summary.totalCreditOutstandingMinor > 0n ? "negative" : "neutral"}
          />
        </StatCard>
        <StatCard label={t("dashboard.spendingThisMonth")}>
          <AmountText minor={summary.spendingThisMonthMinor} locale={locale} currency={currency} />
        </StatCard>
        <StatCard label={t("dashboard.incomeThisMonth")}>
          <AmountText minor={summary.incomeThisMonthMinor} locale={locale} currency={currency} />
        </StatCard>
      </div>

      <div className="mt-3 grid grid-cols-2 gap-3 lg:grid-cols-4">
        <StatCard label={t("dashboard.netWorth")}>
          <AmountText
            minor={summary.netWorthMinor}
            locale={locale}
            currency={currency}
            tone="auto"
          />
        </StatCard>
        <StatCard label={t("dashboard.owedToYou")}>
          <AmountText minor={summary.owedToUserMinor} locale={locale} currency={currency} />
        </StatCard>
        <StatCard label={t("dashboard.youOwe")}>
          <AmountText
            minor={summary.userOwesMinor}
            locale={locale}
            currency={currency}
            tone={summary.userOwesMinor > 0n ? "negative" : "neutral"}
          />
        </StatCard>
      </div>

      <div className="mt-6 grid gap-4 lg:grid-cols-2">
        <SectionCard
          title={t("dashboard.accounts")}
          action={
            <Link
              href="/accounts"
              className="text-sm font-medium text-[color:var(--color-primary)]"
            >
              {t("common.viewAll")}
            </Link>
          }
        >
          <ul className="divide-y divide-[color:var(--color-border)]">
            {balances.map((b) => (
              <li key={b.account.id} className="flex items-center justify-between gap-3 py-3">
                <div className="flex min-w-0 items-center gap-3">
                  <BankBadge bank={b.account.bank} fallbackName={b.account.name} />
                  <div className="min-w-0">
                    <div className="truncate text-sm font-medium">{b.account.name}</div>
                    <div className="text-xs text-[color:var(--color-muted)]">
                      {t(`accountTypes.${b.account.type}`)}
                    </div>
                  </div>
                </div>
                <AmountText
                  minor={b.balanceMinor}
                  locale={locale}
                  currency={currency}
                  tone={b.account.type === "credit" && b.balanceMinor > 0n ? "negative" : "neutral"}
                  className="text-sm font-semibold"
                />
              </li>
            ))}
          </ul>
        </SectionCard>

        <SectionCard title={t("dashboard.spendingByCategory")}>
          {summary.spendingByCategory.length === 0 ? (
            <p className="py-6 text-center text-sm text-[color:var(--color-muted)]">
              {t("dashboard.noData")}
            </p>
          ) : (
            <ul className="space-y-3">
              {summary.spendingByCategory.slice(0, 6).map((c) => {
                const pct = maxCat > 0n ? Number((c.amountMinor * 100n) / maxCat) : 0;
                return (
                  <li key={c.categoryId ?? "none"}>
                    <div className="mb-1 flex items-center justify-between text-sm">
                      <span className="truncate">
                        {c.categoryName ?? t("transactions.uncategorized")}
                      </span>
                      <AmountText
                        minor={c.amountMinor}
                        locale={locale}
                        currency={currency}
                        className="text-xs font-medium"
                      />
                    </div>
                    <div className="h-2 overflow-hidden rounded-full bg-[color:var(--color-surface-2)]">
                      <div
                        className="h-full rounded-full bg-[color:var(--color-primary)]"
                        style={{ width: `${Math.max(pct, 3)}%` }}
                      />
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </SectionCard>
      </div>

      <div className="mt-4">
        <SectionCard
          title={t("dashboard.recentTransactions")}
          action={
            <Link
              href="/transactions"
              className="text-sm font-medium text-[color:var(--color-primary)]"
            >
              {t("common.viewAll")}
            </Link>
          }
        >
          {summary.recentTransactions.length === 0 ? (
            <EmptyState
              title={t("transactions.empty")}
              description={t("transactions.emptyDesc")}
              action={<AddTransactionButton />}
            />
          ) : (
            <div className="divide-y divide-[color:var(--color-border)]">
              {summary.recentTransactions.map((item) => (
                <TransactionRow
                  key={item.transaction.id}
                  item={item}
                  locale={locale}
                  currency={currency}
                  t={t}
                />
              ))}
            </div>
          )}
        </SectionCard>
      </div>
    </>
  );
}
