"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { supabase } from "@/lib/supabase/client";
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
  // null = not checked yet, so we briefly render nothing rather than
  // flashing "Log in" for an already-signed-in visitor.
  const [isLoggedIn, setIsLoggedIn] = useState<boolean | null>(null);

  useEffect(() => {
    function onScroll() {
      setScrolled(window.scrollY > 8);
    }
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => setIsLoggedIn(!!data.user));

    // The header is part of the root layout and persists across client-side
    // navigations, so a one-time check on mount would go stale the moment
    // someone logs in or out without a full page reload — subscribe instead.
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setIsLoggedIn(!!session?.user);
    });
    return () => subscription.unsubscribe();
  }, []);

  const closeMenu = () => setMenuOpen(false);
  const accountHref = isLoggedIn ? "/dashboard" : "/login";
  const accountLabel = isLoggedIn ? "Dashboard" : "Log in";

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
            {isLoggedIn !== null && (
              <Link href={accountHref} className="nav-login-link">
                {accountLabel}
              </Link>
            )}
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
        {isLoggedIn !== null && (
          <Link href={accountHref} onClick={closeMenu}>
            {accountLabel}
          </Link>
        )}
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
