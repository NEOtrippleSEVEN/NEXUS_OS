/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx,ts,tsx}'],
  theme: {
    extend: {
      colors: {
        'bg-base': '#F2F1ED',
        'bg-surface': '#FFFFFF',
        'bg-card': '#FAFAF7',
        'bg-orb': '#1A1A1F',
        'bg-orb-card': '#25252B',
        'border-subtle': '#E5E4DE',
        'border-card': '#E0DFD9',
        'border-hover': '#C5C4BE',
        'text-primary': '#1A1A1A',
        'text-secondary': '#6B6B6B',
        'text-muted': '#9B9B9B',
        'text-on-dark': '#E8E8ED',
        'text-on-dark-muted': '#8B8B94',
        'dot-grid': '#D5D4CE',
        'mac-red': '#FF5F57',
        'mac-yellow': '#FEBC2E',
        'mac-green': '#28C840',
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'sans-serif'],
      },
      letterSpacing: {
        wordmark: '-0.03em',
      },
    },
  },
  plugins: [],
}
