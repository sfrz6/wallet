import "server-only";
import { cookies } from "next/headers";
import { THEME_COOKIE, isTheme, type Theme } from "./theme";

/** Resolves the stored theme. Returns null when the user has not chosen one, so
 * the layout can defer to the system preference via a no-flash inline script. */
export async function getStoredTheme(): Promise<Theme | null> {
  const store = await cookies();
  const value = store.get(THEME_COOKIE)?.value;
  return isTheme(value) ? value : null;
}
