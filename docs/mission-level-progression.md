# Mission Level Progression Plan (Zombie Escape, Ghost Hunt, Mirror World)

> Scope: design + implementation plan only. No schema changes.

## Current Mission Parameter Sources

### Ghost Hunt
- **Difficulty and tuning:** `difficultyLevel`, `getGhostCount`, `getTimeLimit`, `requiredCaptures`, `trapCharges`, and `playerLives` are all derived in `useGhostHuntStore.startMission`. Level increments on `completeMission`. Battery state lives under `equipment` in the same store.
  - Key knobs already present: time limit, ghost count, required captures, trap charges, lives, EMF/flashlight battery usage.

### Zombie Escape
- **Core mission state:** `useMissionStore` controls timer (`timeRemaining`, `timeLimit`), lives, and zombie/trap lists.
- **Zombie count & spawn locations:** `generateZombieSpawns` (fixed list of 12 zombie spawns + behavior types).
- **Trap count & placement:** `generateTrapPositions` (fixed list of fire pits, axes, thorns).
- **Zombie speed:** default speed is passed via `ZombieCharacter` props; speed defaults inside `ZombieCharacter`.

### Mirror World
- **Difficulty & knobs:** `useMirrorWorldStore` contains `requiredAnchors`, `shadowSpeed`, `timeRemaining`, and `playerLives`. Anchors are generated from a fixed list of 5 positions. Shadow speed increments slightly when anchors are collected.
- **Chase speed:** `MirrorShadow` uses `shadowSpeed` as a multiplier on the mirrored movement delta.

## Unified 5-Level Mission Schema (Zustand-only)

### Shared Level Rules
- Each mission keeps a local `level` (1–5).
- Success **increments** to a max of 5. Failure **does not increment**.
- Optional reset/cooldown can be applied per-mission (e.g., reset to 1 after X fails), but not required.

### Store-Level Additions
- **Zombie Escape** (`useMissionStore`)
  - Add `difficultyLevel` (1–5) and a `getMissionLevelConfig(level)` helper.
  - Apply config in `activateMission` for:
    - `timeLimit`, `timeRemaining`
    - `lives`
    - `zombies` (subset/superset by level)
    - `traps` (subset by level)
    - `zombieSpeed` (passed into `ZombieCharacter`)
- **Ghost Hunt** (`useGhostHuntStore`)
  - Already has `difficultyLevel`. Add a `getGhostHuntLevelConfig(level)` table to centralize tuning.
- **Mirror World** (`useMirrorWorldStore`)
  - Already has `difficultyLevel`. Add a config table that controls:
    - `requiredAnchors`
    - `timeRemaining`
    - `shadowSpeed`
    - `playerLives`
    - `anchorBonus` (if using time bonus or score)

## Level Scaling Tables (Proposed)

> These are *starting* values to be tuned using playtesting.

### Zombie Escape
| Level | Zombies | Zombie Speed | Spawn Distance | Trap Count | Time Limit | Lives |
|------:|--------:|-------------:|---------------:|-----------:|-----------:|------:|
| 1 | 6 | 0.035 | Far (>= 35m) | 6 | 100s | 3 |
| 2 | 8 | 0.040 | Far (>= 30m) | 8 | 95s | 3 |
| 3 | 10 | 0.045 | Mid (>= 25m) | 10 | 90s | 2 |
| 4 | 11 | 0.050 | Mid (>= 22m) | 12 | 85s | 2 |
| 5 | 12 | 0.055 | Near (>= 20m) | 14 | 80s | 2 |

### Ghost Hunt
| Level | Timer | Required Captures | Ghost Count | Ghost Aggression | Battery Drain |
|------:|------:|------------------:|------------:|------------------:|--------------:|
| 1 | 90s | 3 | 3 | Low | Normal |
| 2 | 85s | 3 | 4 | Low-Med | Normal |
| 3 | 80s | 4 | 5 | Medium | +10% |
| 4 | 75s | 4 | 6 | Medium-High | +15% |
| 5 | 70s | 5 | 7 | High | +20% |

### Mirror World
| Level | Required Anchors | Base Timer | Anchor Bonus | Shadow Speed | Collision Dist | Lives | Chase Anchor Speed |
|------:|-----------------:|-----------:|-------------:|-------------:|---------------:|------:|--------------------:|
| 1 | 2 | 75s | +5s | 0.45 | 2.0 | 2 | 0.40 |
| 2 | 3 | 70s | +4s | 0.50 | 2.0 | 2 | 0.45 |
| 3 | 4 | 65s | +4s | 0.55 | 2.0 | 2 | 0.50 |
| 4 | 5 | 60s | +3s | 0.60 | 2.0 | 2 | 0.55 |
| 5 | 5 | 55s | +3s | 0.65 | 2.0 | 2 | 0.60 |

## Ghost Hunt Recharge Pickup Plan

### Where to store battery variables
- Keep in `useGhostHuntStore.equipment` (`emfBattery`, `flashlightBattery`, `trapCharges`).

### Add a recharge pickup object
- Add a small glowing mesh + floating icon component in `ShopInteriorRoom`.
- Use the existing `CollectibleItem` distance-check pattern or add a simple in-room collision check (distance to player).

### Randomize shop selection per session
- Create a helper in `lib/missionShopSelection.ts` (or new file) to select **one** eligible shop using existing `getEligibleShops` rules.
- Store the selected `shopId` in a small `ghostHuntPickupStore` (Zustand) or in `useGhostHuntStore` as `rechargeShopId` + `hasCollectedRecharge`.

### Prevent multiple recharges per run
- Track `hasCollectedRecharge` in store. Once true, hide/disable the pickup.
- When picked up, refill batteries to full and log:
  - `console.debug('[GhostHunt] Recharge spawned in shop', shopId)`
  - `console.debug('[GhostHunt] Recharge collected')`

### Eligible shops
- Use existing “occupied and not suspended” rules (same as mission target selection). Exclude `hasShop === false` (“for rent”).

## Mirror World Level 1 Adjustments
- Level 1 must require **2 anchors**, Level 2: **3**, Level 3: **4**, Level 4–5: **5**.
- Ensure `shadowSpeed` remains below player effective movement. Start below `0.6` and scale with level.

## Acceptance Tests (Manual)

### Zombie Escape
- Start mission at each level and verify zombies, traps, time limit, and speed match the table.
- Win a level → next activation should be at the next level; fail → level should not increment.

### Ghost Hunt
- Complete a hunt → level increments (up to 5). Fail → level unchanged.
- Timer, ghost count, required captures, trap charges, and battery drain adjust per level.
- Recharge pickup spawns in a **random eligible shop** interior, is visible, and refills equipment once.

### Mirror World
- Level 1 has exactly **2** anchors; levels scale to 5.
- Shadow speed remains winnable (does not exceed player effective speed).
- Success increments level; fail does not.
