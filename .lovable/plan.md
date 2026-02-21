

## Fix Routing + Unify Branding (Logo)

### 1. Swap Homepage and Marketing Page

**Current state:**
- `/` loads `Index.tsx` (simple hero page with Building2 icon)
- `/marketing` loads `Marketing.tsx` (the full landing page with SVG logo)

**Change:**
- `/` will load `Marketing.tsx` (the full landing page becomes the homepage)
- `/marketing` will redirect to `/` (using React Router's `Navigate` component)
- Remove old `Index.tsx` (no longer needed)

### 2. Create a Shared Logo Component

**Current state:**
- The Navbar (`Navbar.tsx`) uses a `Building2` Lucide icon as the logo
- The Marketing page uses `/virtual-city-logo.svg` (the correct logo)

**Change:**
- Create `src/components/Logo.tsx` -- a shared component rendering the SVG logo with the "Virtual Shop City" text
- Props: optional `size` (sm/md) for different contexts

### 3. Update Navbar to Use the Shared Logo

Replace the `Building2` icon block in `Navbar.tsx` with the new `<Logo />` component, matching the marketing page's look (SVG image + text).

### 4. Update Marketing Page to Use Shared Logo

Replace the inline logo markup in Marketing.tsx's navbar section with the shared `<Logo />` component.

### 5. Fix Internal Links

- Marketing page "Enter City" buttons: already point to `/city-map` (correct)
- Marketing page "Open a Shop" button: already points to `/auth` (correct merchant entry point)
- Marketing page internal nav logo link: update from `to="/"` (already correct after swap)

### Technical Summary

| File | Action |
|------|--------|
| `src/components/Logo.tsx` | **Create** -- shared logo component using `/virtual-city-logo.svg` |
| `src/App.tsx` | Swap routes: `/` renders Marketing, `/marketing` redirects to `/` via `Navigate`, remove Index import |
| `src/pages/Index.tsx` | **Delete** (replaced by Marketing as homepage) |
| `src/components/Navbar.tsx` | Replace Building2 icon with `<Logo />` component |
| `src/pages/Marketing.tsx` | Replace inline logo with `<Logo />` component |

