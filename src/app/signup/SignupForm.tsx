"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { supabase } from "@/lib/supabase/client";

export default function SignupForm({ next }: { next: string }) {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [confirmationSent, setConfirmationSent] = useState(false);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setSubmitting(true);

    const { data, error: signUpError } = await supabase.auth.signUp({
      email,
      password,
    });

    setSubmitting(false);

    if (signUpError) {
      setError(signUpError.message);
      return;
    }

    if (data.session) {
      // Email confirmation is off for this project — the user is already
      // signed in.
      router.push(next);
      router.refresh();
      return;
    }

    // Email confirmation is required before a session exists.
    setConfirmationSent(true);
  }

  if (confirmationSent) {
    return (
      <div className="notice">
        We&apos;ve sent a confirmation link to <strong>{email}</strong>.
        Click it, then{" "}
        <Link href={`/login?next=${encodeURIComponent(next)}`}>log in</Link>.
      </div>
    );
  }

  return (
    <>
      <form onSubmit={handleSubmit}>
        <div className="field">
          <label htmlFor="email">Email</label>
          <input
            id="email"
            name="email"
            type="email"
            autoComplete="email"
            required
            value={email}
            onChange={(event) => setEmail(event.target.value)}
          />
        </div>

        <div className="field">
          <label htmlFor="password">Password</label>
          <input
            id="password"
            name="password"
            type="password"
            autoComplete="new-password"
            minLength={6}
            required
            value={password}
            onChange={(event) => setPassword(event.target.value)}
          />
          <span className="field-hint">At least 6 characters.</span>
        </div>

        {error && <p className="error-text">{error}</p>}

        <button type="submit" className="btn btn-primary btn-lg btn-block" disabled={submitting}>
          {submitting ? "Creating account..." : "Sign up"}
        </button>
      </form>

      <p className="muted" style={{ marginTop: "1.5rem" }}>
        Already have an account?{" "}
        <Link href={`/login?next=${encodeURIComponent(next)}`}>Log in</Link>
      </p>
    </>
  );
}
