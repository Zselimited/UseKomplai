// One-off connectivity check: confirms the app can reach Supabase using the
// publishable key from .env.local. Not part of the app itself — safe to
// delete once you've confirmed the connection works, or keep it around for
// future sanity checks.
//
// Usage: node scripts/test-supabase-connection.mjs

import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import path from "node:path";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const envPath = path.join(__dirname, "..", ".env.local");

function loadEnvLocal(filePath) {
  const env = {};
  const content = readFileSync(filePath, "utf-8");
  for (const line of content.split("\n")) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const eqIndex = trimmed.indexOf("=");
    if (eqIndex === -1) continue;
    const key = trimmed.slice(0, eqIndex).trim();
    const value = trimmed.slice(eqIndex + 1).trim();
    env[key] = value;
  }
  return env;
}

const env = loadEnvLocal(envPath);
const supabaseUrl = env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error("Missing NEXT_PUBLIC_SUPABASE_URL or NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY in .env.local");
  process.exit(1);
}

console.log(`Testing connection to ${supabaseUrl} ...`);

try {
  const res = await fetch(`${supabaseUrl}/auth/v1/settings`, {
    headers: {
      apikey: supabaseKey,
      Authorization: `Bearer ${supabaseKey}`,
    },
  });

  if (!res.ok) {
    console.error(`Connection failed: HTTP ${res.status} ${res.statusText}`);
    const body = await res.text();
    console.error(body);
    process.exit(1);
  }

  const data = await res.json();
  console.log("✅ Successfully connected to Supabase.");
  console.log("Auth settings response:", JSON.stringify(data, null, 2));
} catch (err) {
  console.error("❌ Failed to connect to Supabase:", err.message);
  process.exit(1);
}
