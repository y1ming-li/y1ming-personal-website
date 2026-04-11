import { useEffect, useRef, useState } from 'react';
import type { CubeItem } from '@/data/projects';
import { ProjectHeader, ProjectBody, ProjectCTA } from './ProjectContent';

function useScrollBottom() {
  const [scrolledToBottom, setScrolledToBottom] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    const handler = () => {
      setScrolledToBottom(el.scrollHeight - el.scrollTop - el.clientHeight < 10);
    };
    el.addEventListener('scroll', handler);
    handler();
    return () => el.removeEventListener('scroll', handler);
  }, []);

  return { scrollRef, scrolledToBottom };
}

/** Full-screen DOM overlay panel rendered outside <Canvas>. */
export function ProjectDOMPanel({
  project,
  onClose,
}: {
  project: CubeItem;
  onClose: () => void;
}) {
  const [isWide, setIsWide] = useState(false);
  const [xHovered, setXHovered] = useState(false);

  useEffect(() => {
    const update = () => setIsWide(window.innerWidth > 768);
    update();
    window.addEventListener('resize', update);
    return () => window.removeEventListener('resize', update);
  }, []);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [onClose]);

  const { scrollRef, scrolledToBottom } = useScrollBottom();

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        pointerEvents: 'none',
        zIndex: 200,
        color: 'white',
        ['--projectColor' as string]: project.color,
      }}
    >
      {/* Close button — at panel boundary, styled like original */}
      <button
        type="button"
        aria-label="close project"
        onClick={onClose}
        onMouseEnter={() => setXHovered(true)}
        onMouseLeave={() => setXHovered(false)}
        style={{
          pointerEvents: 'auto',
          position: 'absolute',
          zIndex: 20,
          ...(isWide
            ? { top: '1rem', left: 'min(450px, 45vw)' }
            : { top: 'calc(45% + 0.25rem)', right: '1rem' }),
          background: 'none',
          border: 'none',
          cursor: 'pointer',
          color: 'white',
          fontFamily: 'monospace',
          fontSize: 'max(35px, 6vw)',
          padding: '0 0.5em',
          transform: 'scale(1.5)',
          transformOrigin: isWide ? 'top left' : 'top right',
        }}
      >
        <span
          style={{
            display: 'inline-block',
            transform: `translateY(-3%)${xHovered ? ' scale(1.5)' : ''}`,
            transition: 'transform 0.2s, color 0.2s',
            color: xHovered ? 'var(--projectColor)' : 'inherit',
          }}
        >
          ×
        </span>
      </button>

      {/* Content panel — left side on wide, bottom on mobile */}
      <div
        style={{
          pointerEvents: 'auto',
          position: 'absolute',
          overflowY: 'hidden',
          ...(isWide
            ? {
                top: 0,
                left: 0,
                width: 'min(450px, 45vw)',
                height: '100%',
                paddingTop: '2rem',
              }
            : {
                bottom: 0,
                left: 0,
                right: 0,
                height: '55%',
                paddingTop: '1rem',
              }),
        }}
      >
        <div
          ref={scrollRef}
          style={{
            height: '100%',
            overflowY: 'auto',
            scrollbarWidth: 'none',
            padding: '0 1.5rem 2rem',
          }}
        >
          <ProjectHeader project={project} />
          <ProjectBody project={project} />
          <ProjectCTA />
        </div>

        {/* Scroll indicator arrow */}
        {!scrolledToBottom && (
          <div
            style={{
              position: 'absolute',
              bottom: 0,
              left: 0,
              right: 0,
              display: 'flex',
              justifyContent: 'center',
              pointerEvents: 'none',
            }}
          >
            <span style={{ fontSize: '2.5rem', transform: 'rotate(90deg) translateY(30%)' }}>
              ›
            </span>
          </div>
        )}
      </div>
    </div>
  );
}
