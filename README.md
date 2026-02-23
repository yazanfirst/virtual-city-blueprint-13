# Virtual City Blueprint

A browser-based 3D city game built with React, Vite, and Three.js (via React Three Fiber).

## Tech stack

- React + TypeScript
- Vite
- React Three Fiber / Drei / Three.js
- Zustand (state management)
- TanStack Query
- Supabase
- Tailwind CSS + shadcn/ui

## Getting started

### Prerequisites

- Node.js 18+
- npm

### Install

```bash
npm install
```

### Run locally

```bash
npm run dev
```

Then open the local URL shown by Vite.

## Available scripts

```bash
npm run dev       # Start local dev server
npm run build     # Production build
npm run build:dev # Development-mode build
npm run preview   # Preview production build
npm run lint      # Run ESLint
```

## Project structure (high level)

- `src/components/3d/` — 3D scene, player controller, shop visuals, mission/world props
- `src/pages/StreetView.tsx` — primary browser gameplay screen
- `src/stores/` — Zustand stores for player, game, mission and world state
- `src/hooks/` — data and gameplay hooks
- `supabase/` — migrations and edge functions

## Performance notes

The game is browser-first and tuned for runtime performance:

- Scene uses a performance-oriented WebGL setup.
- Lighting is intentionally simple and avoids heavy per-object dynamic lights.
- Mobile controls and behavior are handled separately for small/touch devices.

## Deployment

Build the app:

```bash
npm run build
```

Preview locally:

```bash
npm run preview
```

Deploy the `dist/` output using your preferred static hosting provider.
