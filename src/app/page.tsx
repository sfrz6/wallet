import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth/current-user";
import { emailVerificationEnabled } from "@/lib/env";

export default async function Home() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  if (emailVerificationEnabled() && !user.emailVerifiedAt) redirect("/verify");
  if (!user.onboardingCompletedAt) redirect("/onboarding");
  redirect("/dashboard");
}
