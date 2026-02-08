

# UI Interaction Audit Report: Button & Modal Layering

## Executive Summary

After reviewing all 30+ interactive components across the game HUD, modals, mission panels, shop UI, and mobile controls, the codebase is **largely well-implemented** with consistent use of `onPointerDown` + `stopPropagation` + `touch-manipulation`. However, there are **7 specific issues** that can cause buttons to not respond on the first click.

---

## Z-Index Layer Map (Current State)

```text
Layer 1000  Dialog overlay (Radix UI default)
Layer  400  JumpScareModal
Layer  300  RedemptionCodeModal, PauseOverlay, MissionFailedModal,
            GhostHuntFailedModal, GhostHuntCompleteModal,
            ShopProximityIndicator
Layer  250  ShopInteriorRoom, TrapHitFeedback
Layer  240  ZombieMissionCompleteModal
Layer  220  MirrorWorldBriefing, MirrorWorldComplete, MirrorWorldFailed
Layer  200  GhostHuntUI (briefing), TutorialTooltip, MissionPopup, 2DMapOverlay
Layer  160  MirrorWorldUI toast/prompt overlays, Map toggle button
Layer  150  HUD elements (timer, health, stats, equipment, side panels, top bar)
Layer  100  ShopDetailModal, Toast notifications
Layer   50  Game container (fixed inset-0)
Layer   10  Canvas loading overlay
```

---

## Issues Found

### ISSUE 1: MirrorWorldUI "Climb" and "Drop Down" buttons use `onClick` instead of `onPointerDown`
**File:** `src/components/mission/MirrorWorldUI.tsx` (lines 170-203)
**Severity:** High (Mobile)
**Problem:** The "Climb" (line 173) and "Drop Down" (line 182) buttons use `onClick` instead of `onPointerDown`. On mobile, `onClick` fires with a ~300ms delay and can be intercepted by the camera touch handler in MobileControls. These buttons also lack `data-control-ignore="true"`, so the camera system may consume the touch before the click event fires.
**Fix:** Change both buttons to use `onPointerDown` with `e.stopPropagation()` and add `data-control-ignore="true"`.

### ISSUE 2: MirrorWorldBriefing, MirrorWorldComplete, and MirrorWorldFailed lack touch event blocking
**Files:** `MirrorWorldBriefing.tsx`, `MirrorWorldComplete.tsx`, `MirrorWorldFailed.tsx`
**Severity:** Medium (Mobile)
**Problem:** These three modals at z-index 220 do NOT have `onPointerDown`, `onTouchStart`, or `onClick` event handlers with `stopPropagation()` on their backdrop container. This means touches on these modals can propagate through to the game canvas/MobileControls behind them, potentially causing camera movement or joystick activation while interacting with modal buttons. Other modals at the same or higher z-level (like GhostHuntFailedModal, MissionFailedModal, JumpScareModal) all correctly block these events.
**Fix:** Add `onPointerDown={(e) => e.stopPropagation()}` and `onTouchStart={(e) => e.stopPropagation()}` to the backdrop container of all three modals.

### ISSUE 3: ZombieMissionCompleteModal missing touch event blocking
**File:** `src/components/mission/ZombieMissionCompleteModal.tsx`
**Severity:** Medium (Mobile)
**Problem:** Same issue as Issue 2 -- the modal container at z-[240] lacks `onPointerDown` and `onTouchStart` handlers with `stopPropagation()`. Touch events can propagate to game controls behind it.
**Fix:** Add event blocking handlers to the backdrop container.

### ISSUE 4: QuestionModal radio options use both `onPointerDown` and `onClick` creating double-fire risk
**File:** `src/components/mission/QuestionModal.tsx` (lines 84-89)
**Severity:** Low (Desktop + Mobile)
**Problem:** Each question option button has BOTH `onPointerDown` and `onClick` handlers that both call `setSelectedOption(option)`. While harmless for selection (idempotent), this pattern can cause subtle timing issues where the selected state appears to "not register" on fast taps because `onPointerDown` fires, then `onClick` fires again slightly later, potentially interfering with React batching. More importantly, the `onPointerDown` handler does not call `e.stopPropagation()`, which could allow the event to bubble up to the Dialog overlay.
**Fix:** Remove the `onClick` handler (keep `onPointerDown` only with `e.stopPropagation()`), matching the pattern used by all other interactive elements in the codebase.

### ISSUE 5: TrapHitFeedback overlay at z-[250] blocks clicks on ShopInteriorRoom buttons
**File:** `src/components/mission/TrapHitFeedback.tsx`
**Severity:** Low (Edge case)
**Problem:** When a trap hit triggers, the TrapHitFeedback overlay renders at z-[250] with `pointer-events-none` which is correct. However, the red flash overlay (`bg-red-500/30 animate-pulse`) inside it covers the entire screen. While `pointer-events-none` prevents click interception, during the 800ms animation, the visual flash can make users think their click failed, leading to a perceived "button not working" experience. This is cosmetic but contributes to the reported issue perception.
**Fix:** No code change needed -- this is working correctly with `pointer-events-none`. Document for awareness.

### ISSUE 6: ShopDetailModal backdrop uses `onClick` for close instead of `onPointerDown`
**File:** `src/components/3d/ShopDetailModal.tsx` (line 96)
**Severity:** Medium (Desktop + Mobile)
**Problem:** The backdrop container uses `onClick={onClose}` to close the modal when clicking outside. On mobile, `onClick` fires ~300ms after the touch, during which time a user might also be touching a button inside the modal. The inner modal card has `onClick={(e) => e.stopPropagation()}` which is also `onClick`-based. If a user taps a button fast, the `onPointerDown` on the button fires first and processes the action, but then the `onClick` on the backdrop fires and closes the modal prematurely -- causing the "button didn't work" perception (the action executed but the modal closed immediately). Other modals (MissionPopup, 2DMap) use `onClick` on backdrop for close AND `onClick` + `stopPropagation` on inner content, which is the same pattern. But ShopDetailModal is unique because its inner buttons use `onPointerDown` while the backdrop uses `onClick`, creating a timing mismatch.
**Fix:** Change the backdrop from `onClick={onClose}` to `onPointerDown={onClose}`. Also change the inner card `onClick={(e) => e.stopPropagation()}` to `onPointerDown={(e) => e.stopPropagation()}` (it already has this, so just remove the redundant `onClick`).

### ISSUE 7: RedemptionCodeModal lacks `data-control-ignore="true"` on backdrop
**File:** `src/components/mission/RedemptionCodeModal.tsx`
**Severity:** Low (Mobile during gameplay)
**Problem:** While the modal at z-[300] correctly stops pointer propagation, it does not have `data-control-ignore="true"` on its container. The MobileControls touch handler checks for this attribute to determine whether to start camera tracking. Without it, when the modal opens, any new touches that start on the modal (before propagation is stopped) could briefly be captured by the MobileControls window-level touchstart listener before the modal's onPointerDown handler fires.
**Fix:** Add `data-control-ignore="true"` to the modal container.

---

## What Is Already Working Well

- All major modals (MissionFailedModal, GhostHuntFailedModal, JumpScareModal, PauseOverlay) have comprehensive event blocking with `onPointerDown`, `onTouchStart`, and `onClick` propagation stops.
- All HUD buttons consistently use `onPointerDown` + `stopPropagation` + `data-control-ignore="true"`.
- MobileControls correctly checks for `data-control-ignore`, button/link elements, and joystick bounds before starting camera tracking.
- The ShopProximityIndicator uses elevated z-index (300) with both `onPointerDown` and `onTouchEnd` handlers.
- GameStartScreen uses `onPointerDown` with `data-control-ignore`.
- ShopOfferCard and EligibleOffersPanel use `onPointerDown` with stopPropagation.

---

## Implementation Plan

### Step 1: Fix MirrorWorldUI buttons (Issue 1)
Change "Climb" and "Drop Down" buttons from `onClick` to `onPointerDown` with `e.stopPropagation()` and add `data-control-ignore="true"`.

### Step 2: Add event blocking to Mirror World modals (Issue 2)
Add `onPointerDown` and `onTouchStart` with `stopPropagation` to:
- `MirrorWorldBriefing.tsx` backdrop
- `MirrorWorldComplete.tsx` backdrop
- `MirrorWorldFailed.tsx` backdrop

### Step 3: Add event blocking to ZombieMissionCompleteModal (Issue 3)
Add `onPointerDown` and `onTouchStart` with `stopPropagation` to the backdrop container.

### Step 4: Fix QuestionModal option handlers (Issue 4)
Remove `onClick` from option buttons, keep `onPointerDown` only with `stopPropagation`.

### Step 5: Fix ShopDetailModal event type mismatch (Issue 6)
Change backdrop from `onClick` to `onPointerDown` for closing.

### Step 6: Add data-control-ignore to RedemptionCodeModal (Issue 7)
Add `data-control-ignore="true"` and `style={{ touchAction: 'manipulation' }}` to the modal container.

---

## Device-Specific Notes

### PC (Desktop)
- Most interactions work reliably due to mouse events having no delay.
- Issue 4 (QuestionModal double handler) is the most likely cause of perceived "click not working" on desktop -- when both handlers fire, React state updates may batch unpredictably.
- Issue 6 (ShopDetailModal) can cause premature modal close on fast clicks.

### Mobile (Touch)
- Issues 1-3 are the primary causes of "button not responding" on mobile.
- The MobileControls system attaches window-level touch listeners that run BEFORE component-level handlers. Without `data-control-ignore` and `stopPropagation`, touches on game overlays can be consumed by the camera rotation system.
- The 300ms `onClick` delay on mobile is the root cause of most perceived interaction failures -- the codebase correctly uses `onPointerDown` in most places, but the 7 identified locations still use `onClick`.

### Tablet
- Same issues as mobile, but less severe due to larger touch targets.
- Landscape orientation works correctly due to landscape-specific Tailwind classes.

