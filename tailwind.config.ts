import type { Config } from 'tailwindcss';

const config: Config = {
  darkMode: 'class',
  content: ['./src/**/*.{js,ts,jsx,tsx,mdx}'],
  theme: {
    extend: {
      colors: {
        slate: {
          50: '#f5f7f1',
          100: '#e9eee3',
          200: '#d5dfcc',
          300: '#b4c2a6',
          400: '#8b9b7d',
          500: '#68785c',
          600: '#4f5d46',
          700: '#3b4735',
          800: '#283126',
          900: '#1b211a',
          950: '#12160f',
        },
        brand: {
          50: '#f1f8e9',
          100: '#dff1c9',
          200: '#c3e4a1',
          300: '#9ece70',
          400: '#82b953',
          500: '#6a9e3f',
          600: '#527c31',
          700: '#416228',
          800: '#364e23',
          900: '#2e401f',
        },
        rose: {
          50: '#fdf2ee',
          100: '#f9ded4',
          200: '#f2b9a7',
          300: '#e89379',
          400: '#dc7255',
          500: '#c85a3f',
          600: '#a84630',
          700: '#863628',
          800: '#6b2d23',
          900: '#58281f',
        },
        sky: {
          50: '#edf6f8',
          100: '#d5eaef',
          200: '#add5de',
          300: '#7cb8c7',
          400: '#529bad',
          500: '#3d7f92',
          600: '#326777',
          700: '#2b5361',
          800: '#26454f',
          900: '#213943',
        },
      },
      fontFamily: {
        sans: ['var(--font-body)', 'ui-sans-serif', 'system-ui', 'sans-serif'],
        display: ['var(--font-display)', 'var(--font-body)', 'sans-serif'],
        mono: ['var(--font-data)', 'ui-monospace', 'monospace'],
      },
      keyframes: {
        'pulse-ring': {
          '0%': { transform: 'scale(0.8)', opacity: '0.8' },
          '100%': { transform: 'scale(2.2)', opacity: '0' },
        },
        'fade-up': {
          '0%': { opacity: '0', transform: 'translateY(10px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
      },
      animation: {
        'pulse-ring': 'pulse-ring 1.8s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'fade-up': 'fade-up 0.4s ease-out both',
      },
    },
  },
  plugins: [],
};

export default config;
