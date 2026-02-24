

## Plan: Refined Professional Hooded Character with Better Proportions

The current implementation already uses LatheGeometry, TubeGeometry, and octahedron eyes, but the result doesn't look right in-game. The issue is with **proportions, positioning, and profile curves** -- the hood looks like a spinning top rather than a proper hood, and parts don't connect naturally.

This plan rewrites the same file with corrected geometry to produce a more convincing hooded figure.

### What's Wrong Now

1. **Hood**: The LatheGeometry rotates the profile 360 degrees, creating a symmetrical bell shape. A real hood needs to be **open at the front** and deeper at the back -- not a perfect radial shape.
2. **Face position**: Eyes and face void are too high (Y=1.55-1.56) relative to the hood center (Y=1.35), making them float above the hood.
3. **Torso-hood gap**: The torso ends at Y=1.3 and the hood starts at Y=1.35, but there's no visual neck/collar connection.
4. **Sleeve accents**: The TubeGeometry curves use world-space coordinates but are placed inside arm groups that have their own position offset, causing misalignment.
5. **Overall silhouette**: The character looks like stacked geometric shapes rather than a cohesive figure.

### What Changes

**`src/components/3d/LowPolyCharacter.tsx`** -- single file rewrite of geometry and positions. Animation system stays identical.

### Corrected Design

```text
        ╭━━━━━━━━━╮
        ┃  HOOD   ┃  ← Sphere (scaled Y:1.2, Z:0.9) for natural oval hood
        ┃ ╭─────╮ ┃     NOT LatheGeometry (which creates a spinning top)
        ┃ ┃ ◆ ◆ ┃ ┃  ← Eyes properly recessed inside hood
        ┃ ╰─────╯ ┃
        ╰━━━┳━━━━━╯
         ╭━━┻━━╮
         ┃NECK ┃  ← Short cylinder connecting hood to torso
         ╰━┳━━━╯
        ╭━━┻━━━━╮
   ╭━━━━┫ TORSO ┣━━━━╮
   ┃ARM ┃       ┃ ARM┃  ← Capsule arms with proper shoulder attach
   ┃    ┃  ═══  ┃    ┃  ← Accent torus rings (local space, not TubeGeometry)
   ┃    ┃  (_)  ┃    ┃  ← Pocket torus arc
   ╰━━━━┫       ┣━━━━╯
        ╰━━┳━━━╯
        ╭━━┻━━╮
        ┃LEGS ┃  ← Capsule legs
        ╰━━┳━━╯
        ╭━━┻━━╮
        ┃BOOT ┃  ← Capsule boots (short, wide)
        ╰━━━━━╯
```

### Key Fixes

**Hood approach change**: Replace LatheGeometry with a **scaled sphere** (`scaleY: 1.2, scaleZ: 0.85`) combined with:
- A **second sphere** (slightly smaller, darker) recessed inside for the face void depth
- A **cone** collar at the bottom connecting to the torso
- A **sphere section** at the back for drape effect

This produces a natural hood shape that is round, slightly elongated on top, and slightly compressed front-to-back -- much more like a real hoodie hood than a lathe-rotated profile.

**Torso approach change**: Replace LatheGeometry with a **capsule** (wide radius, short height) combined with a **cylinder** for the main body. This is simpler but reads better as a hoodie body than the lathe profile which creates visible radial seams.

**Sleeve accents fix**: Use **torus** rings in **local arm-group coordinates** (centered at 0,0,0 with Y offsets) instead of TubeGeometry with world-space coordinates that don't align with the arm group transforms.

**Boot simplification**: Replace LatheGeometry boots with short wide **capsules** -- they read better at game-camera distance and avoid the lathe radial artifact.

### Corrected Proportions

| Part | Y Position | Geometry | Scale |
|------|-----------|----------|-------|
| Hood | 1.55 | Sphere r=0.28 | Y:1.2, Z:0.85 |
| Face void | 1.52 | Sphere r=0.18 | -- |
| Eyes | 1.53 | Octahedron r=0.025 | -- |
| Eye halos | 1.53 | Sphere r=0.04 | transparent |
| Neck | 1.32 | Cylinder r=0.1, h=0.1 | -- |
| Hood collar | 1.38 | Cone r=0.22/0.15, h=0.12 | -- |
| Hood drape | 1.45 | Sphere section | scaleZ:0.5 |
| Torso | 0.95 | Capsule r=0.2, h=0.45 | -- |
| Chest accent | 1.12 | Torus r=0.18, tube=0.008 | scaleY:0.3 |
| Pocket accent | 0.85 | Torus r=0.1, tube=0.006 | scaleY:0.3, half |
| Arms (pivot) | 1.18 | Group | -- |
| Upper arm | -0.12 (local) | Capsule r=0.07, h=0.18 | -- |
| Lower arm | -0.32 (local) | Capsule r=0.055, h=0.14 | -- |
| Hand | -0.45 (local) | Icosahedron r=0.05 | -- |
| Sleeve rings | -0.1, -0.2 (local) | Torus r=0.075, tube=0.007 | -- |
| Legs (pivot) | 0.55 | Group | -- |
| Upper leg | -0.08 (local) | Capsule r=0.075, h=0.18 | -- |
| Lower leg | -0.28 (local) | Capsule r=0.06, h=0.14 | -- |
| Boot | -0.42 (local) | Capsule r=0.07, h=0.06 | scaleX:1.2 |

### Materials (same palette, minor tweaks)

All materials stay the same dark theme with cyan emissive accents. Hood uses `roughness: 0.9` for matte fabric. Eyes use `emissiveIntensity: 4.0` with pulsing. Accent lines use `emissiveIntensity: 2.5` with pulsing.

### Animation -- Zero Changes

The entire `useFrame` block is preserved exactly:
- Idle bob, walk bounce on `groupRef`
- Arm swing on `leftArmRef`/`rightArmRef`
- Leg swing on `leftLegRef`/`rightLegRef`
- Eye pulse and accent pulse

All 5 refs, same positions, same props API.

### File Changed

**`src/components/3d/LowPolyCharacter.tsx`** -- geometry and positioning rewrite. No other files touched.

