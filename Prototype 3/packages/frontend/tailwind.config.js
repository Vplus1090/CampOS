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
          primary: '#d0bcff',
          onPrimary: '#381e72',
          primaryContainer: '#4f378b',
          onPrimaryContainer: '#eaddff',
          secondary: '#ccc2dc',
          onSecondary: '#332d41',
          secondaryContainer: '#4a4458',
          onSecondaryContainer: '#e8def8',
          tertiary: '#efb8c8',
          onTertiary: '#492532',
          tertiaryContainer: '#633b48',
          onTertiaryContainer: '#ffd8e4',
          error: '#f2b8b5',
          onError: '#601410',
          errorContainer: '#8c1d18',
          onErrorContainer: '#f9dedc',
          surface: '#181125',
          onSurface: '#e6e1e5',
          surfaceVariant: '#483c5e',
          onSurfaceVariant: '#cac4d0',
          outline: '#948baf',
          outlineVariant: '#483c5e',
          surfaceContainerHighest: '#352a48',
          surfaceContainerHigh: '#292035',
          surfaceContainer: '#211a30',
          surfaceContainerLow: '#1c1529',
          surfaceContainerLowest: '#0f0918',
        }
      },
      fontFamily: {
        sans: ['Roboto Flex', 'Roboto', 'system-ui', 'sans-serif'],
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
