import type { Config } from "tailwindcss";

// All neutral scales are CSS-variable driven (RGB triplets) so light/dark/system
// themes swap at :root without touching component code. Signal colors (brand,
// ok, warn, danger, info) are theme-invariant by design — status must read
// identically in both themes.

const v = (name: string) => `rgb(var(--${name}) / <alpha-value>)`;

const config: Config = {
  content: ["./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        ink: {
          DEFAULT: v("ink"), // page background
          surface: v("ink-surface"), // cards, panels
          elevated: v("ink-elevated"), // modals, dropdowns, palette
          raised: v("ink-raised"),
        },
        line: {
          subtle: v("line-subtle"),
          DEFAULT: v("line"),
          strong: v("line-strong"),
        },
        // Brand = the logo: a volt-green lightning bolt striking through deep
        // harbor navy. Green carries action/identity; cyan carries gradients.
        brand: {
          DEFAULT: "#00ED82",
          secondary: "#2BD9FF",
          deep: "#0E3A4C", // the logo's navy "D"
          soft: "rgba(0,237,130,0.12)",
        },
        ok: { DEFAULT: "#10B981", soft: "rgba(16,185,129,0.12)" },
        warn: { DEFAULT: "#F59E0B", soft: "rgba(245,158,11,0.12)" },
        danger: { DEFAULT: "#EF4444", soft: "rgba(239,68,68,0.12)" },
        info: { DEFAULT: "#38BDF8", soft: "rgba(56,189,248,0.12)" },
        fg: {
          DEFAULT: v("fg"),
          secondary: v("fg-secondary"),
          muted: v("fg-muted"),
          faint: v("fg-faint"),
        },
      },
      fontFamily: {
        sans: ["var(--font-plex)", "system-ui", "sans-serif"],
        display: ["var(--font-sora)", "var(--font-plex)", "sans-serif"],
        mono: ["var(--font-plex-mono)", "ui-monospace", "monospace"],
        serif: ["var(--font-newsreader)", "Newsreader", "Georgia", "serif"],
      },
      // Global readability floor v4: nothing renders below 14px. These tokens
      // are the master volume knob for the whole product — every label, hint,
      // chip, and cell must read at first glance, not at arm's length.
      fontSize: {
        "2xs": ["14px", "20px"],
        xs: ["15px", "22px"],
        sm: ["16px", "24px"],
        base: ["17px", "26px"],
        lg: ["19px", "28px"],
        xl: ["22px", "30px"],
        "2xl": ["26px", "34px"],
        "3xl": ["32px", "40px"],
        "4xl": ["40px", "46px"],
      },
      borderRadius: {
        card: "12px",
      },
      boxShadow: {
        card: "var(--shadow-card)",
        "card-hover": "var(--shadow-card-hover)",
        pop: "var(--shadow-pop)",
        glow: "0 0 24px rgba(0,237,130,0.30)",
      },
      keyframes: {
        shimmer: {
          "0%": { backgroundPosition: "-400px 0" },
          "100%": { backgroundPosition: "400px 0" },
        },
        pulseRed: {
          "0%, 100%": { boxShadow: "0 0 0 0 rgba(239,68,68,0)" },
          "50%": { boxShadow: "0 0 16px 2px rgba(239,68,68,0.35)" },
        },
        riseIn: {
          from: { opacity: "0", transform: "translateY(8px)" },
          to: { opacity: "1", transform: "translateY(0)" },
        },
      },
      animation: {
        shimmer: "shimmer 1.6s linear infinite",
        pulseRed: "pulseRed 2.4s ease-in-out infinite",
        riseIn: "riseIn 0.25s cubic-bezier(0.4,0,0.2,1) both",
      },
    },
  },
  plugins: [],
};
export default config;
