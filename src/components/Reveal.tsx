"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";

/**
 * Adds the .is-visible class (see globals.css .reveal rules) once the
 * element scrolls into view. Pure IntersectionObserver + CSS transitions —
 * no animation library. Respects prefers-reduced-motion via CSS alone
 * (the .reveal base styles are neutralized in that media query).
 */
export default function Reveal({
  children,
  className = "",
}: {
  children: ReactNode;
  className?: string;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const node = ref.current;
    if (!node) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setVisible(true);
          observer.disconnect();
        }
      },
      { threshold: 0.15 }
    );

    observer.observe(node);
    return () => observer.disconnect();
  }, []);

  return (
    <div ref={ref} className={`reveal ${visible ? "is-visible" : ""} ${className}`}>
      {children}
    </div>
  );
}
