/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // Paleta Elefantes Verdes
        primary: {
          50: '#f0fdf4',
          100: '#dcfce7',
          200: '#bbf7d0',
          300: '#86efac',
          400: '#4ade80',
          500: '#10B981',  // Verde esmeralda principal
          600: '#059669',  // Verde oscuro
          700: '#047857',  // Verde del logo
          800: '#065f46',
          900: '#064e3b',
        },
        secondary: {
          50: '#fef3c7',
          100: '#fde68a',
          200: '#fcd34d',
          300: '#fbbf24',
          400: '#f59e0b',
          500: '#d97706',
          600: '#b45309',
          700: '#92400e',  // Marrón tierra (del logo)
          800: '#78350f',
          900: '#451a03',
        },
        accent: {
          light: '#9DC183',  // Verde claro del logo
          DEFAULT: '#047857', // Verde oscuro del logo
        }
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
    },
  },
  plugins: [],
}
