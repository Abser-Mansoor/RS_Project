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
        ink: "#0a0a0a",
        cream: "#fef6e4",
        bone: "#fffaeb",
        neu: {
          yellow: "#ffd23f",
          pink: "#ff5c8a",
          mint: "#7afcd1",
          sky: "#74c0fc",
          purple: "#c0a8ff",
          orange: "#ff8c42",
          lime: "#d4f04e",
          red: "#ff4747",
        },
      },
      boxShadow: {
        neu: "6px 6px 0 0 #0a0a0a",
        "neu-sm": "4px 4px 0 0 #0a0a0a",
        "neu-xs": "2px 2px 0 0 #0a0a0a",
        "neu-lg": "10px 10px 0 0 #0a0a0a",
        "neu-pressed": "2px 2px 0 0 #0a0a0a",
        "neu-dark": "6px 6px 0 0 #fef6e4",
        "neu-dark-sm": "4px 4px 0 0 #fef6e4",
      },
      keyframes: {
        wiggle: {
          "0%, 100%": { transform: "rotate(-1deg)" },
          "50%": { transform: "rotate(1deg)" },
        },
        marquee: {
          "0%": { transform: "translateX(0)" },
          "100%": { transform: "translateX(-50%)" },
        },
        "pop-in": {
          "0%": { transform: "scale(0.92) translateY(8px)", opacity: "0" },
          "100%": { transform: "scale(1) translateY(0)", opacity: "1" },
        },
        blink: {
          "0%, 100%": { opacity: "1" },
          "50%": { opacity: "0.35" },
        },
      },
      animation: {
        wiggle: "wiggle 2.4s ease-in-out infinite",
        marquee: "marquee 32s linear infinite",
        "pop-in": "pop-in 420ms cubic-bezier(.2,.8,.2,1) both",
        blink: "blink 1.4s ease-in-out infinite",
      },
    },
  },
  plugins: [],
};
