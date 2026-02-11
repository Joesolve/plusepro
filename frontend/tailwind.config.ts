import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        // PulsePro brand colors
        primary: {
          50: "#EBF0F7",
          100: "#D6E1EE",
          200: "#ADC3DD",
          300: "#84A5CC",
          400: "#5B87BB",
          500: "#1E3A5F",
          600: "#1A3354",
          700: "#162C49",
          800: "#12253E",
          900: "#0E1E33",
          DEFAULT: "#1E3A5F",
        },
        accent: {
          50: "#E6F9F7",
          100: "#CCF3EF",
          200: "#99E7DF",
          300: "#66DBCF",
          400: "#33CFBF",
          500: "#00B4A6",
          600: "#009D92",
          700: "#00867D",
          800: "#006F69",
          900: "#005855",
          DEFAULT: "#00B4A6",
        },
        background: "var(--background)",
        foreground: "var(--foreground)",
      },
      fontFamily: {
        sans: ["Inter", "system-ui", "sans-serif"],
      },
    },
  },
  plugins: [],
};
export default config;
