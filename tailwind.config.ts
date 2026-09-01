import type { Config } from "tailwindcss";

// Color and type tokens are taken directly from Design.md so the palette
// stays a single source of truth instead of being hardcoded per component.
const config: Config = {
  content: ["./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        background: "#0F172A", // Slate 900
        surface: "#1E293B", // Slate 800
        "surface-raised": "#243044",
        border: "#334155",
        accent: "#3B82F6", // Blue 500
        success: "#10B981", // Emerald 500
        warning: "#F59E0B", // Amber 500
        danger: "#EF4444", // Red 500
      },
      fontFamily: {
        sans: ["Inter", "ui-sans-serif", "system-ui", "sans-serif"],
        mono: ["JetBrains Mono", "Fira Code", "ui-monospace", "monospace"],
      },
    },
  },
  plugins: [],
};

export default config;
