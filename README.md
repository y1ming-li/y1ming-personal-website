This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Interactive Particle Portrait

The Hero section renders a portrait (`public/profile.PNG`) as an interactive particle system on an HTML5 `<canvas>`.

**File:** `src/components/ui/ParticlePortrait.tsx`

### Two visual states

**Idle — rotating cluster ball**
Up to 20 000 particles form 80 distinct blobs on the surface of a spinning sphere. The sphere auto-rotates continuously around the Y-axis.

**Hover — portrait reveal**
Moving the cursor over the canvas acts as a reveal brush. Particles within 90 px of the cursor gradually fly to their original pixel positions, reconstructing the photograph. Moving the cursor away causes particles to slowly drift back to the sphere.

---

### How the functions interact

#### 1. `fibSphere(n)` — uniform point distribution

Generates `n` evenly-spaced points on a unit sphere using the [Fibonacci / golden-angle method](https://arxiv.org/abs/0912.4540). Each point is returned as a flat `Float32Array` of `[x, y, z]` triples. Used internally by `clusterSphere` to place blob centroids.

#### 2. `clusterSphere(n, nClusters, clusterR)` — blob layout

Called once on load to assign every particle a fixed home on the sphere surface, grouped into `nClusters` blobs:

1. Calls `fibSphere(nClusters)` to place 80 centroid positions uniformly across the sphere.
2. For each particle `k`, computes `ci = k % nClusters` (which blob) and `wi = floor(k / nClusters)` (rank within that blob).
3. Builds a local **tangent frame** (two orthonormal vectors perpendicular to the centroid) so offsets stay on the sphere surface.
4. Places the particle at radius `√(wi / clusterSize) × CLUSTER_R` along a golden-angle spiral in that tangent plane — giving uniform area density within each blob.
5. Re-normalises the offset point back onto the unit sphere.

The result: every particle has a `(sx, sy, sz)` home that is clustered near one of 80 centroids.

#### 3. `rotatePt(sx, sy, sz, rx, ry, out, off)` — 3-D rotation

Rotates a unit-sphere point by angle `rx` around the X-axis then `ry` around the Y-axis and writes the result directly into a pre-allocated `Float32Array` (`rotBuf`) at byte offset `off`. Called in a tight loop every frame for all particles — writing into a shared buffer avoids per-frame heap allocations.

#### 4. `img.onload` — pixel sampling & particle construction

1. Center-crops the portrait to a square and draws it to an offscreen canvas scaled to 500 × 500.
2. Scans every `IMG_STEP` (2) pixels; skips any with alpha < 40.
3. If the candidate count exceeds `MAX_PART` (20 000), strides evenly through the list to subsample.
4. Calls `clusterSphere` to get sphere home positions, then calls `rotatePt` with `rotY = 0` to get the initial 2-D screen positions.
5. Creates a `Particle` object for each sample storing both identities — its sphere home `(sx, sy, sz)` and its portrait target `(px, py)` with colour `(pr, pg, pb, pa)` — plus its starting canvas position and `prog = 0`.

#### 5. `animate()` — frame loop (called via `requestAnimationFrame`)

Runs every frame (~16 ms at 60 fps):

**a. Rotation** — increments `rotY` by `SPIN_SPEED` each frame regardless of hover state.

**b. `rotatePt` batch** — re-rotates all `(sx, sy, sz)` positions into `rotBuf` using the new `rotY`. This gives the current sphere-projected screen position for every particle without allocating new arrays.

**c. Z-sort** — when not hovering, sorts `sortedIdx` by `rotBuf[z]` so back-facing particles are drawn first and front-facing particles paint over them, producing correct depth layering on the sphere.

**d. Per-particle loop** — for each particle (in sorted order):

- **Progress update:** if hovering and the particle is within `REVEAL_R` of the cursor, `prog` increases by `REVEAL_SPEED × (1 − dist/REVEAL_R)` — a linear falloff so the brush edge transitions slower than its centre. Otherwise `prog` decays by `RETREAT_SPEED` until it reaches 0.

- **Ease-in-out:** `prog` is mapped through a cubic ease-in-out curve to get `t ∈ [0, 1]`. This makes the transition accelerate out of sphere positions and decelerate into portrait positions (and vice-versa on retreat).

- **Target interpolation:** the frame target is `lerp(sphereProjected, portraitPixel, t)`. At `t = 0` the particle aims at its spinning sphere position; at `t = 1` it aims at its exact pixel coordinate in the portrait.

- **Spring physics:** a spring force `(target − current) × SPRING` is added to the velocity each frame, then velocity is multiplied by `DAMP`. The particle position advances by velocity. This produces organic, slightly elastic motion rather than a mechanical snap.

- **Rendering:** dot radius interpolates from `0.7–1.5 px` (sphere, depth-varied) to `2.0 px` (portrait, uniform). Alpha is the particle's own portrait alpha, dimmed by `0.20 + depth × 0.80` in sphere mode so back-facing particles appear darker, giving the ball a 3-D shaded look. Colour is always the sampled portrait pixel — no artificial hues are introduced.

#### 6. Mouse event handlers

- `onEnter` / `onLeave` toggle the `hovering` flag, which controls whether `prog` advances or retreats.
- `onMove` maps the raw cursor position from CSS pixels to logical canvas coordinates using the canvas bounding rect and the `SIZE / rect.width` scale factor, writing into `mouseX` / `mouseY` which the frame loop reads each tick.

All three listeners are attached to the `<canvas>` element and removed in the `useEffect` cleanup to prevent leaks on unmount.

---

### Tuning constants

| Constant | Value | Effect |
|---|---|---|
| `N_CLUSTERS` | `80` | Number of blobs on the sphere — fewer = bigger, more spaced clusters |
| `CLUSTER_R` | `0.09` | Blob radius in unit-sphere space (× `SPHERE_R` = px on screen) |
| `IMG_STEP` | `2` | Pixel sampling stride — lower = more particles, higher CPU cost |
| `MAX_PART` | `20 000` | Hard cap on particle count |
| `REVEAL_R` | `90` | Hover brush radius in canvas px |
| `REVEAL_SPEED` | `0.1` | Per-particle progress gain per frame inside brush |
| `RETREAT_SPEED` | `0.001` | Per-particle progress loss per frame outside brush |
| `SPRING` | `0.10` | Spring stiffness — higher = snappier motion |
| `DAMP` | `0.82` | Velocity decay per frame — lower = more oscillation |
| `SPHERE_R` | `210` | Sphere radius in canvas px |
| `SPIN_SPEED` | `0.005` | Auto-rotation speed in rad/frame |

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.
