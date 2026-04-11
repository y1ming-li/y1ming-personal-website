export interface CubeItem {
  slug: string;
  title: string;
  shortTitle: string; // ≤ 12 chars, shown on hover in 3D
  subtitle: string;
  color: string; // hex accent — cube shader color + panel highlight
  body: string; // plain text description
  thumbnailUrl?: string; // shown on cube face (frozen state)
  videoUrl?: string; // played on cube face when hovered/open — must be .mp4 for Chrome/Firefox (.mov is Safari-only)
  links?: Array<{ text: string; url: string }>;
}

export const projects: CubeItem[] = [
  {
    slug: "personal-website",
    title: "This Portfolio",
    shortTitle: "Portfolio",
    subtitle: "Next.js · React Three Fiber · Tailwind CSS",
    color: "#E60000",
    body: "The site you're looking at right now. Built with Next.js 16 and React 19, featuring a Canvas 2D particle portrait on the home page and this 3D cube ring for the projects section. The cube ring is a port of bryantcodes.art's original Three.js showcase, adapted with static data instead of a CMS. Dark mode, responsive layout, and a custom contact API are all included.",
    thumbnailUrl: "/image/sample1.png",
    videoUrl: "/video/sample1.mov",
    links: [
      { text: "View Source on GitHub", url: "https://github.com" },
    ],
  },
  {
    slug: "music-player",
    title: "Rhythm",
    shortTitle: "Rhythm",
    subtitle: "A browser-based music streaming app",
    color: "#0066FF",
    body: "Rhythm is a web app for organizing and playing music entirely in the browser. Built with React and the Web Audio API, it supports playlist management, waveform visualization, and gapless playback. Tracks are stored locally using IndexedDB — no server required. The UI takes inspiration from classic desktop media players, with drag-to-reorder queues and keyboard shortcuts for everything.",
    links: [
      { text: "Live Demo", url: "https://example.com" },
      { text: "GitHub", url: "https://github.com" },
    ],
  },
  {
    slug: "cli-toolkit",
    title: "Forge",
    shortTitle: "Forge",
    subtitle: "A developer productivity CLI",
    color: "#00CC88",
    body: "Forge is a command-line toolkit that automates repetitive project setup tasks — scaffolding new repos, generating boilerplate, running lint and format passes, and syncing environment configs across machines. Written in Go for fast startup and distributed as a single binary. Plugins are written as simple shell scripts, making it easy to extend without touching the core.",
    links: [
      { text: "Documentation", url: "https://example.com" },
      { text: "GitHub", url: "https://github.com" },
    ],
  },
  {
    slug: "data-viz",
    title: "Pulse",
    shortTitle: "Pulse",
    subtitle: "A real-time analytics dashboard",
    color: "#FF6600",
    body: "Pulse is a live analytics dashboard built for monitoring web application metrics in real time. The frontend uses D3.js for SVG charts that update every second via WebSocket. The backend is a lightweight Node.js server that aggregates events and serves summary stats. Designed to be self-hosted — drop it in front of any Express app and start watching traffic flow.",
    links: [
      { text: "Live Demo", url: "https://example.com" },
      { text: "GitHub", url: "https://github.com" },
    ],
  },
  {
    slug: "mobile-app",
    title: "Bloom",
    shortTitle: "Bloom",
    subtitle: "A habit tracking mobile app",
    color: "#9900FF",
    body: "Bloom is a habit tracking app built with React Native and Expo. It uses a streak-based system with gentle reminders rather than guilt-driven notifications. Each habit gets a customizable schedule, a color, and a simple check-in interaction. Data lives on device with optional iCloud/Google Drive backup. The design is intentionally minimal — one tap to check in, nothing more.",
    links: [
      { text: "App Store", url: "https://example.com" },
      { text: "GitHub", url: "https://github.com" },
    ],
  },
];
