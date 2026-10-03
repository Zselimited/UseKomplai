"use client";

import { useState } from "react";
import { IconMessageQuestion } from "@/components/icons";

export default function OfficerCard() {
  const [clicked, setClicked] = useState(false);

  return (
    <button type="button" className="officer-card" onClick={() => setClicked(true)}>
      <span className="icon-tile" style={{ marginBottom: 0 }}>
        <IconMessageQuestion />
      </span>
      <div>
        <h3 style={{ fontSize: "1rem" }}>Get your Rulla officer</h3>
        <p className="muted" style={{ fontSize: "0.85rem" }}>
          A trained account officer who files what&apos;s due and helps
          explain your numbers.
        </p>
        {clicked && <span className="coming-soon-badge">Coming soon</span>}
      </div>
    </button>
  );
}
