/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        cyber: {
          dark: '#030712',
          card: '#0f172a',
          blue: '#60a5fa',
          purple: '#a78bfa',
          silver: '#e2e8f0',
          indigo: '#818cf8'
        }
      },
      boxShadow: {
        'glass': '0 8px 32px 0 rgba(0, 0, 0, 0.37)',
        'glass-inset': 'inset 0 1px 1px 0 rgba(255, 255, 255, 0.1)',
        'neon-blue': '0 0 15px rgba(96, 165, 250, 0.4)',
        'neon-purple': '0 0 15px rgba(167, 139, 250, 0.4)'
      },
      backdropBlur: {
        'xs': '2px',
      }
    },
  },
  plugins: [],
}
