

# Implementation Plan: Platform Foundation

## What We Are Building

Three technical layers that move the platform from a browser-only prototype to a persistent, server-backed system:

1. **Player Progress** -- persist coins, XP, level in the database instead of browser memory
2. **Merchant Offers** -- merchants create discount offers with coin prices and limits
3. **Offer Redemption** -- players spend coins to claim coupon codes, validated server-side

---

## Layer 1: Server-Side Player Progress

### Problem
Player state (coins, XP, level) lives only in the Zustand store (`gameStore.ts`). It resets on page refresh and can be manipulated via browser dev tools. The `addCoins()` and `addXP()` functions exist but are never called anywhere after mission completion.

### Database

New table: `player_progress`

| Column | Type | Default |
|--------|------|---------|
| id | uuid | gen_random_uuid() |
| user_id | uuid, NOT NULL, UNIQUE | -- |
| coins | integer | 100 |
| xp | integer | 0 |
| level | integer | 1 |
| missions_completed | integer | 0 |
| shops_visited | integer | 0 |
| created_at | timestamptz | now() |
| updated_at | timestamptz | now() |

RLS:
- SELECT: `auth.uid() = user_id`
- INSERT: `auth.uid() = user_id`
- UPDATE: `auth.uid() = user_id`

### New Files

**`src/hooks/usePlayerProgress.ts`**
- On mount (when user is logged in): fetch or create a `player_progress` row via upsert
- Exposes: `earnCoins(amount)`, `spendCoins(amount)` (returns false if insufficient), `earnXP(amount)`, `incrementMissions()`, `incrementShopsVisited()`
- Each function updates both the local Zustand store (instant UI) and the Supabase row (persistence)

### Modified Files

**`src/stores/gameStore.ts`**
- Add `loadFromServer(data)` action to initialize store from Supabase data on login

**`src/pages/StreetView.tsx`**
- Import and use `usePlayerProgress`
- On game start: load player progress from Supabase
- Wire reward granting at each mission completion point:
  - Zombie Escape complete (around line 1258-1279): `earnCoins(30)` + `earnXP(level * 50)` + `incrementMissions()`
  - Ghost Hunt complete (around line 1236-1256): `earnCoins(15 * capturedCount)` + `earnXP(level * 50)` + `incrementMissions()`
  - Mirror World complete (around line 1182-1199): `earnCoins(20 * anchorsFound)` + `earnXP(level * 50)` + `incrementMissions()`
  - First shop visit: `earnCoins(5)` + `incrementShopsVisited()`

**`src/components/mission/ZombieMissionCompleteModal.tsx`**
- Add `coinsEarned` and `xpEarned` props, display them in the modal

**`src/components/mission/GhostHuntCompleteModal.tsx`**
- Add `coinsEarned` and `xpEarned` props, display them in the stats section

**`src/components/mission/MirrorWorldComplete.tsx`**
- Add `coinsEarned` and `xpEarned` props, display them alongside the time bonus

---

## Layer 2: Merchant Offers

### Database

New table: `merchant_offers`

| Column | Type | Default |
|--------|------|---------|
| id | uuid | gen_random_uuid() |
| shop_id | uuid, FK to shops | NOT NULL |
| title | text | NOT NULL |
| description | text | -- |
| discount_type | text | NOT NULL ('percentage' or 'fixed_amount') |
| discount_value | numeric | NOT NULL |
| coin_price | integer | NOT NULL |
| min_player_level | integer | 1 |
| daily_limit | integer | 10 |
| per_player_limit | integer | 1 |
| min_order_value | numeric | NULL |
| is_active | boolean | true |
| expires_at | timestamptz | NULL |
| created_at | timestamptz | now() |
| updated_at | timestamptz | now() |

RLS:
- SELECT (authenticated): active offers visible to all logged-in users
- INSERT: merchant owns the shop (`auth.uid()` matches `shops.merchant_id`)
- UPDATE/DELETE: merchant owns the shop

### New Files

**`src/hooks/useMerchantOffers.ts`**
- For merchants: CRUD on offers for their shops
- For players: fetch active offers for a given shop

### Modified Files

**`src/pages/merchant/EditShop.tsx`**
- Add an "Offers" section below the Showcase Wall section
- Form fields: title, discount type, discount value, coin price, daily limit, per-player limit, minimum level, minimum order value
- List existing offers with edit/delete/toggle active controls

---

## Layer 3: Offer Redemption

### Database

New table: `offer_redemptions`

| Column | Type | Default |
|--------|------|---------|
| id | uuid | gen_random_uuid() |
| offer_id | uuid, FK to merchant_offers | NOT NULL |
| player_id | uuid | NOT NULL |
| redemption_code | text, UNIQUE | NOT NULL |
| status | text | 'claimed' |
| coins_spent | integer | NOT NULL |
| created_at | timestamptz | now() |
| expires_at | timestamptz | -- (7 days after claim) |

RLS:
- Players can SELECT their own redemptions
- Merchants can SELECT redemptions for their shops' offers (to verify codes)
- INSERT restricted to the Edge Function via service role

### New Edge Function

**`supabase/functions/redeem-offer/index.ts`**

Handles the entire claim process atomically:
1. Verify player is authenticated
2. Verify offer exists and is active
3. Verify player has enough coins (reads `player_progress`)
4. Verify player meets minimum level
5. Verify daily limit not exceeded (count today's redemptions)
6. Verify per-player limit not exceeded
7. Verify offer has not expired
8. If valid: generate unique 8-character code, insert redemption, deduct coins
9. If invalid: return clear error

### New Files

**`src/hooks/useRedemptions.ts`**
- `claimOffer(offerId)` -- calls the Edge Function, returns the code or error
- `useMyRedemptions()` -- lists player's claimed codes

**`src/components/3d/ShopOfferCard.tsx`**
- Displayed inside the shop interior
- Shows each offer: title, discount details, coin price, "Claim" button
- Grayed out if player lacks coins or level
- Shows "Already Claimed" if per-player limit reached

**`src/components/mission/RedemptionCodeModal.tsx`**
- Appears after successful claim
- Shows coupon code prominently with "Copy Code" button
- Shows expiry date (7 days)
- Link to visit the merchant's website (uses shop's `external_link`)

### Modified Files

**`src/components/3d/ShopInteriorRoom.tsx`**
- Add an "Offers" section in the shop interior (both 3D and 2D fallback views)
- Below the product frames / bottom hint area
- Renders `ShopOfferCard` for each active offer belonging to that shop

---

## Execution Order

1. **Database migration** -- all 3 tables + RLS policies (single migration)
2. **Edge Function** -- `redeem-offer` (deploy)
3. **Layer 1 code** -- `usePlayerProgress` hook, update `gameStore`, wire rewards in `StreetView`, update 3 completion modals
4. **Layer 2 code** -- `useMerchantOffers` hook, offers UI in `EditShop`
5. **Layer 3 code** -- `useRedemptions` hook, `ShopOfferCard`, `RedemptionCodeModal`, update `ShopInteriorRoom`

---

## Complete File Summary

| Action | File |
|--------|------|
| Migration | 3 new tables + RLS policies |
| Create | `supabase/functions/redeem-offer/index.ts` |
| Create | `src/hooks/usePlayerProgress.ts` |
| Create | `src/hooks/useMerchantOffers.ts` |
| Create | `src/hooks/useRedemptions.ts` |
| Create | `src/components/3d/ShopOfferCard.tsx` |
| Create | `src/components/mission/RedemptionCodeModal.tsx` |
| Modify | `src/stores/gameStore.ts` |
| Modify | `src/pages/StreetView.tsx` |
| Modify | `src/components/3d/ShopInteriorRoom.tsx` |
| Modify | `src/pages/merchant/EditShop.tsx` |
| Modify | `src/components/mission/ZombieMissionCompleteModal.tsx` |
| Modify | `src/components/mission/GhostHuntCompleteModal.tsx` |
| Modify | `src/components/mission/MirrorWorldComplete.tsx` |

---

## Key Technical Notes

- **Guest players** (not logged in) can still play but will not earn persistent coins or claim offers. Zustand still works locally for the session.
- **Coins cannot go negative.** The `spendCoins()` function and the Edge Function both validate balance before deducting.
- **Redemption codes are generated server-side only.** Players cannot forge codes.
- **All 3 tables use RLS tied to `auth.uid()`.** The existing auth system (`useAuth`) already handles login and role detection.

