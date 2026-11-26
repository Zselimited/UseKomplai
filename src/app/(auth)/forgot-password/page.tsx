import type { Metadata } from "next";
import Link from "next/link";
import ForgotPasswordForm from "./ForgotPasswordForm";

export const metadata: Metadata = {
  title: "Reset your password — Rulla",
};

export default function ForgotPasswordPage() {
  return (
    <main className="auth-split">
      <div className="auth-split-visual">
        <Link href="/" className="auth-split-brand">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/logo-rulla.png" alt="Rulla" className="brand-logo" />
        </Link>
        <div className="auth-split-copy">
          <h1>
            Forgot your <span className="accent">password?</span>
          </h1>
          <p>No problem — we&apos;ll send you a link to choose a new one.</p>
        </div>
      </div>

      <div className="auth-split-form">
        <div className="auth-split-card">
          <h2>Reset password</h2>
          <p className="muted">
            Enter the email on your account and we&apos;ll send a reset link.
          </p>
          <ForgotPasswordForm />
        </div>
      </div>
    </main>
  );
}
