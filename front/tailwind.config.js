/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: "class",
  content: ["./src/**/*.{js,jsx,ts,tsx}"],
  theme: {
    extend: {
      colors: {
        pos: {
          surface: "#f9f9ff",
          "surface-container": "#e7eeff",
          "surface-container-high": "#dee8ff",
          "surface-container-low": "#f0f3ff",
          "on-surface": "#111c2d",
          "on-surface-variant": "#3d4947",
          outline: "#6d7a77",
          "outline-variant": "#bcc9c6",
          primary: "#00685f",
          "on-primary": "#ffffff",
          "primary-container": "#008378",
          "on-primary-container": "#f4fffc",
          "primary-fixed": "#89f5e7",
          "primary-fixed-dim": "#6bd8cb",
          secondary: "#006b5f",
          "secondary-container": "#62fae3",
          "on-secondary-container": "#007165",
          tertiary: "#4b41e1",
          "tertiary-container": "#645efb",
          "on-tertiary-container": "#fffbff",
          "inverse-surface": "#263143",
          error: "#ba1a1a",
          "error-container": "#ffdad6",
          "on-error-container": "#93000a",
        },
      },
      fontFamily: {
        pos: ["Manrope", "system-ui", "sans-serif"],
        "pos-mono": ["JetBrains Mono", "ui-monospace", "monospace"],
      },
      boxShadow: {
        "admin-sm": "0 1px 2px rgba(15, 23, 42, 0.06)",
        "admin-lg": "0 18px 40px rgba(15, 23, 42, 0.16)",
      },
      keyframes: {
        "sc-in": {
          "0%": { opacity: "0", transform: "translateY(8px) scale(0.98)" },
          "100%": { opacity: "1", transform: "translateY(0) scale(1)" },
        },
      },
      animation: {
        "sc-in": "sc-in 160ms ease-out",
      },
    },
  },
  plugins: [],
};
