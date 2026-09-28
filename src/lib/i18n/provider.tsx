"use client";

import { createContext, useContext, useMemo, type ReactNode } from "react";
import { dirForLocale, type AppLocale } from "./config";
import { getDictionary } from "./dictionaries";
import { createTranslator, type TFunction } from "./translate";

interface I18nContextValue {
  locale: AppLocale;
  dir: "rtl" | "ltr";
  t: TFunction;
}

const I18nContext = createContext<I18nContextValue | null>(null);

export function I18nProvider({ locale, children }: { locale: AppLocale; children: ReactNode }) {
  const value = useMemo<I18nContextValue>(() => {
    const dict = getDictionary(locale);
    return { locale, dir: dirForLocale(locale), t: createTranslator(dict) };
  }, [locale]);
  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>;
}

export function useI18n(): I18nContextValue {
  const ctx = useContext(I18nContext);
  if (!ctx) throw new Error("useI18n must be used within I18nProvider");
  return ctx;
}
