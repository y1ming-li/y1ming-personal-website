import {
  Ref,
  useMemo,
  useRef,
  useState,
} from 'react';
import { MathUtils, Mesh, Object3D } from 'three';
import { extend, ThreeElement, useFrame } from '@react-three/fiber';
import { useEventListener, useInterval } from 'usehooks-ts';
import { animated, config, useSpring } from '@react-spring/three';
import { RoundedBoxGeometry } from 'three-stdlib';
import { MeshDistortMaterial, Text } from '@react-three/drei';
import type { CubeItem } from '@/data/projects';
import { ProjectCubeMaterial } from './ProjectCubeMaterial';

const ROTATION_MAX_SPEED = 0.01;
const MAX_WANDER_DISTANCE = 0.5;
const circle = Math.PI * 2;

type CoordArray = [number, number, number];

const getRandomCubeOffset = (): CoordArray => [
  (Math.random() * 2 - 1) * MAX_WANDER_DISTANCE,
  (Math.random() * 2 - 1) * MAX_WANDER_DISTANCE,
  (Math.random() * 2 - 1) * MAX_WANDER_DISTANCE,
];

extend({ RoundedBoxGeometry });

declare module '@react-three/fiber' {
  interface ThreeElements {
    roundedBoxGeometry: ThreeElement<typeof RoundedBoxGeometry>;
  }
}

export const ProjectEntry = ({
  project,
  basePosition,
  open,
  setOpen,
  hovering,
  someProjectIsOpen,
  setHovering,
}: {
  project: CubeItem;
  basePosition: CoordArray;
  open: boolean;
  setOpen: (open: boolean) => void;
  someProjectIsOpen: boolean;
  hovering: boolean;
  setHovering: (hovering: boolean) => void;
}) => {
  const directionInterval = useMemo(() => Math.random() * 5000 + 2500, []);
  const [cubeFloatingOffset, setCubeFloatingOffset] = useState<CoordArray>(
    getRandomCubeOffset(),
  );

  const { animatedCubeFloatingOffset } = useSpring({
    animatedCubeFloatingOffset: open ? ([0, 0, 0] as CoordArray) : cubeFloatingOffset,
    config: { duration: open ? 100 : directionInterval },
  });

  useInterval(() => {
    setCubeFloatingOffset(getRandomCubeOffset());
  }, directionInterval);

  const cubeRef = useRef<Mesh>(null);
  const rotationSpeeds = useRef({
    x: (Math.random() * 2 - 1) * ROTATION_MAX_SPEED,
    y: (Math.random() * 2 - 1) * ROTATION_MAX_SPEED,
    z: (Math.random() * 2 - 1) * ROTATION_MAX_SPEED,
  });

  const objectAimedAtCamera = useMemo(() => new Object3D(), []);

  useFrame(({ camera }) => {
    if (!cubeRef.current) return;
    if (hovering || open) {
      cubeRef.current.getWorldPosition(objectAimedAtCamera.position);
      objectAimedAtCamera.lookAt(camera.position);
      const { x, y, z } = cubeRef.current.rotation;
      cubeRef.current.rotation.x = MathUtils.lerp(
        x,
        Math.round(x / circle) * circle + objectAimedAtCamera.rotation.x,
        0.1,
      );
      cubeRef.current.rotation.y = MathUtils.lerp(
        y,
        Math.round(y / circle) * circle + objectAimedAtCamera.rotation.y,
        0.1,
      );
      cubeRef.current.rotation.z = MathUtils.lerp(
        z,
        Math.round(z / circle) * circle + objectAimedAtCamera.rotation.z,
        0.1,
      );
    } else {
      cubeRef.current.rotation.x += rotationSpeeds.current.x;
      cubeRef.current.rotation.y += rotationSpeeds.current.y;
      cubeRef.current.rotation.z += rotationSpeeds.current.z;
    }
  });

  let cubeScale = 1;
  if (hovering) cubeScale = 2.9;
  if (open) cubeScale = 1;

  const cubePosition: CoordArray = open ? [0, 0, 4] : basePosition;

  const { animatedCubePosition } = useSpring({
    animatedCubePosition: cubePosition,
    config: config.stiff,
  });

  const { animatedCubeScale } = useSpring({
    animatedCubeScale: cubeScale,
    config: config.wobbly,
  });

  const active = hovering || open;

  useEventListener('keydown', (e: KeyboardEvent) => {
    if (e.key === 'Escape' && open) setOpen(false);
  });

  const yDist = 2.5 - Math.abs(basePosition[0]) * 0.25;
  const titlePosition: CoordArray = [
    -basePosition[0] / 4,
    basePosition[1] < 0 ? basePosition[1] + yDist : basePosition[1] - yDist,
    2,
  ];

  return (
    <>
      {/* Hover glow blob */}
      <group position={basePosition}>
        <animated.group
          // @ts-ignore
          position={animatedCubeFloatingOffset}
        >
          <mesh position={[0, 0, -0.2]} scale={[1, 1, 0.1]}>
            <sphereGeometry args={[1, 20, 20]} />
            <MeshDistortMaterial
              color={project.color}
              emissive={project.color}
              emissiveIntensity={1.2}
              speed={3}
              radius={0.85}
              distort={0.25}
              transparent
              opacity={0.45}
              roughness={0.1}
              metalness={0.3}
            />
          </mesh>
        </animated.group>
      </group>

      {/* Cube */}
      <animated.group
        // @ts-ignore
        position={animatedCubePosition}
      >
        <animated.group
          // @ts-ignore
          position={animatedCubeFloatingOffset}
          // @ts-ignore
          scale={animatedCubeScale}
        >
          <mesh
            ref={cubeRef as Ref<Mesh>}
            renderOrder={active ? 1 : 0}
            onPointerOver={(e) => {
              e.stopPropagation();
              if (!someProjectIsOpen) setHovering(true);
            }}
            onPointerOut={() => setHovering(false)}
            onClick={(e) => {
              e.stopPropagation();
              if (!someProjectIsOpen) setOpen(true);
            }}
          >
            <roundedBoxGeometry args={[0.8, 0.8, 0.8, 4, 0.1]} />
            <ProjectCubeMaterial
              color={project.color}
              active={active}
              thumbnailUrl={project.thumbnailUrl}
              videoUrl={project.videoUrl}
            />
          </mesh>
        </animated.group>
      </animated.group>

      {/* Hover title */}
      {hovering && !someProjectIsOpen && (
        <Text
          position={titlePosition}
          color={project.color}
          anchorX="center"
          anchorY="middle"
          fontSize={0.45}
          font={undefined}
          depthOffset={-1}
        >
          {project.shortTitle}
        </Text>
      )}

      {/* Panel is rendered as a DOM overlay in ProjectsCanvas — nothing here */}
    </>
  );
};
