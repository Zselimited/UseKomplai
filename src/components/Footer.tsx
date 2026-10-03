import Link from "next/link";

export default function Footer() {
  return (
    <footer className="site-footer">
      <div className="container">
        <div className="footer-grid">
          <div className="footer-brand">
            <Link href="/" className="brand">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src="/logo-rulla.svg" alt="Rulla" className="brand-logo" />
            </Link>
            <p>Business compliance, made simpler.</p>
          </div>

          <div>
            <h4>Navigation</h4>
            <ul>
              <li>
                <Link href="/assessment">Assessment</Link>
              </li>
              <li>
                <Link href="/#compliance-areas">Compliance Areas</Link>
              </li>
              <li>
                <Link href="/#how-it-works">How It Works</Link>
              </li>
            </ul>
          </div>

          <div>
            <h4>Legal</h4>
            <ul>
              <li>
                <Link href="/privacy">Privacy</Link>
              </li>
              <li>
                <Link href="/terms">Terms</Link>
              </li>
              <li>
                <a href="#disclaimer">Disclaimer</a>
              </li>
            </ul>
          </div>
        </div>

        <div className="footer-disclaimer" id="disclaimer">
          Rulla provides informational compliance guidance. Applicability
          and requirements may depend on your business, current laws,
          regulations and official guidance.
        </div>
      </div>
    </footer>
  );
}
