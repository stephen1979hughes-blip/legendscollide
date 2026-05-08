import type { Config } from 'tailwindcss'

export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: '#003D82',
        secondary: '#C8102E',
        background: '#F8F8F8',
        text: '#1a1a1a',
        muted: '#666666',
        cream: '#F5EFE7',
        gold: '#D4A574',
      },
      fontFamily: {
        heading: ['Playfair Display', 'Georgia', 'serif'],
        body: ['Courier New', 'Courier', 'monospace'],
      },
    },
  },
  plugins: [],
} satisfies Config
