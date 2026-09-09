/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: 'class',
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        gov: {
          blue: '#003366',
          navy: '#0f172a',
          gold: '#d97706',
          emerald: '#059669',
          light: '#f8fafc',
          card: '#ffffff',
          border: '#e2e8f0',
        }
      }
    },
  },
  plugins: [],
}
