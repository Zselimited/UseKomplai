"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase/client";
import type { UserProfile } from "@/lib/supabase/queries";

export default function AccountDetailsCard({
  profile,
  fallbackEmail,
}: {
  profile: UserProfile | null;
  fallbackEmail: string;
}) {
  const router = useRouter();
  const [editing, setEditing] = useState(false);
  const [fullName, setFullName] = useState(profile?.full_name ?? "");
  const [phone, setPhone] = useState(profile?.phone ?? "");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const displayName = profile?.full_name?.trim() ?? "";
  const firstName = displayName.split(" ")[0] || null;
  const avatarLetter = (displayName[0] ?? fallbackEmail[0] ?? "?").toUpperCase();

  function cancelEdit() {
    setEditing(false);
    setFullName(profile?.full_name ?? "");
    setPhone(profile?.phone ?? "");
    setError(null);
  }

  async function handleSave(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!profile) return;
    setSaving(true);
    setError(null);

    const { error: updateError } = await supabase
      .from("profiles")
      .update({ full_name: fullName.trim(), phone: phone.trim() || null })
      .eq("id", profile.id);

    setSaving(false);

    if (updateError) {
      setError(updateError.message);
      return;
    }

    setEditing(false);
    router.refresh();
  }

  return (
    <section className="card" style={{ marginBottom: "1.25rem" }}>
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          gap: "1rem",
          flexWrap: "wrap",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "0.85rem" }}>
          <span className="avatar-circle">{avatarLetter}</span>
          <div>
            <h1 style={{ fontSize: "1.3rem" }}>
              {firstName ? `Welcome back, ${firstName}!` : "Welcome back!"}
            </h1>
            <p className="muted" style={{ fontSize: "0.85rem" }}>
              {profile?.email ?? fallbackEmail}
            </p>
          </div>
        </div>
        {!editing && (
          <button type="button" className="btn btn-outline" onClick={() => setEditing(true)}>
            Edit details
          </button>
        )}
      </div>

      {editing && (
        <form onSubmit={handleSave} style={{ marginTop: "1.5rem" }}>
          <div className="field">
            <label htmlFor="editFullName">Full name</label>
            <input
              id="editFullName"
              value={fullName}
              onChange={(event) => setFullName(event.target.value)}
              required
            />
          </div>
          <div className="field">
            <label htmlFor="editPhone">Phone</label>
            <input
              id="editPhone"
              type="tel"
              placeholder="e.g. 0801 234 5678"
              value={phone}
              onChange={(event) => setPhone(event.target.value)}
            />
          </div>

          {error && <p className="error-text">{error}</p>}

          <div style={{ display: "flex", gap: "0.75rem" }}>
            <button type="submit" className="btn btn-primary" disabled={saving}>
              {saving ? "Saving..." : "Save"}
            </button>
            <button type="button" className="btn btn-ghost" onClick={cancelEdit}>
              Cancel
            </button>
          </div>
        </form>
      )}
    </section>
  );
}
