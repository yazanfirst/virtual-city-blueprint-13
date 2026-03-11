

## Plan: Ghost Hunt Visibility Fixes + City Map Search/Filter

Two separate improvements based on tester feedback.

---

### Part 1: Ghost Hunt — "EMF works but never saw the ghost"

The tester could detect ghosts via EMF but never visually found one. The flashlight reveal mechanic is too hard to use: 60-degree cone, 500ms flash, no visual beam, and revealed ghosts are only 0.85 opacity.

**Changes:**

#### A. `src/hooks/useFlashlightReveal.ts`
- Widen cone from 60° (`PI/3`) to 90° (`PI/2`)
- Increase range from 12 to 15

#### B. `src/stores/ghostHuntStore.ts`
- Extend flash duration from 500ms to 800ms in `useFlashlight()`

#### C. `src/components/3d/GhostCharacter.tsx`
- Increase revealed opacity from 0.85 to 1.0
- Increase emissive intensity from 0.8 to 1.2 when revealed
- Add a pulsing scale effect when revealed so ghost is more noticeable

#### D. `src/components/mission/GhostHuntUI.tsx`
- Add a directional arrow indicator when EMF is Level 3+ ("STRONG" or higher)
- The arrow points toward the nearest uncaptured ghost using player position vs ghost position
- Shows as a compass-style arrow below the EMF reading display

#### E. `src/components/3d/CityScene.tsx` (new: FlashlightBeam inline)
- When `equipment.flashlightActive` is true during ghost hunt, render a cone mesh in front of the player showing the beam direction
- Simple yellow transparent cone, lasts the 800ms flash duration

---

### Part 2: City Map — Search & Filter

#### `src/pages/CityMap.tsx`
- Add a search input that filters streets by name (real-time)
- Add category filter chips below search (e.g., "All", "Fashion", "Food", "Tech") derived from available street categories
- Show "No streets found" when filters produce empty results

---

### Files Changed
1. `src/hooks/useFlashlightReveal.ts` — wider cone + range
2. `src/stores/ghostHuntStore.ts` — longer flash
3. `src/components/3d/GhostCharacter.tsx` — brighter revealed ghost
4. `src/components/mission/GhostHuntUI.tsx` — directional EMF arrow
5. `src/components/3d/CityScene.tsx` — flashlight beam visual
6. `src/pages/CityMap.tsx` — search + category filter

