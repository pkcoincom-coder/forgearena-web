## /* ============================================================
ForgeArena.net — Runtime Configuration

## This is the ONLY file you need to edit when keys change.
Do NOT touch index.html for credential updates.

## How to update:
1. Replace the value of SUPABASE_ANON below
2. Commit changes
3. Vercel auto-deploys in ~30s

Security note:
- This file is PUBLIC (anyone visiting forgearena.net can
read it via DevTools or /config.js URL).
- That is OK for `sb_publishable_...` keys — they are
designed for browsers and are protected by Supabase RLS
(Row Level Security) policies on the database side.
- NEVER put `sb_secret_...` keys here.
============================================================ */

window.FA_CONFIG = {
/* Supabase publishable key (safe for browsers, RLS-protected) */
SUPABASE_ANON: “sb_publishable_B2ZFcCQRhP_8VPSgKXgLfg_gBMWUg2A”,

/* Supabase project URL (rarely changes) */
SUPABASE_URL: “https://dfbrqporbfiaaejeofmr.supabase.co”,

/* Edge function endpoint (rarely changes) */
VERIFY_FN_PATH: “/functions/v1/verify-coc”,

/* Build tag — bump this when you push a new version */
BUILD: “v5.1.0”
};