import React, { useMemo, useRef, useEffect, useState } from 'react';
import { shaderMaterial } from '@react-three/drei';
import { extend, ThreeElement, useFrame } from '@react-three/fiber';
import { ShaderMaterial, FrontSide } from 'three';
import type { CubeItem } from '@/data/projects';

function hexToRgb(hex: string): [number, number, number] {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  if (!result) return [1, 1, 1];
  return [
    parseInt(result[1], 16) / 255,
    parseInt(result[2], 16) / 255,
    parseInt(result[3], 16) / 255,
  ];
}

const BackgroundColorShaderMaterial = shaderMaterial(
  {
    opacity: 0.0,
    time: 0.0,
    seed: 0.0,
    projectColor: [1, 1, 1] as [number, number, number],
    breakpoint: false,
  },
  `
    varying vec2 vUv;
    void main() {
      vUv = uv;
      gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
    }
  `,
  `
    varying vec2 vUv;
    uniform float opacity;
    uniform float time;
    uniform float seed;
    uniform vec3 projectColor;
    uniform bool breakpoint;

    float random(in vec2 st) {
      return fract(sin(dot(st.xy, vec2(12.9898, 78.233))) * 43758.5453123);
    }

    float randomWithSeed(in vec2 st, float s) {
      return fract(sin(dot(st.xy, vec2(12.9898 + s, 78.233 + s))) * 43758.5453123);
    }

    float noise(in vec2 st, float s) {
      vec2 i = floor(st);
      vec2 f = fract(st);
      float a = randomWithSeed(i, s);
      float b = randomWithSeed(i + vec2(1.0, 0.0), s);
      float c = randomWithSeed(i + vec2(0.0, 1.0), s);
      float d = randomWithSeed(i + vec2(1.0, 1.0), s);
      vec2 u = f * f * (3.0 - 2.0 * f);
      return mix(a, b, u.x) + (c - a) * u.y * (1.0 - u.x) + (d - b) * u.x * u.y;
    }

    float bsDistance(float x1, float y1, float x2, float y2) {
      return sqrt(pow(x2 - x1, 2.0) + pow(y2 - y1, 2.0));
    }

    float blobNoise(float size, float s, float correctedTime) {
      float bn = 0.0;
      correctedTime = correctedTime * (0.75 + 0.5 * randomWithSeed(vec2(s), s));
      bn += noise(vec2(vUv.x * size - correctedTime / 2.0, vUv.y * size - correctedTime / 2.0), s * 2.0) * cos(correctedTime + 3.14 * 0.0);
      bn += noise(vec2(vUv.x * size + correctedTime / 2.0, vUv.y * size + correctedTime / 2.0), s * 3.0) * cos(correctedTime + 3.14 * 0.5);
      bn += noise(vec2(vUv.x * size + correctedTime / 2.0, vUv.y * size - correctedTime / 2.0), s * 4.0) * cos(correctedTime + 3.14 * 1.0);
      bn += noise(vec2(vUv.x * size - correctedTime / 2.0, vUv.y * size + correctedTime / 2.0), s * 5.0) * cos(correctedTime + 3.14 * 1.5);
      return clamp(0.0, 1.0, bn);
    }

    vec3 blush = vec3(0.961, 0.910, 0.937); // matches --foreground #F5E8EF (soft rose-white)

    void main() {
      float transitionBlobs = 0.0;
      transitionBlobs += noise(vUv * 2.0 + time, seed) / 2.0;
      transitionBlobs += noise(vUv * 8.0 + time, seed + 1000.0) / 2.0;
      transitionBlobs = step(1.0 - opacity, transitionBlobs);

      float distanceGradient = 0.0;
      if (breakpoint) {
        distanceGradient += smoothstep(0.4, 0.9, 1.0 - bsDistance(vUv.x, vUv.y, 0.75, vUv.y) * 2.0);
      } else {
        distanceGradient += smoothstep(0.5, 1.1, 1.0 - bsDistance(vUv.x, vUv.y, vUv.x, 0.65) * 2.0);
      }

      float correctedTime = time * 0.4;
      float colorBlobs = 0.0;
      colorBlobs += distanceGradient / 1.0;
      colorBlobs += blobNoise(5.0,  seed, correctedTime * 0.3) / 3.0;
      colorBlobs += blobNoise(12.0, seed, correctedTime * 0.6) / 2.0;
      colorBlobs += blobNoise(8.0,  seed, correctedTime * 0.6) / 2.0;
      colorBlobs *= noise(vUv * 1000.0, gl_FragCoord.x * gl_FragCoord.y / 10000.0);
      colorBlobs = step(0.5, colorBlobs);

      vec3 color = mix(blush, colorBlobs * projectColor, opacity) * 2.0;
      color *= smoothstep(0.0, 1.0, distanceGradient) * 0.5;

      gl_FragColor = vec4(color, transitionBlobs);
    }
  `,
);

extend({ BackgroundColorShaderMaterial });

// eslint-disable-next-line no-redeclare
type BackgroundColorShaderMaterial = ShaderMaterial & {
  opacity: number;
  seed: number;
  time: number;
  projectColor: [number, number, number];
  breakpoint: boolean;
};

declare module '@react-three/fiber' {
  interface ThreeElements {
    backgroundColorShaderMaterial: ThreeElement<typeof BackgroundColorShaderMaterial>;
  }
}

export const BackgroundColorMaterial = ({
  opacity = true,
  project = null,
}: {
  opacity: boolean;
  project: CubeItem | null;
}) => {
  const materialRef = React.useRef<BackgroundColorShaderMaterial>(null);

  const [isWide, setIsWide] = useState(false);
  useEffect(() => {
    const update = () => setIsWide(window.innerWidth > 768);
    update();
    window.addEventListener('resize', update);
    return () => window.removeEventListener('resize', update);
  }, []);

  const projectColor: [number, number, number] =
    project !== null ? hexToRgb(project.color) : [0.333, 0.122, 0.0];

  const lastT = useRef(performance.now());

  useFrame(() => {
    if (!materialRef.current) return;
    const now = performance.now();
    const increment = (now - lastT.current) / 1000;
    lastT.current = now;

    if (opacity) {
      materialRef.current.uniforms.opacity.value = Math.min(
        materialRef.current.uniforms.opacity.value + increment,
        1.0,
      );
    } else {
      materialRef.current.uniforms.opacity.value = Math.max(
        materialRef.current.uniforms.opacity.value - increment,
        0.0,
      );
    }
    materialRef.current.uniforms.time.value += increment;
  });

  const randomSeed = useMemo(() => Math.random(), []);

  return (
    <backgroundColorShaderMaterial
      side={FrontSide}
      key={BackgroundColorShaderMaterial.key}
      opacity={0}
      seed={randomSeed}
      ref={materialRef}
      transparent
      time={0}
      projectColor={projectColor}
      breakpoint={isWide as unknown as false}
    />
  );
};
