/** @type {import('tailwindcss').Config} */
const config = {
  darkMode: 'class',
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      boxShadow: {
        soft: '0 24px 80px rgba(15, 23, 42, 0.08)',
      },
      colors: {
        brand: {
          500: '#2563EB',
          600: '#1D4ED8',
        },
      },
    },
  },
  plugins: [],
};

module.exports = config;
