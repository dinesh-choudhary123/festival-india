import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./src/**/*.{js,ts,jsx,tsx,mdx}"],
  theme: {
    extend: {
      colors: {
        sidebar: {
          bg: "#1a1a2e",
          hover: "#16213e",
          active: "#0f3460",
          text: "#a0aec0",
          heading: "#718096",
        },
        brand: {
          orange: "#e94d1b",
          yellow: "#f2a900",
          green: "#22c55e",
          blue: "#3b82f6",
          purple: "#8b5cf6",
          pink: "#ec4899",
        },
        badge: {
          festival: "#f97316",
          social: "#3b82f6",
          observance: "#8b5cf6",
          global: "#22c55e",
          national: "#3b82f6",
          regional: "#f97316",
        },
      },
    },
  },
  plugins: [],
};
export default config;
