import Link from "next/link";
import { getDb } from "@/db";
import { requireOnboardedUser } from "@/lib/auth/current-user";
import { getI18n } from "@/lib/i18n/server";
import { listCategories } from "@/domain/categories";
import { archiveCategoryAction } from "../actions";
import { PageHeader, EmptyState } from "@/components/ui/layout";
import { CategoryFormModal } from "@/components/app/CategoryFormModal";
import { ConfirmAction } from "@/components/app/ConfirmAction";

export default async function CategoriesPage({
  searchParams,
}: {
  searchParams: Promise<{ archived?: string }>;
}) {
  const user = await requireOnboardedUser();
  const { t } = await getI18n();
  const sp = await searchParams;
  const includeArchived = sp.archived === "1";

  const categories = await listCategories(getDb(), user.id, { includeArchived });

  const kindLabel = (k: string) =>
    k === "expense"
      ? t("categories.expense")
      : k === "income"
        ? t("categories.income")
        : t("categories.both");

  return (
    <>
      <PageHeader
        title={t("categories.title")}
        action={<CategoryFormModal mode="create" triggerLabel={t("categories.newCategory")} />}
      />

      <div className="mb-4">
        <Link
          href={includeArchived ? "/categories" : "/categories?archived=1"}
          className="text-sm font-medium text-[color:var(--color-primary)]"
        >
          {includeArchived ? t("common.all") : t("categories.showArchived")}
        </Link>
      </div>

      {categories.length === 0 ? (
        <EmptyState
          title={t("categories.empty")}
          description={t("categories.emptyDesc")}
          action={<CategoryFormModal mode="create" triggerLabel={t("categories.newCategory")} />}
        />
      ) : (
        <div className="card divide-y divide-[color:var(--color-border)]">
          {categories.map((c) => (
            <div key={c.id} className="flex items-center justify-between gap-3 px-4 py-3">
              <div className="flex items-center gap-2">
                <span className="font-medium">{c.name}</span>
                <span className="badge">{kindLabel(c.kind)}</span>
                {c.isArchived && <span className="badge">{t("categories.archived")}</span>}
              </div>
              <div className="flex items-center gap-1">
                <CategoryFormModal
                  mode="edit"
                  category={{ id: c.id, name: c.name, kind: c.kind }}
                  triggerLabel={t("common.edit")}
                  triggerVariant="ghost"
                  triggerClassName="text-sm"
                />
                {!c.isArchived && (
                  <ConfirmAction
                    id={c.id}
                    action={archiveCategoryAction}
                    confirmKey="categories.archiveConfirm"
                  >
                    {t("common.archive")}
                  </ConfirmAction>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </>
  );
}
