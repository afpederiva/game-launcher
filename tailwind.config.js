/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/renderer/**/*.{js,jsx,ts,tsx}",
    "./src/renderer/index.html",
  ],
  theme: {
    extend: {
      colors: {
        // Background layers
        bg: {
          primary: '#0b0e14',
          secondary: '#151923',
          tertiary: '#1c2130',
        },
        // Accent colors
        accent: {
          purple: '#7c7cff',
          blue: '#4cc2ff',
          green: '#2ecc71',
        },
        // Text colors
        text: {
          primary: '#e6e6eb',
          secondary: '#9aa0b3',
        },
        // Border
        border: {
          subtle: 'rgba(255, 255, 255, 0.05)',
        }
      },
      fontFamily: {
        sans: ['Inter', 'SF Pro', 'Manrope', 'system-ui', 'sans-serif'],
      },
      boxShadow: {
        'card': '0 4px 20px rgba(0, 0, 0, 0.5)',
        'card-hover': '0 8px 30px rgba(0, 0, 0, 0.7)',
      },
      animation: {
        'fade-in': 'fadeIn 0.3s ease-out',
        'scale-in': 'scaleIn 0.2s ease-out',
        'shimmer': 'shimmer 2s infinite',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        scaleIn: {
          '0%': { transform: 'scale(0.95)', opacity: '0' },
          '100%': { transform: 'scale(1)', opacity: '1' },
        },
        shimmer: {
          '0%': { backgroundPosition: '-200% 0' },
          '100%': { backgroundPosition: '200% 0' },
        },
      },
    },
  },
  plugins: [],
}
