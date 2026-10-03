import type { Metadata } from "next";
import SignupForm from "./SignupForm";

export const metadata: Metadata = {
  title: "Sign up — Rulla",
};

export default async function SignupPage({
  searchParams,
}: {
  searchParams: Promise<{ next?: string }>;
}) {
  const { next } = await searchParams;
  const safeNext = next && next.startsWith("/") ? next : "/start";

  return (
    <main className="auth-shell">
      <div className="auth-card">
        <h1 style={{ fontSize: "1.5rem" }}>Create your account</h1>
        <p className="muted" style={{ marginTop: "0.4rem" }}>
          Takes a minute. Next, we&apos;ll ask a few questions about your
          business.
        </p>
        <SignupForm next={safeNext} />
      </div>
    </main>
  );
}
