import type { Config } from "tailwindcss";

export default {
  content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        ink: "#17211b",
        muted: "#69736d",
        canvas: "#f7f9f7",
        line: "#e4e9e5",
        brand: { DEFAULT: "#176b45", dark: "#115537", soft: "#e8f3ed" }
      },
      boxShadow: { card: "0 1px 2px rgba(23,33,27,.04), 0 8px 24px rgba(23,33,27,.04)" }
    }
  },
  plugins: []
} satisfies Config;
