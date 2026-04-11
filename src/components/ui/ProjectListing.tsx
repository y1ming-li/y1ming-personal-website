import React, { useEffect, useState } from 'react';
import { MeshDistortMaterial, Text } from '@react-three/drei';
import { animated, useSpring, config } from '@react-spring/three';
import { DoubleSide } from 'three';
import { useInterval } from 'usehooks-ts';
import type { CubeItem } from '@/data/projects';
import { ProjectEntry } from './ProjectEntry';
import { BackgroundColorMaterial } from './ProjectBackgroundMaterial';

type CoordArray = [number, number, number];

export function ProjectListing({
  active,
  projects,
  openIndex: externalOpenIndex,
  setOpenIndex: setExternalOpenIndex,
}: {
  active: boolean;
  projects: CubeItem[];
  openIndex: number | null;
  setOpenIndex: (index: number | null) => void;
}) {
  const [blobIsBig, setBlobIsBig] = useState(false);
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);

  const [isWide, setIsWide] = useState(false);
  useEffect(() => {
    const update = () => setIsWide(window.innerWidth > 768);
    update();
    window.addEventListener('resize', update);
    return () => window.removeEventListener('resize', update);
  }, []);

  const [hasNoMouse, setHasNoMouse] = useState(false);
  useEffect(() => {
    const handler = () => setHasNoMouse(false);
    window.addEventListener('mousemove', handler, { once: true });
    return () => window.removeEventListener('mousemove', handler);
  }, []);

  const nProjects = projects.length;
  const arcPerProject = nProjects > 0 ? (Math.PI * 2) / nProjects : 0;

  const [autoHover, setAutoHover] = useState(false);
  const aProjectIsOpen = externalOpenIndex !== null;

  useInterval(() => {
    if (aProjectIsOpen) return;
    if (hasNoMouse && autoHover) {
      setHoveredIndex(((hoveredIndex ?? 0) + 1) % nProjects);
    }
  }, 2000);

  let blobTargetPosition: CoordArray = [0, 0, 0];
  if (!blobIsBig) {
    blobTargetPosition = isWide ? [3.62, 1.91, 0] : [1, 3.91, 0];
  }

  const { blobScale, blobPosition } = useSpring({
    blobPosition: blobTargetPosition,
    blobScale: blobIsBig ? 1 : 0,
    config: active ? config.gentle : config.stiff,
  });

  useEffect(() => {
    if (active) {
      const t1 = setTimeout(() => setBlobIsBig(true), 500);
      const t2 = setTimeout(() => setAutoHover(true), 3500);
      return () => { clearTimeout(t1); clearTimeout(t2); };
    } else {
      setHoveredIndex(null);
      setAutoHover(false);
      const t = setTimeout(() => setBlobIsBig(false), 500);
      return () => clearTimeout(t);
    }
  }, [active]);

  const radius = isWide ? 2.7 : 2.4;
  const currentProject =
    externalOpenIndex !== null ? projects[externalOpenIndex] ?? null : null;

  return (
    <group>
      {/* Blob "Click a cube" prompt */}
      <animated.group
        // @ts-ignore
        scale={blobScale}
        // @ts-ignore
        position={blobPosition}
      >
        <mesh position={[0, 0, -5]} scale={[2.5, 2.5, 0.1]}>
          <sphereGeometry args={[4, 70, 70]} />
          <MeshDistortMaterial
            color="#551F00"
            speed={6}
            radius={1}
            distort={0.3}
            transparent
            opacity={0.7}
            side={DoubleSide}
          />
        </mesh>
        <Text
          position={[0, 0, 0]}
          color="#00FFFF"
          anchorX="center"
          anchorY="middle"
          textAlign="center"
          fontSize={0.5}
          material-toneMapped={false}
        >
          {`${hasNoMouse ? 'Tap' : 'Click'} a\ncube.`}
        </Text>
      </animated.group>

      {/* Background shader mesh shown when a project is open */}
      <mesh position={[0, 0, 3]}>
        <boxGeometry args={[10, 10, 0.01]} />
        <BackgroundColorMaterial opacity={aProjectIsOpen} project={currentProject} />
      </mesh>

      {/* Cube ring */}
      <animated.group
        // @ts-ignore
        scale={blobScale}
        // @ts-ignore
        position={blobPosition}
      >
        {projects.map((project, index) => (
          <ProjectEntry
            project={project}
            key={project.slug}
            basePosition={[
              Math.sin(index * arcPerProject) * radius,
              Math.cos(index * arcPerProject) * radius,
              0,
            ]}
            someProjectIsOpen={externalOpenIndex !== null}
            hovering={externalOpenIndex === null && hoveredIndex === index}
            setHovering={(isHovering: boolean) => {
              if (isHovering) setHoveredIndex(index);
              else if (hoveredIndex === index) setHoveredIndex(null);
            }}
            open={externalOpenIndex === index}
            setOpen={(isOpening: boolean) => {
              if (isOpening && !aProjectIsOpen) {
                setExternalOpenIndex(index);
              } else if (!isOpening && externalOpenIndex === index) {
                setExternalOpenIndex(null);
                setHoveredIndex(null);
              }
            }}
          />
        ))}
      </animated.group>
    </group>
  );
}
