import type { Config } from 'tailwindcss'

const config: Config = {
  darkMode: ['class'],
  content: [
    './src/pages/**/*.{ts,tsx}',
    './src/components/**/*.{ts,tsx}',
    './src/app/**/*.{ts,tsx}',
  ],
  theme: {
    container: {
      center: true,
      padding: '1rem',
      screens: { '2xl': '1400px' },
    },
    extend: {
      fontFamily: {
        display: ['"Saira Condensed"', 'sans-serif'],
        body: ['"Saira"', 'sans-serif'],
        mono: ['"Space Mono"', 'ui-monospace', 'monospace'],
      },
      colors: {
        // Brand
        brand: {
          DEFAULT: '#E8871E',
          light:   '#F2CC95',
          dark:    '#B65E18',
          surface: '#F2CC95',
          border:  '#E8871E40',
        },
        accent: {
          DEFAULT: '#1E9E6A',
          mid:     '#1C6E49',
          surface: '#A7DAC0',
          border:  '#1E9E6A40',
        },
        // App tokens (mapeiam para CSS vars)
        app: {
          bg:     'var(--background)',
          card:   'var(--background-card)',
          subtle: 'var(--background-subtle)',
          muted:  'var(--background-muted)',
        },
        sidebar: {
          bg:        'var(--sidebar-bg)',
          text:      'var(--sidebar-text)',
          active:    'var(--sidebar-active-bg)',
          'active-text': 'var(--sidebar-text-active)',
          hover:     'var(--sidebar-hover-bg)',
          border:    'var(--sidebar-border)',
        },
        ink: {
          DEFAULT:   'var(--text-primary)',
          secondary: 'var(--text-secondary)',
          muted:     'var(--text-muted)',
          inverse:   'var(--text-inverse)',
        },
        // shadcn semantic compat
        border:      'var(--border-color)',
        input:       'var(--input)',
        ring:        'var(--ring)',
        background:  'var(--background)',
        foreground:  'var(--foreground)',
        primary: {
          DEFAULT: 'var(--primary)',
          foreground: 'var(--primary-foreground)',
        },
        secondary: {
          DEFAULT: 'var(--secondary)',
          foreground: 'var(--secondary-foreground)',
        },
        destructive: {
          DEFAULT: 'var(--destructive)',
          foreground: 'var(--destructive-foreground)',
        },
        muted: {
          DEFAULT: 'var(--muted)',
          foreground: 'var(--muted-foreground)',
        },
        popover: {
          DEFAULT: 'var(--popover)',
          foreground: 'var(--popover-foreground)',
        },
        card: {
          DEFAULT: 'var(--card)',
          foreground: 'var(--card-foreground)',
        },
      },
      borderRadius: {
        lg: 'var(--radius)',
        md: 'calc(var(--radius) - 2px)',
        sm: 'calc(var(--radius) - 4px)',
      },
      keyframes: {
        'accordion-down': { from: { height: '0' }, to: { height: 'var(--radix-accordion-content-height)' } },
        'accordion-up':   { from: { height: 'var(--radix-accordion-content-height)' }, to: { height: '0' } },
      },
      animation: {
        'accordion-down': 'accordion-down 0.2s ease-out',
        'accordion-up':   'accordion-up 0.2s ease-out',
      },
    },
  },
  plugins: [require('tailwindcss-animate')],
}

export default config
