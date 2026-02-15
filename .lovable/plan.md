

## Problem

When editing a product in the Showcase Wall dialog, if you switch to another browser tab (e.g., to copy a product description) and come back, all your form data disappears. This happens because React Query automatically refetches data when the browser window regains focus, which triggers a re-render and can reset the form state.

## Solution

Persist the edit form data in `sessionStorage` while the dialog is open, following the same pattern already used in the `EditShop.tsx` page. This way, even if the component re-renders or data refetches, the user's in-progress edits are preserved.

## Technical Details

**File: `src/components/merchant/ShopShowcaseWall.tsx`**

1. **Add a sessionStorage key** based on `shopId` and the slot index being edited (e.g., `showcaseEdit-{shopId}-{slotIndex}`).

2. **On opening the edit dialog** (`openEditDialog`): Check sessionStorage for a saved draft. If one exists, restore it into `editForm` instead of loading from the current slot data.

3. **On every form field change**: Save the current `editForm` state to sessionStorage automatically (debounced or immediate).

4. **On successful save**: Clear the sessionStorage draft for that slot.

5. **On dialog close (cancel)**: Clear the sessionStorage draft (user intentionally discarded changes).

6. **Prevent React Query refetch from overwriting the edit state**: Add a guard in the `useEffect` that syncs `items` to `slots` so it does not interfere with the active `editForm` state while the dialog is open.

This ensures that switching tabs, refreshing, or any background data refetch will not lose the merchant's in-progress product edits.

