/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,jsx}"],
  theme: {
    extend: {
      colors: {
        // Premium dark theme palette
        primary: {
          DEFAULT: '#6366F1', // Indigo
          50: '#EDEEF8',
          100: '#DDE0F4',
          200: '#BBC1E9',
          300: '#99A1DE',
          400: '#7782D3',
          500: '#6366F1',
          600: '#4F52C1',
          700: '#3B3D91',
          800: '#272961',
          900: '#131430',
        },
        accent: {
          DEFAULT: '#8B5CF6', // Purple
          50: '#F5F0FE',
          100: '#EBE1FD',
          200: '#D7C3FB',
          300: '#C3A5F9',
          400: '#AF87F7',
          500: '#8B5CF6',
          600: '#6F4AC5',
          700: '#533794',
          800: '#372563',
          900: '#1B1231',
        },
        pink: {
          DEFAULT: '#EC4899',
          50: '#FDF2F8',
          100: '#FCE7F3',
          200: '#FBCFE8',
          300: '#F9A8D4',
          400: '#F472B6',
          500: '#EC4899',
          600: '#DB2777',
          700: '#BE185D',
          800: '#9D174D',
          900: '#831843',
        },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'sans-serif'],
      },
      backgroundImage: {
        'gradient-radial': 'radial-gradient(var(--tw-gradient-stops))',
        'gradient-conic': 'conic-gradient(from 180deg at 50% 50%, var(--tw-gradient-stops))',
      },
      animation: {
        'pulse-slow': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
      },
    },
  },
  plugins: [],
}