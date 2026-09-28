import Link from "next/link";
import { getDb } from "@/db";
import { requireOnboardedUser } from "@/lib/auth/current-user";
import { getI18n } from "@/lib/i18n/server";
import { addMonths, monthRange, todayIso } from "@/lib/date";
import {
  debitVsCreditSpending,
  monthlySeries,
  spendingByAccount,
  spendingByCategory,
  totalIncome,
  totalSpending,
  type DateRange,
} from "@/domain/reports";
import { PageHeader, SectionCard, StatCard } from "@/components/ui/layout";
import { AmountText } from "@/components/AmountText";
import { MonthlyTrendChart, CategoryPieChart } from "@/components/app/charts";
import { cn } from "@/lib/cn";

function resolveRange(sp: Record<string, string | undefined>): { range: string; dr: DateRange } {
  const today = todayIso();
  const thisMonth = monthRange(today);
  const range = sp.range ?? "this";
  if (range === "last") {
    return { range, dr: monthRange(addMonths(today, -1)) };
  }
  if (range === "3m") {
    return { range, dr: { from: monthRange(addMonths(today, -2)).from, to: thisMonth.to } };
  }
  if (range === "6m") {
    return { range, dr: { from: monthRange(addMonths(today, -5)).from, to: thisMonth.to } };
  }
  if (range === "custom" && sp.from && sp.to) {
    return { range, dr: { from: sp.from, to: sp.to } };
  }
  return { range: "this", dr: thisMonth };
}

const toMajor = (m: bigint) => Number(m) / 1000;

export default async function ReportsPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | undefined>>;
}) {
  const user = await requireOnboardedUser();
  const { locale, t } = await getI18n();
  const currency = t("common.currency");
  const db = getDb();
  const sp = await searchParams;
  const { range, dr } = resolveRange(sp);

  const [spending, income, byCategory, byAccount, dc, monthly] = await Promise.all([
    totalSpending(db, user.id, dr),
    totalIncome(db, user.id, dr),
    spendingByCategory(db, user.id, dr),
    spendingByAccount(db, user.id, dr),
    debitVsCreditSpending(db, user.id, dr),
    monthlySeries(db, user.id, dr),
  ]);

  const monthlyData = monthly.map((m) => ({
    month: m.month,
    spending: toMajor(m.spendingMinor),
    income: toMajor(m.incomeMinor),
  }));
  const categoryData = byCategory
    .filter((c) => c.amountMinor > 0n)
    .map((c) => ({ name: c.categoryName ?? t("transactions.uncategorized"), value: toMajor(c.amountMinor) }));

  const presets: { key: string; label: string }[] = [
    { key: "this", label: t("reports.thisMonth") },
    { key: "last", label: t("reports.lastMonth") },
    { key: "3m", label: t("reports.last3Months") },
    { key: "6m", label: t("reports.last6Months") },
  ];

  const maxAccount = byAccount.reduce((m, a) => (a.amountMinor > m ? a.amountMinor : m), 0n);
  const dcTotal = dc.debitMinor + dc.creditMinor;

  return (
    <>
      <PageHeader title={t("reports.title")} />

      <div className="mb-4 flex flex-wrap items-center gap-2">
        {presets.map((p) => (
          <Link
            key={p.key}
            href={`/reports?range=${p.key}`}
            className={cn(
              "btn text-sm",
              range === p.key ? "btn-primary" : "btn-secondary",
            )}
          >
            {p.label}
          </Link>
        ))}
        <form method="get" className="flex items-end gap-2">
          <input type="hidden" name="range" value="custom" />
          <input type="date" name="from" defaultValue={sp.from ?? dr.from} className="input w-auto" />
          <input type="date" name="to" defaultValue={sp.to ?? dr.to} className="input w-auto" />
          <button type="submit" className="btn btn-secondary text-sm">
            {t("reports.apply")}
          </button>
        </form>
      </div>

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-3">
        <StatCard label={t("reports.expense")}>
          <AmountText minor={spending} locale={locale} currency={currency} />
        </StatCard>
        <StatCard label={t("reports.income")}>
          <AmountText minor={income} locale={locale} currency={currency} />
        </StatCard>
        <StatCard label={t("reports.total")}>
          <AmountText minor={income - spending} locale={locale} currency={currency} tone="auto" />
        </StatCard>
      </div>

      <div className="mt-4 grid gap-4 lg:grid-cols-2">
        <SectionCard title={t("reports.monthlyTrend")}>
          {monthlyData.length === 0 ? (
            <p className="py-10 text-center text-sm text-[color:var(--color-muted)]">
              {t("reports.noData")}
            </p>
          ) : (
            <MonthlyTrendChart data={monthlyData} />
          )}
        </SectionCard>

        <SectionCard title={t("reports.spendingByCategory")}>
          {categoryData.length === 0 ? (
            <p className="py-10 text-center text-sm text-[color:var(--color-muted)]">
              {t("reports.noData")}
            </p>
          ) : (
            <CategoryPieChart data={categoryData} />
          )}
        </SectionCard>

        <SectionCard title={t("reports.spendingByAccount")}>
          {byAccount.length === 0 ? (
            <p className="py-10 text-center text-sm text-[color:var(--color-muted)]">
              {t("reports.noData")}
            </p>
          ) : (
            <ul className="space-y-3">
              {byAccount.map((a) => {
                const pct = maxAccount > 0n ? Number((a.amountMinor * 100n) / maxAccount) : 0;
                return (
                  <li key={a.accountId}>
                    <div className="mb-1 flex items-center justify-between text-sm">
                      <span className="truncate">{a.accountName}</span>
                      <AmountText
                        minor={a.amountMinor}
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

        <SectionCard title={t("reports.debitVsCredit")}>
          {dcTotal === 0n ? (
            <p className="py-10 text-center text-sm text-[color:var(--color-muted)]">
              {t("reports.noData")}
            </p>
          ) : (
            <div className="space-y-4 py-2">
              <div>
                <div className="mb-1 flex items-center justify-between text-sm">
                  <span>{t("reports.debit")}</span>
                  <AmountText minor={dc.debitMinor} locale={locale} currency={currency} />
                </div>
                <div className="h-2 overflow-hidden rounded-full bg-[color:var(--color-surface-2)]">
                  <div
                    className="h-full rounded-full bg-[color:var(--color-primary)]"
                    style={{ width: `${dcTotal > 0n ? Number((dc.debitMinor * 100n) / dcTotal) : 0}%` }}
                  />
                </div>
              </div>
              <div>
                <div className="mb-1 flex items-center justify-between text-sm">
                  <span>{t("reports.credit")}</span>
                  <AmountText minor={dc.creditMinor} locale={locale} currency={currency} />
                </div>
                <div className="h-2 overflow-hidden rounded-full bg-[color:var(--color-surface-2)]">
                  <div
                    className="h-full rounded-full bg-[color:var(--color-warning)]"
                    style={{ width: `${dcTotal > 0n ? Number((dc.creditMinor * 100n) / dcTotal) : 0}%` }}
                  />
                </div>
              </div>
            </div>
          )}
        </SectionCard>
      </div>
    </>
  );
}
