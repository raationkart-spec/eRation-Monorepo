import type { Config } from "tailwindcss";

// Design tokens from PRD Part 2 — Zepto-style palette.
const config: Config = {
  content: [
    "./app/**/*.{ts,tsx}",
    "./components/**/*.{ts,tsx}",
    "./lib/**/*.{ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          DEFAULT: "#F97316",
          light: "#FDBA74",
          dark: "#EA580C",
          50: "#FFF7ED",
          100: "#FFEDD5",
        },
        surface: {
          DEFAULT: "#FFFFFF",
          muted: "#F6F7F8",
          border: "#EAECEE",
          overlay: "rgba(0,0,0,0.5)",
        },
        ink: {
          DEFAULT: "#1A1A1A",
          muted: "#6B7280",
          subtle: "#9CA3AF",
          inverse: "#FFFFFF",
        },
        status: {
          success: "#22C55E",
          warning: "#F59E0B",
          error: "#EF4444",
          info: "#3B82F6",
        },
        order: {
          placed: "#3B82F6",
          confirmed: "#8B5CF6",
          packed: "#F59E0B",
          out_delivery: "#F97316",
          delivered: "#22C55E",
          cancelled: "#EF4444",
        },
      },
      fontFamily: {
        sans: ["Inter", "system-ui", "sans-serif"],
      },
      fontSize: {
        "2xs": ["10px", { lineHeight: "14px" }],
        xs: ["12px", { lineHeight: "16px" }],
        sm: ["13px", { lineHeight: "18px" }],
        base: ["14px", { lineHeight: "20px" }],
        md: ["15px", { lineHeight: "22px" }],
        lg: ["16px", { lineHeight: "24px" }],
        xl: ["18px", { lineHeight: "26px" }],
        "2xl": ["22px", { lineHeight: "30px" }],
        "3xl": ["28px", { lineHeight: "36px" }],
      },
      spacing: {
        "4.5": "18px",
        "13": "52px",
        "15": "60px",
        "18": "72px",
        "22": "88px",
      },
      borderRadius: {
        sm: "6px",
        DEFAULT: "10px",
        md: "12px",
        lg: "16px",
        xl: "20px",
        "2xl": "24px",
      },
      boxShadow: {
        card: "0 1px 4px rgba(0,0,0,0.08)",
        float: "0 4px 20px rgba(0,0,0,0.12)",
        nav: "0 -1px 0 #EAECEE",
      },
      keyframes: {
        "scale-in": {
          "0%": { transform: "scale(0.8)", opacity: "0" },
          "100%": { transform: "scale(1)", opacity: "1" },
        },
        "slide-up": {
          "0%": { transform: "translateY(100%)" },
          "100%": { transform: "translateY(0)" },
        },
        "fade-in": {
          "0%": { opacity: "0" },
          "100%": { opacity: "1" },
        },
        "bump": {
          "0%": { transform: "scale(1)" },
          "50%": { transform: "scale(1.3)" },
          "100%": { transform: "scale(1)" },
        },
      },
      animation: {
        "scale-in": "scale-in 150ms ease-out",
        "slide-up": "slide-up 250ms cubic-bezier(0.32,0.72,0,1)",
        "fade-in": "fade-in 150ms ease-out",
        "bump": "bump 200ms ease-out",
      },
    },
  },
  plugins: [],
};

export default config;
