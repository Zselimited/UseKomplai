import type { Metadata } from "next";
import Link from "next/link";
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
    <main className="auth-split">
      <div className="auth-split-visual">
        <Link href="/" className="auth-split-brand">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/logo-rulla.svg" alt="Rulla" className="brand-logo" />
        </Link>
        <div className="auth-split-copy">
          <h1>
            Stay compliant, <span className="accent">effortlessly.</span>
          </h1>
          <p>
            Join Nigerian businesses using Rulla to track VAT, PAYE, CAC
            and more — backed by real regulatory sources, not guesswork.
          </p>
        </div>
      </div>

      <div className="auth-split-form">
        <div className="auth-split-card">
          <h2>Create your account</h2>
          <p className="muted">
            Takes a minute. Next, we&apos;ll ask a few questions about your
            business.
          </p>
          <SignupForm next={safeNext} />
        </div>
      </div>
    </main>
  );
}
