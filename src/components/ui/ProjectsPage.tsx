'use client';

import dynamic from 'next/dynamic';
import { projects } from '@/data/projects';

const ProjectsCanvas = dynamic(
  () => import('@/components/ui/ProjectsCanvas').then((m) => ({ default: m.ProjectsCanvas })),
  { ssr: false },
);

export function ProjectsPage() {
  return (
    <div className="w-full h-full">
      <ProjectsCanvas projects={projects} />
    </div>
  );
}
