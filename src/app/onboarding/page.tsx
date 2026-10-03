import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { getUserBusiness } from "@/lib/supabase/queries";
import OnboardingForm from "./OnboardingForm";

export const metadata: Metadata = {
  title: "Business Profile — Rulla",
};

export default async function OnboardingPage() {
  const supabase = await createSupabaseServerClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login?next=/onboarding");
  }

  // Already onboarded — don't let them accidentally create a second
  // business by resubmitting this form.
  const existingBusiness = await getUserBusiness(supabase);
  if (existingBusiness) {
    redirect("/dashboard");
  }

  return (
    <main className="page">
      <span className="eyebrow">Business profile</span>
      <h1>Tell us about your business</h1>
      <p className="muted">
        This helps Rulla work out which compliance obligations apply to
        you. You can update these details later.
      </p>
      <OnboardingForm />
    </main>
  );
}
