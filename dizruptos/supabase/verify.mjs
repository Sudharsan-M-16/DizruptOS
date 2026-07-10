#!/usr/bin/env node
/**
 * Supabase connection verifier.
 * Run with: node supabase/verify.mjs
 * Needs .env.local to be populated with real credentials.
 */

import { readFileSync } from "fs";
import { createClient } from "@supabase/supabase-js";

// Parse .env.local manually (no dotenv dependency needed)
const env = Object.fromEntries(
  readFileSync(".env.local", "utf8")
    .split("\n")
    .filter((l) => l.includes("=") && !l.startsWith("#"))
    .map((l) => {
      const [k, ...rest] = l.split("=");
      return [k.trim(), rest.join("=").trim()];
    })
);

const url = env["NEXT_PUBLIC_SUPABASE_URL"];
const anon = env["NEXT_PUBLIC_SUPABASE_ANON_KEY"];
const service = env["SUPABASE_SERVICE_ROLE_KEY"];

if (!url || !anon) {
  console.error("❌  NEXT_PUBLIC_SUPABASE_URL or NEXT_PUBLIC_SUPABASE_ANON_KEY missing from .env.local");
  process.exit(1);
}

console.log(`\nTesting: ${url.replace(/https:\/\//, "").split(".")[0]}…\n`);

// Test 1: DNS / reachability
try {
  const res = await fetch(`${url}/rest/v1/`, {
    headers: {
      apikey: anon,
      Authorization: `Bearer ${anon}`,
    },
  });
  if (res.status < 500) {
    console.log(`✅  Project reachable (HTTP ${res.status})`);
  } else {
    console.error(`❌  HTTP ${res.status} — Supabase server error`);
    process.exit(1);
  }
} catch (e) {
  console.error("❌  Cannot reach Supabase URL — project doesn't exist or URL is wrong");
  console.error("    Check NEXT_PUBLIC_SUPABASE_URL in .env.local");
  process.exit(1);
}

// Test 2: anon key — can we hit a table?
const anon_client = createClient(url, anon);
const { error: anonErr } = await anon_client.from("users").select("id").limit(1);
if (anonErr) {
  console.log("⚠️   Anon read failed (expected if migrations not yet applied):", anonErr.message);
} else {
  console.log("✅  Anon key works — can read public tables");
}

// Test 3: service role key
if (!service) {
  console.log("⚠️   SUPABASE_SERVICE_ROLE_KEY not set — server-side APIs will use demo fallback");
} else {
  const svc = createClient(url, service, { auth: { persistSession: false } });

  // Check which tables exist
  const tables = ["organizations", "departments", "users", "projects", "tasks",
                  "capabilities", "risks", "decisions", "goals", "approvals"];
  const missing = [];
  for (const t of tables) {
    const { error } = await svc.from(t).select("id").limit(1);
    if (error && error.code === "42P01") missing.push(t);
  }

  if (missing.length === 0) {
    console.log("✅  All tables exist — migrations already applied");

    // Check row counts
    const { data: orgs } = await svc.from("organizations").select("id, name");
    const { data: users } = await svc.from("users").select("id, full_name, role");
    const { data: projects } = await svc.from("projects").select("id, name");
    const { data: tasks } = await svc.from("tasks").select("id");
    console.log(`\n📊  Data snapshot:`);
    console.log(`    Organizations : ${orgs?.length ?? 0}`);
    console.log(`    Users         : ${users?.length ?? 0}`);
    console.log(`    Projects      : ${projects?.length ?? 0}`);
    console.log(`    Tasks         : ${tasks?.length ?? 0}`);
    if ((users?.length ?? 0) === 0) {
      console.log("\n⚠️   Tables exist but no data — run the seed:");
      console.log("    Supabase dashboard → SQL Editor → paste supabase/seed.sql → Run");
    }
  } else {
    console.log(`\n⚠️   Missing tables (migrations not applied yet): ${missing.join(", ")}`);
    console.log("\n📋  NEXT STEP — apply the schema:");
    console.log("    1. Go to: Supabase dashboard → SQL Editor → New Query");
    console.log("    2. Open the file: supabase/setup_all.sql");
    console.log("    3. Paste the entire contents and click Run");
    console.log("    4. Then paste supabase/seed.sql and run that too");
    console.log("    5. Run this script again to verify");
  }
}

// Test 4: auth hook reminder
console.log("\n📌  One dashboard step required after migrations:");
console.log("    Supabase → Authentication → Hooks → Customize Access Token");
console.log("    → select public.custom_access_token_hook → Save");
console.log("    (This makes real login inherit the RBAC roles)");

console.log("\nDone.\n");
