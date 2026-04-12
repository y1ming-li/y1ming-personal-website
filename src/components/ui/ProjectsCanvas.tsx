'use client';

import React, { Suspense, useEffect, useState } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { MathUtils } from 'three';
import type { CubeItem } from '@/data/projects';
import { ProjectListing } from './ProjectListing';
import { ProjectDOMPanel } from './ProjectHtmlModal';

function CameraController({ openIndex }: { openIndex: number | null }) {
  useFrame(({ camera }) => {
    const isWide = window.innerWidth > 768;
    const targetX = (openIndex !== null && isWide) ? -0.6 : 0;
    const targetZ = openIndex !== null ? 5.5 : 8;
    camera.position.x = MathUtils.lerp(camera.position.x, targetX, 0.05);
    camera.position.z = MathUtils.lerp(camera.position.z, targetZ, 0.05);
  });
  return null;
}

function Scene({
  projects,
  openIndex,
  setOpenIndex,
}: {
  projects: CubeItem[];
  openIndex: number | null;
  setOpenIndex: (index: number | null) => void;
}) {
  return (
    <>
      <CameraController openIndex={openIndex} />
      <ambientLight intensity={0.5} />
      <pointLight position={[10, 10, 10]} intensity={1} />
      <ProjectListing
        projects={projects}
        active
        openIndex={openIndex}
        setOpenIndex={setOpenIndex}
      />
    </>
  );
}

export function ProjectsCanvas({ projects }: { projects: CubeItem[] }) {
  const [openIndex, setOpenIndex] = useState<number | null>(null);
  const openProject = openIndex !== null ? projects[openIndex] ?? null : null;

  // Hide the whole header (logo + hamburger) while a project panel is open
  useEffect(() => {
    const el = document.getElementById('site-header');
    if (!el) return;
    el.style.display = openIndex !== null ? 'none' : '';
  }, [openIndex]);

  return (
    <div style={{ position: 'relative', width: '100%', height: '100%' }}>
      <Suspense fallback={null}>
        <Canvas
          camera={{ fov: 50, position: [0, 0, 8] }}
          style={{ background: 'transparent', width: '100%', height: '100%' }}
        >
          <Scene projects={projects} openIndex={openIndex} setOpenIndex={setOpenIndex} />
        </Canvas>
      </Suspense>

      {/* DOM overlay panel — outside Canvas so it uses normal CSS positioning */}
      {openProject && (
        <ProjectDOMPanel
          project={openProject}
          onClose={() => setOpenIndex(null)}
        />
      )}
    </div>
  );
}
