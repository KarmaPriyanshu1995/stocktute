/**
 * Design tokens — single source of truth for the terminal-inspired design system.
 * Consumed by tailwind.config.ts (as CSS variables) and directly in components
 * that need raw values (e.g. R3F materials, canvas/chart theming).
 */

export const color = {
  // Base surfaces — near-black terminal, not pure black
  bg: {
    base: "#0B0E11",
    raised: "#12161B",
    surface: "#171C22",
    surfaceHover: "#1D232B",
    border: "#242B33",
    borderStrong: "#333C46",
  },
  // Light mode surfaces
  bgLight: {
    base: "#F5F4EF",
    raised: "#FFFFFF",
    surface: "#FBFAF6",
    surfaceHover: "#EFEEE7",
    border: "#DEDCD2",
    borderStrong: "#C7C4B6",
  },
  // Signal accent — used sparingly (primary CTAs, active states, AI highlights)
  accent: {
    DEFAULT: "#C6FF3D",
    dim: "#9FCC30",
    glow: "rgba(198, 255, 61, 0.25)",
  },
  // Reserved strictly for price movement / P&L — never decorative
  price: {
    up: "#3DDC84",
    upDim: "#245C3C",
    down: "#FF5C5C",
    downDim: "#5C2A2A",
    flat: "#8A9099",
  },
  // Text
  text: {
    primary: "#F4F1EA",
    secondary: "#9DA3AC",
    tertiary: "#6B7178",
    inverse: "#0B0E11",
  },
  textLight: {
    primary: "#14171B",
    secondary: "#565B62",
    tertiary: "#84898F",
    inverse: "#F5F4EF",
  },
} as const;

export const font = {
  display: '"Instrument Serif", Georgia, serif',
  ui: '"Geist", "Inter", system-ui, sans-serif',
  mono: '"JetBrains Mono", "SF Mono", Consolas, monospace',
} as const;

export const type = {
  scale: {
    xs: "0.75rem",
    sm: "0.875rem",
    base: "1rem",
    lg: "1.125rem",
    xl: "1.375rem",
    "2xl": "1.75rem",
    "3xl": "2.25rem",
    "4xl": "3rem",
    "5xl": "4rem",
    "6xl": "5.5rem",
  },
  tracking: {
    display: "-0.02em",
    tight: "-0.01em",
    normal: "0",
    wide: "0.04em",
  },
  leading: {
    tight: "1.1",
    snug: "1.3",
    normal: "1.5",
    relaxed: "1.75",
  },
} as const;

export const space = {
  px: "1px",
  0.5: "0.125rem",
  1: "0.25rem",
  2: "0.5rem",
  3: "0.75rem",
  4: "1rem",
  6: "1.5rem",
  8: "2rem",
  12: "3rem",
  16: "4rem",
  24: "6rem",
  32: "8rem",
} as const;

export const radius = {
  sm: "4px",
  md: "8px",
  lg: "12px",
  xl: "16px",
  full: "9999px",
} as const;

export const motion = {
  duration: {
    instant: 0.12,
    fast: 0.2,
    base: 0.3,
    slow: 0.5,
    page: 0.28, // page transitions must stay under 300ms
  },
  ease: {
    spring: [0.16, 1, 0.3, 1] as const, // snappy spring-like ease
    standard: [0.4, 0, 0.2, 1] as const,
    out: [0, 0, 0.2, 1] as const,
  },
} as const;

export const shadow = {
  sm: "0 1px 2px rgba(0,0,0,0.4)",
  md: "0 4px 12px rgba(0,0,0,0.45)",
  lg: "0 12px 32px rgba(0,0,0,0.55)",
  accentGlow: `0 0 24px ${color.accent.glow}`,
} as const;
