# Code Review Notes

## 2026-02-13 — Atomic Coin Deduction (race condition fix)

**Problem:** The `redeem-offer` edge function read `progress.coins` then wrote
`coins = progress.coins - price`. Two concurrent requests could both read the same
balance and each subtract the price, effectively "minting" coins (e.g., 100 coins
becomes 100 − 50 = 50 twice → player pays 50 but keeps 50 instead of 0).

**Fix:** Created a `deduct_coins(_user_id, _price)` Postgres function (SECURITY DEFINER)
that performs `UPDATE player_progress SET coins = coins - _price WHERE coins >= _price
RETURNING coins`. The decrement is relative to the **current row value**, not a stale
snapshot. The edge function now calls `supabase.rpc('deduct_coins', ...)` and checks
the return value (−1 = insufficient funds). If deduction fails, the redemption row is
rolled back.

**Why this prevents double-spend:** Postgres row-level locks ensure that concurrent
UPDATEs on the same row are serialised. The `WHERE coins >= _price` guard guarantees
that only one request can succeed when the balance is borderline.
