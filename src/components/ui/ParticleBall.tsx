"use client";

import { useEffect, useRef, useCallback } from "react";

interface Particle {
  x: number;
  y: number;
  z: number;
}

const PARTICLE_COUNT = 280;
const RADIUS = 130;
const BASE_SPEED = 0.004;

function fibonacci_sphere(count: number): Particle[] {
  const particles: Particle[] = [];
  const phi = Math.PI * (3 - Math.sqrt(5)); // golden angle

  for (let i = 0; i < count; i++) {
    const y = 1 - (i / (count - 1)) * 2;
    const r = Math.sqrt(1 - y * y);
    const theta = phi * i;
    particles.push({
      x: Math.cos(theta) * r,
      y,
      z: Math.sin(theta) * r,
    });
  }
  return particles;
}

export function ParticleBall() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const mouse = useRef({ x: 0, y: 0, active: false });
  const rotation = useRef({ x: 0.3, y: 0 });
  const velocity = useRef({ x: 0, y: BASE_SPEED });
  const rafRef = useRef<number>(0);
  const particles = useRef<Particle[]>(fibonacci_sphere(PARTICLE_COUNT));

  const handleMouseMove = useCallback((e: MouseEvent) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const cx = rect.left + rect.width / 2;
    const cy = rect.top + rect.height / 2;
    mouse.current = {
      x: (e.clientX - cx) / (rect.width / 2),
      y: (e.clientY - cy) / (rect.height / 2),
      active: true,
    };
  }, []);

  const handleMouseLeave = useCallback(() => {
    mouse.current.active = false;
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctxOrNull = canvas.getContext("2d");
    if (!ctxOrNull) return;
    const ctx: CanvasRenderingContext2D = ctxOrNull;

    const size = 300;
    canvas.width = size;
    canvas.height = size;
    const cx = size / 2;
    const cy = size / 2;

    // Rotation helpers
    function rotateX(p: Particle, a: number): Particle {
      const cos = Math.cos(a), sin = Math.sin(a);
      return { x: p.x, y: p.y * cos - p.z * sin, z: p.y * sin + p.z * cos };
    }
    function rotateY(p: Particle, a: number): Particle {
      const cos = Math.cos(a), sin = Math.sin(a);
      return { x: p.x * cos + p.z * sin, y: p.y, z: -p.x * sin + p.z * cos };
    }

    function draw() {
      ctx.clearRect(0, 0, size, size);

      // Update velocity based on mouse
      if (mouse.current.active) {
        velocity.current.x = mouse.current.y * 0.025;
        velocity.current.y = mouse.current.x * 0.025;
      } else {
        // Ease back to auto-spin
        velocity.current.x += (0 - velocity.current.x) * 0.05;
        velocity.current.y += (BASE_SPEED - velocity.current.y) * 0.05;
      }

      rotation.current.x += velocity.current.x;
      rotation.current.y += velocity.current.y;

      // Project & sort particles back-to-front
      const projected = particles.current.map((p) => {
        let q = rotateX(p, rotation.current.x);
        q = rotateY(q, rotation.current.y);
        const scale = RADIUS * (0.6 + 0.4 * ((q.z + 1) / 2));
        return {
          sx: cx + q.x * scale,
          sy: cy + q.y * scale,
          z: q.z,
        };
      });

      projected.sort((a, b) => a.z - b.z);

      for (const { sx, sy, z } of projected) {
        const t = (z + 1) / 2; // 0..1, back to front
        const radius = 1.2 + t * 2;
        const alpha = 0.15 + t * 0.85;

        // Detect dark mode
        const isDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
        const lightness = isDark
          ? Math.round(55 + t * 45)
          : Math.round(30 + t * 40);
        const hue = 220 + t * 40; // blue → purple

        ctx.beginPath();
        ctx.arc(sx, sy, radius, 0, Math.PI * 2);
        ctx.fillStyle = `hsla(${hue}, 70%, ${lightness}%, ${alpha})`;
        ctx.fill();
      }

      rafRef.current = requestAnimationFrame(draw);
    }

    rafRef.current = requestAnimationFrame(draw);

    window.addEventListener("mousemove", handleMouseMove);
    window.addEventListener("mouseleave", handleMouseLeave);

    return () => {
      cancelAnimationFrame(rafRef.current);
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("mouseleave", handleMouseLeave);
    };
  }, [handleMouseMove, handleMouseLeave]);

  return (
    <canvas
      ref={canvasRef}
      className="opacity-90"
      style={{ width: 300, height: 300 }}
      aria-hidden="true"
    />
  );
}
