import { and, eq } from "drizzle-orm";
import { categories, type Category, type CategoryKind } from "@/db/schema";
import type { DbExecutor } from "@/db/types";
import { forbidden, notFound, validation } from "./errors";

export interface CreateCategoryInput {
  name: string;
  kind: CategoryKind;
}

export async function assertCategory(
  db: DbExecutor,
  userId: string,
  categoryId: string,
): Promise<Category> {
  const rows = await db
    .select()
    .from(categories)
    .where(and(eq(categories.id, categoryId), eq(categories.userId, userId)))
    .limit(1);
  const category = rows[0];
  if (!category) throw notFound("errors.category_not_found");
  return category;
}

export async function createCategory(
  db: DbExecutor,
  userId: string,
  input: CreateCategoryInput,
): Promise<Category> {
  const name = input.name.trim();
  if (name.length === 0) throw validation("errors.category_name_required");
  const rows = await db
    .insert(categories)
    .values({ userId, name, kind: input.kind })
    .returning();
  const created = rows[0];
  if (!created) throw validation("errors.category_create_failed");
  return created;
}

export async function listCategories(
  db: DbExecutor,
  userId: string,
  opts: { includeArchived?: boolean; kind?: CategoryKind } = {},
): Promise<Category[]> {
  const conditions = [eq(categories.userId, userId)];
  if (!opts.includeArchived) conditions.push(eq(categories.isArchived, false));
  const rows = await db
    .select()
    .from(categories)
    .where(and(...conditions))
    .orderBy(categories.name);
  if (!opts.kind) return rows;
  // "both" categories are usable for either expense or income selection.
  return rows.filter((c) => c.kind === opts.kind || c.kind === "both");
}

export async function updateCategory(
  db: DbExecutor,
  userId: string,
  categoryId: string,
  input: { name?: string; kind?: CategoryKind; isArchived?: boolean },
): Promise<Category> {
  await assertCategory(db, userId, categoryId);
  const patch: Partial<typeof categories.$inferInsert> = { updatedAt: new Date() };
  if (input.name !== undefined) {
    const name = input.name.trim();
    if (name.length === 0) throw validation("errors.category_name_required");
    patch.name = name;
  }
  if (input.kind !== undefined) patch.kind = input.kind;
  if (input.isArchived !== undefined) patch.isArchived = input.isArchived;

  const rows = await db
    .update(categories)
    .set(patch)
    .where(and(eq(categories.id, categoryId), eq(categories.userId, userId)))
    .returning();
  const updated = rows[0];
  if (!updated) throw forbidden("errors.category_not_found");
  return updated;
}

/** Archive rather than delete so historical transactions stay valid. */
export async function archiveCategory(
  db: DbExecutor,
  userId: string,
  categoryId: string,
): Promise<Category> {
  return updateCategory(db, userId, categoryId, { isArchived: true });
}
