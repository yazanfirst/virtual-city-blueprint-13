

## Fix: Ghost Direction Arrow Points Backwards (180° Off)

### Problem
The arrow subtracts only `cameraRotation.azimuth` from the angle-to-ghost, but in 3rd-person the player's forward direction is `azimuth + π`. This makes the arrow point exactly opposite to the correct direction.

### Change

**`src/components/mission/GhostHuntUI.tsx` — line 100-102**

Replace:
```ts
const angleToGhost = Math.atan2(gx - px, gz - pz);
return (angleToGhost - cameraRotation.azimuth) * (180 / Math.PI);
```

With:
```ts
const angleToGhost = Math.atan2(gx - px, gz - pz);
// Player faces direction (azimuth + PI) in 3rd person, so subtract that
return (angleToGhost - cameraRotation.azimuth - Math.PI) * (180 / Math.PI);
```

Single line change. Arrow will now correctly point toward the ghost relative to your screen view.

