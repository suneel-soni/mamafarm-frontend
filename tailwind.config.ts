import type { Config } from 'tailwindcss';

const config: Config = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        background: 'var(--background)',
        foreground: 'var(--foreground)',
        brand: {
          green: '#283C06',
          brown: '#8B7E2A',
          cream: '#F4EDD6',
          white: '#FEFEFE',
        },
      },
    },
  },
  plugins: [],
};
export default config;
