import "server-only";
import { cookies } from "next/headers";
import { DEFAULT_LOCALE, LOCALE_COOKIE, dirForLocale, isLocale, type AppLocale } from "./config";
import { getDictionary, type Dictionary } from "./dictionaries";
import { createTranslator, type TFunction } from "./translate";

export async function getLocale(): Promise<AppLocale> {
  const store = await cookies();
  const value = store.get(LOCALE_COOKIE)?.value;
  return isLocale(value) ? value : DEFAULT_LOCALE;
}

export interface ServerI18n {
  locale: AppLocale;
  dir: "rtl" | "ltr";
  dict: Dictionary;
  t: TFunction;
}

export async function getI18n(): Promise<ServerI18n> {
  const locale = await getLocale();
  const dict = getDictionary(locale);
  return {
    locale,
    dir: dirForLocale(locale),
    dict,
    t: createTranslator(dict),
  };
}
