import { z } from "zod";
import { BANK_KEYS } from "@/lib/banks";

// A monetary amount as a string, up to three decimal places, greater than zero.
export const positiveAmount = z
  .string()
  .trim()
  .regex(/^\d+(\.\d{1,3})?$/, "errors.amount_positive")
  .refine((v) => Number(v) > 0, "errors.amount_positive");

// A non-negative amount (opening balances may be zero).
export const nonNegativeAmount = z
  .string()
  .trim()
  .regex(/^\d+(\.\d{1,3})?$/, "errors.invalid_input");

export const isoDate = z
  .string()
  .trim()
  .regex(/^\d{4}-\d{2}-\d{2}$/, "errors.invalid_input");

export const optionalNote = z.string().trim().max(500).optional().or(z.literal(""));

export const uuid = z.string().uuid("errors.invalid_input");

export const bankKey = z.enum(BANK_KEYS);

// ------------------------------- Auth --------------------------------------

export const usernameSchema = z
  .string()
  .trim()
  .min(3, "errors.invalid_input")
  .max(30, "errors.invalid_input")
  .regex(/^[a-zA-Z0-9._-]+$/, "errors.invalid_input");

export const emailSchema = z.string().trim().email("errors.invalid_input").max(255);

export const passwordSchema = z.string().min(8, "errors.invalid_input").max(200);

export const signupSchema = z
  .object({
    username: usernameSchema,
    email: emailSchema,
    password: passwordSchema,
    confirmPassword: z.string(),
    locale: z.enum(["ar", "en"]),
  })
  .refine((d) => d.password === d.confirmPassword, {
    path: ["confirmPassword"],
    message: "errors.passwords_no_match",
  });

export const loginSchema = z.object({
  identifier: z.string().trim().min(1, "errors.invalid_input").max(255),
  password: z.string().min(1, "errors.invalid_input"),
});

export const verifyCodeSchema = z.object({
  code: z
    .string()
    .trim()
    .regex(/^\d{6}$/, "errors.invalid_code"),
});

export const changePasswordSchema = z
  .object({
    currentPassword: z.string().min(1, "errors.invalid_input"),
    newPassword: passwordSchema,
    confirmPassword: z.string(),
  })
  .refine((d) => d.newPassword === d.confirmPassword, {
    path: ["confirmPassword"],
    message: "errors.passwords_no_match",
  });

// ----------------------------- Financial -----------------------------------

export const accountTypeSchema = z.enum(["debit", "credit", "jamiya"]);
export const categoryKindSchema = z.enum(["expense", "income", "both"]);

export const createAccountSchema = z.object({
  name: z.string().trim().min(1, "errors.account_name_required").max(60),
  type: accountTypeSchema,
  bank: bankKey.nullable().optional(),
  openingBalance: nonNegativeAmount.default("0"),
  creditLimit: nonNegativeAmount.optional().or(z.literal("")),
});

export const updateAccountSchema = z.object({
  id: uuid,
  name: z.string().trim().min(1, "errors.account_name_required").max(60).optional(),
  bank: bankKey.nullable().optional(),
  creditLimit: nonNegativeAmount.optional().or(z.literal("")),
  openingBalance: nonNegativeAmount.optional(),
  isArchived: z.boolean().optional(),
});

export const createCategorySchema = z.object({
  name: z.string().trim().min(1, "errors.category_name_required").max(60),
  kind: categoryKindSchema,
});

export const updateCategorySchema = z.object({
  id: uuid,
  name: z.string().trim().min(1, "errors.category_name_required").max(60).optional(),
  kind: categoryKindSchema.optional(),
  isArchived: z.boolean().optional(),
});

export const expenseSchema = z.object({
  accountId: uuid,
  categoryId: uuid,
  amount: positiveAmount,
  occurredOn: isoDate,
  note: optionalNote,
  clientRequestId: z.string().max(64).optional(),
});

export const incomeSchema = z.object({
  accountId: uuid,
  categoryId: uuid.optional().or(z.literal("")),
  amount: positiveAmount,
  occurredOn: isoDate,
  note: optionalNote,
  clientRequestId: z.string().max(64).optional(),
});

export const transferSchema = z.object({
  fromAccountId: uuid,
  toAccountId: uuid,
  amount: positiveAmount,
  occurredOn: isoDate,
  note: optionalNote,
  clientRequestId: z.string().max(64).optional(),
});

export const creditCardPaymentSchema = z.object({
  fromAccountId: uuid,
  creditAccountId: uuid,
  amount: positiveAmount,
  occurredOn: isoDate,
  note: optionalNote,
  clientRequestId: z.string().max(64).optional(),
});

export const lendSchema = z.object({
  personName: z.string().trim().min(1, "errors.person_name_required").max(80),
  fromAccountId: uuid,
  amount: positiveAmount,
  occurredOn: isoDate,
  dueDate: isoDate.optional().or(z.literal("")),
  note: optionalNote,
  clientRequestId: z.string().max(64).optional(),
});

export const borrowSchema = z.object({
  personName: z.string().trim().min(1, "errors.person_name_required").max(80),
  toAccountId: uuid,
  amount: positiveAmount,
  occurredOn: isoDate,
  dueDate: isoDate.optional().or(z.literal("")),
  note: optionalNote,
  clientRequestId: z.string().max(64).optional(),
});

export const createGoalSchema = z.object({
  name: z.string().trim().min(1, "errors.goal_name_required").max(80),
  targetAmount: positiveAmount,
  accountId: uuid.optional().or(z.literal("")),
});

export const updateGoalSchema = z.object({
  id: uuid,
  name: z.string().trim().min(1, "errors.goal_name_required").max(80).optional(),
  targetAmount: positiveAmount.optional(),
  accountId: uuid.optional().or(z.literal("")),
});

export const repaymentSchema = z.object({
  debtId: uuid,
  accountId: uuid,
  amount: positiveAmount,
  occurredOn: isoDate,
  note: optionalNote,
  clientRequestId: z.string().max(64).optional(),
});
