import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{ts,tsx}",
    "./components/**/*.{ts,tsx}",
    "./lib/**/*.{ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        navy: "#162A41",
        ink: "#191E23",
        teal: "#257E84",
        blue: "#2F6091",
        green: "#337A56",
        gold: "#B77D1C",
        muted: "#5B6978",
        mist: "#F1F5F7",
        line: "#DCE2E6",
      },
    },
  },
  plugins: [],
};

export default config;
