import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth/current-user";
import { emailVerificationEnabled } from "@/lib/env";
import { LoginForm } from "./LoginForm";

export default async function LoginPage() {
  const user = await getCurrentUser();
  if (user) {
    if (emailVerificationEnabled() && !user.emailVerifiedAt) redirect("/verify");
    else if (!user.onboardingCompletedAt) redirect("/onboarding");
    else redirect("/dashboard");
  }
  return <LoginForm />;
}
