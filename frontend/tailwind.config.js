/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        ink: {
          950: '#0B1220',
          900: '#111827',
          800: '#1F2937',
          700: '#374151',
        },
        steel: {
          50: '#F4F7FB',
          100: '#E8EEF7',
          200: '#D5E0EF',
          300: '#B7C7DC',
          400: '#8FA3BD',
          500: '#6B829E',
        },
        signal: {
          DEFAULT: '#0F766E',
          dark: '#0D9488',
          light: '#14B8A6',
          muted: '#CCFBF1',
        },
        amber: {
          accent: '#D97706',
        },
      },
      fontFamily: {
        display: ['"Space Grotesk"', 'system-ui', 'sans-serif'],
        body: ['"IBM Plex Sans"', 'system-ui', 'sans-serif'],
      },
      boxShadow: {
        soft: '0 10px 40px rgba(15, 23, 42, 0.08)',
      },
    },
  },
  plugins: [],
};
