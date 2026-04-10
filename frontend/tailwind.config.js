/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,jsx,ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // Ajout de la couleur officielle Djezzy pour plus de simplicité
        'djezzy-red': '#6e070d',
        'djezzy-bg': '#f5e7e8',
      },
      keyframes: {
        // L'animation qui fait vibrer la cloche quand on clique
        wiggle: {
          '0%, 100%': { transform: 'rotate(-8deg)' },
          '50%': { transform: 'rotate(8deg)' },
        },
      },
      animation: {
        // On définit l'animation "wiggle" (6 vibrations en 0.5s)
        'wiggle': 'wiggle 0.1s ease-in-out 6',
      },
    },
  },
  plugins: [],
}