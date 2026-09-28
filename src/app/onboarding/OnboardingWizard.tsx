"use client";

import { useRef, useState, useTransition } from "react";
import {
  completeOnboardingAction,
  onboardingCreateAccountAction,
  onboardingCreateCategoryAction,
  type CreatedAccount,
  type CreatedCategory,
} from "./actions";
import { Button } from "@/components/ui/Button";
import { SelectField, TextField } from "@/components/ui/fields";
import { Alert } from "@/components/ui/Alert";
import { useI18n } from "@/lib/i18n/provider";
import { BANK_KEYS } from "@/lib/banks";

export function OnboardingWizard() {
  const { t } = useI18n();
  const [step, setStep] = useState<1 | 2>(1);
  const [accounts, setAccounts] = useState<CreatedAccount[]>([]);
  const [categories, setCategories] = useState<CreatedCategory[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  const bankOptions = BANK_KEYS.map((k) => ({ value: k, label: t(`banks.${k}`) }));

  return (
    <div className="mx-auto w-full max-w-2xl px-4 py-8">
      <header className="mb-6">
        <div className="flex items-baseline gap-2">
          <span className="text-xl font-bold text-[color:var(--color-primary)]">{t("app.name")}</span>
        </div>
        <h1 className="mt-4 text-2xl font-semibold">{t("onboarding.title")}</h1>
        <p className="mt-1 text-sm text-[color:var(--color-muted)]">{t("onboarding.subtitle")}</p>
        <p className="mt-2 text-xs font-medium text-[color:var(--color-primary)]">
          {t("onboarding.step", { n: step })}
        </p>
      </header>

      {error && (
        <div className="mb-4">
          <Alert tone="error">{t(error)}</Alert>
        </div>
      )}

      {step === 1 && (
        <section className="card p-5">
          <h2 className="text-lg font-semibold">{t("onboarding.accountsTitle")}</h2>
          <p className="mt-1 text-sm text-[color:var(--color-muted)]">{t("onboarding.accountsDesc")}</p>
          <p className="mt-1 text-xs text-[color:var(--color-muted)]">{t("onboarding.examplesAccounts")}</p>

          <AccountForm
            bankOptions={bankOptions}
            pending={pending}
            onSubmit={(fd) =>
              startTransition(async () => {
                setError(null);
                const res = await onboardingCreateAccountAction(null, fd);
                if (res.ok && res.data) setAccounts((a) => [...a, res.data as CreatedAccount]);
                else if (!res.ok) setError(res.error);
              })
            }
          />

          <div className="mt-5">
            <h3 className="text-sm font-semibold">{t("onboarding.accountsAdded")}</h3>
            {accounts.length === 0 ? (
              <p className="mt-2 text-sm text-[color:var(--color-muted)]">
                {t("onboarding.emptyAccounts")}
              </p>
            ) : (
              <ul className="mt-2 space-y-2">
                {accounts.map((a) => (
                  <li
                    key={a.id}
                    className="flex items-center justify-between rounded-md border border-[color:var(--color-border)] px-3 py-2 text-sm"
                  >
                    <span className="font-medium">{a.name}</span>
                    <span className="badge">{t(`accountTypes.${a.type}`)}</span>
                  </li>
                ))}
              </ul>
            )}
          </div>

          <div className="mt-6 flex justify-end">
            <Button
              onClick={() => {
                if (accounts.length === 0) {
                  setError("onboarding.atLeastOneAccount");
                  return;
                }
                setError(null);
                setStep(2);
              }}
            >
              {t("onboarding.next")}
            </Button>
          </div>
        </section>
      )}

      {step === 2 && (
        <section className="card p-5">
          <h2 className="text-lg font-semibold">{t("onboarding.categoriesTitle")}</h2>
          <p className="mt-1 text-sm text-[color:var(--color-muted)]">
            {t("onboarding.categoriesDesc")}
          </p>
          <p className="mt-1 text-xs text-[color:var(--color-muted)]">
            {t("onboarding.examplesCategories")}
          </p>

          <CategoryForm
            pending={pending}
            onSubmit={(fd) =>
              startTransition(async () => {
                setError(null);
                const res = await onboardingCreateCategoryAction(null, fd);
                if (res.ok && res.data) setCategories((c) => [...c, res.data as CreatedCategory]);
                else if (!res.ok) setError(res.error);
              })
            }
          />

          <div className="mt-5">
            <h3 className="text-sm font-semibold">{t("onboarding.categoriesAdded")}</h3>
            {categories.length === 0 ? (
              <p className="mt-2 text-sm text-[color:var(--color-muted)]">
                {t("onboarding.emptyCategories")}
              </p>
            ) : (
              <ul className="mt-2 flex flex-wrap gap-2">
                {categories.map((c) => (
                  <li key={c.id} className="badge">
                    {c.name}
                  </li>
                ))}
              </ul>
            )}
          </div>

          <div className="mt-6 flex items-center justify-between">
            <Button variant="ghost" onClick={() => setStep(1)}>
              {t("common.back")}
            </Button>
            <Button
              onClick={() =>
                startTransition(async () => {
                  setError(null);
                  const res = await completeOnboardingAction();
                  if (!res.ok) setError(res.error);
                })
              }
              disabled={pending}
            >
              {t("onboarding.finishSetup")}
            </Button>
          </div>
        </section>
      )}
    </div>
  );
}

function AccountForm({
  bankOptions,
  onSubmit,
  pending,
}: {
  bankOptions: { value: string; label: string }[];
  onSubmit: (fd: FormData) => void;
  pending: boolean;
}) {
  const { t } = useI18n();
  const formRef = useRef<HTMLFormElement>(null);
  const [type, setType] = useState<"debit" | "credit">("debit");

  return (
    <form
      ref={formRef}
      onSubmit={(e) => {
        e.preventDefault();
        onSubmit(new FormData(e.currentTarget));
        formRef.current?.reset();
        setType("debit");
      }}
      className="mt-4 space-y-4"
    >
      <div className="grid gap-4 sm:grid-cols-2">
        <TextField label={t("accounts.name")} name="name" required maxLength={60} />
        <SelectField
          label={t("accounts.type")}
          name="type"
          value={type}
          onChange={(e) => setType(e.target.value as "debit" | "credit")}
          options={[
            { value: "debit", label: t("accountTypes.debit") },
            { value: "credit", label: t("accountTypes.credit") },
          ]}
        />
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <SelectField
          label={t("accounts.bankOptional")}
          name="bank"
          placeholder={t("common.none")}
          options={bankOptions}
        />
        <TextField
          label={type === "credit" ? t("accounts.openingOutstanding") : t("accounts.openingBalance")}
          name="openingBalance"
          inputMode="decimal"
          placeholder="0.000"
          defaultValue="0"
          hint={
            type === "credit"
              ? t("accounts.openingOutstandingHint")
              : t("accounts.openingBalanceHint")
          }
        />
      </div>
      <Button type="submit" variant="secondary" disabled={pending}>
        {t("onboarding.addAccount")}
      </Button>
    </form>
  );
}

function CategoryForm({
  onSubmit,
  pending,
}: {
  onSubmit: (fd: FormData) => void;
  pending: boolean;
}) {
  const { t } = useI18n();
  const formRef = useRef<HTMLFormElement>(null);

  return (
    <form
      ref={formRef}
      onSubmit={(e) => {
        e.preventDefault();
        onSubmit(new FormData(e.currentTarget));
        formRef.current?.reset();
      }}
      className="mt-4 space-y-4"
    >
      <div className="grid gap-4 sm:grid-cols-2">
        <TextField label={t("categories.name")} name="name" required maxLength={60} />
        <SelectField
          label={t("categories.kind")}
          name="kind"
          defaultValue="expense"
          options={[
            { value: "expense", label: t("categories.expense") },
            { value: "income", label: t("categories.income") },
            { value: "both", label: t("categories.both") },
          ]}
        />
      </div>
      <Button type="submit" variant="secondary" disabled={pending}>
        {t("onboarding.addCategory")}
      </Button>
    </form>
  );
}
