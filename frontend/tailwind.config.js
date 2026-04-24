/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        'mono': ['JetBrains Mono', 'Fira Code', 'monospace'],
        'sans': ['Space Grotesk', 'system-ui', 'sans-serif'],
      },
      colors: {
        // Re-mapped to yellow/black premium glass palette.
        // Names kept identical so existing JSX classes (bg-dark-700,
        // text-accent-primary, etc.) re-skin without touching components.
        dark: {
          900: '#0A0A0A', // page background
          800: '#111111', // secondary surface
          700: 'rgba(255,255,255,0.04)', // glass surface
          600: 'rgba(255,255,255,0.08)', // glass border
          500: 'rgba(255,255,255,0.12)', // hover border
        },
        accent: {
          primary: '#FACC15',   // yellow (was indigo)
          secondary: '#FDE047', // softer yellow highlight
          green: '#22C55E',
          red: '#EF4444',
          yellow: '#FACC15',
        },
      },
      boxShadow: {
        'glow-yellow': '0 0 20px rgba(250, 204, 21, 0.35)',
        'glow-yellow-lg': '0 0 32px rgba(250, 204, 21, 0.55)',
        'glass': '0 8px 32px rgba(0, 0, 0, 0.45)',
      },
      backdropBlur: {
        xs: '4px',
      },
    },
  },
  plugins: [],
}
