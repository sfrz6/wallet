"use server";

import { redirect } from "next/navigation";
import { eq } from "drizzle-orm";
import { ZodError } from "zod";
import { getDb } from "@/db";
import { users } from "@/db/schema";
import { requireVerifiedUser } from "@/lib/auth/current-user";
import { createAccount, listAccounts } from "@/domain/accounts";
import { createCategory } from "@/domain/categories";
import { parseAmountToMinor } from "@/lib/money";
import { createAccountSchema, createCategorySchema } from "@/lib/validation/schemas";
import { fail, fieldErrorsFrom, ok, toErrorKey, type ActionResult } from "@/lib/actions/result";

export interface CreatedAccount {
  id: string;
  name: string;
  type: "debit" | "credit" | "jamiya";
  bank: string | null;
}

export async function onboardingCreateAccountAction(
  _prev: ActionResult<CreatedAccount> | null,
  formData: FormData,
): Promise<ActionResult<CreatedAccount>> {
  try {
    const user = await requireVerifiedUser();
    const parsed = createAccountSchema.parse({
      name: formData.get("name"),
      type: formData.get("type"),
      bank: (formData.get("bank") as string) || null,
      openingBalance: (formData.get("openingBalance") as string) || "0",
      creditLimit: (formData.get("creditLimit") as string) || "",
    });
    const account = await createAccount(getDb(), user.id, {
      name: parsed.name,
      type: parsed.type,
      bank: parsed.bank ?? null,
      openingBalanceMinor: parseAmountToMinor(parsed.openingBalance),
      creditLimitMinor: parsed.creditLimit ? parseAmountToMinor(parsed.creditLimit) : null,
    });
    return ok({ id: account.id, name: account.name, type: account.type, bank: account.bank });
  } catch (e) {
    if (e instanceof ZodError) return fail("errors.invalid_input", fieldErrorsFrom(e));
    return fail(toErrorKey(e));
  }
}

export interface CreatedCategory {
  id: string;
  name: string;
  kind: "expense" | "income" | "both";
}

export async function onboardingCreateCategoryAction(
  _prev: ActionResult<CreatedCategory> | null,
  formData: FormData,
): Promise<ActionResult<CreatedCategory>> {
  try {
    const user = await requireVerifiedUser();
    const parsed = createCategorySchema.parse({
      name: formData.get("name"),
      kind: formData.get("kind"),
    });
    const category = await createCategory(getDb(), user.id, parsed);
    return ok({ id: category.id, name: category.name, kind: category.kind });
  } catch (e) {
    if (e instanceof ZodError) return fail("errors.invalid_input", fieldErrorsFrom(e));
    return fail(toErrorKey(e));
  }
}

export async function completeOnboardingAction(): Promise<ActionResult> {
  let done = false;
  try {
    const user = await requireVerifiedUser();
    const db = getDb();
    const accounts = await listAccounts(db, user.id, { includeArchived: true });
    if (accounts.length === 0) return fail("onboarding.atLeastOneAccount");
    await db
      .update(users)
      .set({ onboardingCompletedAt: new Date(), updatedAt: new Date() })
      .where(eq(users.id, user.id));
    done = true;
  } catch (e) {
    return fail(toErrorKey(e));
  }
  if (done) redirect("/dashboard");
  return ok();
}
