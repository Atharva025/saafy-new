// tailwind.config.js
import { fontFamily } from 'tailwindcss/defaultTheme';

/** @type {import('tailwindcss').Config} */
export default {
  darkMode: 'class',
  content: [
    './index.html',
    './src/**/*.{js,jsx,ts,tsx}',
  ],
  theme: {
    extend: {
      screens: {
        'xs': '475px',
      },
      fontFamily: {
        sans: ['Inter Variable', 'Inter', ...fontFamily.sans],
        heading: ['Plus Jakarta Sans', 'Inter', ...fontFamily.sans],
        mono: ['Space Grotesk', 'SFMono-Regular', ...fontFamily.mono],
      },
      colors: {
        // New premium color system
        background: {
          primary: '#0E0E10',
          secondary: '#18181B',
          tertiary: '#1F1F23',
        },
        surface: {
          primary: '#27272A',
          secondary: '#3F3F46',
          elevated: '#52525B',
        },
        accent: {
          primary: '#7B5FFF',
          secondary: '#01FFD5',
          danger: '#FF4F4F',
          warning: '#FF6B35',
        },
        text: {
          primary: '#FAFAFA',
          secondary: '#D4D4D8',
          tertiary: '#A1A1AA',
          muted: '#71717A',
        },
        // Custom gradient colors
        gradient: {
          from: '#7B5FFF',
          to: '#01FFD5',
        },
        // Glass effect
        glass: {
          light: 'rgba(255, 255, 255, 0.05)',
          medium: 'rgba(255, 255, 255, 0.10)',
          dark: 'rgba(0, 0, 0, 0.20)',
        },
      },
      backgroundImage: {
        'gradient-primary': 'linear-gradient(90deg, #7B5FFF, #01FFD5)',
        'gradient-secondary': 'linear-gradient(135deg, #FF4F4F, #FF6B35)',
        'gradient-glass': 'linear-gradient(135deg, rgba(255,255,255,0.1), rgba(255,255,255,0.05))',
      },
      boxShadow: {
        'glow-sm': '0 0 20px rgba(123, 95, 255, 0.3)',
        'glow-md': '0 0 40px rgba(123, 95, 255, 0.4)',
        'glow-lg': '0 0 60px rgba(123, 95, 255, 0.5)',
        'glass': '0 8px 32px 0 rgba(31, 38, 135, 0.37)',
        'elevated': '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
      },
      backdropBlur: {
        'glass': '12px',
        'strong': '20px',
      },
      borderRadius: {
        'xl': '1rem',
        '2xl': '1.5rem',
        '3xl': '2rem',
      },
      transitionTimingFunction: {
        'bounce-subtle': 'cubic-bezier(0.34, 1.56, 0.64, 1)',
      },
      animation: {
        'fade-in': 'fadeIn 0.5s ease-out',
        'slide-up': 'slideUp 0.4s ease-out',
        'scale-in': 'scaleIn 0.3s ease-out',
        'pulse-glow': 'pulseGlow 2s ease-in-out infinite',
        'float': 'float 3s ease-in-out infinite',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0', transform: 'translateY(10px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        slideUp: {
          '0%': { opacity: '0', transform: 'translateY(20px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        scaleIn: {
          '0%': { opacity: '0', transform: 'scale(0.9)' },
          '100%': { opacity: '1', transform: 'scale(1)' },
        },
        pulseGlow: {
          '0%, 100%': { opacity: '0.8' },
          '50%': { opacity: '1' },
        },
        float: {
          '0%, 100%': { transform: 'translateY(0px)' },
          '50%': { transform: 'translateY(-4px)' },
        },
      },
    },
  },
  plugins: [],
  shadcn: {
    theme: {
      borderRadius: '1rem',
      accent: '#7B5FFF',
      background: '#0E0E10',
      card: '#18181B',
      text: '#FAFAFA',
      muted: '#A1A1AA',
    },
  },
};
