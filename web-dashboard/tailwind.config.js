/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        gov: {
          navy: '#1E3A8A',
          'navy-dark': '#0F2253',
          'navy-light': '#2563EB',
          saffron: '#FF9933',
          'saffron-dark': '#D97706',
          green: '#138808',
          'green-dark': '#0E6606',
          'green-light': '#16A34A',
          cream: '#FFFDF9',
          border: '#E2E8F0',
          grey: '#334155',
          dark: '#0F172A',
        }
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'Segoe UI', 'Roboto', 'sans-serif'],
      }
    },
  },
  plugins: [],
};
