
## Fix: Product Prices Not Showing Merchant's Currency

### Root Cause

The shop's currency (e.g., "AED") is stored in the database correctly, but players can't see it because:

1. The RPC function `get_active_or_suspended_public_shops_for_spots` (which players use to load shop data) does NOT include the `currency` column -- it was never added.
2. `ShopInteriorRoom` tries a separate direct query to the `shops` table to get currency, but **RLS blocks it** for non-merchant users (the SELECT policy only allows shop owners and admins). So it silently falls back to "USD".

### Fix

**Step 1: Add `currency` to the RPC function** (SQL migration)

Update `get_active_or_suspended_public_shops_for_spots` to include `s.currency` in its SELECT list.

**Step 2: Add `currency` to `PublicShop` interface** (`src/hooks/use3DShops.ts`)

Add `currency: string | null` to the `PublicShop` type.

**Step 3: Add `currency` to `ShopBranding` interface and transform** (`src/hooks/use3DShops.ts`)

Add `currency?: string` to `ShopBranding` and pass it through in `transformToShopBranding`.

**Step 4: Use the already-loaded currency in `ShopInteriorRoom`** (`src/components/3d/ShopInteriorRoom.tsx`)

Remove the separate (RLS-blocked) query for `shop-currency` and use `shop.currency` instead (which now comes from the RPC via the branding data).

### Files Changed

| File | Change |
|------|--------|
| New SQL migration | Add `currency` to the RPC function |
| `src/hooks/use3DShops.ts` | Add `currency` to `PublicShop`, `ShopBranding`, and transform function |
| `src/components/3d/ShopInteriorRoom.tsx` | Remove the separate currency query; use `shop.currency` from branding data |
