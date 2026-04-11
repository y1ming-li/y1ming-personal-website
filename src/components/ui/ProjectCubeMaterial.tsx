import { useMemo, useRef, useEffect, useState } from 'react';
import { shaderMaterial, useTexture } from '@react-three/drei';
import { extend, ThreeElement, useFrame } from '@react-three/fiber';
import { ShaderMaterial, FrontSide, DataTexture, RGBAFormat, Texture, VideoTexture } from 'three';

function hexToRgb(hex: string): [number, number, number] {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  if (!result) return [1, 1, 1];
  return [
    parseInt(result[1], 16) / 255,
    parseInt(result[2], 16) / 255,
    parseInt(result[3], 16) / 255,
  ];
}

// 1×1 white fallback texture
const fallbackTexture = new DataTexture(new Uint8Array([255, 255, 255, 255]), 1, 1, RGBAFormat);
fallbackTexture.needsUpdate = true;

const ProjectCubeShaderMaterial = shaderMaterial(
  {
    projectColor: [1, 0, 0] as [number, number, number],
    thumb: fallbackTexture as Texture,
    video: fallbackTexture as Texture,
    hasThumb: 0, // 1 = has thumbnail, 0 = color only
    videoReady: 0.0,
    unfreeze: 0.0,
    time: 0.0,
    seed: 0.0,
  },
  /* vertex shader */
  `
    varying vec2 vUv;
    void main() {
      vUv = uv;
      gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
    }
  `,
  /* fragment shader */
  `
    varying vec2 vUv;
    uniform vec3 projectColor;
    uniform sampler2D thumb;
    uniform sampler2D video;
    uniform int hasThumb; // 1 = has thumbnail, 0 = color only
    uniform float videoReady;
    uniform float unfreeze;
    uniform float seed;
    uniform float time;

    float random(in vec2 st) {
      return fract(sin(dot(st.xy, vec2(12.9898, 78.233))) * 43758.5453123);
    }

    float noise(in vec2 st) {
      vec2 i = floor(st);
      vec2 f = fract(st);
      float a = random(i);
      float b = random(i + vec2(1.0, 0.0));
      float c = random(i + vec2(0.0, 1.0));
      float d = random(i + vec2(1.0, 1.0));
      vec2 u = f * f * (3.0 - 2.0 * f);
      return mix(a, b, u.x) + (c - a) * u.y * (1.0 - u.x) + (d - b) * u.x * u.y;
    }

    vec3 darkColor   = vec3(0.0, 0.0, 1.0);
    vec3 middleColor = vec3(0.0, 1.0, 1.0);
    vec3 lightColor  = vec3(0.8, 1.0, 1.0);

    void main() {
      float n1 = noise(vUv * 5.0   - seed           + time);
      float n2 = noise(vUv * 10.0  - seed * 50.0    + time);
      float n3 = noise(vUv * 2.0   - seed * 100.0   + time);
      float n4 = noise(vUv * 8.0   - seed * 150.0 * unfreeze + time);
      float n5 = noise(vUv * 100.0 - seed * 250.0 * unfreeze + time);
      float n6 = noise(vUv * -seed * 300.0            + time);
      float noiseValue = (n1 + n2 + n3 + n4 + n5 + n6) / 6.0;

      float visible = smoothstep(0.0, 2.0, noiseValue + unfreeze * 2.0);
      visible = smoothstep(0.5, 1.0, visible);

      // Frozen state
      vec3 frozenColor;
      if (hasThumb == 1) {
        // Thumbnail tinted with noise (same as original)
        vec3 thumbColor = texture2D(thumb, vUv).rgb;
        float gray = (thumbColor.r + thumbColor.g + thumbColor.b) / 3.0 * 1.0 + 0.33;
        frozenColor =
          (1.0 - step(0.5, gray)) * mix(darkColor, middleColor, gray * 2.0)
          + step(0.5, gray) * mix(middleColor, lightColor, gray * 2.0 - 1.0);
        frozenColor += noiseValue;
      } else {
        float gray = noiseValue + 0.33;
        frozenColor =
          (1.0 - step(0.5, gray)) * mix(darkColor, middleColor, gray * 2.0)
          + step(0.5, gray) * mix(middleColor, lightColor, gray * 2.0 - 1.0);
        frozenColor += noiseValue;
      }

      // Unfrozen state: video > thumbnail > solid color
      vec3 distortedThumb = hasThumb == 1
        ? texture2D(thumb, (vUv - 0.5) * visible + 0.5).rgb
        : projectColor;
      vec3 distortedVideo = texture2D(video, (vUv - 0.5) * visible + 0.5).rgb;
      vec3 unfrozenColor = mix(distortedThumb, distortedVideo, videoReady);

      vec3 color = mix(frozenColor, unfrozenColor, visible);
      gl_FragColor = vec4(color, 1.0);
    }
  `,
);

extend({ ProjectCubeShaderMaterial });

// eslint-disable-next-line no-redeclare
type ProjectCubeShaderMaterial = ShaderMaterial & {
  projectColor: [number, number, number];
  thumb: Texture;
  video: Texture;
  hasThumb: number;
  videoReady: number;
  unfreeze: number;
  seed: number;
  time: number;
};

declare module '@react-three/fiber' {
  interface ThreeElements {
    projectCubeShaderMaterial: ThreeElement<typeof ProjectCubeShaderMaterial>;
  }
}

// Internal component that loads the thumb texture (hooks must not be called conditionally)
function MaterialWithThumb({
  color, active, thumbnailUrl, videoTexture, videoCanPlay,
}: {
  color: string;
  active: boolean;
  thumbnailUrl: string;
  videoTexture: VideoTexture | null;
  videoCanPlay: boolean;
}) {
  const thumbTexture = useTexture(thumbnailUrl);
  const materialRef = useRef<ProjectCubeShaderMaterial>(null);
  const randomSeed = useMemo(() => Math.random(), []);
  const lastT = useRef(performance.now());
  const [r, g, b] = hexToRgb(color);

  useFrame(() => {
    if (!materialRef.current) return;
    const now = performance.now();
    const inc = (now - lastT.current) / 1000;
    lastT.current = now;
    if (active) {
      materialRef.current.uniforms.unfreeze.value = Math.min(
        materialRef.current.uniforms.unfreeze.value + inc * 0.7, 1.0,
      );
    } else {
      materialRef.current.uniforms.unfreeze.value = Math.max(
        materialRef.current.uniforms.unfreeze.value - inc * 0.7, 0.0,
      );
    }
    if (videoCanPlay) {
      materialRef.current.uniforms.videoReady.value = Math.min(
        materialRef.current.uniforms.videoReady.value + inc, 1.0,
      );
    } else {
      materialRef.current.uniforms.videoReady.value = Math.max(
        materialRef.current.uniforms.videoReady.value - inc, 0.0,
      );
    }
    materialRef.current.uniforms.time.value += inc;
    if (videoTexture) videoTexture.needsUpdate = true;
  });

  return (
    <projectCubeShaderMaterial
      depthTest={false}
      side={FrontSide}
      key={ProjectCubeShaderMaterial.key}
      transparent
      unfreeze={0}
      videoReady={0}
      seed={randomSeed}
      ref={materialRef}
      projectColor={[r, g, b]}
      thumb={thumbTexture}
      video={videoTexture ?? fallbackTexture}
      hasThumb={1}
      time={0}
    />
  );
}

// Fallback: color-only, no texture loading
function MaterialColorOnly({ color, active }: { color: string; active: boolean }) {
  const materialRef = useRef<ProjectCubeShaderMaterial>(null);
  const randomSeed = useMemo(() => Math.random(), []);
  const lastT = useRef(performance.now());
  const [r, g, b] = hexToRgb(color);

  useFrame(() => {
    if (!materialRef.current) return;
    const now = performance.now();
    const inc = (now - lastT.current) / 1000;
    lastT.current = now;
    if (active) {
      materialRef.current.uniforms.unfreeze.value = Math.min(
        materialRef.current.uniforms.unfreeze.value + inc * 0.7, 1.0,
      );
    } else {
      materialRef.current.uniforms.unfreeze.value = Math.max(
        materialRef.current.uniforms.unfreeze.value - inc * 0.7, 0.0,
      );
    }
    materialRef.current.uniforms.time.value += inc;
  });

  return (
    <projectCubeShaderMaterial
      depthTest={false}
      side={FrontSide}
      key={ProjectCubeShaderMaterial.key}
      transparent
      unfreeze={0}
      videoReady={0}
      seed={randomSeed}
      ref={materialRef}
      projectColor={[r, g, b]}
      thumb={fallbackTexture}
      video={fallbackTexture}
      hasThumb={0}
      time={0}
    />
  );
}

export const ProjectCubeMaterial = ({
  color,
  active = false,
  thumbnailUrl,
  videoUrl,
}: {
  color: string;
  active: boolean;
  thumbnailUrl?: string;
  videoUrl?: string;
}) => {
  // Video element setup
  const [videoTexture, setVideoTexture] = useState<VideoTexture | null>(null);
  const [videoCanPlay, setVideoCanPlay] = useState(false);
  const videoElRef = useRef<HTMLVideoElement | null>(null);

  useEffect(() => {
    if (!videoUrl) return;
    const vid = document.createElement('video');
    vid.src = videoUrl;
    vid.crossOrigin = 'anonymous';
    vid.loop = true;
    vid.muted = true;
    vid.playsInline = true;
    vid.autoplay = true;
    videoElRef.current = vid;

    const onCanPlay = () => setVideoCanPlay(true);
    vid.addEventListener('canplay', onCanPlay);

    const tex = new VideoTexture(vid);
    setVideoTexture(tex);

    return () => {
      vid.removeEventListener('canplay', onCanPlay);
      vid.pause();
      tex.dispose();
      setVideoTexture(null);
      setVideoCanPlay(false);
    };
  }, [videoUrl]);

  // Play/pause video based on active state
  useEffect(() => {
    const vid = videoElRef.current;
    if (!vid) return;
    if (active) {
      vid.play().catch(() => {});
    } else {
      vid.pause();
    }
  }, [active]);

  if (thumbnailUrl) {
    return (
      <MaterialWithThumb
        color={color}
        active={active}
        thumbnailUrl={thumbnailUrl}
        videoTexture={videoTexture}
        videoCanPlay={videoCanPlay}
      />
    );
  }

  return <MaterialColorOnly color={color} active={active} />;
};
