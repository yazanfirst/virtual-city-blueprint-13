

## Fix Authenticated Routing Behavior

### Changes Overview

Four files need updates to properly separate marketing pages from authenticated app pages.

### 1. Marketing page (`src/App.tsx`) -- Wrap "/" with auth-aware redirect

Replace the plain `<Marketing />` route with a wrapper component that checks auth state:
- If user is NOT authenticated: show the Marketing landing page
- If user IS authenticated: redirect to `/city-map`

### 2. Auth page redirect fix (`src/pages/Auth.tsx`)

Currently on line 48, after login, players are redirected to `'/'`. Change this to `'/city-map'` so authenticated players go straight to the city map instead of the marketing page.

### 3. Logo dynamic linking (`src/components/Logo.tsx`)

The Logo component already supports a `linkTo` prop. No changes needed to the component itself.

### 4. Navbar logo link (`src/components/Navbar.tsx`)

Pass `linkTo` to the `<Logo>` based on auth state:
- Not logged in: `linkTo="/"`
- Logged in: `linkTo="/city-map"`

### 5. Marketing page navbar logo (`src/pages/Marketing.tsx`)

The marketing page has its own navbar with a `<Logo />`. Since this page is only shown to non-authenticated users, the default `linkTo="/"` is correct -- no change needed.

### Technical Details

| File | Change |
|------|--------|
| `src/App.tsx` | Create `AuthAwareHome` component that renders `<Marketing />` or `<Navigate to="/city-map" />` based on auth state; use it at `/` route |
| `src/pages/Auth.tsx` | Line 48: change `navigate('/')` to `navigate('/city-map')` |
| `src/components/Navbar.tsx` | Pass `linkTo={user ? "/city-map" : "/"}` to `<Logo />` |
| `src/components/Logo.tsx` | No changes needed (already has `linkTo` prop) |
| `src/pages/Marketing.tsx` | No changes needed |

