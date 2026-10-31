/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      colors: {
        ink: "#06080D",
        ink2: "#090C13",
        panel: "#0B0F18",
        mint: "#7CF7C4",
        mintdim: "#38D39F",
        danger: "#FF6B6B",
        gold: "#F5C451",
        violet: "#B69CFF",
        blue: "#7FB2FF",
        pink: "#FF8FB1",
      },
      fontFamily: {
        sans: ["Space Grotesk Variable", "ui-sans-serif", "system-ui", "sans-serif"],
        mono: ["JetBrains Mono Variable", "ui-monospace", "SFMono-Regular", "monospace"],
      },
      boxShadow: {
        glow: "0 0 0 1px rgba(124,247,196,0.18), 0 0 40px rgba(124,247,196,0.10)",
        card: "0 24px 80px rgba(0,0,0,0.45)",
      },
      backgroundImage: {
        "mesh": "radial-gradient(circle at 10% 0%, rgba(124,247,196,0.08), transparent 32%), radial-gradient(circle at 90% 10%, rgba(182,156,255,0.08), transparent 30%), radial-gradient(circle at 50% 100%, rgba(245,196,81,0.05), transparent 40%)",
      },
      keyframes: {
        "pulse-dot": {
          "0%, 100%": { opacity: "1", transform: "scale(1)" },
          "50%": { opacity: "0.4", transform: "scale(0.72)" },
        },
        ticker: {
          "0%": { transform: "translateX(0)" },
          "100%": { transform: "translateX(-50%)" },
        },
        "fade-up": {
          "0%": { opacity: "0", transform: "translateY(8px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
        scan: {
          "0%": { transform: "translateY(-100%)" },
          "100%": { transform: "translateY(700%)" },
        },
        shimmer: {
          "0%": { backgroundPosition: "200% 0" },
          "100%": { backgroundPosition: "-200% 0" },
        },
      },
      animation: {
        "pulse-dot": "pulse-dot 2s ease-in-out infinite",
        ticker: "ticker 38s linear infinite",
        "fade-up": "fade-up 0.35s ease-out both",
        scan: "scan 7s linear infinite",
        shimmer: "shimmer 3s linear infinite",
      },
    },
  },
  plugins: [],
};
