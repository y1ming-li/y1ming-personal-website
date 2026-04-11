# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

@AGENTS.md

## Commands

```bash
npm run dev      # start dev server at localhost:3000
npm run build    # production build (runs type-check + Next.js compiler)
npm run lint     # ESLint across the project
npm run start    # serve the production build
```

No test suite exists yet.

## Stack versions (non-obvious)

- **Next.js 16.2** with **React 19** — APIs and conventions differ from training data. Read `node_modules/next/dist/docs/` before writing Next.js code.
- **Tailwind CSS v4** — configured via `@import "tailwindcss"` in `globals.css` + `postcss.config.mjs`. No `tailwind.config.*` file; theme tokens are defined with `@theme inline` in `globals.css`.
- **Tailwind v4 preflight** sets `height: auto` on all `<img>` elements. Next.js `<Image>` components need an explicit `style={{ height: "Xpx" }}` to prevent aspect-ratio console warnings.

## Architecture

### Routing (`src/app/`)

The site uses the App Router. All user-facing pages live under the `(main)` route group, which wraps them in `Header` + `Footer` (`src/app/(main)/layout.tsx`). Pages are thin — they import one or two section components and render them.

| Route | Page |
|---|---|
| `/` | `src/app/page.tsx` — splash / landing |
| `/profile` | Hero + About + Skills |
| `/projects` | Projects (3-D cube ring) |
| `/discography` | Discography (stub) |
| `/contact` | Contact form |

`src/app/api/contact/route.ts` — POST handler that validates form fields; email/DB integration is a TODO stub.

### Design tokens (`src/app/globals.css`)

All colours are CSS variables on `:root` with dark-mode overrides:

| Token | Light | Dark |
|---|---|---|
| `--accent` | `#E60000` | (unchanged) |
| `--background` | `#FFFFFF` | `#2D0F1E` |
| `--card` | `#F7F7F7` | `#3F1528` |

Use Tailwind utility classes like `bg-background`, `text-accent`, `border-border`. Never hard-code these hex values in components.

### Data layer (`src/data/`)

Static config only — no CMS or external data fetching:
- `site.ts` — `siteConfig`, `navItems`, `socialLinks`
- `projects.ts` — `CubeItem[]` fed into the 3-D ring; each entry has `slug`, `title`, `shortTitle`, `subtitle`, `color` (hex accent), `body` (plain text), and optional `links[]`. **To add a project: append one object here — no other files need to change.**
- `skills.ts` — skill badges for the Skills section

### 3-D Projects section

Split across several files ported from the original `portfolio-site-main`:

- **`src/components/ui/ProjectListing.tsx`** — top-level ring. Manages `hoveredIndex` and `openIndex` state. Arranges `ProjectEntry` components in a circle: `angle = index * (2π / n)`, position = `[sin(angle) * radius, cos(angle) * radius, 0]`. Includes the `MeshDistortMaterial` blob sphere and "Click a cube" `<Text>` label.
- **`src/components/ui/ProjectEntry.tsx`** — individual cube. Uses `@react-spring/three` (`useSpring` with `config.stiff/wobbly`) for position and scale animations. On hover: `lookAt(camera.position)` lerp via `useFrame`. On open: cube moves to `[0, 0, 4]`. Uses `RoundedBoxGeometry` (from `three-stdlib`) and `CoffeeVideoMaterial`.
- **`src/components/ui/ProjectCubeMaterial.tsx`** — GLSL shader (inline template literals, no glslify). Uniforms: `projectColor` (vec3 from `project.color` hex), `unfreeze` (0→1), `time`, `seed`. Frozen state: red-tinted noise. Hover/open: `unfreeze` animates 0→1, noise wipes away to reveal solid project color. No video or texture — adapted from original `CoffeeVideoMaterial`.
- **`src/components/ui/ProjectHtmlModal.tsx`** — project detail overlay using `<Html>` from `@react-three/drei`. Renders `ProjectHeader`, `ProjectBody`, `ProjectCTA` from `ProjectContent.tsx`. Close via button or Escape key.
- **`src/components/ui/ProjectContent.tsx`** — DOM content components (header, body as plain `<p>`, links, CTA). No PortableText — `body` is a plain string.
- **`src/components/ui/ProjectBackgroundMaterial.tsx`** — GLSL shader background mesh shown when a project is open. Perlin noise blob animated with `useFrame`.
- **`src/components/ui/ProjectsCanvas.tsx`** — `'use client'` wrapper that sets up `<Canvas>` + `<ProjectListing>`. Imported via `dynamic(..., { ssr: false })` from the projects page.

Key patterns:
- **Spring animations**: `useSpring` from `@react-spring/three` for cube `position` and `scale`. `animated.group` is the wrapper element.
- **Auto-hover cycling**: `useInterval` cycles `hoveredIndex` every 2 s on touch devices when no project is open.
- **Floating offset**: `useInterval` randomises a `cubeFloatingOffset` per cube on a staggered interval (2.5–7.5 s). `useSpring` with long `duration` smoothly interpolates to the new offset.
- **Blob background**: `MeshDistortMaterial` sphere at `z = -5`, `scale` spring-animated from 0 → 1 when `openIndex !== null`.

### Particle portrait (`src/components/ui/ParticlePortrait.tsx`)

Canvas 2-D animation in the Hero section. Samples `public/profile.PNG`, maps pixels to particles that idle as a spinning sphere cluster and reveal the portrait on hover. See `README.md` for detailed algorithm notes and tuning constants.

### Navigation / layout

- `Header` is sticky; the logo fades when the hamburger menu is open.
- `HamburgerMenu` is a full-screen overlay rendered as a sibling to `<header>`, not inside it, to allow independent z-index control.
- `NavLink` uses Next.js `<Link>` with active-state detection via `usePathname`.
