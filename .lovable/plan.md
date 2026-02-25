

## Procedural Shop Visual Upgrade

Single file change: `src/components/3d/BrandedShop.tsx`

### Changes

**1. Sidewalk platform** — New mesh before roof section
- Box `[9, 0.15, 2.5]` at `[0, 0.075, 5]`, concrete gray `#888888`

**2. Peaked roof** — Replace flat roof (lines 158-162) with:
- Base slab: box `[8.6, 0.15, 8.6]` at Y=6.1
- Left slope: box `[4.5, 0.12, 8.2]` at `[-2.1, 6.55, 0]` rotated Z=0.38
- Right slope: same mirrored with Z=-0.38
- Ridge cap: box `[0.3, 0.1, 8.4]` at `[0, 6.95, 0]`

**3. Window frames + sills** — After each window (lines 164-174), add:
- Frame: 4 thin boxes (top/bottom/left/right, 0.08 thick) in `darker` color
- Sill ledge: box `[1.7, 0.1, 0.15]` below each upper window
- Storefront sill: box `[4.2, 0.1, 0.15]` below storefront window

**4. Recessed door with frame** — Replace door (lines 186-190):
- Move door to Z=3.85 (recessed 0.2 into wall)
- Add 3-piece frame (two vertical sides + top) at Z=4.05 in darker brown
- Add small sphere door handle

**5. Thicker awning** — Replace awning (lines 192-196):
- Increase height from 0.1 to 0.25
- Add thin fascia strip at front edge

**6. Front corner pillars** — New meshes:
- Two cylinders at `[±3.8, 3, 4.2]`, radius 0.12, height 6, 8 segments
- Color matches `roofColor`

**7. Side wall accent lines** — New meshes:
- Thin horizontal boxes at mid-height on each side: `[±4.05, 3.5, 0]`, size `[0.05, 0.1, 8]`

### What stays identical
- All template-specific decorations (cyber_tech, modern_neon, luxury_gold, pharaoh_gold, greek_marble, art_deco, japanese_zen, neon_cyberpunk, led_display, urban_industrial)
- Signboard group with Html overlays (logo, shop name, FOR RENT, CLOSED)
- Star rating display
- Hover highlight, pointer/click handling
- Texture support (TexturedMesh)
- Main body box `[8, 6, 8]`
- All colors, fonts, branding logic

### Performance
~12 additional simple meshes per shop using boxGeometry/cylinderGeometry with meshLambertMaterial. Negligible GPU cost.

