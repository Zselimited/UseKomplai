import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Terms — Rulla",
};

export default function TermsPage() {
  return (
    <main className="page">
      <h1>Terms of Use</h1>
      <p className="muted" style={{ marginTop: "1rem" }}>
        Rulla&apos;s full terms of use are being finalized ahead of our
        pilot. Rulla currently provides informational compliance
        guidance only — it is not a substitute for professional legal or
        tax advice, and applicability of any obligation depends on your
        specific business, current laws, regulations and official
        guidance.
      </p>
    </main>
  );
}
