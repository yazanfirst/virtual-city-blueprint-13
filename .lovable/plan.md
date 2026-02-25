

## Performance Optimization Plan — Zero Visual Changes

### Overview
Reduce draw calls and CPU overhead across `CityScene.tsx` and `BrandedShop.tsx` while keeping every pixel identical. Three categories of optimization: instancing repeated meshes, merging static shop geometries, and distance-culling Html overlays.

---

### File 1: `src/components/3d/CityScene.tsx`

#### A. Instance Trees (84 meshes → 3 instancedMesh calls)

Replace the 28 individual `<Tree>` components (each with 3 meshes: trunk, canopy1, canopy2) with 3 `<instancedMesh>` components — one for trunks (cylinderGeometry), one for main canopy (icosahedronGeometry r=1.8), one for secondary canopy (icosahedronGeometry r=1.3).

Each instance matrix is set via a `useEffect` that iterates `treePositions` and calls `setMatrixAt`. Materials and geometries are identical to the current `Tree` component.

Savings: **84 → 3 draw calls** (−81)

#### B. Instance Lamps (48 meshes → 2 instancedMesh calls)

Replace the 24 individual `<Lamp>` components (pole + bulb each) with 2 `<instancedMesh>` — one for poles (cylinderGeometry), one for bulbs (sphereGeometry). The bulb material color depends on `isNight`, handled by changing the single shared material.

Savings: **48 → 2 draw calls** (−46)

#### C. Instance Lane Markings (46 meshes → 2 instancedMesh calls)

Four groups of lane markings exist: north (10), south (12), east (12), west (12) = 46 total. Two orientations (vertical and horizontal). Use 2 `<instancedMesh>` components — one per orientation — with `planeGeometry` and `meshBasicMaterial color="#FFFFFF"`.

Savings: **46 → 2 draw calls** (−44)

#### D. Instance Tall Building Windows (~400+ meshes → ~26 instancedMesh calls)

Each of the 13 tall buildings creates `rows × 3` front-face windows and `rows × 3` side-face windows individually. Replace the per-building window loops with 2 `<instancedMesh>` per building (one for front windows, one for side windows). The geometry and material are identical across all windows within a building.

Alternatively, since all 13 buildings share the same window geometry and material (only position differs), we can use just **2 global instancedMesh calls** — one for all front-facing windows across all buildings, one for all side-facing windows. Compute all instance matrices in a single `useMemo`.

Savings: **~400 → 2 draw calls** (−~398)

#### Implementation approach for CityScene instancing

Create new components: `InstancedTrees`, `InstancedLamps`, `InstancedLaneMarkings`, `InstancedTallBuildingWindows`. Each uses `useRef<THREE.InstancedMesh>`, creates shared geometry/material, and sets instance matrices in a `useEffect`/`useMemo`. The `isNight` prop controls material emissive properties (single material update, not per-instance).

The original `Tree`, `Lamp`, `LaneMarking` components remain in the file (used by `Shop` component for the "FOR RENT" sign which uses `<Text>`) but their `.map()` render calls in `SceneInner` are replaced with the instanced versions. `TallBuilding` component body mesh stays as individual meshes (each has unique height/color), only the windows are instanced.

**Total CityScene savings: ~569 fewer draw calls**

---

### File 2: `src/components/3d/BrandedShop.tsx`

#### E. Merge static architectural meshes per shop

Currently each `BrandedShop` renders ~30 individual meshes for the architectural details (window frames ×8, window sills ×3, door frame ×3, door handle ×1, sidewalk ×1, roof pieces ×4, awning ×2, pillars ×2, accent lines ×2, storefront frame ×4). Many of these share the same material color (`darker`).

Group meshes by material color and merge them using `BufferGeometryUtils.mergeGeometries` in a `useMemo`:

- **Group 1 — `darker` color**: All window frames (8), storefront frames (4), window sills (3), accent lines (2) = 17 meshes → 1 merged mesh
- **Group 2 — door frame `#3A2A1A`**: 3 meshes → 1 merged mesh  
- **Group 3 — roof `roofColor`**: Base slab + 2 slopes + ridge cap + 2 pillars = 6 meshes → 1 merged mesh
- **Group 4 — sidewalk**: stays as 1 mesh (already single)
- **Group 5 — awning**: 2 meshes → 1 merged mesh (if same color, otherwise keep 2)

Each merge creates a new `BufferGeometry` by transforming individual geometries to their world-relative positions, then merging. This is computed once per shop in `useMemo` with dependencies on `darker`, `roofColor`, `isNight`.

**Per-shop savings: ~30 → ~8 meshes (−22 draw calls per shop)**
**Across 26 shops: −572 draw calls**

#### F. Distance-based Html overlay culling

Add a small inner component (`ShopHtmlOverlays`) that uses `useFrame` to check the camera/player distance to each shop. Only render the `<Html>` components (signboard, rating, CLOSED banner) when the player is within a threshold distance (e.g., 50 units). Beyond that distance, the sign text is too small to read anyway.

Implementation:
- Import `usePlayerStore` to get `positionRef` (or use `useFrame` with `state.camera.position`)
- Compute distance: `Math.sqrt((camX - shopX)² + (camZ - shopZ)²)`
- Use a `useState<boolean>` for `isNearby`, updated in `useFrame` with throttling (check every 10 frames, not every frame)
- Wrap all `<Html>` JSX in `{isNearby && ( ... )}`
- The 3D signboard box meshes (background + frame) always render — only the DOM-heavy `<Html>` overlays are culled

**Savings: At any given time, only ~6-10 nearby shops render Html instead of all 26. Eliminates ~50+ DOM nodes from the live document.**

---

### Technical Details

**Instancing pattern:**
```text
const meshRef = useRef<THREE.InstancedMesh>(null);
const dummy = useMemo(() => new THREE.Object3D(), []);

useEffect(() => {
  positions.forEach((pos, i) => {
    dummy.position.set(pos.x, posY, pos.z);
    dummy.updateMatrix();
    meshRef.current!.setMatrixAt(i, dummy.matrix);
  });
  meshRef.current!.instanceMatrix.needsUpdate = true;
}, []);

<instancedMesh ref={meshRef} args={[geometry, material, count]} castShadow />
```

**Merge pattern:**
```text
const mergedGeo = useMemo(() => {
  const geos: THREE.BufferGeometry[] = [];
  // For each mesh in group:
  const g = new THREE.BoxGeometry(...);
  g.translate(x, y, z); // or applyMatrix4 for rotation
  geos.push(g);
  return BufferGeometryUtils.mergeGeometries(geos);
}, [deps]);

<mesh geometry={mergedGeo}>
  <meshLambertMaterial color={darker} />
</mesh>
```

**Html culling pattern:**
```text
// Inside BrandedShop, wrapping Html sections:
const [showHtml, setShowHtml] = useState(true);
const frameCount = useRef(0);

useFrame(({ camera }) => {
  if (++frameCount.current % 10 !== 0) return;
  const dx = camera.position.x - position.x;
  const dz = camera.position.z - position.z;
  const dist = Math.sqrt(dx * dx + dz * dz);
  setShowHtml(dist < 50);
});
```

---

### Summary of Impact

| Optimization | Draw calls saved |
|---|---|
| Instance trees | −81 |
| Instance lamps | −46 |
| Instance lane markings | −44 |
| Instance tall building windows | −398 |
| Merge shop static meshes | −572 |
| Html distance culling | ~50 DOM nodes removed at any time |
| **Total** | **~1,141 fewer draw calls + major DOM reduction** |

### Files changed
- `src/components/3d/CityScene.tsx` — Replace Tree/Lamp/LaneMarking/TallBuilding-window rendering with instanced versions
- `src/components/3d/BrandedShop.tsx` — Merge static geometries by material, add distance-based Html culling

### What stays identical
- All colors, materials (MeshStandardMaterial kept where used), lighting, shadows (1024 map)
- Shop UI styling (Html overlays unchanged in appearance)
- All template decorations, branding, signage fonts
- Camera, player controller, game mechanics
- 3D layout positions, rotations, sizes

