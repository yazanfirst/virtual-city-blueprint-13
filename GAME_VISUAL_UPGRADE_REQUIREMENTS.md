# Game Visual Upgrade Requirements (From "boxes" to polished mission look)

This document lists what is required to upgrade the current low-poly/blockout city into a polished visual style similar to your reference image.

## 1) What we have now

- The project already uses a Web 3D stack with `three`, `@react-three/fiber`, and `@react-three/drei`, so the engine foundation is ready for visual upgrades.
- The city scene currently uses many flat color materials and simple geometric placements (shops/buildings/props), which explains the "box" look.

## 2) Required assets (biggest requirement)

To match the reference quality, we need a complete art pack (or permission to source one):

- **Environment textures (PBR):** asphalt, sidewalk, concrete, walls, glass, metal, painted wood, dirt, foliage.
  - For each surface: `BaseColor`, `Normal`, `Roughness`, and optional `AO/Metallic/Height` maps.
- **3D modular buildings/props:** storefront kits, streetlights, benches, signs, fences, dumpsters, barricades, decals.
- **Vegetation:** trees, bushes, grass clumps.
- **Character models + animations:** player, zombies, idle/walk/run/attack/hit/death animations.
- **VFX textures/sprites:** fire, smoke, embers, sparks, glow/noise masks.
- **UI assets:** mission header, timer frame, icon set, panel backgrounds.

> If you do not already own these assets, we can use marketplaces (Synty, KitBash, CGTrader, Sketchfab, Unreal/Fab, Unity Asset Store equivalents) with compatible licenses.

## 3) Art direction package (required before production)

Please provide:

- 5-10 reference screenshots for **target mood** (night, neon, wet road, mission urgency).
- Color script (main palette + accent colors).
- Detail level target (stylized-low-poly, stylized-mid-poly, semi-realistic).
- Platform targets (desktop/mobile/browser constraints).

Without this package, the visual result will drift and rework cost becomes high.

## 4) Technical requirements for this repo

### Rendering and lighting

- Replace flat materials with `MeshStandardMaterial`/PBR maps where needed.
- Add **HDRI + baked/placed lights** for stronger night ambiance.
- Add emissive materials for neon signs and mission markers.
- Tune shadows and contact darkness for depth.

### Post-processing

- Add selective **bloom** for neon/fire/light bulbs.
- Add color grading/contrast/vignette and mild ambient occlusion.
- Optional subtle depth-of-field and film grain.

### Environment detail pass

- Road decals: cracks, stains, lane paint wear, puddles.
- Sidewalk variation: edge dirt, curb color breakup.
- Prop density pass: benches, boxes, barriers, clutter.
- Foliage layering: bushes + small grass cards.

### Characters and enemies

- Replace primitive enemies with rigged zombie meshes.
- Add animation state machine (idle/chase/attack/hit).
- Add eye/emissive details and hit feedback VFX.

### VFX pass

- Fire pits with particles + animated emissive light flicker.
- Smoke and ember particles.
- Footstep dust/spark (optional).

### UI polish

- Mission banner typography + glow treatment.
- Cleaner mission timer plate.
- Better HUD hierarchy and icon consistency.

### Performance (important for browser)

- Texture budget by tier (mobile vs desktop).
- LODs for buildings/props.
- Frustum culling and instance repeated meshes.
- Compressed textures (`KTX2/Basis`) and optimized glTF.

## 5) Team/resource requirements

Minimum recommended:

- 1x 3D environment artist
- 1x technical artist (materials, lighting, optimization)
- 1x gameplay/frontend engineer (integration)
- 1x UI artist (or UI-capable designer)

If solo, we can still do it, but timeline will be longer.

## 6) Expected timeline (realistic)

- **Week 1:** art direction lock + asset sourcing.
- **Week 2:** material/lighting baseline + first beauty pass.
- **Week 3:** character replacement + VFX + UI polish.
- **Week 4:** optimization + bug fixing + final polish.

## 7) Information I need from you now

To start immediately, please send:

1. Your target platform(s): desktop browser only, or mobile too.
2. Preferred visual style: stylized or realistic.
3. Asset budget range (free only / paid pack budget).
4. Whether you already have character and environment assets.
5. Priority: best visual quality vs stable FPS.
6. 3-5 more reference images (day/night, UI style, enemy style).

## 8) Definition of done for "reference-level" milestone

- Night city has layered lighting (street lamps + emissive signs + fire glow).
- Roads/sidewalks/buildings are textured and no longer flat-color boxes.
- Zombies are animated meshes, not primitive blocks.
- Fire/smoke/bloom post effects are visible and controlled.
- HUD matches a polished mission game style.
- Stable frame rate on target devices.
