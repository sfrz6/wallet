import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth/current-user";
import { LoginForm } from "./LoginForm";

export default async function LoginPage() {
  const user = await getCurrentUser();
  if (user) {
    if (!user.emailVerifiedAt) redirect("/verify");
    else if (!user.onboardingCompletedAt) redirect("/onboarding");
    else redirect("/dashboard");
  }
  return <LoginForm />;
}
