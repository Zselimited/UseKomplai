import type { Metadata } from "next";
import Link from "next/link";
import LoginForm from "./LoginForm";

export const metadata: Metadata = {
  title: "Log in — Rulla",
};

export default async function LoginPage({
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
            Welcome <span className="accent">back.</span>
          </h1>
          <p>
            Log in to see your business&apos;s compliance dashboard and
            what&apos;s due next.
          </p>
        </div>
      </div>

      <div className="auth-split-form">
        <div className="auth-split-card">
          <h2>Log in</h2>
          <p className="muted">Log in to see your business&apos;s compliance dashboard.</p>
          <LoginForm next={safeNext} />
        </div>
      </div>
    </main>
  );
}
