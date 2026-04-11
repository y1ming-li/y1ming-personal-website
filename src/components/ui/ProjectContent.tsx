import React, { ReactNode } from 'react';
import type { CubeItem } from '@/data/projects';

const ExternalLinkIcon = () => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth={2}
    strokeLinecap="round"
    strokeLinejoin="round"
    style={{ width: '1em', height: '1em', display: 'inline-block', verticalAlign: 'middle' }}
  >
    <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />
    <polyline points="15 3 21 3 21 9" />
    <line x1="10" y1="14" x2="21" y2="3" />
  </svg>
);

const ExternalLink = ({
  href,
  children,
}: {
  href: string;
  children: ReactNode;
}) => (
  <a
    href={href}
    target="_blank"
    rel="noreferrer"
    className="
      relative block p-2 pr-8 font-mono text-center border border-current
      hover:text-[var(--projectColor)] hover:border-[var(--projectColor)]
    "
    style={{ display: 'block', position: 'relative' }}
  >
    {children}
    <span
      style={{
        position: 'absolute',
        top: 0,
        right: '0.5rem',
        display: 'grid',
        placeItems: 'center',
        height: '100%',
      }}
    >
      <ExternalLinkIcon />
    </span>
  </a>
);

const P = ({ children, className = '' }: { children: ReactNode; className?: string }) => (
  <p className={`my-4 ${className}`}>{children}</p>
);

const H2 = ({ children }: { children: ReactNode }) => (
  <h2 className="mt-16 font-mono text-2xl">{children}</h2>
);

export const ProjectHeader = ({ project }: { project: CubeItem }) => (
  <>
    <h1
      className="font-mono leading-tight mb-6 mt-12"
      style={{
        fontSize:
          (project.title.length ?? 0) > 15
            ? 'clamp(35px, 3.5vw, 55px)'
            : 'clamp(35px, 6vw, 85px)',
      }}
    >
      {project.title}
    </h1>
    <h2 className="font-mono text-2xl">{project.subtitle}</h2>
    {project.links && project.links.length > 0 && (
      <ul className="mt-8">
        {project.links.map((link) => (
          <li className="mt-4 first:mt-0" key={link.url}>
            <ExternalLink href={link.url}>{link.text}</ExternalLink>
          </li>
        ))}
      </ul>
    )}
  </>
);

export const ProjectBody = ({ project }: { project: CubeItem }) => (
  <div className="my-8 tracking-wide">
    <p style={{ whiteSpace: 'pre-wrap' }}>{project.body}</p>
  </div>
);

export const ProjectCTA = () => (
  <div className="mb-20">
    <H2>Questions?</H2>
    <P className="mb-8">
      Wanna nerd out and talk shop? Have a project of your own you want to discuss? Just want to say
      hi? I&apos;d love to hear from you!
    </P>
    <ExternalLink href="/contact">Get in touch</ExternalLink>
  </div>
);
