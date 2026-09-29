import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth/current-user";
import { emailVerificationEnabled, getEnv, isProduction } from "@/lib/env";
import { VerifyForm } from "./VerifyForm";

export default async function VerifyPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  // V1: verification disabled - never show this page.
  if (!emailVerificationEnabled()) {
    redirect(user.onboardingCompletedAt ? "/dashboard" : "/onboarding");
  }
  if (user.emailVerifiedAt) {
    redirect(user.onboardingCompletedAt ? "/dashboard" : "/onboarding");
  }
  const devHint = !isProduction() && getEnv().DEV_EMAIL_FALLBACK === true && !getEnv().RESEND_API_KEY;
  return <VerifyForm email={user.email} devHint={devHint} />;
}
