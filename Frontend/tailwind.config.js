/** @type {import('tailwindcss').Config} */
export default {
  darkMode: "class",
  content: ["./index.html", "./src/**/*.{js,jsx}"],
  theme: {
    extend: {
      fontFamily: {
        display: ['"Archivo Black"', '"Space Grotesk"', "system-ui", "sans-serif"],
        body: ['"Space Grotesk"', "system-ui", "sans-serif"],
        mono: ['"JetBrains Mono"', "monospace"],
      },
      colors: {
        ink: "#0c1f35",
        cream: "#f0f7ff",
        neu: {
          yellow: "#60a5fa",
          pink: "#93c5fd",
          mint: "#bfdbfe",
          sky: "#3b82f6",
          purple: "#1d4ed8",
          orange: "#bfdbfe",
          red: "#ef4444",
        },
      },
      boxShadow: {
        neu: "4px 4px 0 0 #0c1f35",
        "neu-sm": "3px 3px 0 0 #0c1f35",
        "neu-xs": "2px 2px 0 0 #0c1f35",
        "neu-lg": "6px 6px 0 0 #0c1f35",
        "neu-pressed": "2px 2px 0 0 #0c1f35",
        "neu-dark": "4px 4px 0 0 #7ab3e0",
        "neu-dark-sm": "3px 3px 0 0 #7ab3e0",
      },
      keyframes: {
        float: {
          "0%, 100%": { transform: "translateY(0px)" },
          "50%": { transform: "translateY(-10px)" },
        },
        "count-pop": {
          "0%": { transform: "scale(0.75) translateY(8px)", opacity: "0" },
          "60%": { transform: "scale(1.08) translateY(-2px)" },
          "100%": { transform: "scale(1) translateY(0)", opacity: "1" },
        },
        "marquee-x": {
          "0%": { transform: "translateX(0)" },
          "100%": { transform: "translateX(-50%)" },
        },
        "pop-in": {
          "0%": { transform: "scale(0.92) translateY(8px)", opacity: "0" },
          "100%": { transform: "scale(1) translateY(0)", opacity: "1" },
        },
        blink: {
          "0%, 100%": { opacity: "1" },
          "50%": { opacity: "0.2" },
        },
        "slide-up": {
          from: { opacity: "0", transform: "translateY(18px)" },
          to: { opacity: "1", transform: "translateY(0)" },
        },
      },
      animation: {
        float: "float 3s ease-in-out infinite",
        "count-pop": "count-pop 420ms cubic-bezier(.2,.8,.2,1) both",
        "marquee-x": "marquee-x 28s linear infinite",
        "pop-in": "pop-in 420ms cubic-bezier(.2,.8,.2,1) both",
        blink: "blink 1.4s ease-in-out infinite",
        "slide-up": "slide-up 520ms cubic-bezier(.2,.8,.2,1) both",
      },
    },
  },
  plugins: [],
};
