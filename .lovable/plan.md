

## Plan: Smart Anchor Placement + Shadow Ladder Climbing

### Summary
1. Anchors dynamically placed based on active shops — **inside active shops** (ground level) or **on rooftops** (inactive/empty spots). The existing mini-map already shows anchor dots, so players naturally navigate using the map. No new glowing effects needed.
2. Shadows gain ladder-climbing ability — when the player is on a rooftop, nearby shadows head to the nearest ladder and climb up to chase them.

---

### Changes

**1. `src/stores/mirrorWorldStore.ts` — Dynamic anchor positions**

- `createAnchors` accepts an optional `activeShopPositions: Set<string>` parameter (stringified `"x,z"` keys)
- For each of the 5 `ANCHOR_POSITIONS`, check if a matching shop exists at that X/Z:
  - **Active shop** → Y = 1.5 (ground level, inside shop area)
  - **No shop / inactive** → Y = 8 (rooftop, as current)
- `startMission` accepts optional `shopBrandings` array, builds the `activeShopPositions` set from shops where `hasShop === true`, passes it to `createAnchors`
- `resetMission` also uses the same logic

**2. `src/components/mission/MirrorWorldPanel.tsx` — Pass shop data to startMission**

- Accept `shopBrandings` prop
- Pass it to `startMission(shopBrandings)` in `handleActivate`

**3. `src/components/3d/CityScene.tsx` — Thread shopBrandings to MirrorWorldPanel**

- Where `MirrorWorldPanel` is rendered, pass the existing `shopBrandings` prop through

**4. `src/components/mission/MirrorWorldUI.tsx` — Update hint text**

- Change hint from "Follow the purple dots on the map to rooftop anchors" to "Follow the purple dots on the map — anchors are inside shops or on rooftops"

**5. `src/components/3d/MirrorShadow.tsx` — Shadow ladder climbing**

- Add `LADDER_POSITIONS` array (same 5 positions from MirrorWorldUI)
- In `useFrame`, when the player Y > 7.5 (on roof):
  - Shadow finds nearest ladder base
  - If within ~4 units of a ladder base, lerp Y from ground to 8.2 over ~1.5s
  - Once at rooftop height, resume mirrored movement at that Y
- When player drops back to ground (Y < 1.5):
  - Shadow lerps Y back down to ground level at the nearest ladder
- Add `isClimbing` ref to pause horizontal movement during climb
- Shadow aura opacity pulses faster while climbing (visual cue)

**6. `src/components/mission/MirrorWorldBriefing.tsx` — Update briefing text**

- Mention that some anchors are hidden inside active shops while others are on rooftops

---

### How It Plays
- Player starts Mirror World, opens the mini-map — sees purple dots at different locations
- Some dots are at ground level near active shops (easy to walk to), others on rooftops (need ladders)
- When player climbs a ladder to reach a rooftop anchor, shadows start heading toward the nearest ladder
- After a short delay, a shadow climbs up and chases the player on the roof — creating urgency to grab and drop down fast
- The map already shows all this — no extra glowing needed

