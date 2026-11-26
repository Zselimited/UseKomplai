import type { Metadata } from "next";
import Link from "next/link";
import ResetPasswordForm from "./ResetPasswordForm";

export const metadata: Metadata = {
  title: "Choose a new password | Rulla",
};

export default function ResetPasswordPage() {
  return (
    <main className="auth-split">
      <div className="auth-split-visual">
        <Link href="/" className="auth-split-brand">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/logo-rulla.png" alt="Rulla" className="brand-logo" />
        </Link>
        <div className="auth-split-copy">
          <h1>
            Choose a new <span className="accent">password.</span>
          </h1>
          <p>Pick something you&apos;ll remember this time.</p>
        </div>
      </div>

      <div className="auth-split-form">
        <div className="auth-split-card">
          <h2>New password</h2>
          <p className="muted">You&apos;re verified — set a new password below.</p>
          <ResetPasswordForm />
        </div>
      </div>
    </main>
  );
}
