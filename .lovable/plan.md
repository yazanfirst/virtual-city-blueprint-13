

# Fix Reward System Exploits

## What's Being Fixed

Two exploits that let players farm unlimited coins and XP:

1. **Shop visit farming** -- Players earn 5 coins every time they visit a shop after a page refresh, because the "already visited" check is only stored in browser memory (resets on refresh).
2. **Mission replay farming** -- Players earn full rewards (coins + XP) every time they replay any mission level, even easy ones they've already beaten.

## How It Will Work After the Fix

| Action | First Time | Replay |
|--------|-----------|--------|
| Complete a mission level | Full coins + Full XP | 0 coins + 10 XP |
| Visit a shop | 5 coins | Nothing (server blocks it) |

Replay XP (10 per run) is intentionally small -- it lets dedicated players still progress slowly, but removes the ability to farm coins (which have real-world value via merchant discounts).

---

## Step 1: Database -- Two New Tables

### Table: `player_shop_visits`
Tracks which shops each player has visited. The UNIQUE constraint on (user_id, shop_id) prevents duplicate entries at the database level.

| Column | Type | Notes |
|--------|------|-------|
| id | uuid | Primary key |
| user_id | uuid | NOT NULL |
| shop_id | uuid | NOT NULL |
| created_at | timestamptz | Default now() |
| | | UNIQUE(user_id, shop_id) |

RLS: Players can only insert and read their own rows.

### Table: `mission_completions`
Records the first time a player beats each mission level. The UNIQUE constraint on (user_id, mission_type, level) ensures only one record per level per player.

| Column | Type | Notes |
|--------|------|-------|
| id | uuid | Primary key |
| user_id | uuid | NOT NULL |
| mission_type | text | 'zombie', 'ghost_hunt', 'mirror_world' |
| level | integer | The mission difficulty level |
| coins_earned | integer | Coins granted on first clear |
| xp_earned | integer | XP granted on first clear |
| completed_at | timestamptz | Default now() |
| | | UNIQUE(user_id, mission_type, level) |

RLS: Players can only insert and read their own rows.

---

## Step 2: Update usePlayerProgress Hook

Add two new server-backed methods:

**`recordShopVisit(shopId)`** -- Tries to insert into `player_shop_visits`. If the row already exists (unique constraint violation), it returns false (no reward). If it succeeds, it grants 5 coins and returns true.

**`completeMission(type, level, baseCoins, baseXP)`** -- Checks `mission_completions` for an existing row with the same (user, type, level). If found, this is a replay: grant 0 coins and 10 XP. If not found, insert the completion record and grant full rewards. Returns `{ coinsEarned, xpEarned, isFirstClear }` so the UI can show the correct amounts.

Also load visited shop IDs from `player_shop_visits` on login to pre-populate the client-side Set (prevents the "first visit" prompt from showing for already-visited shops).

---

## Step 3: Update gameStore

Add a `loadVisitedShops(shopIds)` action that populates the `shopsVisited` Set from server data on login. This ensures the client-side check stays in sync with the database.

---

## Step 4: Update StreetView Reward Logic

### Shop Visits (handleEnterShop)
Replace the current client-only check with the new `recordShopVisit()` call. The server decides if this is truly a first visit.

### Zombie Escape (useEffect watching mission.phase)
Replace direct `earnCoins(30)` + `earnXP(level*50)` with `completeMission('zombie', level, 30, level*50)`. Use the returned amounts for the completion modal.

### Ghost Hunt (onComplete callback)
Replace direct rewards with `completeMission('ghost_hunt', level, 15*captured, level*50)`. Use returned amounts.

### Mirror World (onContinue and onExit callbacks)
Replace direct rewards with `completeMission('mirror_world', level, 20*anchors, level*50)`. Use returned amounts. Also fix the current bug where Mirror World grants rewards twice (once on Continue AND once on the next action) by using a ref guard similar to the zombie mission fix.

---

## Step 5: Update Completion Modals

The three completion modals (`ZombieMissionCompleteModal`, `GhostHuntCompleteModal`, `MirrorWorldComplete`) already accept `coinsEarned` and `xpEarned` props. They will now naturally show "0" coins and "+10 XP" for replays, and full amounts for first clears. No structural changes needed -- just ensure the correct values are passed from StreetView.

---

## File Change Summary

| Action | File |
|--------|------|
| Create (migration) | `player_shop_visits` table + RLS |
| Create (migration) | `mission_completions` table + RLS |
| Modify | `src/hooks/usePlayerProgress.ts` -- add `recordShopVisit`, `completeMission`, load visited shops |
| Modify | `src/stores/gameStore.ts` -- add `loadVisitedShops` action |
| Modify | `src/pages/StreetView.tsx` -- replace all reward calls with server-validated versions, fix Mirror World double-reward bug |

