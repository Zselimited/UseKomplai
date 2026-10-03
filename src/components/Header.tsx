"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { IconMenu, IconX } from "./icons";

const NAV_LINKS = [
  { href: "/#product", label: "Product" },
  { href: "/explore", label: "Explore" },
  { href: "/#how-it-works", label: "How It Works" },
  { href: "/#compliance-areas", label: "Compliance Areas" },
];

export default function Header() {
  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    function onScroll() {
      setScrolled(window.scrollY > 8);
    }
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const closeMenu = () => setMenuOpen(false);

  return (
    <header className={`site-header ${scrolled ? "is-scrolled" : ""}`}>
      <div className="container site-header-inner">
        <Link href="/" className="brand">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/logo-rulla.svg" alt="Rulla" className="brand-logo" />
        </Link>

        <div className="header-desktop-only">
          <nav className="main-nav" aria-label="Primary">
            {NAV_LINKS.map((link) => (
              <Link key={link.href} href={link.href}>
                {link.label}
              </Link>
            ))}
          </nav>

          <div className="header-actions">
            <Link href="/login" className="nav-login-link">
              Log in
            </Link>
            <Link href="/assessment" className="btn btn-primary">
              Check My Compliance
            </Link>
          </div>
        </div>

        <button
          type="button"
          className="menu-toggle"
          aria-label={menuOpen ? "Close menu" : "Open menu"}
          aria-expanded={menuOpen}
          onClick={() => setMenuOpen((open) => !open)}
        >
          {menuOpen ? <IconX /> : <IconMenu />}
        </button>
      </div>

      <nav className={`mobile-nav ${menuOpen ? "is-open" : ""}`} aria-label="Mobile">
        {NAV_LINKS.map((link) => (
          <Link key={link.href} href={link.href} onClick={closeMenu}>
            {link.label}
          </Link>
        ))}
        <Link href="/login" onClick={closeMenu}>
          Log in
        </Link>
        <Link
          href="/assessment"
          className="btn btn-primary"
          style={{ marginTop: "0.75rem" }}
          onClick={closeMenu}
        >
          Check My Compliance
        </Link>
      </nav>
    </header>
  );
}
