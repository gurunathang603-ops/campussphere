/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,jsx}"],
  theme: {
    extend: {
      fontFamily: {
        display: ["'Space Grotesk'", "sans-serif"],
        body: ["'Inter'", "sans-serif"],
      },
      colors: {
        ink: "#0F1729",
        navy: { DEFAULT: "#132352", 50: "#EEF1F9", 100: "#D8DFF0", 600: "#1B2F63", 700: "#132352", 800: "#0D1B44", 900: "#091333" },
        indigo: { DEFAULT: "#3452E1", 50: "#EEF1FE", 600: "#2C46C7" },
        gold: { DEFAULT: "#E8A33D", 50: "#FDF4E6", 600: "#C9822A" },
        mist: "#F6F7FB",
      },
      boxShadow: {
        card: "0 1px 2px rgba(15,23,41,.04), 0 8px 24px -12px rgba(15,23,41,.12)",
        pop: "0 20px 60px -20px rgba(19,35,82,.35)",
      },
      maxWidth: { content: "1240px" },
      keyframes: {
        drift: { "0%,100%": { transform: "translate(0,0)" }, "50%": { transform: "translate(-2%,3%)" } },
        rise: { from: { opacity: 0, transform: "translateY(14px)" }, to: { opacity: 1, transform: "translateY(0)" } },
      },
      animation: { drift: "drift 16s ease-in-out infinite", rise: "rise .6s ease forwards" },
    },
  },
  plugins: [],
};
