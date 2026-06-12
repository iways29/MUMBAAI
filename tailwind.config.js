/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/**/*.{js,jsx,ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        void: 'var(--color-void)',
        panel: {
          DEFAULT: 'var(--color-panel)',
          2: 'var(--color-panel-2)',
        },
        bone: 'var(--color-bone)',
        ash: 'var(--color-ash)',
        smoke: 'var(--color-smoke)',
        hairline: {
          DEFAULT: 'var(--color-hairline)',
          strong: 'var(--color-hairline-strong)',
        },
        plum: {
          DEFAULT: 'var(--color-plum)',
          hover: 'var(--color-plum-hover)',
          soft: 'var(--color-plum-soft)',
        },
        amber: 'var(--color-amber)',
        lichen: 'var(--color-lichen)',
        danger: 'var(--color-danger)',
      },
      fontFamily: {
        sans: ['Inter Variable', 'Inter', 'ui-sans-serif', 'system-ui', 'sans-serif'],
      },
      letterSpacing: {
        display: '-0.04em',
        body: '0.015em',
        kicker: '0.05em',
      },
      borderRadius: {
        pill: '24px',
        node: '16px',
      },
      maxWidth: {
        page: '1200px',
      },
      transitionTimingFunction: {
        out: 'cubic-bezier(0.16, 1, 0.3, 1)',
      },
      transitionDuration: {
        fast: '120ms',
        med: '200ms',
        slow: '320ms',
      },
    },
  },
  plugins: [],
}
