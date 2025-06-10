/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
theme: {
    extend: {
      colors: {
        primary: {
          50: '#eef2ff',
          100: '#e0e7ff',
          200: '#c7d2fe',
          300: '#a5b4fc',
          400: '#818cf8',
          500: '#6366f1',
          600: '#4f46e5',
          700: '#4338ca',
          800: '#3730a3',
          900: '#312e81',
          DEFAULT: '#4F46E5',
          light: '#6366F1',
          dark: '#3730A3'
        },
        secondary: {
          DEFAULT: '#059669',
          light: '#10B981',
          dark: '#047857'
        },
        accent: '#F59E0B',
        surface: {
          50: '#f8fafc',
          100: '#f1f5f9',
          200: '#e2e8f0',
          300: '#cbd5e1',
          400: '#94a3b8',
          500: '#64748b',
          600: '#475569',
          700: '#334155',
          800: '#1e293b',
          900: '#0f172a'
        },
        craft: {
          grass: '#4ADE80',
          dirt: '#92400E',
          stone: '#6B7280',
          wood: '#A16207',
          water: '#3B82F6',
          sand: '#FCD34D'
        }
      },
      fontFamily: {
        sans: ['Inter', 'ui-sans-serif', 'system-ui'],
        heading: ['Space Grotesk', 'ui-sans-serif', 'system-ui']
      },
      boxShadow: {
        'soft': '0 2px 15px -3px rgba(0, 0, 0, 0.07), 0 10px 20px -2px rgba(0, 0, 0, 0.04)',
        'card': '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -2px rgba(0, 0, 0, 0.1)',
        'neu-light': '5px 5px 15px #d1d9e6, -5px -5px 15px #ffffff',
        'neu-dark': '5px 5px 15px rgba(0, 0, 0, 0.3), -5px -5px 15px rgba(255, 255, 255, 0.05)',
        'game': '0 0 20px rgba(79, 70, 229, 0.3)'
},
      borderRadius: {
        'xl': '0.75rem',
        '2xl': '1rem'
      },
      // 3D-specific responsive utilities
      perspective: {
        'none': 'none',
        '500': '500px',
        '1000': '1000px',
        '1500': '1500px',
        '2000': '2000px'
      },
      zIndex: {
        '60': '60',
        '70': '70',
        '80': '80',
        '90': '90',
        '100': '100'
      },
      // Enhanced responsive spacing for 3D UI
      spacing: {
        '18': '4.5rem',
        '22': '5.5rem',
        '26': '6.5rem',
        '30': '7.5rem'
      },
      animation: {
        'block-place': 'blockPlace 0.3s ease-out',
        'block-break': 'blockBreak 0.4s ease-in',
        'float': 'float 2s ease-in-out infinite',
'object-select': 'objectSelect 0.2s ease-out',
        'ui-slide-in': 'uiSlideIn 0.3s ease-out',
        'data-overlay-fade': 'dataOverlayFade 0.2s ease-in-out'
      },
      keyframes: {
        blockPlace: {
          '0%': { transform: 'scale(0) rotateY(0deg)', opacity: '0' },
          '50%': { transform: 'scale(1.2) rotateY(180deg)', opacity: '0.8' },
          '100%': { transform: 'scale(1) rotateY(360deg)', opacity: '1' }
        },
        blockBreak: {
          '0%': { transform: 'scale(1) rotate(0deg)', opacity: '1' },
          '50%': { transform: 'scale(1.1) rotate(5deg)', opacity: '0.7' },
          '100%': { transform: 'scale(0) rotate(15deg)', opacity: '0' }
        },
        float: {
          '0%, 100%': { transform: 'translateY(0px)' },
          '50%': { transform: 'translateY(-6px)' }
        },
        pulseGlow: {
          '0%, 100%': { boxShadow: '0 0 10px rgba(79, 70, 229, 0.3)' },
          '50%': { boxShadow: '0 0 20px rgba(79, 70, 229, 0.6)' }
        },
        objectSelect: {
          '0%': { transform: 'scale(1)', boxShadow: '0 0 0 rgba(79, 70, 229, 0)' },
          '50%': { transform: 'scale(1.05)', boxShadow: '0 0 20px rgba(79, 70, 229, 0.8)' },
          '100%': { transform: 'scale(1)', boxShadow: '0 0 10px rgba(79, 70, 229, 0.4)' }
        },
        uiSlideIn: {
          '0%': { transform: 'translateX(100%)', opacity: '0' },
          '100%': { transform: 'translateX(0)', opacity: '1' }
        },
        dataOverlayFade: {
          '0%': { opacity: '0', transform: 'translateY(10px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' }
        }
      }
    }
  },
  plugins: [],
  darkMode: 'class'
}