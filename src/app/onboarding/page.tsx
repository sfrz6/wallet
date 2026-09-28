import { redirect } from "next/navigation";
import { requireVerifiedUser } from "@/lib/auth/current-user";
import { OnboardingWizard } from "./OnboardingWizard";

export default async function OnboardingPage() {
  const user = await requireVerifiedUser();
  if (user.onboardingCompletedAt) redirect("/dashboard");
  return <OnboardingWizard />;
}
