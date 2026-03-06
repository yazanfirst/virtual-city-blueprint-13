

## Fix: Add `frustumCulled={false}` to All Instanced Meshes

### Problem
Instanced meshes (trees, lamps, lane markings, windows) use Three.js default frustum culling, which computes the bounding sphere from the base geometry near the origin — not from the actual spread of instances across the map. This causes entire batches to disappear while their collision boxes remain active.

### Changes

**File: `src/components/3d/CityScene.tsx`**

Add `frustumCulled={false}` to all 9 `<instancedMesh>` elements:

- **Lines 454-456** — InstancedTrees (trunk, canopy1, canopy2): 3 meshes
- **Lines 494-495** — InstancedLamps (pole, bulb): 2 meshes
- **Lines 551-552** — InstancedLaneMarkings (vert, horiz): 2 meshes
- **Lines 608-609** — InstancedTallBuildingWindows (front, side): 2 meshes

No other files changed. No visual changes. Negligible performance impact since these are already batched into single draw calls.

