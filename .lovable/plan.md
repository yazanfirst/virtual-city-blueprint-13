

## Fix: Remove Incorrect Math.PI Offset from Direction Arrow

### Problem
The screenshot clearly shows a ghost **directly in front** of the player, but the arrow points **down-left** (roughly opposite). The `- Math.PI` offset added in the previous fix is inverting the arrow direction.

### Root Cause
In this camera setup, `cameraRotation.azimuth` already represents the direction the player faces on screen. Subtracting `Math.PI` adds an unnecessary 180° flip.

### Change

**`src/components/mission/GhostHuntUI.tsx` line 102** — Remove `- Math.PI`:

```ts
// Before:
return (angleToGhost - cameraRotation.azimuth - Math.PI) * (180 / Math.PI);

// After:
return (angleToGhost - cameraRotation.azimuth) * (180 / Math.PI);
```

Single line change. The arrow will now correctly point toward the ghost relative to your screen.

