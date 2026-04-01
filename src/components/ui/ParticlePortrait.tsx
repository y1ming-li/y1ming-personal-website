"use client";

import { useEffect, useRef } from "react";

// ── Constants ─────────────────────────────────────────────────────────────────
const SIZE          = 500;   // canvas logical size (px)
const SPHERE_R      = 210;   // sphere radius (px)
const TILT_X        = 0.38; // fixed X-tilt for a natural 3-D look
const SPIN_SPEED    = 0.005; // idle auto-spin (rad / frame)
const MAX_PART      = 20000; // particle cap
const IMG_STEP      = 2;     // portrait sample stride (px)
const SPRING        = 0.10;  // spring stiffness — tighter keeps particles on the sphere
const DAMP          = 0.82;  // velocity damping — higher = snappier, less drift
const REVEAL_R      = 90;    // cursor influence radius (canvas px)
const REVEAL_SPEED  = 0.1;  // per-particle progress gain per frame inside radius
const RETREAT_SPEED = 0.001; // per-particle progress loss per frame outside radius
const N_CLUSTERS    = 80;    // number of distinct blobs on the sphere
const CLUSTER_R     = 0.09;  // blob radius in unit-sphere space (≈ SPHERE_R × 0.09 px)

// ── Types ─────────────────────────────────────────────────────────────────────
interface Particle {
  sx: number; sy: number; sz: number; // unit-sphere position
  px: number; py: number;             // portrait pixel target
  pr: number; pg: number; pb: number; pa: number; // portrait colour
  x: number; y: number; vx: number; vy: number;  // animated state
  prog: number;                       // 0 = sphere, 1 = portrait (per-particle)
}

// ── Maths helpers ─────────────────────────────────────────────────────────────

function fibSphere(n: number): Float32Array {
  const buf = new Float32Array(n * 3);
  const phi = Math.PI * (3 - Math.sqrt(5));
  for (let i = 0; i < n; i++) {
    const y = 1 - (i / (n - 1)) * 2;
    const r = Math.sqrt(1 - y * y);
    const θ = phi * i;
    buf[i * 3]     = Math.cos(θ) * r;
    buf[i * 3 + 1] = y;
    buf[i * 3 + 2] = Math.sin(θ) * r;
  }
  return buf;
}

/**
 * Distribute n points into nClusters blobs on the unit sphere.
 * Cluster centroids are fibonacci-distributed; particles within each cluster
 * are arranged in a golden-angle spiral on the tangent plane, capped by clusterR.
 */
function clusterSphere(n: number, nClusters: number, clusterR: number): Float32Array {
  const buf       = new Float32Array(n * 3);
  const centroids = fibSphere(nClusters);
  const clusterSize = Math.ceil(n / nClusters);
  const spiral      = Math.PI * (3 - Math.sqrt(5)); // golden angle

  for (let k = 0; k < n; k++) {
    const ci  = k % nClusters;             // which cluster
    const wi  = Math.floor(k / nClusters); // index within cluster

    const ccx = centroids[ci * 3];
    const ccy = centroids[ci * 3 + 1];
    const ccz = centroids[ci * 3 + 2];

    // Build two orthonormal tangent vectors at the centroid.
    // Use (1,0,0) as the "up" reference when centroid is near Y-pole, else (0,1,0).
    const useX  = Math.abs(ccy) >= 0.99;
    const upX   = useX ? 1 : 0;
    const upY   = useX ? 0 : 1;
    // t1 = centroid × up  (lies in tangent plane)
    let t1x = ccy * 0   - ccz * upY;
    let t1y = ccz * upX - ccx * 0;
    let t1z = ccx * upY - ccy * upX;
    const t1len = Math.sqrt(t1x * t1x + t1y * t1y + t1z * t1z) || 1;
    t1x /= t1len; t1y /= t1len; t1z /= t1len;
    // t2 = centroid × t1  (perpendicular tangent, automatically unit-length)
    const t2x = ccy * t1z - ccz * t1y;
    const t2y = ccz * t1x - ccx * t1z;
    const t2z = ccx * t1y - ccy * t1x;

    // Place particle wi in a golden-angle spiral inside the cluster disc.
    const angle = spiral * wi;
    const r     = Math.sqrt(wi / clusterSize) * clusterR; // uniform-area radial spread

    const osx = ccx + r * (Math.cos(angle) * t1x + Math.sin(angle) * t2x);
    const osy = ccy + r * (Math.cos(angle) * t1y + Math.sin(angle) * t2y);
    const osz = ccz + r * (Math.cos(angle) * t1z + Math.sin(angle) * t2z);

    // Re-project onto unit sphere surface
    const mag    = Math.sqrt(osx * osx + osy * osy + osz * osz) || 1;
    buf[k * 3]     = osx / mag;
    buf[k * 3 + 1] = osy / mag;
    buf[k * 3 + 2] = osz / mag;
  }
  return buf;
}

function rotatePt(
  sx: number, sy: number, sz: number,
  rx: number, ry: number,
  out: Float32Array, off: number,
) {
  const cosx = Math.cos(rx), sinx = Math.sin(rx);
  const y1 = sy * cosx - sz * sinx;
  const z1 = sy * sinx + sz * cosx;
  const cosy = Math.cos(ry), siny = Math.sin(ry);
  out[off]     =  sx * cosy + z1 * siny;
  out[off + 1] =  y1;
  out[off + 2] = -sx * siny + z1 * cosy;
}


// ── Component ─────────────────────────────────────────────────────────────────
export function ParticlePortrait() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const rafRef    = useRef<number>(0);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d")!;
    if (!ctx) return;

    const dpr = window.devicePixelRatio || 1;
    canvas.width  = SIZE * dpr;
    canvas.height = SIZE * dpr;
    ctx.scale(dpr, dpr);

    const cx = SIZE / 2, cy = SIZE / 2;

    let particles: Particle[] = [];
    let sortedIdx: number[]   = [];
    let rotBuf  = new Float32Array(0);
    let ready   = false;
    let hovering = false;
    let mouseX  = cx;
    let mouseY  = cy;
    let rotY    = 0;

    // ── Sample portrait ───────────────────────────────────────────────────
    const img = new Image();
    img.src = "/profile.PNG";

    img.onload = () => {
      const off = document.createElement("canvas");
      off.width = off.height = SIZE;
      const oc = off.getContext("2d", { willReadFrequently: true })!;
      const { naturalWidth: iw, naturalHeight: ih } = img;
      let sx = 0, sy = 0, sw = iw, sh = ih;
      if (iw / ih > 1) { sx = (iw - ih) / 2; sw = ih; }
      else              { sy = (ih - iw) / 2; sh = iw; }
      oc.drawImage(img, sx, sy, sw, sh, 0, 0, SIZE, SIZE);
      const { data } = oc.getImageData(0, 0, SIZE, SIZE);

      const cands: [number, number, number, number, number, number][] = [];
      for (let py = 0; py < SIZE; py += IMG_STEP)
        for (let px = 0; px < SIZE; px += IMG_STEP) {
          const i = (py * SIZE + px) * 4;
          if (data[i + 3] < 40) continue;
          cands.push([px, py, data[i], data[i + 1], data[i + 2], data[i + 3]]);
        }

      let chosen = cands;
      if (cands.length > MAX_PART) {
        const stride = cands.length / MAX_PART;
        chosen = Array.from({ length: MAX_PART }, (_, k) => cands[Math.round(k * stride)]);
      }

      const n      = chosen.length;
      const sphere = clusterSphere(n, N_CLUSTERS, CLUSTER_R);
      rotBuf    = new Float32Array(n * 3);
      sortedIdx = Array.from({ length: n }, (_, k) => k);

      for (let k = 0; k < n; k++)
        rotatePt(sphere[k*3], sphere[k*3+1], sphere[k*3+2], TILT_X, 0, rotBuf, k*3);

      particles = chosen.map(([px, py, pr, pg, pb, pa], k) => {
        const depth = (rotBuf[k*3+2] + 1) / 2;
        const sc    = SPHERE_R * (0.65 + 0.35 * depth);
        return {
          sx: sphere[k*3], sy: sphere[k*3+1], sz: sphere[k*3+2],
          px, py, pr, pg, pb, pa,
          x:  cx + rotBuf[k*3]   * sc,
          y:  cy + rotBuf[k*3+1] * sc,
          vx: 0, vy: 0,
          prog: 0,
        };
      });

      ready = true;
    };

    // ── Animation ─────────────────────────────────────────────────────────
    function animate() {
      ctx.clearRect(0, 0, SIZE, SIZE);

      rotY += SPIN_SPEED;

      if (!ready) { rafRef.current = requestAnimationFrame(animate); return; }

      const n = particles.length;

      // Rotated 3-D coords for all particles
      for (let k = 0; k < n; k++)
        rotatePt(particles[k].sx, particles[k].sy, particles[k].sz, TILT_X, rotY, rotBuf, k*3);

      // Z-sort only when no particle is mid-transition (pure sphere idle state)
      if (!hovering)
        sortedIdx.sort((a, b) => rotBuf[a*3+2] - rotBuf[b*3+2]);

      for (const k of sortedIdx) {
        const p     = particles[k];
        const depth = (rotBuf[k*3+2] + 1) / 2;
        const sc    = SPHERE_R * (0.65 + 0.35 * depth);
        const sphX  = cx + rotBuf[k*3]   * sc;
        const sphY  = cy + rotBuf[k*3+1] * sc;

        // ── Per-particle progress driven by cursor proximity ───────────
        if (hovering) {
          const dx = mouseX - p.x;
          const dy = mouseY - p.y;
          const dist = Math.sqrt(dx * dx + dy * dy);
          if (dist < REVEAL_R) {
            // Smooth falloff so particles at the edge of the brush transition slower
            const influence = 1 - dist / REVEAL_R;
            p.prog = Math.min(1, p.prog + REVEAL_SPEED * influence);
          } else {
            p.prog = Math.max(0, p.prog - RETREAT_SPEED);
          }
        } else {
          // Mouse left — all particles retreat back to sphere
          p.prog = Math.max(0, p.prog - RETREAT_SPEED);
        }

        // Ease-in-out
        const t = p.prog < 0.5
          ? 2 * p.prog * p.prog
          : 1 - Math.pow(-2 * p.prog + 2, 2) / 2;

        // Target lerps between sphere projection and portrait pixel
        const targX = sphX + (p.px - sphX) * t;
        const targY = sphY + (p.py - sphY) * t;

        p.vx = (p.vx + (targX - p.x) * SPRING) * DAMP;
        p.vy = (p.vy + (targY - p.y) * SPRING) * DAMP;
        p.x += p.vx;
        p.y += p.vy;

        // Always use the particle's own portrait colour.
        // In sphere mode dim by depth so the ball has visible 3-D shading;
        // in portrait mode restore full opacity.
        const portraitA = p.pa / 255;
        const sphereA   = (0.20 + depth * 0.80) * portraitA;
        const bA        = sphereA + (portraitA - sphereA) * t;

        // Sphere: tiny dot so particles have breathing room between them.
        // Portrait: larger dot so adjacent 2-px samples tile seamlessly.
        const radius = (0.7 + depth * 0.8) * (1 - t) + 2.0 * t;

        ctx.beginPath();
        ctx.arc(p.x, p.y, radius, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(${p.pr},${p.pg},${p.pb},${bA.toFixed(2)})`;
        ctx.fill();
      }

      rafRef.current = requestAnimationFrame(animate);
    }

    rafRef.current = requestAnimationFrame(animate);

    // ── Mouse events ──────────────────────────────────────────────────────
    const onEnter = () => { hovering = true; };
    const onLeave = () => { hovering = false; };
    const onMove  = (e: MouseEvent) => {
      const rect = canvas.getBoundingClientRect();
      mouseX = (e.clientX - rect.left) * (SIZE / rect.width);
      mouseY = (e.clientY - rect.top)  * (SIZE / rect.height);
    };

    canvas.addEventListener("mouseenter", onEnter);
    canvas.addEventListener("mouseleave", onLeave);
    canvas.addEventListener("mousemove",  onMove);

    return () => {
      cancelAnimationFrame(rafRef.current);
      canvas.removeEventListener("mouseenter", onEnter);
      canvas.removeEventListener("mouseleave", onLeave);
      canvas.removeEventListener("mousemove",  onMove);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      style={{ width: SIZE, height: SIZE }}
      aria-label="Portrait"
    />
  );
}
