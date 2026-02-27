/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}', './admin/**/*.{ts,tsx}'],
  darkMode: 'class',
  theme: {
    extend: {
      fontFamily: {
        sans: ['"OpenAI Sans"', 'Inter', 'system-ui', 'sans-serif'],
        brand: ['"OpenAI Sans"', '"Philosopher"', 'Georgia', 'serif'],
        display: ['"OpenAI Sans"', '"Plus Jakarta Sans"', 'Inter', 'sans-serif'],
        mono: ['"JetBrains Mono"', '"Fira Code"', '"SF Mono"', 'Menlo', 'Consolas', 'monospace'],
      },
      colors: {
        background: 'var(--bg-primary)',
        surface: 'var(--bg-surface)',
        'surface-highlight': 'var(--bg-surface-highlight)',
        primary: 'var(--text-primary)',
        secondary: 'var(--text-secondary)',
        tertiary: 'var(--text-tertiary)',
        inverse: 'var(--text-inverse)',
        border: 'var(--border-primary)',
        'border-highlight': 'var(--border-focus)',
        action: {
          bg: 'var(--action-primary-bg)',
          text: 'var(--action-primary-text)',
          hover: 'var(--action-primary-hover)',
        },
        status: {
          success: { bg: 'var(--status-success-bg)', text: 'var(--status-success-text)' },
          warning: { bg: 'var(--status-warning-bg)', text: 'var(--status-warning-text)' },
          error: { bg: 'var(--status-error-bg)', text: 'var(--status-error-text)' },
          info: { bg: 'var(--status-info-bg)', text: 'var(--status-info-text)' },
        },
        brand: {
          50: '#f4f4f5',
          100: '#e4e4e7',
          200: '#d4d4d8',
          300: '#a1a1aa',
          400: '#71717a',
          500: '#52525b',
          600: '#3f3f46',
          700: '#27272a',
          800: '#18181b',
          900: '#09090b',
        }
      },
      backgroundImage: {
        'grid-light': 'radial-gradient(circle at 1px 1px, rgba(65,90,255,0.08) 1px, transparent 0)',
        'grid-dark': 'radial-gradient(circle at 1px 1px, rgba(91,153,255,0.15) 1px, transparent 0)',
        'spectrum': 'linear-gradient(135deg, rgba(65,90,255,0.9), rgba(181,36,255,0.85), rgba(34,211,238,0.7))'
      }
    }
  },
  plugins: [],
};
