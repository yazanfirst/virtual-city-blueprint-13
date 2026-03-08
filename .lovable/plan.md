

## Plan: Fix Mirror World Anchors — Simple, Random, Two Locations

### What You Want (confirmed)
1. **Active shops** → anchor inside the shop interior (enter shop to collect)
2. **Inactive/empty spots** → anchor on rooftop (climb ladder to collect)
3. **All anchors collect the same way** — walk near = collected
4. **Random every playthrough** — shuffled distribution each game start
5. **Works for ALL difficulty levels**

### Changes

#### 1. `src/stores/mirrorWorldStore.ts` — Simplify anchor data model
- Remove `AnchorType` union (`pulse`, `chase`, `guardian`, `riddle`, `sacrifice`)
- Remove `isVisible`, `requiredKey`, `shieldActive` fields
- Add `location: 'shop' | 'rooftop'` and `shopId?: string` to `RealityAnchor`
- `createAnchors()`: shuffle all shop positions, assign active shops → `location: 'shop'` (Y=1.5, with shopId), inactive → `location: 'rooftop'` (Y=8). Random every call.
- Remove `updateAnchorState`, `chaseAnchorSpeed`, `promptMessage`/`promptKey`/`promptAnchorId` (no longer needed)
- Keep `updateAnchorPosition` removal too (no chase behavior)

#### 2. `src/components/3d/RealityAnchor.tsx` — Single simple anchor
- Remove all 5 type-specific behaviors and visuals
- One look: glowing purple crystal (icosahedron) + light beam + point light
- One behavior: float, rotate, walk near → `collectAnchor(id)`
- Keep vertical distance check (`sameLevel = Math.abs(dy) < 3.5`) so rooftop can't be grabbed from ground
- Props simplified: `id`, `position`, `isCollected` only

#### 3. `src/components/3d/CityScene.tsx` — Only render rooftop anchors outside
- Filter: only render `<RealityAnchor>` for anchors with `location === 'rooftop'`
- Shop anchors are NOT rendered in the city scene (they appear inside shop interiors)

#### 4. `src/components/3d/ShopInteriorRoom.tsx` — Render anchor inside shop
- Import `useMirrorWorldStore` and `RealityAnchor`
- When mirror world is active (`phase === 'hunting'`), check if any uncollected anchor has `shopId` matching current shop's ID
- If match found, render `<RealityAnchor>` at center of room floor (position `[0, 1.5, 0]`)
- Player walks near it inside shop → collected same as rooftop

#### 5. `src/components/mission/MirrorWorldUI.tsx` — Update mini-map + hint
- Different dot styles: shop anchors = small square, rooftop anchors = circle
- Add to legend: "Shop" + "Roof" labels
- Update hint text: "Some anchors are inside active shops — enter to collect. Others are on rooftops — climb ladders to reach them."

#### 6. `src/components/mission/MirrorWorldPanel.tsx` — Pass shop IDs
- Include shop `id` in `ShopPositionInfo` so anchors can reference which shop they belong to

