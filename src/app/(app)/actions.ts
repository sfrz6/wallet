"use server";

import { revalidatePath } from "next/cache";
import { ZodError } from "zod";
import { getDb } from "@/db";
import { requireOnboardedUser } from "@/lib/auth/current-user";
import { getSessionToken } from "@/lib/auth/current-user";
import { invalidateUserSessions } from "@/lib/auth/session";
import { changePassword } from "@/lib/auth/service";
import {
  archiveAccount,
  createAccount,
  updateAccount,
} from "@/domain/accounts";
import { archiveCategory, createCategory, updateCategory } from "@/domain/categories";
import {
  createCreditCardPayment,
  createExpense,
  createIncome,
  createTransfer,
  deleteTransaction,
} from "@/domain/transactions";
import { createBorrow, createLoanGiven, deleteDebt, recordRepayment } from "@/domain/loans";
import { createGoal, deleteGoal, updateGoal } from "@/domain/goals";
import { parseAmountToMinor } from "@/lib/money";
import { todayIso } from "@/lib/date";
import { fail, fieldErrorsFrom, ok, toErrorKey, type ActionResult } from "@/lib/actions/result";
import {
  borrowSchema,
  changePasswordSchema,
  createAccountSchema,
  createCategorySchema,
  creditCardPaymentSchema,
  expenseSchema,
  incomeSchema,
  lendSchema,
  repaymentSchema,
  transferSchema,
  updateAccountSchema,
  updateCategorySchema,
  createGoalSchema,
  updateGoalSchema,
} from "@/lib/validation/schemas";

function revalidateFinancial() {
  revalidatePath("/dashboard");
  revalidatePath("/accounts");
  revalidatePath("/transactions");
  revalidatePath("/debts");
  revalidatePath("/reports");
  revalidatePath("/categories");
  revalidatePath("/goals");
}

function str(formData: FormData, key: string): string | undefined {
  const v = formData.get(key);
  return typeof v === "string" && v.length > 0 ? v : undefined;
}

// ------------------------------- Accounts ----------------------------------

export async function createAccountAction(
  _prev: ActionResult | null,
  formData: FormData,
): Promise<ActionResult> {
  try {
    const user = await requireOnboardedUser();
    const parsed = createAccountSchema.parse({
      name: formData.get("name"),
      type: formData.get("type"),
      bank: str(formData, "bank") ?? null,
      openingBalance: str(formData, "openingBalance") ?? "0",
      creditLimit: str(formData, "creditLimit") ?? "",
    });
    await createAccount(getDb(), user.id, {
      name: parsed.name,
      type: parsed.type,
      bank: parsed.bank ?? null,
      openingBalanceMinor: parseAmountToMinor(parsed.openingBalance),
      creditLimitMinor: parsed.creditLimit ? parseAmountToMinor(parsed.creditLimit) : null,
    });
    revalidateFinancial();
    return ok();
  } catch (e) {
    if (e instanceof ZodError) return fail("errors.invalid_input", fieldErrorsFrom(e));
    return fail(toErrorKey(e));
  }
}

export async function updateAccountAction(
  _prev: ActionResult | null,
  formData: FormData,
): Promise<ActionResult> {
  try {
    const user = await requireOnboardedUser();
    const parsed = updateAccountSchema.parse({
      id: formData.get("id"),
      name: str(formData, "name"),
      bank: str(formData, "bank") ?? null,
      creditLimit: str(formData, "creditLimit") ?? "",
      openingBalance: str(formData, "openingBalance"),
    });
    await updateAccount(getDb(), user.id, parsed.id, {
      name: parsed.name,
      bank: parsed.bank ?? null,
      creditLimitMinor: parsed.creditLimit ? parseAmountToMinor(parsed.creditLimit) : null,
      openingBalanceMinor:
        parsed.openingBalance !== undefined ? parseAmountToMinor(parsed.openingBalance) : undefined,
    });
    revalidateFinancial();
    return ok();
  } catch (e) {
    if (e instanceof ZodError) return fail("errors.invalid_input", fieldErrorsFrom(e));
    return fail(toErrorKey(e));
  }
}

export async function archiveAccountAction(id: string): Promise<ActionResult> {
  try {
    const user = await requireOnboardedUser();
    await archiveAccount(getDb(), user.id, id);
    revalidateFinancial();
    return ok();
  } catch (e) {
    return fail(toErrorKey(e));
  }
}

// ------------------------------ Categories ---------------------------------

export async function createCategoryAction(
  _prev: ActionResult | null,
  formData: FormData,
): Promise<ActionResult> {
  try {
    const user = await requireOnboardedUser();
    const parsed = createCategorySchema.parse({
      name: formData.get("name"),
      kind: formData.get("kind"),
    });
    await createCategory(getDb(), user.id, parsed);
    revalidateFinancial();
    return ok();
  } catch (e) {
    if (e instanceof ZodError) return fail("errors.invalid_input", fieldErrorsFrom(e));
    return fail(toErrorKey(e));
  }
}

export async function updateCategoryAction(
  _prev: ActionResult | null,
  formData: FormData,
): Promise<ActionResult> {
  try {
    const user = await requireOnboardedUser();
    const parsed = updateCategorySchema.parse({
      id: formData.get("id"),
      name: str(formData, "name"),
      kind: str(formData, "kind"),
    });
    await updateCategory(getDb(), user.id, parsed.id, {
      name: parsed.name,
      kind: parsed.kind,
    });
    revalidateFinancial();
    return ok();
  } catch (e) {
    if (e instanceof ZodError) return fail("errors.invalid_input", fieldErrorsFrom(e));
    return fail(toErrorKey(e));
  }
}

export async function archiveCategoryAction(id: string): Promise<ActionResult> {
  try {
    const user = await requireOnboardedUser();
    await archiveCategory(getDb(), user.id, id);
    revalidateFinancial();
    return ok();
  } catch (e) {
    return fail(toErrorKey(e));
  }
}

// ----------------------------- Transactions --------------------------------

export async function addTransactionAction(
  _prev: ActionResult | null,
  formData: FormData,
): Promise<ActionResult> {
  try {
    const user = await requireOnboardedUser();
    const db = getDb();
    const userId = user.id;
    const kind = formData.get("kind");
    const occurredOn = str(formData, "occurredOn") ?? todayIso();
    const note = str(formData, "note") ?? null;
    const clientRequestId = str(formData, "clientRequestId");

    switch (kind) {
      case "expense": {
        const p = expenseSchema.parse({
          accountId: formData.get("accountId"),
          categoryId: formData.get("categoryId"),
          amount: formData.get("amount"),
          occurredOn,
          note: note ?? "",
          clientRequestId,
        });
        await createExpense(db, userId, {
          accountId: p.accountId,
          categoryId: p.categoryId,
          amountMinor: parseAmountToMinor(p.amount),
          occurredOn: p.occurredOn,
          note,
          clientRequestId,
        });
        break;
      }
      case "income": {
        const p = incomeSchema.parse({
          accountId: formData.get("accountId"),
          categoryId: str(formData, "categoryId") ?? "",
          amount: formData.get("amount"),
          occurredOn,
          note: note ?? "",
          clientRequestId,
        });
        await createIncome(db, userId, {
          accountId: p.accountId,
          categoryId: p.categoryId ? p.categoryId : null,
          amountMinor: parseAmountToMinor(p.amount),
          occurredOn: p.occurredOn,
          note,
          clientRequestId,
        });
        break;
      }
      case "transfer": {
        const p = transferSchema.parse({
          fromAccountId: formData.get("fromAccountId"),
          toAccountId: formData.get("toAccountId"),
          amount: formData.get("amount"),
          occurredOn,
          note: note ?? "",
          clientRequestId,
        });
        await createTransfer(db, userId, {
          fromAccountId: p.fromAccountId,
          toAccountId: p.toAccountId,
          amountMinor: parseAmountToMinor(p.amount),
          occurredOn: p.occurredOn,
          note,
          clientRequestId,
        });
        break;
      }
      case "credit_card_payment": {
        const p = creditCardPaymentSchema.parse({
          fromAccountId: formData.get("fromAccountId"),
          creditAccountId: formData.get("creditAccountId"),
          amount: formData.get("amount"),
          occurredOn,
          note: note ?? "",
          clientRequestId,
        });
        await createCreditCardPayment(db, userId, {
          fromAccountId: p.fromAccountId,
          creditAccountId: p.creditAccountId,
          amountMinor: parseAmountToMinor(p.amount),
          occurredOn: p.occurredOn,
          note,
          clientRequestId,
        });
        break;
      }
      case "lend": {
        const p = lendSchema.parse({
          personName: formData.get("personName"),
          fromAccountId: formData.get("fromAccountId"),
          amount: formData.get("amount"),
          occurredOn,
          dueDate: str(formData, "dueDate") ?? "",
          note: note ?? "",
          clientRequestId,
        });
        await createLoanGiven(db, userId, {
          personName: p.personName,
          fromAccountId: p.fromAccountId,
          amountMinor: parseAmountToMinor(p.amount),
          occurredOn: p.occurredOn,
          dueDate: p.dueDate ? p.dueDate : null,
          note,
          clientRequestId,
        });
        break;
      }
      case "borrow": {
        const p = borrowSchema.parse({
          personName: formData.get("personName"),
          toAccountId: formData.get("toAccountId"),
          amount: formData.get("amount"),
          occurredOn,
          dueDate: str(formData, "dueDate") ?? "",
          note: note ?? "",
          clientRequestId,
        });
        await createBorrow(db, userId, {
          personName: p.personName,
          toAccountId: p.toAccountId,
          amountMinor: parseAmountToMinor(p.amount),
          occurredOn: p.occurredOn,
          dueDate: p.dueDate ? p.dueDate : null,
          note,
          clientRequestId,
        });
        break;
      }
      default:
        return fail("errors.invalid_input");
    }

    revalidateFinancial();
    return ok();
  } catch (e) {
    if (e instanceof ZodError) return fail("errors.invalid_input", fieldErrorsFrom(e));
    return fail(toErrorKey(e));
  }
}

export async function deleteTransactionAction(id: string): Promise<ActionResult> {
  try {
    const user = await requireOnboardedUser();
    await deleteTransaction(getDb(), user.id, id);
    revalidateFinancial();
    return ok();
  } catch (e) {
    return fail(toErrorKey(e));
  }
}

// -------------------------------- Debts ------------------------------------

export async function addRepaymentAction(
  _prev: ActionResult | null,
  formData: FormData,
): Promise<ActionResult> {
  try {
    const user = await requireOnboardedUser();
    const parsed = repaymentSchema.parse({
      debtId: formData.get("debtId"),
      accountId: formData.get("accountId"),
      amount: formData.get("amount"),
      occurredOn: str(formData, "occurredOn") ?? todayIso(),
      note: str(formData, "note") ?? "",
      clientRequestId: str(formData, "clientRequestId"),
    });
    await recordRepayment(getDb(), user.id, {
      debtId: parsed.debtId,
      accountId: parsed.accountId,
      amountMinor: parseAmountToMinor(parsed.amount),
      occurredOn: parsed.occurredOn,
      note: parsed.note || null,
      clientRequestId: parsed.clientRequestId,
    });
    revalidateFinancial();
    return ok();
  } catch (e) {
    if (e instanceof ZodError) return fail("errors.invalid_input", fieldErrorsFrom(e));
    return fail(toErrorKey(e));
  }
}

export async function deleteDebtAction(id: string): Promise<ActionResult> {
  try {
    const user = await requireOnboardedUser();
    await deleteDebt(getDb(), user.id, id);
    revalidateFinancial();
    return ok();
  } catch (e) {
    return fail(toErrorKey(e));
  }
}

// -------------------------------- Goals ------------------------------------

export async function createGoalAction(
  _prev: ActionResult | null,
  formData: FormData,
): Promise<ActionResult> {
  try {
    const user = await requireOnboardedUser();
    const parsed = createGoalSchema.parse({
      name: formData.get("name"),
      targetAmount: formData.get("targetAmount"),
      accountId: str(formData, "accountId") ?? "",
    });
    await createGoal(getDb(), user.id, {
      name: parsed.name,
      targetAmountMinor: parseAmountToMinor(parsed.targetAmount),
      accountId: parsed.accountId ? parsed.accountId : null,
    });
    revalidatePath("/goals");
    return ok();
  } catch (e) {
    if (e instanceof ZodError) return fail("errors.invalid_input", fieldErrorsFrom(e));
    return fail(toErrorKey(e));
  }
}

export async function updateGoalAction(
  _prev: ActionResult | null,
  formData: FormData,
): Promise<ActionResult> {
  try {
    const user = await requireOnboardedUser();
    const parsed = updateGoalSchema.parse({
      id: formData.get("id"),
      name: str(formData, "name"),
      targetAmount: str(formData, "targetAmount"),
      accountId: str(formData, "accountId") ?? "",
    });
    await updateGoal(getDb(), user.id, parsed.id, {
      name: parsed.name,
      targetAmountMinor: parsed.targetAmount ? parseAmountToMinor(parsed.targetAmount) : undefined,
      accountId: parsed.accountId !== undefined ? (parsed.accountId ? parsed.accountId : null) : undefined,
    });
    revalidatePath("/goals");
    return ok();
  } catch (e) {
    if (e instanceof ZodError) return fail("errors.invalid_input", fieldErrorsFrom(e));
    return fail(toErrorKey(e));
  }
}

export async function deleteGoalAction(id: string): Promise<ActionResult> {
  try {
    const user = await requireOnboardedUser();
    await deleteGoal(getDb(), user.id, id);
    revalidatePath("/goals");
    return ok();
  } catch (e) {
    return fail(toErrorKey(e));
  }
}

// ------------------------------- Settings ----------------------------------

export async function changePasswordAction(
  _prev: ActionResult | null,
  formData: FormData,
): Promise<ActionResult> {
  try {
    const user = await requireOnboardedUser();
    const parsed = changePasswordSchema.parse({
      currentPassword: formData.get("currentPassword"),
      newPassword: formData.get("newPassword"),
      confirmPassword: formData.get("confirmPassword"),
    });
    const db = getDb();
    await changePassword(db, user.id, parsed.currentPassword, parsed.newPassword);
    // Sign out all other sessions after a password change.
    const token = await getSessionToken();
    await invalidateUserSessions(db, user.id, token ?? undefined);
    return ok();
  } catch (e) {
    if (e instanceof ZodError) return fail("errors.invalid_input", fieldErrorsFrom(e));
    return fail(toErrorKey(e));
  }
}
