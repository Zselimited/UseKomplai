import type { Metadata } from "next";
import LoginForm from "./LoginForm";

export const metadata: Metadata = {
  title: "Log in — Komplai",
};

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ next?: string }>;
}) {
  const { next } = await searchParams;
  const safeNext = next && next.startsWith("/") ? next : "/start";

  return (
    <main className="auth-shell">
      <div className="auth-card">
        <h1 style={{ fontSize: "1.5rem" }}>Log in</h1>
        <p className="muted" style={{ marginTop: "0.4rem" }}>
          Log in to see your business&apos;s compliance dashboard.
        </p>
        <LoginForm next={safeNext} />
      </div>
    </main>
  );
}
