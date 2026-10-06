# Project: 1v1club
Summary: Peer-to-peer 1v1 skill challenges — friends compete at basketball, chess, pool or games, declare a winner, and earn ranking points on a shared leaderboard. React + TypeScript + Supabase, with iOS builds via Capacitor.
Code: https://github.com/aloniewski2/1v1club
Live: http://1v1club.com/
Languages: TypeScript, HTML
Last updated: 2026-08-18

# 1v1 Club

Peer-to-peer 1v1 skill challenges for casual games. Friends challenge each
other (basketball, gaming, chess, pool…), play, declare a winner, and the winner
earns ranking points on a friends leaderboard. (Formerly "Wagerly" — the
codebase still uses the `wager` prefix for internal module/folder names and the
DB schema; user-facing routes are now `/club/*`.) Built with Vite + React +
TypeScript + Tailwind/shadcn, with a Supabase backend (Postgres, Auth, Storage,
Edge Functions).

> Free-to-play model. 1v1 Club does not take cash stakes, hold funds, pay
> out money, or charge a rake. Matches are competitions for points/ranking, not
> money. This is a deliberate legal choice — see `docs/compliance/` for the New
> Jersey gambling/money-transmitter research that drove it. The legacy
> real-money code (wallet, escrow, Stripe payout, 5% fee) remains in the repo,
> unused and unrouted, for reference only.

Two complete themes: light "Split" and dark "Voltage" (default),
toggled in the dashboard header.

> ⚠️ Real-money wagering is heavily regulated (money-transmitter licensing,
> state-by-state gambling law). This repo runs in Stripe test mode for
> development. Do not operate it with real money without legal review.

## Backend setup (Supabase + Stripe)

1. Supabase project — create at supabase.com; copy the Project URL + anon
   key into `.env.local`.
2. Schema — `supabase link --project-ref ` then `supabase db push`
   (applies everything in `supabase/migrations/`, incl. the `wager-proofs`
   storage bucket, the wallet ledger, the friends/leaderboard tables, and the
   wager chat messages table).
3. Auth — enable the Email provider in Supabase Auth settings. For local
   testing you can turn off "Confirm email" (re-enable before launch).
4. Stripe (test mode) — create an account, enable Connect (Express),
   copy `pk_test_…` (→ `.env.local`) and `sk_test_…`.
5. Edge function secrets + deploy

6. Stripe webhook — add endpoint
   `https://.supabase.co/functions/v1/stripe-webhook` for events
   `payment_intent.succeeded`, `payment_intent.payment_failed`,
   `transfer.created`, `account.updated`; put the signing secret in step 5.

## How the money flows

- Each player pays their stake via a Stripe PaymentIntent
  (`create-payment-intent` → `stripe-webhook` confirms).
- On a confirmed result, `declare-winner` → `process-payout` credits the
  winner's wallet ledger (`ledger_entries`) — winnings accrue on-platform.
- Cash Out (`request-cashout`) transfers the available wallet balance to the
  user's Stripe Connect account (minus a 1.5% instant fee).
- Disputes (`resolve-dispute`) and cancellations/refunds (`cancel-wager`) are
  handled by their own functions; everything writes to a `wager_events` audit
  log and `notifications`.

## Edge functions (`supabase/functions/`)

`create-payment-intent`, `create-connect-account`, `stripe-webhook`,
`declare-winner`, `process-payout`, `request-cashout`, `cancel-wager`,
`resolve-dispute`, `admin-resolve-dispute`, `submit-dispute-evidence`,
`register-proof`, `resolve-expired-wagers`, `create-subscription-checkout`,
`sync-subscription`, `manage-subscription` (1v1 Club Pro).

## 1v1 Club Pro (subscription monetization)

The only money 1v1 Club handles is a subscription (not wagers): "1v1 Club Pro"
at $4.99/mo via Stripe Checkout. Perks: detailed stats, ranked seasons,
unlimited challenges (free tier caps open challenges at 3), priority disputes.

- `create-subscription-checkout` → hosted Stripe Checkout session.
- `sync-subscription` → on return, reconciles Pro status to `profiles.is_pro`.
- `manage-subscription` → Stripe Billing Portal (update card / cancel).
- `stripe-webhook` handles `customer.subscription.*` to keep status in sync.
- Price ID is read from the `STRIPE_PRO_PRICE_ID` secret (mode-agnostic).

Setup to finish Pro: in the Stripe Dashboard add these webhook events to the
existing endpoint — `customer.subscription.created`, `.updated`, `.deleted`,
`checkout.session.completed` — and ensure `STRIPE_PRO_PRICE_ID` points to a price
created in the same mode (test/live) as `STRIPE_SECRET_KEY`.

## Result verification & anti-foul-play

Winners are settled by mutual attestation with several safeguards:

- Both players declare the winner (`declare-winner`). Agreement → payout;
  disagreement → `disputed`.
- Deadline forfeit (`resolve-expired-wagers`, run on a schedule): once
  `declaration_deadline` passes, if one player declared and the other ghosted
  the declared winner wins by forfeit; if neither declared, both are refunded
  (no-contest). This closes the "stall to freeze the pot" attack. Guard the
  endpoint with a `CRON_SECRET` and schedule it hourly (pg_cron + pg_net, or any
  external scheduler hitting the function with `Authorization: Bearer $CRON_SECRET`).
- Structured disputes (`submit-dispute-evidence`): each party submits a
  written statement, who they claim won, and proof images. Submissions are
  locked — one per party, never editable — so no one can revise their story
  after seeing the other's.
- Proof integrity (`register-proof`): every uploaded image is hashed
  (SHA-256) server-side and checked against prior uploads; a recycled screenshot
  reused across wagers is flagged for the reviewer.
- Admin review console (`/club/admin`, gated by `profiles.is_admin`):
  reviewers see both sides' statements, signed-URL proof links, reuse flags, and
  resolve the pot with a recorded rationale (`admin-resolve-dispute`).

Grant an admin with: `UPDATE profiles SET is_admin = true WHERE email = '…';`

## Scripts

## Status

Free-to-play core (live): auth, create challenge (ranked/casual), invite +
join (no payment), play, declare winner, points awarded on win
(`record_match_result`), disputes + locked evidence + admin review, deadline
forfeit/void auto-resolution, points leaderboard over friends,
notifications, profile, and persistent chat.

Disabled / unrouted (legacy real-money): wallet, cash out, Stripe payment +
payout + Connect, 5% fee. The pages/functions remain on disk but are not
reachable in the app. See `docs/compliance/` before ever re-enabling them.
