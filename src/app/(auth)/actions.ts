"use server";

import { redirect } from "next/navigation";
import { cookies } from "next/headers";
import { getDb } from "@/db";
import { authenticate, registerUser } from "@/lib/auth/service";
import { createSession } from "@/lib/auth/session";
import {
  clearSessionCookie,
  getCurrentUser,
  getSessionToken,
  setSessionCookie,
} from "@/lib/auth/current-user";
import { invalidateSessionToken } from "@/lib/auth/session";
import { createVerificationCode, verifyCode } from "@/lib/auth/verification";
import { hitRateLimit } from "@/lib/auth/rate-limit";
import { sendEmail, verificationEmailContent } from "@/lib/email/send";
import { getClientIp } from "@/lib/request";
import { getLocale } from "@/lib/i18n/server";
import { LOCALE_COOKIE } from "@/lib/i18n/config";
import { loginSchema, signupSchema, verifyCodeSchema } from "@/lib/validation/schemas";
import { fail, fieldErrorsFrom, toErrorKey, type ActionResult } from "@/lib/actions/result";
import { ZodError } from "zod";

async function issueVerification(userId: string, email: string): Promise<void> {
  const db = getDb();
  const code = await createVerificationCode(db, userId);
  const locale = await getLocale();
  const content = verificationEmailContent(code, locale);
  await sendEmail({ to: email, ...content });
}

export async function signupAction(
  _prev: ActionResult | null,
  formData: FormData,
): Promise<ActionResult> {
  const locale = await getLocale();
  let redirectTo: string;
  try {
    const parsed = signupSchema.parse({
      username: formData.get("username"),
      email: formData.get("email"),
      password: formData.get("password"),
      confirmPassword: formData.get("confirmPassword"),
      locale,
    });

    const db = getDb();
    const ip = await getClientIp();
    const limit = await hitRateLimit(db, `signup:ip:${ip}`, 10, 3600);
    if (!limit.allowed) return fail("errors.rate_limited");

    const user = await registerUser(db, {
      username: parsed.username,
      email: parsed.email,
      password: parsed.password,
      locale: parsed.locale,
    });

    await issueVerification(user.id, user.email);

    const session = await createSession(db, user.id);
    await setSessionCookie(session.token, session.expiresAt);
    redirectTo = "/verify";
  } catch (e) {
    if (e instanceof ZodError) return fail("errors.invalid_input", fieldErrorsFrom(e));
    return fail(toErrorKey(e));
  }
  redirect(redirectTo);
}

export async function loginAction(
  _prev: ActionResult | null,
  formData: FormData,
): Promise<ActionResult> {
  let redirectTo: string;
  try {
    const parsed = loginSchema.parse({
      identifier: formData.get("identifier"),
      password: formData.get("password"),
    });

    const db = getDb();
    const ip = await getClientIp();
    const ipLimit = await hitRateLimit(db, `login:ip:${ip}`, 30, 900);
    const idLimit = await hitRateLimit(
      db,
      `login:id:${parsed.identifier.toLowerCase()}`,
      10,
      900,
    );
    if (!ipLimit.allowed || !idLimit.allowed) return fail("errors.rate_limited");

    const user = await authenticate(db, parsed.identifier, parsed.password);
    if (!user) return fail("errors.invalid_credentials");

    const session = await createSession(db, user.id);
    await setSessionCookie(session.token, session.expiresAt);
    const store = await cookies();
    store.set(LOCALE_COOKIE, user.locale, { path: "/", maxAge: 60 * 60 * 24 * 365 });

    if (!user.emailVerifiedAt) {
      await issueVerification(user.id, user.email);
      redirectTo = "/verify";
    } else if (!user.onboardingCompletedAt) {
      redirectTo = "/onboarding";
    } else {
      redirectTo = "/dashboard";
    }
  } catch (e) {
    if (e instanceof ZodError) return fail("errors.invalid_input", fieldErrorsFrom(e));
    return fail(toErrorKey(e));
  }
  redirect(redirectTo);
}

export async function verifyAction(
  _prev: ActionResult | null,
  formData: FormData,
): Promise<ActionResult> {
  let redirectTo: string;
  try {
    const user = await getCurrentUser();
    if (!user) return fail("errors.session_expired");
    if (user.emailVerifiedAt) {
      redirect(user.onboardingCompletedAt ? "/dashboard" : "/onboarding");
    }

    const parsed = verifyCodeSchema.parse({ code: formData.get("code") });
    const db = getDb();
    const limit = await hitRateLimit(db, `verify:user:${user.id}`, 10, 600);
    if (!limit.allowed) return fail("errors.rate_limited");

    const result = await verifyCode(db, user.id, parsed.code);
    if (!result.ok) {
      const map: Record<string, string> = {
        invalid: "errors.invalid_code",
        expired: "errors.code_expired",
        too_many: "errors.too_many_attempts",
        no_code: "errors.no_code",
      };
      return fail(map[result.reason] ?? "errors.invalid_code");
    }
    redirectTo = "/onboarding";
  } catch (e) {
    if (e instanceof ZodError) return fail("errors.invalid_code");
    return fail(toErrorKey(e));
  }
  redirect(redirectTo);
}

export async function resendCodeAction(): Promise<ActionResult> {
  try {
    const user = await getCurrentUser();
    if (!user) return fail("errors.session_expired");
    if (user.emailVerifiedAt) return { ok: true };
    const db = getDb();
    const limit = await hitRateLimit(db, `resend:user:${user.id}`, 4, 900);
    if (!limit.allowed) return fail("errors.rate_limited");
    await issueVerification(user.id, user.email);
    return { ok: true };
  } catch (e) {
    return fail(toErrorKey(e));
  }
}

export async function logoutAction(): Promise<void> {
  const token = await getSessionToken();
  if (token) {
    await invalidateSessionToken(getDb(), token);
  }
  await clearSessionCookie();
  redirect("/login");
}
