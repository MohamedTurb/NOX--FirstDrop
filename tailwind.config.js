/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx,ts,tsx}', './NOXLandingPage.jsx'],
  theme: {
    extend: {
      container: {
        center: true,
        padding: {
          DEFAULT: '1rem',
          sm: '2rem',
          lg: '4rem',
        },
      },
      fontFamily: {
        sans: ['Space Grotesk', 'sans-serif'],
        display: ['Cormorant Garamond', 'serif'],
      },
      spacing: {
        '9': '2.25rem',
      },
    },
  },
  plugins: [],
};
