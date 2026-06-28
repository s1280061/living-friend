import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        // The friend's "mood" palette, used across the UI.
        haru: {
          bg: "#f7f5f0",
          card: "#ffffff",
          accent: "#7c9885",
          bubble: "#dcf8c6",
        },
      },
      fontFamily: {
        sans: ["system-ui", "-apple-system", "Segoe UI", "Roboto", "sans-serif"],
      },
    },
  },
  plugins: [],
};

export default config;
