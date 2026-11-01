/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ['"Google Sans"', '"Google Sans Text"', 'Roboto', 'Helvetica', 'Arial', 'sans-serif'],
        display: ['"Google Sans"', 'sans-serif'],
        mono: ['"Google Sans Code"', '"Roboto Mono"', 'Consolas', '"Courier New"', 'monospace'],
      },
      colors: {
        wa: {
          dark: '#0b141a',
          card: '#111b21',
          teal: '#00a884',
          light: '#25d366',
          chat: '#202c33',
          bubble: '#005c4b',
          muted: '#8696a0'
        }
      },
      animation: {
        'scan': 'scan 2.5s ease-in-out infinite',
        'pulse-slow': 'pulse 4s cubic-bezier(0.4, 0, 0.6, 1) infinite',
      },
      keyframes: {
        scan: {
          '0%, 100%': { transform: 'translateY(0%)', opacity: '0.8' },
          '50%': { transform: 'translateY(100%)', opacity: '0.3' },
        }
      }
    },
  },
  plugins: [],
}
