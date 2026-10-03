import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "../globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Rulla — Business Compliance Made Simpler",
  description:
    "Understand, assess and organise business compliance with Rulla.",
};

// A separate root layout (no Header/Footer) so the signup/login split-screen
// takes the full viewport, matching a focused auth experience instead of
// sitting awkwardly under the marketing site chrome.
export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${geistSans.variable} ${geistMono.variable}`}>
      <body>{children}</body>
    </html>
  );
}
