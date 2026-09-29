import { getDb } from "@/db";
import { requireOnboardedUser } from "@/lib/auth/current-user";
import { getI18n } from "@/lib/i18n/server";
import { listAccounts } from "@/domain/accounts";
import { listGoalsWithProgress } from "@/domain/goals";
import { deleteGoalAction } from "../actions";
import { PageHeader, EmptyState } from "@/components/ui/layout";
import { AmountText } from "@/components/AmountText";
import { GoalFormModal } from "@/components/app/GoalFormModal";
import { ConfirmAction } from "@/components/app/ConfirmAction";
import type { AccountLite } from "@/components/app/types";

export default async function GoalsPage() {
  const user = await requireOnboardedUser();
  const { locale, t } = await getI18n();
  const currency = t("common.currency");
  const db = getDb();

  const [goals, accounts] = await Promise.all([
    listGoalsWithProgress(db, user.id),
    listAccounts(db, user.id),
  ]);

  // Goals can be measured against any asset account (debit or committee).
  const debitAccounts: AccountLite[] = accounts
    .filter((a) => a.type !== "credit")
    .map((a) => ({ id: a.id, name: a.name, type: a.type }));

  return (
    <>
      <PageHeader
        title={t("goals.title")}
        action={
          <GoalFormModal mode="create" debitAccounts={debitAccounts} triggerLabel={t("goals.newGoal")} />
        }
      />

      {goals.length === 0 ? (
        <EmptyState
          title={t("goals.empty")}
          description={t("goals.emptyDesc")}
          action={
            <GoalFormModal
              mode="create"
              debitAccounts={debitAccounts}
              triggerLabel={t("goals.newGoal")}
            />
          }
        />
      ) : (
        <div className="grid gap-3 sm:grid-cols-2">
          {goals.map((g) => (
            <div key={g.goal.id} className="card p-4">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <div className="truncate font-medium">{g.goal.name}</div>
                  <div className="text-xs text-[color:var(--color-muted)]">
                    {g.accountName ?? t("goals.allCash")}
                  </div>
                </div>
                {g.completed ? (
                  <span className="badge badge-positive">{t("goals.completed")}</span>
                ) : (
                  <span className="badge">{g.progressPct}%</span>
                )}
              </div>

              <div className="mt-3 h-2.5 overflow-hidden rounded-full bg-[color:var(--color-surface-2)]">
                <div
                  className="h-full rounded-full transition-[width]"
                  style={{
                    width: `${Math.max(g.progressPct, 2)}%`,
                    backgroundColor: g.completed
                      ? "var(--color-positive)"
                      : "var(--color-primary)",
                  }}
                />
              </div>

              <div className="mt-3 flex items-end justify-between">
                <div className="text-sm">
                  <AmountText
                    minor={g.currentMinor}
                    locale={locale}
                    currency={currency}
                    className="font-semibold"
                  />
                  <span className="text-[color:var(--color-muted)]">
                    {" / "}
                    <AmountText minor={g.targetMinor} locale={locale} currency={currency} />
                  </span>
                </div>
                {!g.completed && (
                  <div className="text-xs text-[color:var(--color-muted)]">
                    {t("goals.remaining")}:{" "}
                    <AmountText minor={g.remainingMinor} locale={locale} currency={currency} />
                  </div>
                )}
              </div>

              <div className="mt-3 flex items-center justify-end gap-1">
                <GoalFormModal
                  mode="edit"
                  debitAccounts={debitAccounts}
                  goal={{
                    id: g.goal.id,
                    name: g.goal.name,
                    targetAmount: g.goal.targetAmount,
                    accountId: g.goal.accountId,
                  }}
                  triggerLabel={t("common.edit")}
                  triggerVariant="ghost"
                  triggerClassName="text-sm"
                />
                <ConfirmAction
                  id={g.goal.id}
                  action={deleteGoalAction}
                  confirmKey="goals.deleteConfirm"
                >
                  {t("common.delete")}
                </ConfirmAction>
              </div>
            </div>
          ))}
        </div>
      )}
    </>
  );
}
