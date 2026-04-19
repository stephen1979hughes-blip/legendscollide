import type { Config } from 'tailwindcss'

export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: '#0B3D2E',
        secondary: '#D4AF37',
        background: '#F5F5F5',
        text: '#222222',
        muted: '#888888',
      },
      fontFamily: {
        heading: ['Montserrat', 'Inter', 'sans-serif'],
        body: ['Roboto', 'Open Sans', 'sans-serif'],
      },
    },
  },
  plugins: [],
} satisfies Config
