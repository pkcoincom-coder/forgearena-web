# ForgeArena Web

Global esports platform — Welcome Gate, OTP login, referral system, PKC token rewards.

## Tech Stack
- Frontend: HTML/CSS/JS (no framework)
- Backend: Supabase (PostgreSQL + Edge Functions)
- Auth: OTP via email
- Token: PKC Coin (on-chain rewards)

## Structure
- `index.html` — Landing page, waitlist, OTP login, referral
- `dashboard.html` — PKC balance, transactions, profile
- `supabase/functions/send-otp/` — Edge Function: send OTP email
- `supabase/functions/verify-otp/` — Edge Function: verify OTP & session
- `supabase/functions/verify-coc/` — Edge Function: verify Code of Conduct

## Status
Pre-launch. Not yet open to public.
