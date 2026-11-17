import type { Config } from "tailwindcss";

// Colors come from CSS variables (see globals.css). Bauhaus / print look:
// every corner is square, every shadow is flat, nothing glows.
const token = (name: string) => `rgb(var(--${name}) / <alpha-value>)`;

const config: Config = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    // Overriding (not extending) borderRadius removes rounding everywhere,
    // including `rounded-full`.
    borderRadius: {
      none: "0",
      sm: "0",
      DEFAULT: "0",
      md: "0",
      lg: "0",
      xl: "0",
      "2xl": "0",
      "3xl": "0",
      full: "0",
    },
    boxShadow: {
      none: "none",
      sm: "none",
      DEFAULT: "none",
      md: "none",
      lg: "none",
      xl: "none",
      "2xl": "none",
      inner: "none",
      glow: "none",
      soft: "none",
      // Hard, offset "printed block" shadow used sparingly for emphasis.
      block: "6px 6px 0 0 rgb(var(--ink))",
    },
    extend: {
      colors: {
        canvas: token("canvas"),
        surface: token("surface"),
        surface2: token("surface2"),
        line: token("line"),
        ink: token("ink"),
        mute: token("mute"),
        accent: token("accent"), // burnt orange
        "accent-fg": token("accent-fg"),
        mustard: token("mustard"),
        ok: token("ok"),
        danger: token("danger"),
      },
      fontFamily: {
        sans: ['"Helvetica Neue"', "Helvetica", "Arial", '"Liberation Sans"', "sans-serif"],
        display: ['"Helvetica Neue"', "Helvetica", "Arial", '"Liberation Sans"', "sans-serif"],
      },
    },
  },
  plugins: [],
};

export default config;
