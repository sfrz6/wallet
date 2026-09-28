"use client";

import { createContext, useCallback, useContext, useState, type ReactNode } from "react";
import { Modal } from "@/components/ui/Modal";
import { useI18n } from "@/lib/i18n/provider";
import { TransactionForm } from "./TransactionForm";
import type { AccountLite, CategoryLite, TxKind } from "./types";

interface QuickAddContextValue {
  open: (type?: TxKind) => void;
}

const QuickAddContext = createContext<QuickAddContextValue | null>(null);

export function QuickAddProvider({
  accounts,
  categories,
  children,
}: {
  accounts: AccountLite[];
  categories: CategoryLite[];
  children: ReactNode;
}) {
  const { t } = useI18n();
  const [isOpen, setIsOpen] = useState(false);
  const [initialType, setInitialType] = useState<TxKind | undefined>(undefined);

  const open = useCallback((type?: TxKind) => {
    setInitialType(type);
    setIsOpen(true);
  }, []);

  const close = useCallback(() => setIsOpen(false), []);

  return (
    <QuickAddContext.Provider value={{ open }}>
      {children}
      <Modal open={isOpen} onClose={close} title={t("transactions.add")}>
        {isOpen && (
          <TransactionForm
            accounts={accounts}
            categories={categories}
            initialType={initialType}
            onDone={close}
          />
        )}
      </Modal>
    </QuickAddContext.Provider>
  );
}

export function useQuickAdd(): QuickAddContextValue {
  const ctx = useContext(QuickAddContext);
  if (!ctx) throw new Error("useQuickAdd must be used within QuickAddProvider");
  return ctx;
}
