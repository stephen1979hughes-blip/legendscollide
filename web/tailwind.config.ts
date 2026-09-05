import type { Config } from 'tailwindcss'

export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        /**
         * Surface scale. On a dark UI depth comes from lightness steps and
         * hairline borders — not from shadows, which are invisible against a
         * near-black ground. Use ground -> surface -> raised in that order and
         * don't invent intermediate values.
         */
        ground: '#0B0D10',
        surface: '#14171C',
        raised: '#1C2027',
        line: '#242A32',
        'line-strong': '#343C46',

        /** Text. ink-3 is for decoration only — it fails AA on body copy. */
        ink: '#E8EBEF',
        'ink-2': '#8A929E',
        'ink-3': '#5E6773',

        /**
         * Floodlight amber — the single bright accent, and the only saturated
         * colour that should appear on a screen by default. It always carries
         * dark ink on top; white on amber fails contrast.
         */
        accent: '#F5B841',
        'accent-hover': '#FFC85C',
        'accent-ink': '#14171C',
        'accent-dim': '#7A5C1B',

        /** Semantic state, kept separate from the accent hue. */
        danger: '#E5484D',
        positive: '#3DDC84',

        /**
         * Legacy names. Kept so untouched call sites still compile, but
         * repointed to values that actually read against #0B0D10 — the old
         * primary (#003D82) was near-invisible on black and unusable as a
         * focus ring.
         */
        primary: '#2F6FE0',
        secondary: '#E5484D',
        muted: '#8A929E',
        background: '#0B0D10',
        text: '#E8EBEF',
        cream: '#F5EFE7',
        gold: '#D4A574',
      },
      fontFamily: {
        /**
         * Playfair is reserved for team names, scorelines and big numbers —
         * roughly ten places in the app. Reserving it is what makes it read as
         * a choice rather than as the default.
         */
        display: ['"Playfair Display"', 'Georgia', 'serif'],
        heading: ['Inter', 'system-ui', '-apple-system', 'Segoe UI', 'sans-serif'],
        body: ['Inter', 'system-ui', '-apple-system', 'Segoe UI', 'sans-serif'],
      },
      borderRadius: {
        card: '14px',
        ctl: '10px',
      },
      /**
         Spacing rhythm. Sections are separated by `space-y-section`, blocks
         within a section by `gap-block`. Six values, no per-page judgement.
       */
      spacing: {
        block: '1.25rem',
        section: '2.5rem',
        page: '4rem',
      },
      animation: {
        fadeIn: 'fadeIn 0.4s ease-out',
        slideUp: 'slideUp 0.35s ease-out',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        slideUp: {
          '0%': { opacity: '0', transform: 'translateY(8px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
      },
      boxShadow: {
        /**
         * Only two, and only for things that genuinely float above the page.
         * Each pairs the shadow with a light hairline, because on a dark ground
         * the hairline is what actually reads as an edge.
         */
        pop: '0 12px 32px -14px rgba(0,0,0,0.85), 0 0 0 1px rgba(255,255,255,0.06)',
        glow: '0 0 0 1px rgba(245,184,65,0.30), 0 10px 28px -14px rgba(245,184,65,0.30)',
      },
    },
  },
  plugins: [],
} satisfies Config
