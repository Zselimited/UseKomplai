import { redirect } from "next/navigation";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { getUserBusiness } from "@/lib/supabase/queries";

// Not a real page — a routing decision. This is what "clicking a
// personalized feature" ultimately lands on: if you're not logged in, you
// get sent to log in first; if you are, you get sent to onboarding (no
// business yet) or straight to your dashboard (already onboarded).
export default async function StartPage() {
  const supabase = await createSupabaseServerClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login?next=/start");
  }

  const business = await getUserBusiness(supabase);

  if (business) {
    redirect("/dashboard");
  }

  redirect("/onboarding");
}
