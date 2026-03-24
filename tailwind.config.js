/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/**/*.{html,ts}",
  ],
  theme: {
    extend: {
      colors: {
        'uni-blue': '#003A6B',
        'uni-orange': '#F28C28',
        'uni-light': '#337AB7'
      }
    },
  },
  plugins: [],
}
