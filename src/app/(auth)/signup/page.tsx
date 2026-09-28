import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth/current-user";
import { SignupForm } from "./SignupForm";

export default async function SignupPage() {
  const user = await getCurrentUser();
  if (user) {
    if (!user.emailVerifiedAt) redirect("/verify");
    else if (!user.onboardingCompletedAt) redirect("/onboarding");
    else redirect("/dashboard");
  }
  return <SignupForm />;
}
