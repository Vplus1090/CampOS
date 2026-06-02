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
        sans: ['system-ui', 'Roboto', 'sans-serif'],
      }
    },
  },
  plugins: [],
}
