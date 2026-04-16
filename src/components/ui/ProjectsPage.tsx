'use client';

import dynamic from 'next/dynamic';
import { projects } from '@/data/projects';

const ProjectsCanvas = dynamic(
  () => import('@/components/ui/ProjectsCanvas').then((m) => ({ default: m.ProjectsCanvas })),
  { ssr: false },
);

export function ProjectsPage() {
  return (
    <div style={{ width: '100vw', height: '100vh', position: 'relative', left: '50%', transform: 'translateX(-50%)' }}>
      <ProjectsCanvas projects={projects} />
    </div>
  );
}
