/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        m3: {
          primary: 'var(--m3-primary)',
          onPrimary: 'var(--m3-on-primary)',
          primaryContainer: 'var(--m3-primary-container)',
          onPrimaryContainer: 'var(--m3-on-primary-container)',
          secondary: 'var(--m3-secondary)',
          onSecondary: 'var(--m3-on-secondary)',
          secondaryContainer: 'var(--m3-secondary-container)',
          onSecondaryContainer: 'var(--m3-on-secondary-container)',
          tertiary: 'var(--m3-tertiary)',
          onTertiary: 'var(--m3-on-tertiary)',
          tertiaryContainer: 'var(--m3-tertiary-container)',
          onTertiaryContainer: 'var(--m3-on-tertiary-container)',
          error: 'var(--m3-error)',
          onError: 'var(--m3-on-error)',
          errorContainer: 'var(--m3-error-container)',
          onErrorContainer: 'var(--m3-on-error-container)',
          surface: 'var(--m3-surface)',
          onSurface: 'var(--m3-on-surface)',
          surfaceVariant: 'var(--m3-surface-variant)',
          onSurfaceVariant: 'var(--m3-on-surface-variant)',
          outline: 'var(--m3-outline)',
          outlineVariant: 'var(--m3-outline-variant)',
          surfaceContainerHighest: 'var(--m3-surface-container-highest)',
          surfaceContainerHigh: 'var(--m3-surface-container-high)',
          surfaceContainer: 'var(--m3-surface-container)',
          surfaceContainerLow: 'var(--m3-surface-container-low)',
          surfaceContainerLowest: 'var(--m3-surface-container-lowest)',
        }
      },
      fontFamily: {
        sans: ['"Google Sans Flex"', '"Roboto Flex"', 'Roboto', 'system-ui', 'sans-serif'],
      },
      borderRadius: {
        'm3-sm': '12px',
        'm3-md': '16px',
        'm3-lg': '20px',
        'm3-xl': '28px',
        'm3-2xl': '32px',
      },
      boxShadow: {
        'm3-1': '0 1px 3px rgba(0, 0, 0, 0.28), 0 1px 2px rgba(0, 0, 0, 0.2)',
        'm3-2': '0 4px 12px rgba(0, 0, 0, 0.32)',
      },
      transitionTimingFunction: {
        'm3-standard': 'cubic-bezier(0.2, 0, 0, 1)',
        'm3-spring': 'cubic-bezier(0.34, 1.25, 0.64, 1)',
      },
    },
  },
  plugins: [],
}
