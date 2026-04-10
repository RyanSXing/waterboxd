import type { Config } from 'tailwindcss'

const config: Config = {
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        red: { DEFAULT: '#e63946', hover: '#c1121f' },
        water: '#4fc3f7',
      },
      fontFamily: {
        mono: ['var(--font-mono)', 'monospace'],
      },
      borderWidth: { '3': '3px' },
    },
  },
  plugins: [],
}
export default config
