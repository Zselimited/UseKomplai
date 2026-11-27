"use client";

import { useEffect, useSyncExternalStore } from "react";
import { createPortal } from "react-dom";
import { IconX } from "./icons";

function subscribeNever() {
  return () => {};
}
function getIsClientSnapshot() {
  return true;
}
function getIsClientServerSnapshot() {
  return false;
}

export default function Modal({
  onClose,
  children,
}: {
  onClose: () => void;
  children: React.ReactNode;
}) {
  // Rendered via a portal straight onto <body> rather than in place, so a
  // position:fixed overlay never gets trapped inside an ancestor's own
  // stacking context (e.g. the dashboard sidebar's `position: sticky`,
  // which paints before the main column regardless of this overlay's own
  // z-index) and always covers the whole screen. document.body doesn't
  // exist during SSR, so the portal target is only resolved once this has
  // re-synced to the client snapshot post-hydration (same pattern as
  // OnboardingForm's hasAssessment check).
  const mounted = useSyncExternalStore(subscribeNever, getIsClientSnapshot, getIsClientServerSnapshot);

  useEffect(() => {
    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") onClose();
    }
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [onClose]);

  if (!mounted) return null;

  return createPortal(
    <div
      className="modal-overlay"
      onClick={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
    >
      <div className="modal-card modal-card-detail">
        <button type="button" className="modal-close" onClick={onClose} aria-label="Close">
          <IconX />
        </button>
        {children}
      </div>
    </div>,
    document.body
  );
}
