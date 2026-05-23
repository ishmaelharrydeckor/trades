// tailwind.config.ts
import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: "class",
  content: [
    "./app/**/*.{ts,tsx}",
    "./components/**/*.{ts,tsx}",
    "./lib/**/*.{ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // Surface palette
        app: "#0b0f19",
        panel: "#131b2e",
        "panel-border": "#1e293b",
        // Accents
        profit: {
          DEFAULT: "#22c55e",
          glow: "#064e3b",
        },
        loss: {
          DEFAULT: "#ef4444",
          glow: "#7f1d1d",
        },
        equity: "#3b82f6",
      },
      fontFamily: {
        sans: ["var(--font-sans)", "ui-sans-serif", "system-ui", "sans-serif"],
      },
      boxShadow: {
        "glow-profit": "0 0 80px -20px rgba(34, 197, 94, 0.45)",
        "glow-loss": "0 0 80px -20px rgba(239, 68, 68, 0.45)",
        "glow-equity": "0 0 80px -20px rgba(59, 130, 246, 0.45)",
      },
    },
  },
  plugins: [],
};

export default config;
