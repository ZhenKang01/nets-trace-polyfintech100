/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      colors: {
        nets: {
          red: "#E31837",
          navy: "#1B3464",
          blue: "#2B5CBF",
          "gray-bg": "#F5F6F8",
          border: "#E0E2E6",
          text: "#1A1A2E",
          muted: "#6B7280",
          "light-blue": "#60A5FA",
        },
      },
      fontFamily: {
        sans: ["Inter", "system-ui", "-apple-system", "sans-serif"],
      },
      borderRadius: {
        nets: "12px",
        "nets-btn": "10px",
      },
    },
  },
  plugins: [],
};
