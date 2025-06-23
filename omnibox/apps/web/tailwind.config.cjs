const plugin = require('tailwindcss/plugin');

module.exports = {
  content: [
    './app/**/*.{ts,tsx}',
    './components/**/*.{ts,tsx}',
    './lib/**/*.{ts,tsx}',
  ],
  theme: {
    fontSize: {
      base: ['16px', '24px'],
    },
    extend: {},
  },
  plugins: [
    require('tailwind-scrollbar'),
    plugin(function ({ addComponents }) {
      addComponents({
        '.container': {
          maxWidth: '1280px',
          paddingLeft: '1.5rem',
          paddingRight: '1.5rem',
          marginLeft: 'auto',
          marginRight: 'auto',
          display: 'grid',
          gridTemplateColumns: 'repeat(12, minmax(0, 1fr))',
        },
      });
    }),
  ],
};