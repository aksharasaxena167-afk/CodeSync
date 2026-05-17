/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      colors: {
        codesync: {
          bg: "#1e1e1e",
          panel: "#252526",
          sidebar: "#333333",
          border: "#3c3c3c",
          accent: "#007acc",
          "accent-hover": "#1a8ad4",
          terminal: "#0c0c0c",
        },
      },
    },
  },
  plugins: [],
};
