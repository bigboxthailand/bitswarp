/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        background: '#0a0a0a',
        foreground: '#ededed',
        primary: {
          DEFAULT: '#3b82f6',
          foreground: '#ffffff',
        },
        card: {
          DEFAULT: '#141414',
          foreground: '#ededed',
        },
        border: '#262626',
      },
    },
  },
  plugins: [],
}
