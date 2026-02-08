

# Merchant Coupon Code System + Auto-Expire Filtering

## Summary

Transition from platform-generated random codes to **merchant-defined coupon codes** that work on real merchant websites. Add **automatic expiry filtering** so expired offers never appear to players. The platform's value is gating access behind gameplay (coins, levels, limits) rather than generating codes.

## What Changes

### 1. Database Migration

Add two new columns to the `merchant_offers` table:

- `coupon_code` (text, nullable) -- the merchant's real website coupon code (e.g., "SUMMER20")
- `code_type` (text, default `'shared'`) -- future-ready field for supporting `'pool'` (CSV upload) or `'api'` (external integration) models later

Existing offers without a coupon code will continue to work but won't reveal a code to players.

### 2. Edge Function Update (`redeem-offer`)

- After successful validation (coins, level, limits), return the merchant's `coupon_code` from the offer record
- Still generate and store a unique `redemption_code` internally for tracking/analytics
- Return both `coupon_code` (what the player uses on the merchant website) and `redemption_code` (internal tracking) in the response

### 3. Merchant Offer Form Update

Add a prominent **"Coupon Code"** input field to the `OfferManagement.tsx` form:

- Required text field with placeholder "e.g., SUMMER20"
- Helper text: "Enter the coupon code customers will use on your website"
- Uppercase-forced input for consistency
- Included in both create and edit flows
- Pre-filled when editing an existing offer

### 4. Auto-Expire Filtering (Client-Side)

Add expiry filtering in two places:

- `useAllActiveOffers.ts` -- filter out offers where `expires_at` is in the past before returning results to the "Offers For You" panel
- `useMerchantOffers.ts` (`useShopOffers`) -- same filter for individual shop offer views

This ensures expired offers are automatically hidden without any manual intervention.

### 5. Redemption Modal Update

Update `RedemptionCodeModal.tsx` to:

- Accept and display a `couponCode` prop (the merchant's real code) prominently
- Show a smaller "Tracking ID" label for the internal redemption code
- The copy button copies the merchant's coupon code
- Keep the existing "Visit Shop Website" button for outbound clicks

### 6. Data Flow Updates

Update these files to pass the `coupon_code` through the claim flow:

- `useRedemptions.ts` -- add `coupon_code` to the `ClaimResult` interface and extract it from the edge function response
- `EligibleOffersPanel.tsx` -- pass `coupon_code` to the redemption modal after claiming
- `ShopOffersSection.tsx` -- same pass-through for the shop interior view
- `useMerchantOffers.ts` -- add `coupon_code` and `code_type` to the `MerchantOffer` and `CreateOfferInput` interfaces

## Data Flow Diagram

```text
MERCHANT CREATES OFFER
  Enters title, discount, coin price, AND coupon code "SUMMER20"
  Stored in merchant_offers.coupon_code

PLAYER BROWSING (auto-filtered)
  Expired offers (expires_at < now) hidden automatically
  Only eligible offers shown (coins, level, not already claimed)

PLAYER CLAIMS OFFER
  Edge function validates: coins, level, per-player limit, daily limit
  Deducts coins from player_progress
  Creates offer_redemptions record (internal tracking code)
  Returns merchant's coupon_code "SUMMER20" to player

PLAYER SEES MODAL
  "SUMMER20" displayed as the code to copy
  "Visit Shop Website" opens merchant's site
  Player uses code at checkout on merchant's website
```

## Anti-Abuse Protections (Unchanged)

- Coin-gating: players must spend earned coins to reveal the code
- Per-player claim limits: enforced by edge function
- Daily global claim limits: enforced by edge function
- Level requirements: enforced by edge function
- All redemptions tracked in `offer_redemptions` for merchant analytics

## Files Modified

| File | Change |
|------|--------|
| Database migration | Add `coupon_code` and `code_type` columns |
| `supabase/functions/redeem-offer/index.ts` | Return `coupon_code` from offer |
| `src/hooks/useMerchantOffers.ts` | Add fields to interfaces |
| `src/hooks/useAllActiveOffers.ts` | Add expiry filter |
| `src/hooks/useRedemptions.ts` | Add `coupon_code` to ClaimResult |
| `src/components/merchant/OfferManagement.tsx` | Add coupon code input field |
| `src/components/3d/EligibleOffersPanel.tsx` | Pass coupon code to modal |
| `src/components/3d/ShopOffersSection.tsx` | Pass coupon code to modal |
| `src/components/mission/RedemptionCodeModal.tsx` | Display merchant coupon code |

## Future Extensibility

The `code_type` column enables these future upgrades without schema changes:

- `'shared'` (current MVP) -- single merchant code shown to all claimants
- `'pool'` (future) -- merchant uploads CSV of unique codes, one distributed per claim
- `'api'` (future) -- platform calls merchant API to generate/validate codes at redemption time

