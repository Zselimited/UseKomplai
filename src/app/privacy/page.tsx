import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Privacy — Komplai",
};

export default function PrivacyPage() {
  return (
    <main className="page">
      <h1>Privacy Policy</h1>
      <p className="muted" style={{ marginTop: "1rem" }}>
        Komplai&apos;s full privacy policy is being finalized ahead of our
        pilot. In the meantime, we only collect the information needed to
        run your account and generate your compliance assessment, and we
        do not sell your data. If you have questions about your data,
        please reach out to us directly.
      </p>
    </main>
  );
}
