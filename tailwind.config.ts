import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        blue: {
          '50': 'rgb(239 246 255)',
          '100': 'rgb(219 234 254)',
          '200': 'rgb(191 219 254)',
          '300': 'rgb(147 197 253)',
          '400': 'rgb(96 165 250)',
          '500': 'rgb(59 130 246)',
          '600': 'rgb(37 99 235)',
          '700': 'rgb(29 78 216)',
          '800': 'rgb(30 64 175)',
          '900': 'rgb(30 58 138)',
        },
      },
    },
  },
  plugins: [],
};
export default config;
